import mongoose from "mongoose";
import validator from "validator";
import { dateSetter, dateGetter } from "../utils/utils.js";
import { LoanProfileStatus } from "../utils/enums.js";
import { toArray } from "../utils/utils.js";
import LoanContract from "./loan_contract.js";
import PaymentReceipt from "./payment_receipt.js";
import moment from "moment";
const liquidationDecisionSchema = mongoose.Schema(
  {
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
    BODSignature: {
      type: String,
      required: true,
    },
    decisionNumber: {
      type: String,
      unique: true,
    },
    paymentReceipt: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentReceipt",
    },
  },
  {
    timestamps: true,
  }
);

//auto generate number when the new decision is saved
liquidationDecisionSchema.pre("save", async function (next) {
  const decision = this;
  if (decision.isNew) {
    const today = moment().startOf("day");

    const num = await LiquidationDecision.count({
      createdAt: {
        $gte: today.toDate(),
        $lte: moment(today).endOf("day").toDate(),
      },
    });
    const decisionNumber = `QDTL.${today.year().toString().substring(2)}.${
      today.month() + 1
    }.${today.date()}.${num + 1}`;
    decision.decisionNumber = decisionNumber;
  }
  next();
});

//remove payment receipt when remove decision
liquidationDecisionSchema.pre("remove", async function (next) {
  const decision = this;
  const paymentReceipt = decision.paymentReceipt;
  if (paymentReceipt) {
    await PaymentReceipt.findByIdAndRemove(paymentReceipt);
  }
});

liquidationDecisionSchema.methods.canAddReceipt = function () {
  return this.paymentReceipt != undefined;
};

const LiquidationDecision = mongoose.model(
  "LiquidationDecision",
  liquidationDecisionSchema
);

export default LiquidationDecision;
