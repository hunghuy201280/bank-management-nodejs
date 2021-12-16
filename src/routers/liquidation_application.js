import Customer from "../models/customer.js";
import LoanProfile from "../models/loan_profile.js";
import LiquidationApplication from "../models/liquidation_application.js";
import LiquidationDecision from "../models/liquidation_decision.js";
import express from "express";
import * as log from "../utils/logger.js";
import auth from "../middleware/auth.js";
import { LoanProfileStatus } from "../utils/enums.js";
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
export default router;
