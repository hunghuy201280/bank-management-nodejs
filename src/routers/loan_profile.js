import LoanProfile from "../models/loan_profile.js";
import express from "express";
import * as log from "../utils/logger.js";
import auth from "../middleware/auth.js";
import Customer from "../models/customer.js";
import { LoanType, LoanProfileStatus, StaffRole } from "../utils/enums.js";
const router = express.Router();

//#region params
router.param("id", async (req, res, next, id) => {
  try {
    const loanProfile = await LoanProfile.findById(id);
    if (!loanProfile)
      return res
        .status(404)
        .send({ error: "This loan profile doesn't exist'" });

    req.loanProfile = loanProfile;
    next();
  } catch (err) {
    log.error(err);
    res.status(404).send({ error: "This loan profile doesn't exist'" });
  }
});
//#endregion

//#region Create Loan Profile

/**
 * @swagger
 * /loan_profile:
 *   post:
 *     summary: Create loan profile.
 *     tags: [LoanProfile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *        required: true
 *        description: customerType và imageType xem ở tab Schema
 *
 *        content:
 *          application/json:
 *            example:
 *             customer:
 *              name: Hung Huy
 *              dateOfBirth: 03/11/2001
 *              address: 123 Lũy Bán Bich, Hiệp Tân, Tân Phú, HCM
 *              identityNumber: '1234456789'
 *              identityCardCreatedDate: 03/11/2001
 *              phoneNumber: '0933970824'
 *              permanentResidence: 123 Lũy Bán Bich, Hiệp Tân, Tân Phú, HCM
 *              customerType: 2
 *             proofOfIncome:
 *             - imageId: 61680edba7fc9635249f6d7e
 *               imageType: 1
 *             - imageId: 61680edba7fc9635249f6d7e
 *               imageType: 1
 *             moneyToLoan: 5
 *             loanPurpose: purpose purpose purpose
 *             loanDuration: 10000000
 *             collateral: house, car
 *             expectedSourceMoneyToRepay: work
 *             benefitFromLoan: money
 *             signatureImg: 61680edba7fc9635249f6d7e
 *            schema:
 *              anyOf:
 *                - $ref: "#/components/schemas/Customer"
 *                - $ref: "#/components/schemas/LoanProfile"
 *     responses:
 *       '201':
 *         description: Created
 *         content:
 *           application/json:
 *             example:
 *              customer:
 *                name: Hung Huy
 *                dateOfBirth: '2001-11-02T17:00:00.000Z'
 *                address: 123 Lũy Bán Bich, Hiệp Tân, Tân Phú, HCM
 *                identityNumber: '12342456789'
 *                identityCardCreatedDate: '2001-11-02T17:00:00.000Z'
 *                phoneNumber: '09343970824'
 *                permanentResidence: 123 Lũy Bán Bich, Hiệp Tân, Tân Phú, HCM
 *                customerType: 2
 *                _id: 61864a0680fdb55de74d80be
 *                createdAt: '2021-11-06T09:25:26.325Z'
 *                updatedAt: '2021-11-06T09:25:26.325Z'
 *                __v: 0
 *              staff: 618642f18fd34655c62ee951
 *              loanApplicationNumber: HSSV.2021.611.1
 *              proofOfIncome:
 *              - imageId: 61680edba7fc9635249f6d7e
 *                imageType: 1
 *                _id: 61864a0680fdb55de74d80c2
 *              - imageId: 61680edba7fc9635249f6d7e
 *                imageType: 1
 *                _id: 61864a0680fdb55de74d80c3
 *              moneyToLoan: 5
 *              loanPurpose: purpose purpose purpose
 *              loanDuration: 10000000
 *              collateral: house, car
 *              expectedSourceMoneyToRepay: work
 *              benefitFromLoan: money
 *              signatureImg: 61680edba7fc9635249f6d7e
 *              _id: 61864a0680fdb55de74d80c1
 *              createdAt: '2021-11-06T09:25:26.436Z'
 *              updatedAt: '2021-11-06T09:25:26.436Z'
 *              __v: 0
 *       '400':
 *         description: Error
 *         content:
 *           application/json:
 *             example:
 *              error: "E11000 duplicate key error collection: bank-management.customers index: identityNumber_1 dup key: { identityNumber: \"1234456789\" }"
 *
 */

router.post("/loan_profiles", auth, async (req, res) => {
  const loanProf = req.body;
  try {
    loanProf.customer = loanProf.customerId;
    delete loanProf.customerId;

    loanProf.staff = req.staff._id;
    loanProf.loanApplicationNumber = await LoanProfile.getLoanProfileNumber();
    const loanProfile = new LoanProfile(loanProf);
    await loanProfile.save();
    await loanProfile.populate(["customer", "staff"]);
    res.status(201).send(loanProfile);
  } catch (error) {
    res.status(400).send({
      error: error.message,
    });
    log.error(error);
  }
});

//#endregion

/**
 * Get multiple loan profiles
 *
 */
router.get("/loan_profiles", auth, async (req, res) => {
  try {
    let limit = 20,
      skip = 0;
    if (req.query.limit) {
      limit = parseInt(req.query.limit);
      if (limit == 0) limit = 20;
    }
    if (req.query.skip) {
      skip = parseInt(req.query.skip);
    }
    const { id, customerName, moneyToLoan, loanType, createdAt, loanStatus } =
      req.body;
    const match = {
      loanStatus: { $ne: LoanProfileStatus.Deleted },
    };
    if (moneyToLoan) {
      match.moneyToLoan = moneyToLoan;
    }
    if (loanType) {
      match.loanType = loanType;
    }
    if (loanStatus) {
      match.loanStatus = loanStatus;
    }
    if (createdAt) {
      match.createdAt = createdAt;
    }
    if (id) {
      match._id = id;
    }
    const sort = {};
    if (req.query.sortBy) {
      const splittedSortQuery = req.query.sortBy.split(":");
      sort[splittedSortQuery[0]] = splittedSortQuery[1] === "desc" ? -1 : 1;
    }
    const profiles = await LoanProfile.find(match)
      .populate(["customer", "staff", "approver"])
      .skip(skip)
      .limit(limit)
      .sort(sort)
      .exec();
    let result = [];

    if (customerName) {
      for (const profile of profiles) {
        log.print(profile);
        if (profile.customer && profile.customer.name === customerName) {
          result.push(profile);
        }
      }
    } else {
      result = profiles;
    }
    res.send(result);
  } catch (error) {
    log.error(error);
    res.status(400).send({ error });
  }
});

/**
 * Get single loan profile
 */
router.get("/loan_profiles/:id", auth, async function (req, res) {
  await req.loanProfile.populate("customer");

  res.send(req.loanProfile);
});

/**
 * update loan profile status
 */
router.patch("/loan_profiles/status/:id", auth, async function (req, res) {
  try {
    const { status } = req.body;
    if (
      req.loanProfile.loanStatus == LoanProfileStatus.Pending ||
      status == LoanProfileStatus.Deleted
    ) {
      req.loanProfile.loanStatus = status;
      req.loanProfile.save();
    } else {
      res.status(403).send({ error: "Forbidden" });
    }

    res.send();
  } catch (error) {
    log.error(error);
    res.status(400).send({ error });
  }
});

export default router;
