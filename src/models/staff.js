import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { StaffRole } from "../utils/enums.js";
import { toArray } from "../utils/utils.js";

/**
 * @swagger
 * components:
 *   schemas:
 *     Staff:
 *       type: object
 *       description: This model contain information about staff
 *       required:
 *         - role
 *         - name
 *         - password
 *         - email
 *         - tokens
 *       properties:
 *         role:
 *           type: Number
 *           description: |
 *              | Staff Role | Value |
 *              | ----------------- | ----- |
 *              | Support | 1 |
 *              | Business | 2 |
 *              | Appraisal | 3 |
 *              | Director | 4 |
 *         name:
 *           type: String
 *         password:
 *           type: String
 *         email:
 *           type: String
 *           description: Must be unique
 *         tokens:
 *           type: Array
 *           example:
 *              - "asdadwda23weqwdsd"
 *              - "sda123eqwadqwewasd"
 *              - "sad234rwedf3456wers"
 *         branchInfo:
 *           type: object
 *           $ref: "#/components/schemas/BranchInfo"
 *         _id:
 *           type: string
 *           description: The auto generated id for this object
 */

/**
 * @swagger
 * tags:
 *   name: Staff
 */

const staffSchema = mongoose.Schema(
  {
    role: {
      type: Number,
      required: true,
      enum: [toArray(StaffRole)],
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
      validate(value) {
        return validator.isStrongPassword(value, {
          minSymbols: 0,
        });
      },
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value) {
        return validator.isEmail(value);
      },
    },
    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
    branchInfo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BranchInfo",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Remove password and token from User model
 * before send it back
 *
 */
staffSchema.methods.toJSON = function () {
  const staffObject = this.toObject();
  delete staffObject.password;
  delete staffObject.tokens;
  return staffObject;
};

/**
 *
 * @param {String} email
 * @param {String} password - password in plain text
 * @returns {User} user - user object if there is an user with correspond email and password
 *
 */
staffSchema.statics.findByCredentials = async function (email, password) {
  const staff = await Staff.findOne({ email });
  if (!staff) {
    throw new Error("This user does not exist");
  }

  const isMatchPassword = await bcrypt.compare(password, staff.password);
  if (!isMatchPassword) {
    throw new Error("Password is not correct");
  }
  return staff;
};

/**
 * Generate new token for user
 * @returns {String} token -The token generated
 */
staffSchema.methods.getToken = async function () {
  const staff = this;
  const token = jwt.sign(
    {
      _id: staff._id.toString(),
    },
    process.env.JWT_SECRET_KEY
  );
  staff.tokens.push({ token });
  await staff.save();
  return token;
};

/**
 * Hash the password before save
 * only hash if password is modified
 */
staffSchema.pre("save", async function (next) {
  const staff = this;
  if (staff.isModified("password")) {
    staff.password = await bcrypt.hash(staff.password, 8);
  }
  next();
});

const Staff = mongoose.model("Staff", staffSchema);

export default Staff;
