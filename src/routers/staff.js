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
import auth from "../middleware/auth.js";
const router = express.Router();

//#region params
router.param("id", auth, async (req, res, next, id) => {
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

//#region get staff info
/**
 * @swagger
 * /staffs/my_info:
 *   get:
 *     summary: Lấy staff info.
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Success
 *         content:
 *          application/json:
 *            example:
 *              data:
 *               _id: 618787b58f39a0f3442f9bd1
 *               role: 4
 *               name: Hung Huy
 *               email: humghuy201280@gmail.com
 *               branchInfo: 618699b54e23538808c53885
 *               createdAt: '2021-11-07T08:00:53.709Z'
 *               updatedAt: '2021-11-07T08:00:53.709Z'
 *               __v: 0
 *       '404':
 *         description: Lỗi not found
 *         content:
 *           application/json:
 *             example:
 *                error: This staff doesn't exist
 *       '401':
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             example:
 *                error: Please authenticate
 *
 */
router.get("/staffs/my_info", auth, async (req, res) => {
  const staff = req.staff;
  staff.timekeeping = undefined;
  try {
    res.json({
      data: staff,
    });
  } catch (error) {
    res.status(500).send({ error });
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
 *              email: hunghuy12345@gmail.com
 *              password: Hunghuy123
 *              branchId: 618787bc8f39a0f3442f9bd6
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
    const { email, password, branchId } = req.body;
    const staff = await Staff.findByCredentials(email, password);

    if (staff.branchInfo != branchId) {
      throw new Error("This user is not working at this branch");
    }
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
 * /staffs/clock_in:
 *   post:
 *     security:
 *       - bearerAuth: []
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
 *     responses:
 *       '200':
 *         description: Clock in thành công
 *       '400':
 *         description: Lỗi
 *         content:
 *           application/json:
 *             examples:
 *              past:
 *                summary: Clock in ngày < now
 *                value:
 *                  error: Can not clock in for the past
 *              alreadyClockedOut:
 *                summary: Clock in rồi
 *                value:
 *                  error: Already clocked in
 */
router.post("/staffs/clock_in/", auth, async (req, res) => {
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

/**
 * @swagger
 * /staffs/clock_out/:
 *   post:
 *     security:
 *       - bearerAuth: []
 *     summary: Clock out staff.
 *     tags: [Staff]
 *     description: |
 *              **clockOut phải ở dạng HH:mm:ss DD/MM/YYYY**
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *            schema:
 *              type: object
 *            example:
 *              clockIn: 16:22:32 07/11/2021
 *     responses:
 *       '200':
 *         description: Clock in thành công
 *       '400':
 *         description: Lỗi
 *         content:
 *           application/json:
 *             examples:
 *              past:
 *                summary: Clock out ngày < now
 *                value:
 *                  error: Can not clock out for the past
 *              alreadyClockedOut:
 *                summary: Clock out rồi
 *                value:
 *                  error: Already clocked out
 */
router.post("/staffs/clock_out/", auth, async (req, res) => {
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
