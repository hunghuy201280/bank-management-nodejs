import LoanProfile from "../models/loan_profile.js";
import LoanContract from "../models/loan_contract.js";
import express from "express";
import * as log from "../utils/logger.js";
import { randomIn } from "../utils/utils.js";
import auth from "../middleware/auth.js";
import Customer from "../models/customer.js";
import { LoanType, LoanProfileStatus, StaffRole } from "../utils/enums.js";
import moment from "moment";

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
    const {
      profileNumber,
      customerName,
      moneyToLoan,
      loanType,
      createdAt,
      loanStatus,
      limit,
      skip,
      sortBy,
    } = req.query;
    const match = {
      loanStatus: { $ne: LoanProfileStatus.Deleted },
    };
    if (loanStatus) {
      match.loanStatus = parseInt(loanStatus);
    }
    if (profileNumber) {
      match.loanApplicationNumber = { $regex: profileNumber, $options: "i" };
    }
    if (moneyToLoan) {
      match.moneyToLoan = parseFloat(moneyToLoan);
    }
    if (loanType) {
      match.loanType = parseInt(loanType);
    }
    if (createdAt) {
      const queryDate = moment(createdAt).startOf("day");
      match.createdAt = {
        $gte: queryDate.toDate(),
        $lte: queryDate.endOf("day").toDate(),
      };
    }

    const sort = {
      createdAt: -1,
    };
    if (sortBy) {
      const splittedSortQuery = sortBy.split(":");
      sort[splittedSortQuery[0]] = splittedSortQuery[1] === "desc" ? -1 : 1;
    }

    const joinCustomer = {
      from: "customers",
      as: "customers",
      let: {
        queryCustomerName: customerName ?? "",
        customerId: "$customer",
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                {
                  $regexMatch: {
                    input: "$name",
                    regex: "$$queryCustomerName",
                    options: "i",
                  },
                },
                {
                  $eq: ["$_id", "$$customerId"],
                },
              ],
            },
          },
        },
      ],
    };
    const profiles = await LoanProfile.aggregate()
      .lookup(joinCustomer)
      .match({
        ...match,
        customers: {
          $ne: [],
        },
      })
      .sort(sort)
      .skip(parseInt(skip) || 0)
      .limit(parseInt(limit) || 20);
    for (const item of profiles) {
      delete item.customers;
    }
    await LoanProfile.populate(profiles, ["customer", "staff", "approver"]);

    res.send(profiles);
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
 * Check if loan profile already had contract
 */
router.get(
  "/loan_profiles/has_contract/:idLoan",
  auth,
  async function (req, res) {
    const count = await LoanContract.count({
      "loanProfile._id": req.params.idLoan,
    });
    res.send(count > 0);
  }
);

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

// const imgs = [
//   "61d69079a621da27bdf1667b_Huy Truong Hung Huy.png",
//   "61d69079a621da27bdf1667e_Hung Nguyen Xuan Hung.png",
//   "61d69079a621da27bdf16681_Hieu Vo Duc Trung Hieu.png",
// ];
// async function tempFunc() {
//   const contracts = await LoanProfile.find({
//     approver: undefined,
//   });
//   for (const item of contracts) {
//     const signatureImg = imgs[randomIn(0, 2)];
//     item.signatureImg = signatureImg;
//     try {
//       item.save();
//     } catch (e) {
//       log.print(`${e} ${item.contractNumber}`);
//     }
//   }
// }
// tempFunc();

// const imgs = {
//   1: [
//     "61d6b774a7c9ba7c843353eb_labor_contract1.png",
//     "61d6b774a7c9ba7c843353ee_labor_contract2.png",
//     "61d6b774a7c9ba7c843353f1_labor_contract3.png",
//     "61d6b774a7c9ba7c843353f4_labor_contract4.png",
//     "61d6b774a7c9ba7c843353f7_labor_contract5.png",
//   ],
//   2: [
//     "61d6b774a7c9ba7c843353fa_salary1.png",
//     "61d6b774a7c9ba7c843353fd_salary2.png",
//     "61d6b775a7c9ba7c84335400_salary3.png",
//     "61d6b775a7c9ba7c84335403_salary4.png",
//     "61d6b775a7c9ba7c84335406_salary5.png",
//   ],
//   3: [
//     "61d6b773a7c9ba7c843353dc_house1.png",
//     "61d6b773a7c9ba7c843353df_house2.png",
//     "61d6b774a7c9ba7c843353e2_house3.png",
//     "61d6b774a7c9ba7c843353e5_house4.png",
//     "61d6b774a7c9ba7c843353e8_house5.png",
//   ],
//   4: [
//     "61d6b773a7c9ba7c843353cd_car1.png",
//     "61d6b773a7c9ba7c843353d0_car2.png",
//     "61d6b773a7c9ba7c843353d3_car3.png",
//     "61d6b773a7c9ba7c843353d6_car4.png",
//     "61d6b773a7c9ba7c843353d9_car5.png",
//   ],
//   5: [
//     "61d6b772a7c9ba7c843353be_business1.png",
//     "61d6b772a7c9ba7c843353c1_business2.png",
//     "61d6b773a7c9ba7c843353c4_business3.png",
//     "61d6b773a7c9ba7c843353c7_business4.png",
//     "61d6b773a7c9ba7c843353ca_business5.png",
//   ],
// };
// async function tempFunc() {
//   const contracts = await LoanProfile.find({
//     approver: undefined,
//   });
//   for (const item of contracts) {
//     const profile = item;
//     for (let i = 0; i < profile.proofOfIncome.length; i++) {
//       profile.proofOfIncome[i].imageId =
//         imgs[profile.proofOfIncome[i].imageType][randomIn(0, 4)];
//     }
//     try {
//       item.save();
//     } catch (e) {
//       log.print(`${e} ${item.contractNumber}`);
//     }
//   }
// }
// tempFunc();

export default router;
