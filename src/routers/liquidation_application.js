import Customer from "../models/customer.js";
import LoanProfile from "../models/loan_profile.js";
import LiquidationApplication from "../models/liquidation_application.js";
import LiquidationDecision from "../models/liquidation_decision.js";
import express from "express";
import * as log from "../utils/logger.js";
import auth from "../middleware/auth.js";
import { LoanProfileStatus } from "../utils/enums.js";
import moment from "moment";
import LoanContract from "../models/loan_contract.js";

const router = express.Router();
//#region params
router.param("id", async (req, res, next, id) => {
  try {
    const liquidationApplication = await LiquidationApplication.findById(id);
    if (!liquidationApplication) {
      throw new Error("This liquidation application doesn't exist");
    }
    req.item = liquidationApplication;
    next();
  } catch (err) {
    log.error(err);
    res.status(404).send({ error: err.toString() });
  }
});
//#endregion

/**
 * add liquidation_applications
 */
router.post("/liquidation_applications", auth, async (req, res) => {
  try {
    const { loanContract, amount, reason, signatureImg } = req.body;
    const application = new LiquidationApplication({
      loanContract,
      amount,
      reason,
      signatureImg,
    });
    await application.save();
    res.send(application);
  } catch (error) {
    log.error(error);
    res.status(400).send({ error: error.message });
  }
});

router.post("/liquidation_applications/decision", auth, async (req, res) => {
  try {
    const { applicationId, BODSignature } = req.body;
    const application = await LiquidationApplication.findById(applicationId);
    if (!application) {
      res.status(404).send({ error: `Application ${applicationId} not found` });
      return;
    }
    if (application.status == LoanProfileStatus.Rejected) {
      return res.status(400).send({
        error: "This application was rejected",
      });
    }
    application.status = 2;
    if (application.decision) {
      throw new Error("Already had decision");
    }

    if (!BODSignature) {
      throw new Error("Invalid BODSignature");
    }
    const decision = new LiquidationDecision({
      reason: application.reason,
      amount: application.amount,
      BODSignature,
    });
    await decision.save();
    application.decision = decision;
    await application.save();
    await application.populate("decision");
    res.send(application);
  } catch (error) {
    log.error(error);
    res.status(400).send({ error: error.message });
  }
});
router.post("/liquidation_applications/reject", auth, async (req, res) => {
  try {
    const { applicationId } = req.body;
    const application = await LiquidationApplication.findById(applicationId);
    if (!application) {
      return res
        .status(404)
        .send({ error: `Application ${applicationId} not found` });
    }
    application.status = 3;
    await application.save();
    res.send();
  } catch (error) {
    log.error(error);
    res.status(400).send({ error: error.message });
  }
});

router.get("/liquidation_applications", auth, async (req, res) => {
  try {
    const {
      contractNumber,
      applicationNumber,
      status,
      createdAt,
      limit,
      sortBy,
      skip,
    } = req.query;
    const match = {
      status: { $ne: LoanProfileStatus.Deleted },
    };
    if (applicationNumber) {
      match.applicationNumber = { $regex: applicationNumber, $options: "i" };
    }
    if (status) {
      match.status = parseInt(status);
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

    const joinLoanContract = {
      from: LoanContract.collection.collectionName,
      as: "contracts",
      let: {
        contractId: "$loanContract",
        queryContractNumber: contractNumber ?? "",
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                {
                  $regexMatch: {
                    input: "$contractNumber",
                    regex: "$$queryContractNumber",
                    options: "i",
                  },
                },
                {
                  $eq: ["$_id", "$$contractId"],
                },
              ],
            },
          },
        },
      ],
    };
    const applications = await LiquidationApplication.aggregate()
      .lookup(joinLoanContract)
      .match({ ...match, contracts: { $ne: [] } })
      .sort(sort)
      .skip(parseInt(skip) || 0)
      .limit(parseInt(limit) || 20);
    await LiquidationApplication.populate(applications, [
      { path: "loanContract", select: ["contractNumber"] },
      { path: "decision", populate: "paymentReceipt" },
    ]);

    const applicationsObject = JSON.parse(JSON.stringify(applications));
    for (const item of applicationsObject) {
      item.loanContract = item.loanContract.contractNumber;
      delete item.contracts;
    }

    if (!applications) {
      return res.status(404).send();
    }
    res.send(applicationsObject);
  } catch (e) {
    res.status(400).send({ error: e.toString() });
  }
});
export default router;
