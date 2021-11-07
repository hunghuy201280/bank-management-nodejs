import mongoose from "mongoose";
import validator from "validator";
import { dateSetter, dateGetter } from "../utils/utils.js";
import { CustomerType } from "../utils/enums.js";
import { toArray } from "../utils/utils.js";

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
      required: true,
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
      required: true,
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
  },
  {
    timestamps: true,
  }
);
// customerSchema.methods.toJSON = function () {
//   const customerObject = this.toObject();
//   customerObject.dateOfBirth = dateGetter(customerObject.dateOfBirth);
//   customerObject.identityCardCreatedDate = dateGetter(
//     customerObject.identityCardCreatedDate
//   );

//   return customerObject;
// };

const Customer = mongoose.model("Customer", customerSchema);

export default Customer;

/**
 * @swagger
 * /loan_profile/{id}:
 *   get:
 *     summary: Get single loan profile.
 *     tags: [LoanProfile]
 *     parameters:
 *        - in: path
 *          name: id
 *          schema:
 *            type: String
 *          required: true
 *          description: Id của loan profile cần get
 *     responses:
 *       '200':
 *         description: Found
 *         content:
 *           application/json:
 *             schema:
 *               $ref : "#/components/schemas/LoanProfile"
 *             example:
 *              _id: 6173a676b9d0b5fa9bdef126
 *              customer:
 *                _id: 6173a676b9d0b5fa9bdef123
 *                name: Hung Huy
 *                dateOfBirth: '2001-11-02T17:00:00.000Z'
 *                address: 123 Lũy Bán Bich, Hiệp Tân, Tân Phú, HCM
 *                identityNumber: '1234456789'
 *                identityCardCreatedDate: '2001-11-02T17:00:00.000Z'
 *                phoneNumber: '0933970824'
 *                permanentResidence: 123 Lũy Bán Bich, Hiệp Tân, Tân Phú, HCM
 *                customerType: 2
 *                createdAt: '2021-10-23T06:06:46.125Z'
 *                updatedAt: '2021-10-23T06:06:46.125Z'
 *                __v: 0
 *              staff: 616aad0eee88ba8690b3ec1f
 *              loanApplicationNumber: HSSV.2021.2310.2
 *              proofOfIncome:
 *              - imageId: 61680edba7fc9635249f6d7e
 *                imageType: 1
 *                _id: 6173a676b9d0b5fa9bdef127
 *              - imageId: 61680edba7fc9635249f6d7e
 *                imageType: 1
 *                _id: 6173a676b9d0b5fa9bdef128
 *              moneyToLoan: 5
 *              loanPurpose: purpose purpose purpose
 *              loanDuration: 10000000
 *              collateral: house, car
 *              expectedSourceMoneyToRepay: work
 *              benefitFromLoan: money
 *              signatureImg: 61680edba7fc9635249f6d7e
 *              createdAt: '2021-10-23T06:06:46.271Z'
 *              updatedAt: '2021-10-23T06:06:46.271Z'
 *              __v: 0
 *
 *       '400':
 *         description: Error
 *         content:
 *           application/json:
 *             example:
 *              error: "This loan profile doesn't exist'"
 */
