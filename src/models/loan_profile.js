import mongoose from "mongoose";
import validator from "validator";
import { ProofOfIncomeType } from "../utils/enums.js";
import { toArray } from "../utils/utils.js";
import moment from "moment";
import { LoanType, LoanProfileStatus } from "../utils/enums.js";
import Staff from "./staff.js";
import BranchInfo from "./branch_info.js";
import Customer from "../models/customer.js";

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       example: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MTg3ODdlMGE5MGM5YTZhMjczN2VkYjQiLCJpYXQiOjE2MzcwMzQyOTl9._lklh-qHbU9cPBoXnlmk8UgD8C-pjR5-0Wt4uctgJUg
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
 *            | Deleted | 4 |
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
      async validate(value) {
        const customer = await Customer.findById(value);

        if (!customer) {
          throw new Error("This customer does not exist");
        }
      },
    },
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Staff",
      async validate(value) {
        const staff = await Staff.findById(value);

        if (!staff) {
          throw new Error("This staff does not exist");
        }
      },
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
    approver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      async validate(value) {
        const staff = await Staff.findById(value);

        if (staff.role != StaffRole.Director) throw new Error("Not Allowed");
      },
    },
    branchInfo: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "BranchInfo",
      async validate(value) {
        const branch = await BranchInfo.findById(value);
        if (!branch) {
          throw new Error("This branch does not exist");
        }
      },
    },
  },
  {
    timestamps: true,
  }
);

loanProfileSchema.virtual("loanContract", {
  ref: "LoanContract",
  localField: "_id",
  foreignField: "loanProfile",
});

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
