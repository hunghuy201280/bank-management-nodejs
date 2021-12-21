import Customer from "../models/customer.js";
import LoanProfile from "../models/loan_profile.js";
import ExemptionApplication from "../models/exemption_application.js";
import ExemptionDecision from "../models/exemption_decision.js";
import express from "express";
import * as log from "../utils/logger.js";
import auth from "../middleware/auth.js";
import { LoanProfileStatus } from "../utils/enums.js";
const router = express.Router();

/**
 * add liquidation_applications
 */
router.post("/exemption_applications", auth, async (req, res) => {
  try {
    const { loanContract, amount, reason, signatureImg } = req.body;
    const application = new ExemptionApplication({
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

router.post("/exemption_applications/decision", auth, async (req, res) => {
  try {
    const { applicationId, BODSignature } = req.body;
    const application = await ExemptionApplication.findById(applicationId);
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
    const decision = new ExemptionDecision({
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
router.post("/exemption_applications/reject", auth, async (req, res) => {
  try {
    const { applicationId } = req.body;
    const application = await ExemptionApplication.findById(applicationId);
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
export default router;
