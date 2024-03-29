import mongoose from "mongoose";
import validator from "validator";
/**
 * @swagger
 * components:
 *   schemas:
 *     BranchInfo:
 *       type: object
 *       description: This model contain information about a bank branch
 *       required:
 *         - branchAddress
 *         - branchPhoneNumber
 *         - branchFax
 *         - branchCode
 *       properties:
 *         branchAddress:
 *           type: String
 *           description: branchAddress
 *         branchPhoneNumber:
 *           type: String
 *           description: branchPhoneNumber, must contain only numbers
 *         branchFax:
 *           type: String
 *           description: branchFax
 *         branchCode:
 *           type: String
 *           description: branchCode
 *         _id:
 *           type: string
 *           description: The auto generated id for this object
 */

/**
 * @swagger
 * tags:
 *   name: BranchInfo
 */
const branchInfoSchema = mongoose.Schema({
  branchAddress: {
    type: String,
    required: true,
  },
  branchPhoneNumber: {
    type: String,
    required: true,
    validate(value) {
      return validator.isNumeric(value, {
        no_symbols: true,
      });
    },
  },
  branchFax: {
    type: String,
    required: true,
  },
  branchBalance: {
    type: Number,
    required: true,
    validate(value) {
      if (value < 0) throw new Error("Balance can not be negative");
    },
    default: 0,
  },
  branchCode: {
    type: String,
    required: true,
    unique: true,
  },
});

const BranchInfo = mongoose.model("BranchInfo", branchInfoSchema);
export default BranchInfo;
