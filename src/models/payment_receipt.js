import mongoose from "mongoose";
import validator from "validator";
import { dateSetter, dateGetter } from "../utils/utils.js";
import { CustomerType } from "../utils/enums.js";
import { toArray } from "../utils/utils.js";
import LoanContract from "./loan_contract.js";
import moment from "moment";
const paymentReceiptSchema = mongoose.Schema(
  {
    receiptNumber: {
      type: String,
      unique: true,
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
  },
  {
    timestamps: true,
  }
);

paymentReceiptSchema.pre("save", async function (next) {
  const receipt = this;
  if (receipt.isNew) {
    const today = moment().startOf("day");

    const num = await PaymentReceipt.count({
      createdAt: {
        $gte: today.toDate(),
        $lte: moment(today).endOf("day").toDate(),
      },
    });
    const receiptNumber = `PT.${today.year().toString().substring(2)}.${
      today.month() + 1
    }.${today.date()}.${num + 1}`;
    receipt.receiptNumber = receiptNumber;
  }
  next();
});
const PaymentReceipt = mongoose.model("PaymentReceipt", paymentReceiptSchema);

export default PaymentReceipt;
