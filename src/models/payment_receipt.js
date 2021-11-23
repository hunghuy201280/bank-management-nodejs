import mongoose from "mongoose";
import validator from "validator";
import { dateSetter, dateGetter } from "../utils/utils.js";
import { CustomerType } from "../utils/enums.js";
import { toArray } from "../utils/utils.js";
import LoanContract from "./loan_contract.js";
import moment from "moment";
const paymentReceiptSchema = mongoose.Schema(
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
    receiptNumber: {
      type: String,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

paymentReceiptSchema.statics.getPaymentReceiptNumber = async function () {
  const today = moment().startOf("day");

  const num = await PaymentReceipt.count({
    createdAt: {
      $gte: today.toDate(),
      $lte: moment(today).endOf("day").toDate(),
    },
  });
  return `PT.${today.year().toString().substring(2)}.${
    today.month() + 1
  }.${today.date()}.${num + 1}`;
};

paymentReceiptSchema.pre("save", async function (next) {
  const receipt = this;
  if (receipt.isNew) {
    const loanContract = await LoanContract.findById(receipt.loanContract);
    const canAddReceipt = await loanContract.canAddReceipt(receipt.amount);
    if (!canAddReceipt) {
      throw new Error("Can't add new receipt, exceed the remaining debt");
    }
  }

  next();
});
const PaymentReceipt = mongoose.model("PaymentReceipt", paymentReceiptSchema);

export default PaymentReceipt;
