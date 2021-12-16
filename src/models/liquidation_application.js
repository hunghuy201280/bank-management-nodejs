import mongoose from "mongoose";
import validator from "validator";
import { dateSetter, dateGetter } from "../utils/utils.js";
import { LoanProfileStatus } from "../utils/enums.js";
import { toArray } from "../utils/utils.js";
import LoanContract from "./loan_contract.js";
import paymentReceiptSchema from "./payment_receipt.js";

import moment from "moment";
const liquidationApplicationSchema = mongoose.Schema(
  {
    loanContract: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LoanContract",
      required: true,
      async validate(value) {
        const checkExisting = await LoanContract.findById(value);

        if (!checkExisting) {
          throw new Error("This LoanContract does not exist");
        }
      },
    },
    reason: {
      type: String,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      validate(value) {
        if (value <= 0) {
          throw new Error("Amount cannot <=0");
        }
      },
    },
    status: {
      type: Number,
      required: true,
      default: 1,
      enum: [toArray(LoanProfileStatus)],
    },
    signatureImg: {
      type: String,
      required: true,
    },
    applicationNumber: {
      type: String,
    },
    decision: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LiquidationDecision",
    },
  },
  {
    timestamps: true,
  }
);

liquidationApplicationSchema.statics.getApplicationNumber = async function () {
  const today = moment().startOf("day");

  const num = await LiquidationApplication.count({
    createdAt: {
      $gte: today.toDate(),
      $lte: moment(today).endOf("day").toDate(),
    },
  });
  return `DTT.${today.year().toString().substring(2)}.${
    today.month() + 1
  }.${today.date()}.${num + 1}`;
};

liquidationApplicationSchema.pre("save", async function (next) {
  const application = this;
  if (application.isNew) {
    const loanContract = await LoanContract.findById(application.loanContract);
    const canAddApplication = await loanContract.canAddLiquidationApplication(
      application.amount
    );
    if (!canAddApplication) {
      throw new Error(
        "Can't add liquidation application, exceed the remaining debt"
      );
    }
    this.applicationNumber =
      await LiquidationApplication.getApplicationNumber();
  }
  next();
});

const LiquidationApplication = mongoose.model(
  "LiquidationApplication",
  liquidationApplicationSchema
);

export default LiquidationApplication;
