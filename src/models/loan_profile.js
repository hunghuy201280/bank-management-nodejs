import mongoose from "mongoose";
import validator from "validator";
import { ProofOfIncomeType } from "../utils/enums.js";
import { toArray } from "../utils/utils.js";
import moment from "moment";
import { LoanType, LoanProfileStatus } from "../utils/enums.js";

/**
 * @swagger
 * components:
 *   schemas:
 *     LoanProfile:
 *       type: object
 *       description: This model contain information about loan profile
 *       required:
 *         - customer
 *         - staff
 *         - loanApplicationNumber
 *         - proofOfIncome
 *         - moneyToLoan
 *         - loanPurpose
 *         - loanDuration
 *         - collateral
 *         - expectedSourceMoneyToRepay
 *         - benefitFromLoan
 *         - signatureImg
 *       properties:
 *         customer:
 *           type: ObjectId
 *           description: Customer's id who owns this profile
 *         staff:
 *           type: ObjectId
 *           description: Staff's id who creates this profile
 *         loanApplicationNumber:
 *           type: String
 *         proofOfIncome:
 *           type: Array
 *           description: |
 *            | ProofOfIncomeType | Value |
 *            | ----------------- | ----- |
 *            | Labor Contract | 1 |
 *            | Salary Confirmation | 2 |
 *            | House Rental Contract | 3 |
 *            | Car Rental Contract | 4 |
 *            | Business License | 5 |
 *           example:
 *             proofOfIncome:
 *                - imageId: "2312asd234d"
 *                  imageType: 1
 *                - imageId: "123asdqwe13easd"
 *                  imageType: 2
 *         moneyToLoan:
 *           type: Number
 *         loanPurpose:
 *           type: String
 *         loanDuration:
 *           type: Number
 *         collateral:
 *           type: String
 *         expectedSourceMoneyToRepay:
 *           type: String
 *         benefitFromLoan:
 *           type: String
 *         signatureImg:
 *           type: String
 *         loanStatus:
 *           type: Number
 *           description: |
 *            | LoanProfileStatus | Value |
 *            | ----------------- | ----- |
 *            | Pending | 1 |
 *            | Done | 2 |
 *            | Rejected | 3 |
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
 *   name: LoanProfile
 */

const loanProfileSchema = mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Customer",
    },
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Staff",
    },
    loanApplicationNumber: {
      type: String,
      required: true,
    },
    proofOfIncome: [
      {
        imageId: {
          type: String,
          required: true,
        },
        imageType: {
          type: Number,
          required: true,
          enum: [toArray(ProofOfIncomeType)],
        },
      },
    ],
    moneyToLoan: {
      type: Number,
      required: true,
    },
    loanPurpose: {
      type: String,
      required: true,
    },
    loanDuration: {
      type: Number,
      required: true,
    },
    collateral: {
      type: String,
      required: true,
    },
    expectedSourceMoneyToRepay: {
      type: String,
      required: true,
    },
    benefitFromLoan: {
      type: String,
      required: true,
    },
    signatureImg: {
      type: String,
      required: true,
    },
    loanType: {
      type: Number,
      required: true,
      enum: [toArray(LoanType)],
    },
    loanStatus: {
      type: Number,
      default: 1,
      enum: [toArray(LoanProfileStatus)],
    },
  },
  {
    timestamps: true,
  }
);

loanProfileSchema.statics.getApplicationNumber = async function () {
  const today = moment().startOf("day");

  const num = await LoanProfile.count({
    createdAt: {
      $gte: today.toDate(),
      $lte: moment(today).endOf("day").toDate(),
    },
  });
  return `HSSV.${today.year()}.${today.date()}${today.month() + 1}.${num + 1}`;
};

const LoanProfile = mongoose.model("LoanProfile", loanProfileSchema);

export default LoanProfile;
