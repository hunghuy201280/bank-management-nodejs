import mongoose from "mongoose";
import validator from "validator";
import { dateSetter, dateGetter } from "../utils/utils.js";
import { LoanProfileStatus } from "../utils/enums.js";
import { toArray } from "../utils/utils.js";
import LoanContract from "./loan_contract.js";
import PaymentReceipt from "./payment_receipt.js";
import moment from "moment";
const extensionDecisionSchema = mongoose.Schema(
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
    duration: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

//auto generate number when the new decision is saved
extensionDecisionSchema.pre("save", async function (next) {
  const decision = this;
  if (decision.isNew) {
    const today = moment().startOf("day");

    const num = await ExtensionDecision.count({
      createdAt: {
        $gte: today.toDate(),
        $lte: moment(today).endOf("day").toDate(),
      },
    });
    const decisionNumber = `QDGH.${today.year().toString().substring(2)}.${
      today.month() + 1
    }.${today.date()}.${num + 1}`;
    decision.decisionNumber = decisionNumber;
  }
  next();
});

const ExtensionDecision = mongoose.model(
  "ExtensionDecision",
  extensionDecisionSchema
);

export default ExtensionDecision;
