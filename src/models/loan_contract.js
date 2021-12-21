import mongoose from "mongoose";
import validator from "validator";
import { toArray } from "../utils/utils.js";
import { StaffRole } from "../utils/enums.js";
import LoanProfile from "./loan_profile.js";
import BranchInfo from "./branch_info.js";
import moment from "moment";
import { LoanProfileStatus } from "../utils/enums.js";

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
      type: LoanProfile.schema,
      required: true,
      async validate(value) {
        const checkExisting = await LoanProfile.findById(value._id);
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
    contractNumber: {
      type: String,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);
// loanContractSchema.virtual("paymentReceipts", {
//   ref: "PaymentReceipt",
//   localField: "_id",
//   foreignField: "loanContract",
// });
loanContractSchema.virtual("disburseCertificates", {
  ref: "DisburseCertificate",
  localField: "_id",
  foreignField: "loanContract",
});
loanContractSchema.virtual("liquidationApplications", {
  ref: "LiquidationApplication",
  localField: "_id",
  foreignField: "loanContract",
});
loanContractSchema.virtual("exemptionApplications", {
  ref: "ExemptionApplication",
  localField: "_id",
  foreignField: "loanContract",
});
loanContractSchema.virtual("extensionApplications", {
  ref: "ExtensionApplication",
  localField: "_id",
  foreignField: "loanContract",
});

loanContractSchema.set("toObject", { virtuals: true });
loanContractSchema.set("toJSON", { virtuals: true });

loanContractSchema.methods.getDebt = async function () {
  const contract = this;
  await contract.populate("liquidationApplications");
  await contract.populate("disburseCertificates");
  await contract.populate("exemptionApplications");
  let liquidationAmount = 0;
  let exemptionAmount = 0;
  let disburseAmount = 0;

  //#region calc disburse amount
  for (const disburse of contract.disburseCertificates) {
    disburseAmount += disburse.amount;
  }
  //#endregion

  //#region calc liquidation amount
  for (const liquidation of contract.liquidationApplications) {
    if (
      liquidation.status == LoanProfileStatus.Pending ||
      liquidation.status == LoanProfileStatus.Done
    )
      liquidationAmount += liquidation.amount;
  }
  //#endregion

  //#region calc exemption amount
  for (const it of contract.exemptionApplications) {
    if (
      it.status == LoanProfileStatus.Pending ||
      it.status == LoanProfileStatus.Done
    )
      exemptionAmount += it.amount;
  }
  //#endregion

  return disburseAmount - liquidationAmount - exemptionAmount;
};

loanContractSchema.methods.canAddLiquidationApplication = async function (
  amount
) {
  const contract = this;
  const debt = await contract.getDebt();
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

//auto generate number when the new contract is saved
loanContractSchema.pre("save", async function (next) {
  const contract = this;
  if (contract.isNew) {
    const today = moment().startOf("day");

    const num = await LoanContract.count({
      createdAt: {
        $gte: today.toDate(),
        $lte: moment(today).endOf("day").toDate(),
      },
    });
    const contractNumber = `HDVV.${today.year().toString().substring(2)}.${
      today.month() + 1
    }.${today.date()}.${num + 1}`;
    contract.contractNumber = contractNumber;
  }
  next();
});

const LoanContract = mongoose.model("LoanContract", loanContractSchema);
export default LoanContract;
