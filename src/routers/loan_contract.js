import express from "express";
import LoanContract from "../models/loan_contract.js";
import auth from "../middleware/auth.js";
import * as log from "../utils/logger.js";
const router = express.Router();

///creat loan contract
router.post("/loan_contracts", auth, async (req, res) => {
  const { loanProfile, commitment, signatureImg } = req.body;
  const tempContract = await LoanContract.findOne({ loanProfile });
  log.print(`te ${tempContract}`);

  if (tempContract) {
    return res.status(400).send({
      error: "This loan profile already had loan contract",
    });
  }
  try {
    const newContract = new LoanContract({
      branchInfo: req.staff.branchInfo,
      loanProfile,
      commitment,
      signatureImg,
    });
    await newContract.populate("loanProfile");
    newContract.loanProfile.approver = req.staff._id;
    log.print(newContract.loanProfile);
    await newContract.loanProfile.save();
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
    } = req.body;
    const matchContract = {};
    const matchProfile = {};
    if (moneyToLoan) {
      matchProfile.moneyToLoan = moneyToLoan;
    }
    if (loanType) {
      matchProfile.loanType = loanType;
    }
    if (createdAt) {
      matchContract.createdAt = createdAt;
    }
    if (contractId) {
      matchContract._id = contractId;
    }
    if (profileId) {
      matchProfile.loanProfile = profileId;
    }
    const sort = {};
    if (req.query.sortBy) {
      const splittedSortQuery = req.query.sortBy.split(":");
      sort[splittedSortQuery[0]] = splittedSortQuery[1] === "desc" ? -1 : 1;
    }
    let contracts = await LoanContract.find(matchContract)
      .populate([
        {
          path: "loanProfile",
          model: "LoanProfile",
          populate: [
            { path: "staff", model: "Staff" },
            { path: "approver", model: "Staff" },
          ],
          match: matchProfile,
        },
        { path: "paymentReceipts" },
      ])
      .skip(skip)
      .limit(limit)
      .sort(sort)
      .exec();

    contracts = contracts.filter((item) => item.loanProfile != null);
    let result = [];
    if (staffName || approver) {
      if (staffName && approver) {
        for (const contract of contracts) {
          const profile = contract.loanProfile;
          if (
            profile.staff.name === staffName &&
            profile.approver.name === approver
          ) {
            result.push(contract);
          }
        }
      } else if (staffName) {
        for (const contract of contracts) {
          const profile = contract.loanProfile;
          if (profile.staff.name === staffName) {
            result.push(contract);
          }
        }
      } else {
        for (const contract of contracts) {
          const profile = contract.loanProfile;
          if (profile.approver.name === approver) {
            result.push(contract);
          }
        }
      }

      return res.send(result);
    } else {
      result = contracts;
    }

    if (result.length == 0) {
      return res.status(404).send();
    }
    res.send(result);
  } catch (error) {
    log.error(error);
    res.status(400).send({ error });
  }
});
export default router;
