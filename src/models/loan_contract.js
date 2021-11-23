import mongoose from "mongoose";
import validator from "validator";
import { toArray } from "../utils/utils.js";
import { StaffRole } from "../utils/enums.js";
import LoanProfile from "./loan_profile.js";
import BranchInfo from "./branch_info.js";
/**
 * @swagger
 * components:
 *   schemas:
 *     LoanContract:
 *       type: object
 *       description: This model contain information about loan contract
 *       required:
 *         - branchInfo
 *         - loanProfile
 *         - commitment
 *         - signatureImg
 *       properties:
 *         branchInfo:
 *           type: object
 *           $ref: "#/components/schemas/BranchInfo"
 *         loanProfile:
 *           type: object
 *           $ref: "#/components/schemas/LoanProfile"
 *         approver:
 *           type: object
 *           $ref: "#/components/schemas/Staff"
 *         commitment:
 *           type: String
 *         signatureImg:
 *           type: String
 *           description: image url
 *         _id:
 *           type: string
 *           description: The auto generated id for this object
 *         createdAt:
 *           type: Date
 *           description: date createdAt
 *         updatedAt:
 *           type: Date
 *           description: last update time
 */
/**
 * @swagger
 * tags:
 *   name: LoanContract
 */
const loanContractSchema = mongoose.Schema(
  {
    branchInfo: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "BranchInfo",
      async validate(value) {
        const checkExisting = await BranchInfo.findById(value);

        if (!checkExisting) {
          throw new Error("This BranchInfo does not exist");
        }
      },
    },
    loanProfile: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "LoanProfile",
      async validate(value) {
        const checkExisting = await LoanProfile.findById(value);

        if (!checkExisting) {
          throw new Error("This LoanProfile does not exist");
        }
      },
    },

    commitment: {
      type: String,
      required: true,
    },

    signatureImg: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);
loanContractSchema.virtual("paymentReceipts", {
  ref: "PaymentReceipt",
  localField: "_id",
  foreignField: "loanContract",
});
loanContractSchema.virtual("disburseCertificates", {
  ref: "DisburseCertificate",
  localField: "_id",
  foreignField: "loanContract",
});

loanContractSchema.set("toObject", { virtuals: true });
loanContractSchema.set("toJSON", { virtuals: true });
loanContractSchema.methods.getDebt = async function () {
  const contract = this;
  await contract.populate("paymentReceipts");
  await contract.populate("loanProfile");
  let result = 0;

  for (const receipt of contract.paymentReceipts) {
    result += receipt.amount;
  }

  return contract.loanProfile.moneyToLoan - result;
};

loanContractSchema.methods.canAddReceipt = async function (amount) {
  const contract = this;
  const debt = await contract.getDebt();
  console.log(debt - amount >= 0);
  return debt - amount >= 0;
};

loanContractSchema.methods.getRemainingDisburse = async function () {
  const contract = this;
  await contract.populate("disburseCertificates");
  await contract.populate("loanProfile");
  let result = 0;

  for (const receipt of contract.disburseCertificates) {
    result += receipt.amount;
  }
  return contract.loanProfile.moneyToLoan - result;
};

loanContractSchema.methods.canAddDisburseCertificate = async function (amount) {
  const contract = this;
  const remainingDisburse = await contract.getRemainingDisburse();
  console.log(remainingDisburse - amount >= 0);
  return remainingDisburse - amount >= 0;
};
const LoanContract = mongoose.model("LoanContract", loanContractSchema);
export default LoanContract;
