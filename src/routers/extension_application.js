import Customer from "../models/customer.js";
import LoanProfile from "../models/loan_profile.js";
import LoanContract from "../models/loan_contract.js";
import ExtensionApplication from "../models/extension_application.js";
import ExtensionDecision from "../models/extension_decision.js";
import express from "express";
import * as log from "../utils/logger.js";
import auth from "../middleware/auth.js";
import { LoanProfileStatus } from "../utils/enums.js";
import moment from "moment";

const router = express.Router();

/**
 * add liquidation_applications
 */
router.post("/extension_applications", auth, async (req, res) => {
  try {
    const { loanContract, amount, reason, signatureImg, duration } = req.body;
    const application = new ExtensionApplication({
      loanContract,
      amount,
      reason,
      signatureImg,
      duration,
    });
    await application.save();
    res.send(application);
  } catch (error) {
    log.error(error);
    res.status(400).send({ error: error.message });
  }
});

router.post("/extension_applications/decision", auth, async (req, res) => {
  try {
    const { applicationId, BODSignature } = req.body;
    const application = await ExtensionApplication.findById(applicationId);
    if (!application) {
      res.status(404).send({ error: `Application ${applicationId} not found` });
      return;
    }
    if (application.status == LoanProfileStatus.Rejected) {
      return res.status(400).send({
        error: "This application was rejected",
      });
    }
    application.status = LoanProfileStatus.Done;
    if (application.decision) {
      throw new Error("Already had decision");
    }

    if (!BODSignature) {
      throw new Error("Invalid BODSignature");
    }
    const decision = new ExtensionDecision({
      reason: application.reason,
      amount: application.amount,
      BODSignature,
      duration: application.duration,
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
router.post("/extension_applications/reject", auth, async (req, res) => {
  try {
    const { applicationId } = req.body;
    const application = await ExtensionApplication.findById(applicationId);
    if (!application) {
      return res
        .status(404)
        .send({ error: `Application ${applicationId} not found` });
    }
    application.status = LoanProfileStatus.Rejected;
    await application.save();
    res.send();
  } catch (error) {
    log.error(error);
    res.status(400).send({ error: error.message });
  }
});

//get applications
router.get("/extension_applications", auth, async (req, res) => {
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
    const applications = await ExtensionApplication.aggregate()
      .lookup(joinLoanContract)
      .match({ ...match, contracts: { $ne: [] } })
      .sort(sort)
      .skip(parseInt(skip) || 0)
      .limit(parseInt(limit) || 20);
    await ExtensionApplication.populate(applications, [
      { path: "loanContract", select: ["contractNumber"] },
      "decision",
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
