import Staff from "../models/staff.js";
import express from "express";
import * as log from "../utils/logger.js";

const router = express.Router();

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
  const staff = new Staff(req.body);
  try {
    const token = await staff.getToken();
    res.status(201).send({ staff, token });
  } catch (err) {
    log.error(err);
    res.status(400).send({ error: err });
  }
});

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

export default router;
