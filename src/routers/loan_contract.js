import express from "express";
import LoanContract from "../models/loan_contract.js";
import LoanProfile from "../models/loan_profile.js";
import { LoanType, LoanProfileStatus, StaffRole } from "../utils/enums.js";
import moment from "moment";
import auth from "../middleware/auth.js";
import * as log from "../utils/logger.js";
const router = express.Router();

///creat loan contract
router.post("/loan_contracts", auth, async (req, res) => {
  const { loanProfile, commitment, signatureImg } = req.body;
  const tempContract = await LoanContract.findOne({
    "loanProfile._id": loanProfile,
  });
  log.print(`te ${tempContract}`);

  if (tempContract) {
    return res.status(400).send({
      error: "This loan profile already had loan contract",
    });
  }
  const profile = await LoanProfile.findById(loanProfile);
  profile.approver = req.staff._id;
  profile.loanStatus = LoanProfileStatus.Done;
  profile.save();

  try {
    const newContract = new LoanContract({
      branchInfo: req.staff.branchInfo,
      loanProfile: profile,
      commitment,
      signatureImg,
    });

    log.print(newContract.loanProfile);
    await newContract.save();
    await newContract.populate([
      { path: "loanProfile.staff" },
      { path: "loanProfile.approver" },
      { path: "loanProfile.customer" },
      { path: "disburseCertificates" },
      {
        path: "liquidationApplications",
        populate: {
          path: "decision",
          populate: {
            path: "paymentReceipt",
          },
        },
      },
    ]);

    res.status(201).send(newContract);
  } catch (error) {
    log.error(error);
    res.status(400).send({ error: error.message });
  }
});

/**
 * Get multiple loan contract
 *
 */
router.get("/loan_contracts", auth, async (req, res) => {
  try {
    let limit = 20,
      skip = 0;
    if (req.query.limit) {
      limit = parseInt(req.query.limit);
      if (limit <= 0) limit = 20;
    }
    if (req.query.skip) {
      skip = parseInt(req.query.skip);
    }
    const {
      contractNumber,
      staffName,
      approver,
      loanType,
      createdAt,
      profileNumber,
      moneyToLoan,
      customerPhone,
    } = req.query;
    const matchContract = {};
    const matchProfile = {};
    if (moneyToLoan) {
      matchProfile["loanProfile.moneyToLoan"] = parseFloat(moneyToLoan);
    }
    if (loanType) {
      matchProfile["loanProfile.loanType"] = parseInt(loanType);
    }
    if (createdAt) {
      const queryDate = moment(createdAt).startOf("day");
      matchContract.createdAt = {
        $gte: queryDate.toDate(),
        $lte: queryDate.endOf("day").toDate(),
      };
    }
    if (contractNumber) {
      matchContract.contractNumber = { $regex: contractNumber, $options: "i" };
    }
    if (profileNumber) {
      matchProfile["loanProfile.loanApplicationNumber"] = {
        $regex: profileNumber,
        $options: "i",
      };
    }
    const sort = {};
    if (req.query.sortBy) {
      const splittedSortQuery = req.query.sortBy.split(":");
      sort[splittedSortQuery[0]] = splittedSortQuery[1] === "desc" ? -1 : 1;
    }

    const contracts = await LoanContract.aggregate()
      .lookup({
        from: "staffs",
        as: "staffs",
        let: {
          queryStaffName: staffName ?? "",
          profileStaffId: "$loanProfile.staff",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $regexMatch: {
                      input: "$name",
                      regex: "$$queryStaffName",
                      options: "i",
                    },
                  },

                  { $eq: ["$_id", "$$profileStaffId"] },
                ],
              },
            },
          },
        ],
      })
      .lookup({
        from: "staffs",
        as: "approvers",
        let: {
          approverId: "$loanProfile.approver",
          queryApproverName: approver ?? "",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $regexMatch: {
                      input: "$name",
                      regex: "$$queryApproverName",
                      options: "i",
                    },
                  },

                  { $eq: ["$_id", "$$approverId"] },
                ],
              },
            },
          },
        ],
      })
      .lookup({
        from: "customers",
        as: "customers",
        let: {
          customerId: "$loanProfile.customer",
          customerPhone: customerPhone ?? "",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $regexMatch: {
                      input: "$name",
                      regex: "$$customerPhone",
                      options: "i",
                    },
                  },

                  { $eq: ["$_id", "$$customerId"] },
                ],
              },
            },
          },
        ],
      })
      .match({
        ...matchContract,
        ...matchProfile,
      })
      .match({
        staffs: {
          $ne: [],
        },
        approvers: {
          $ne: [],
        },
      })
      .limit(limit)
      .sort(sort);
    await LoanContract.populate(contracts, [
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
    ]);

    for (const item of contracts) {
      delete item.staffs;
      delete item.approvers;
      delete item.customers;
    }
    if (contracts.length == 0) {
      return res.status(404).send();
    }

    res.send(contracts);
  } catch (error) {
    log.error(error);
    res.status(400).send({ error: error.message });
  }
});

//#region get 1 contract with id or number
router.get("/loan_contracts/one", auth, async (req, res) => {
  try {
    const allowSearch = ["contractNumber", "_id"];
    const match = {};
    for (const temp in req.query) {
      const str = temp.toString();
      if (allowSearch.includes(str)) {
        match[str] = req.query[str];
      }
    }
    log.print(match);
    const contract = await LoanContract.findOne(match)
      .populate([
        { path: "loanProfile.staff" },
        { path: "loanProfile.approver" },
        { path: "loanProfile.customer" },
        { path: "disburseCertificates" },
        {
          path: "exemptionApplications",
          populate: {
            path: "decision",
          },
        },
        {
          path: "liquidationApplications",
          populate: {
            path: "decision",
            populate: {
              path: "paymentReceipt",
            },
          },
        },
      ])
      .exec();
    if (!contract) {
      return res.status(404).send();
    }
    res.send(contract);
  } catch (error) {
    log.error(error);
    res.status(400).send({ error: error.message });
  }
});

//#endregion

//#region get debt

router.get("/loan_contracts/debt/:id", auth, async (req, res) => {
  try {
    const contract = await LoanContract.findById(req.params.id);
    res.status(200).json(await contract.getDebt());
  } catch (error) {
    log.error(error);
    res.status(400).send({ error: error.message });
  }
});

//#endregion

// async function tempFunc() {
//   const contracts = await LoanContract.find();
//   const num = "HDVV.21.12.15.";
//   let i = 1;
//   for (const item of contracts) {
//     item.contractNumber = num + i++;
//     console.log(item.contractNumber);
//     await item.save();
//   }
// }
// tempFunc();
export default router;
