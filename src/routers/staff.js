import Staff from "../models/staff.js";
import BranchInfo from "../models/branch_info.js";
import express from "express";
import * as log from "../utils/logger.js";
import moment from "moment";
import {
  dateSetter,
  dateGetter,
  timeGetter,
  timeSetter,
  addDate,
} from "../utils/utils.js";

const router = express.Router();

//#region params
router.param("id", async (req, res, next, id) => {
  try {
    const staff = await Staff.findById(id).exec();
    if (!staff)
      return res.status(404).send({ error: "This staff doesn't exist'" });

    req.staff = staff;
    next();
  } catch (err) {
    log.error(err);
    res.status(404).send({ error: err });
  }
});
//#endregion

//#region create account
/**
 * @swagger
 * /staffs:
 *   post:
 *     summary: Create an account for staff.
 *     tags: [Staff]
 *     requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                name:
 *                  example: "Hung Huy"
 *                email:
 *                  example: hunghuy12364@gmail.com
 *                password:
 *                  example: Hunghuy3322
 *                role:
 *                  type: int
 *                  example: 4
 *                  description: |
 *                    | Staff Role | Value |
 *                    | ----------------- | ----- |
 *                    | Support | 1 |
 *                    | Business | 2 |
 *                    | Appraisal | 3 |
 *                    | Director | 4 |
 *     responses:
 *       '201':
 *         description: Created
 *         content:
 *           application/json:
 *             example:
 *              staff:
 *                role: 4
 *                name: "Hung Huy"
 *                email: "hunghu2y12364@gmail.com"
 *                _id: "61863b8798aaf31dfd8a66c2"
 *                createdAt: "2021-11-06T08:23:35.981Z"
 *                updatedAt: "2021-11-06T08:23:35.981Z"
 *                __v: 0
 *              token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MTg2M2I4Nzk4YWFmMzFkZmQ4YTY2YzIiLCJpYXQiOjE2MzYxODcwMTV9.dEmy46g3i17I2GIhsrmMGAZANleLVz6iQzUDyzxTltI"
 *       '400':
 *         description: Error
 *         content:
 *           application/json:
 *             example:
 *              error:
 *               index: 0
 *               code: 11000
 *               keyPattern:
 *                 email: 1
 *               keyValue:
 *                 email: hunghu2y12364@gmail.com
 */

router.post("/staffs", async (req, res) => {
  const { name, email, password, role, branchInfo } = req.body;

  const checkBranchExist = await BranchInfo.findById(branchInfo).exec();
  if (!checkBranchExist) {
    res.status(400).send({ error: "This branch does not exist" });
  }

  const staff = new Staff({
    name,
    email,
    password,
    role,
    branchInfo,
  });
  try {
    const token = await staff.getToken();
    res.status(201).send({ staff, token });
  } catch (err) {
    log.error(err);
    res.status(400).send({ error: err });
  }
});

//#endregion create account

//#region login

/**
 * @swagger
 * /staffs/login:
 *   post:
 *     summary: Login staff.
 *     tags: [Staff]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *            schema:
 *              type: object
 *            example:
 *              email: hung2huy123@gmail.com
 *              password: Hunghuy123
 *     responses:
 *       '200':
 *         description: Created
 *         content:
 *           application/json:
 *             example:
 *              staff:
 *                role: 4
 *                name: "Hung Huy"
 *                email: "hunghu2y12364@gmail.com"
 *                _id: "61863b8798aaf31dfd8a66c2"
 *                createdAt: "2021-11-06T08:23:35.981Z"
 *                updatedAt: "2021-11-06T08:23:35.981Z"
 *                __v: 0
 *              token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MTg2M2I4Nzk4YWFmMzFkZmQ4YTY2YzIiLCJpYXQiOjE2MzYxODcwMTV9.dEmy46g3i17I2GIhsrmMGAZANleLVz6iQzUDyzxTltI"
 *       '400':
 *         description: Error
 *         content:
 *           application/json:
 *             example:
 *              error: This user does not exist
 */

router.post("/staffs/login", async (req, res) => {
  try {
    const staff = await Staff.findByCredentials(
      req.body.email,
      req.body.password
    );
    const token = await staff.getToken();
    res.send({ staff, token });
  } catch (err) {
    log.error(err);

    res.status(400).send({ error: err.message });
  }
});
//#endregion login

router.post("/staffs/su", async (req, res) => {
  const su = new Staff({
    email: "humghuy201280@gmail.com",
    password: "Hunghuy123",
    role: 4,
    name: "Hung Huy",
    branchInfo: "618699b54e23538808c53885",
  });
  try {
    const token = await su.getToken();
    res.status(201).send({ staff: su, token });
  } catch (err) {
    log.error(err);
    res.status(400).send({ error: err });
  }
});

//#region clock in

/**
 * @swagger
 * /staffs/clock_in/:id:
 *   post:
 *     summary: Clock in staff.
 *     tags: [Staff]
 *     description: |
 *              **clockIn phải ở dạng HH:mm:ss DD/MM/YYYY**
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *            schema:
 *              type: object
 *
 *            example:
 *              clockIn: 16:22:32 07/11/2021
 *     parameters:
 *        - in: path
 *          name: id
 *          schema:
 *            type: String
 *          required: true
 *          description: Id của Staff cần clock in
 *     responses:
 *       '200':
 *         description: Clock in thành công
 *       '400':
 *         description: Lỗi
 *         content:
 *           application/json:
 *             example:
 *              error: Clock In not found
 *       '409':
 *         description: Đã clock in rồi
 *         content:
 *           application/json:
 *             example:
 *               error: Already clocked in
 */
router.post("/staffs/clock_in/:id", async (req, res) => {
  try {
    if (!req.body.clockIn) {
      return res.status(400).send({ error: "Clock In not found" });
    }

    const isValidDate = moment(
      req.body.clockIn,
      "HH:mm:ss DD/MM/YYYY",
      true
    ).isValid();
    if (!isValidDate) {
      return res.status(400).send({ error: "Invalid date" });
    }

    const currentDate = timeSetter(req.body.clockIn);

    await req.staff.clockIn(currentDate);
    res.send();
  } catch (error) {
    log.error(error);
    res.status(400).send({ error: error.message ?? error });
  }
});

//#endregion clock in

//#region clock out

router.post("/staffs/clock_out/:id", async (req, res) => {
  try {
    const clockOut = req.body.clockOut;
    if (!clockOut) {
      return res.status(400).send({ error: "Clock out not found" });
    }

    const isValidDate = moment(clockOut, "HH:mm:ss DD/MM/YYYY", true).isValid();
    if (!isValidDate) {
      return res.status(400).send({ error: "Invalid date" });
    }

    const currentDate = timeSetter(clockOut);
    await req.staff.clockOut(currentDate);

    res.send();
  } catch (error) {
    log.error(error);
    res.status(400).send({ error: error.message ?? error });
  }
});

//#endregion clock out

export default router;
