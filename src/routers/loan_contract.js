import express from "express";
import LoanContract from "../models/loan_contract.js";
import LoanProfile from "../models/loan_profile.js";
import { LoanType, LoanProfileStatus, StaffRole } from "../utils/enums.js";

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
      if (limit == 0) limit = 20;
    }
    if (req.query.skip) {
      skip = parseInt(req.query.skip);
    }
    const {
      contractId,
      staffName,
      approver,
      loanType,
      createdAt,
      profileId,
      moneyToLoan,
      customerPhone,
    } = req.body;
    const matchContract = {};
    const matchProfile = {};
    if (moneyToLoan) {
      matchProfile.moneyToLoan = moneyToLoan;
    }
    if (loanType) {
      matchProfile["loanProfile.loanType"] = loanType;
    }
    if (createdAt) {
      matchContract.createdAt = createdAt;
    }
    if (contractId) {
      matchContract._id = contractId;
    }
    if (profileId) {
      matchProfile["loanProfile._id"] = profileId;
    }
    const sort = {};
    if (req.query.sortBy) {
      const splittedSortQuery = req.query.sortBy.split(":");
      sort[splittedSortQuery[0]] = splittedSortQuery[1] === "desc" ? -1 : 1;
    }
    let contracts = await LoanContract.find({
      ...matchContract,
      ...matchProfile,
    })
      .populate([
        { path: "loanProfile.staff" },
        { path: "loanProfile.approver" },
        { path: "loanProfile.customer" },
        { path: "disburseCertificates" },
        { path: "liquidationApplications" },
      ])
      .skip(skip)
      .limit(limit)
      .sort(sort)
      .exec();

    contracts = contracts.filter((item) => item.loanProfile != null);
    contracts = contracts.filter((item) => {
      const staffFilter = staffName
        ? item.loanProfile.staff.name.startsWith(staffName)
        : true;
      const approverFilter = approver
        ? item.loanProfile.approver.name.startsWith(approver)
        : true;
      const customerFilter = customerPhone
        ? item.loanProfile.customer.phoneNumber.startsWith(customerPhone)
        : true;
      return staffFilter && customerFilter && approverFilter;
    });

    if (contracts.length == 0) {
      return res.status(404).send();
    }
    res.send(contracts);
  } catch (error) {
    log.error(error);
    res.status(400).send({ error });
  }
});

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
