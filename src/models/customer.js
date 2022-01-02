console.log("Create customer");

import mongoose from "mongoose";
import validator from "validator";
import { dateSetter, dateGetter } from "../utils/utils.js";
import { CustomerType } from "../utils/enums.js";
import { toArray } from "../utils/utils.js";
import moment from "moment";
/**
 * @swagger
 * components:
 *   schemas:
 *     Customer:
 *       type: object
 *       description: This model contain information about customer
 *       required:
 *         - name
 *         - dateOfBirth
 *         - address
 *         - identityNumber
 *         - identityCardCreatedDate
 *         - phoneNumber
 *         - permanentResidence
 *         - email
 *         - customerType
 *       properties:
 *         name:
 *           type: String
 *         dateOfBirth:
 *           type: Date
 *         address:
 *           type: String
 *           description: customer's address
 *         identityNumber:
 *           type: String
 *           description: customer's identityNumber, should contain only numbers and unique
 *         identityCardCreatedDate:
 *           type: Date
 *         phoneNumber:
 *           type: String
 *           description: customer's phone number, should contain only numbers and unique
 *         permanentResidence:
 *           type: String
 *         email:
 *           type: String
 *           description: must be unique
 *         customerType:
 *           type: Number
 *           enum:
 *            - Business = 1
 *            - Resident = 2
 *         _id:
 *           type: string
 *           description: The auto generated id for this object
 */

/**
 * @swagger
 * tags:
 *   name: Customer
 */

const customerSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      set: dateSetter,
      get: dateGetter,
    },
    address: {
      trim: true,
      required: true,
      type: String,
    },
    identityNumber: {
      trim: true,
      required: true,
      unique: true,
      type: String,
      validate(value) {
        return validator.isNumeric(value, {
          no_symbols: true,
        });
      },
    },
    identityCardCreatedDate: {
      type: Date,
      set: dateSetter,
      required: true,
      get: dateGetter,
    },
    phoneNumber: {
      trim: true,
      unique: true,
      required: true,
      type: String,
      validate(value) {
        return validator.isNumeric(value, {
          no_symbols: true,
        });
      },
    },
    permanentResidence: {
      trim: true,
      type: String,
    },
    email: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value) {
        return validator.isEmail(value);
      },
      sparse: true,
      index: true,
    },
    customerType: {
      type: Number,
      required: true,
      enum: [toArray(CustomerType)],
    },
    businessRegistrationCertificate: {
      type: String,
    },
    companyRules: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);
customerSchema.methods.getRecentContracts = async function () {
  const recentContracts = await mongoose
    .model("LoanContract")
    .find({
      "loanProfile.customer": this._id,
    })
    .sort({
      createdAt: -1,
    })
    .limit(4)
    .populate([
      "loanProfile.staff",
      "loanProfile.approver",
      "loanProfile.customer",
      { path: "disburseCertificates" },
      {
        path: "liquidationApplications",
        populate: [
          {
            path: "decision",
            populate: {
              path: "paymentReceipt",
            },
          },
        ],
      },
      {
        path: "exemptionApplications",
        populate: [
          {
            path: "decision",
          },
        ],
      },
      {
        path: "extensionApplications",
        populate: [
          {
            path: "decision",
          },
        ],
      },
    ]);

  return recentContracts;
};

customerSchema.methods.getStatistic = async function () {
  const statistics = {
    thisYear: 0,
    lastYear: 0,
    total: 0,
    paid: 0,
    unPaid: 0,
  };
  const contracts = await mongoose.model("LoanContract").find({
    "loanProfile.customer": this._id,
  });
  for (const contract of contracts) {
    const createdAt = moment(contract.createdAt);
    const now = moment();
    if (createdAt.year == now.year) {
      statistics.thisYear += contract.loanProfile.moneyToLoan;
    } else if (createdAt.year == now.year - 1) {
      statistics.lastYear += contract.loanProfile.moneyToLoan;
    }
    statistics.total += contract.loanProfile.moneyToLoan;
    const asyncResults = await Promise.all([
      contract.getDebt(),
      contract.getPaid(),
    ]);
    statistics.paid += asyncResults[1];
    statistics.unPaid += asyncResults[0];
  }
  return statistics;
};

const Customer = mongoose.model("Customer", customerSchema);

export default Customer;
