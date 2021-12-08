import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Timekeeping from "./timekeeping.js";
import { StaffRole } from "../utils/enums.js";
import { toArray } from "../utils/utils.js";
import moment from "moment";

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
 *         timekeeping:
 *           type: Array
 *           description: |
 *             ```json
 *                [
 *                        {
 *                            "clockIn": "2021-11-07T08:32:37.625Z",
 *                            "clockOut": "2021-11-07T08:3:37.625Z"
 *                        },
 *                        {
 *                            "clockIn": "2021-11-07T08:32:37.625Z",
 *                            "clockOut": "2021-11-07T08:3:37.625Z"
 *                        }
 *                ]
 *             ```
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
    timekeeping: [
      {
        type: Timekeeping,
      },
    ],
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
  staffObject.timekeeping = undefined;
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
 * Clock in for staff
 * @param {Date} clockInDate
 */
staffSchema.methods.clockIn = async function (clockInDate) {
  if (moment(clockInDate).isAfter(moment().endOf("date"))) {
    throw new Error("Can not clock in for future date");
  } else if (moment(clockInDate).isBefore(moment().startOf("date"))) {
    throw new Error("Can not clock in for the past");
  }

  const staff = this;
  const timekeeping = staff.timekeeping;
  for (let i = 0; i < timekeeping.length; i++) {
    const current = timekeeping[i];
    if (!current.clockIn) continue;
    if (
      current.clockIn.getDate() == clockInDate.getDate() &&
      current.clockIn.getMonth() == clockInDate.getMonth() &&
      current.clockIn.getYear() == clockInDate.getYear()
    ) {
      throw new Error("Already clocked in");
    }
  }

  staff.timekeeping.push({ clockIn: clockInDate });
  await staff.save();
};

/**
 * Clock out for staff
 * @param {Date} clockOutDate
 */
staffSchema.methods.clockOut = async function (clockOutDate) {
  if (moment(clockOutDate).isAfter(moment().endOf("date"))) {
    throw new Error("Can not clock out for future date");
  } else if (moment(clockOutDate).isBefore(moment().startOf("date"))) {
    throw new Error("Can not clock out for the past");
  }
  const staff = this;
  const timekeeping = staff.timekeeping;
  let isClockedIn = false;
  for (let i = 0; i < timekeeping.length; i++) {
    const current = timekeeping[i];
    if (
      current.clockOut &&
      current.clockOut.getDate() == clockOutDate.getDate() &&
      current.clockOut.getMonth() == clockOutDate.getMonth() &&
      current.clockOut.getYear() == clockOutDate.getYear()
    ) {
      throw new Error("Already clocked out");
    } else if (
      current.clockIn &&
      current.clockIn.getDate() == clockOutDate.getDate() &&
      current.clockIn.getMonth() == clockOutDate.getMonth() &&
      current.clockIn.getYear() == clockOutDate.getYear()
    ) {
      isClockedIn = true;
      current.clockOut = clockOutDate;
    }
  }
  if (!isClockedIn) {
    throw new Error("Not clocked in yet");
  }
  await staff.save();
};

staffSchema.methods.isClockedInOrOut = function () {
  const staff = this;
  let isClockedIn = false;
  let isClockedOut = false;
  const today = moment().startOf("date");
  const tomorrow = moment().add(1, "days").startOf("date");
  let clockedInTime, clockedOutTime;
  for (let i = 0; i < staff.timekeeping.length; i++) {
    const cur = staff.timekeeping[i];
    const curClockedInTime = cur.clockIn ? moment(cur.clockIn) : undefined;
    const curClockedOutTime = cur.clockOut ? moment(cur.clockOut) : undefined;

    // console.log(today, tomorrow, curClockedInTime, curClockedOutTime);
    if (
      isClockedIn == false &&
      curClockedInTime != undefined &&
      curClockedInTime.isBefore(tomorrow) &&
      curClockedInTime.isAfter(today)
    ) {
      isClockedIn = true;
      clockedInTime = curClockedInTime;
    }
    if (
      isClockedOut == false &&
      curClockedOutTime != undefined &&
      curClockedOutTime.isBefore(tomorrow) &&
      curClockedOutTime.isAfter(today)
    ) {
      isClockedOut = true;
      clockedOutTime = curClockedOutTime;
    }

    if (isClockedIn == true && isClockedOut == true) {
      break;
    }
  }
  return { isClockedIn, isClockedOut, clockedInTime, clockedOutTime };
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
