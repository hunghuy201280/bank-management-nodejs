import mongoose from "mongoose";
import validator from "validator";
import { dateSetter, dateGetter } from "../utils/utils.js";
import { CustomerType } from "../utils/enums.js";
import { toArray } from "../utils/utils.js";
import LoanContract from "./loan_contract.js";
import moment from "moment";
const disburseCertificateSchema = mongoose.Schema(
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
    certNumber: {
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

disburseCertificateSchema.statics.getDisburseCertificateNumber =
  async function () {
    const today = moment().startOf("day");

    const num = await DisburseCertificate.count({
      createdAt: {
        $gte: today.toDate(),
        $lte: moment(today).endOf("day").toDate(),
      },
    });
    return `PC.${today.year().toString().substring(2)}.${
      today.month() + 1
    }.${today.date()}.${num + 1}`;
  };

disburseCertificateSchema.pre("save", async function (next) {
  const cert = this;
  if (cert.isNew) {
    const loanContract = await LoanContract.findById(cert.loanContract);
    const canAddReceipt = await loanContract.canAddDisburseCertificate(
      cert.amount
    );
    if (!canAddReceipt) {
      throw new Error(
        "Can't add new disburse certificate, exceed the remaining amount"
      );
    }
  }

  next();
});

const DisburseCertificate = mongoose.model(
  "DisburseCertificate",
  disburseCertificateSchema
);

export default DisburseCertificate;
