import Customer from "../models/customer.js";
import LoanProfile from "../models/loan_profile.js";
import PaymentReceipt from "../models/payment_receipt.js";
import express from "express";
import * as log from "../utils/logger.js";
import auth from "../middleware/auth.js";
import LiquidationDecision from "../models/liquidation_decision.js";

const router = express.Router();

/**
 * add payment receipt.
 */
router.post("/payment_receipts", auth, async (req, res) => {
  try {
    const { decisionId } = req.body;
    const decision = await LiquidationDecision.findById(decisionId);
    if (!decision) {
      return res.status(404).send({ error: "Not Found" });
    }
    if (decision.paymentReceipt) {
      throw new Error("Already had receipt");
    }
    const paymentReceipt = new PaymentReceipt({
      amount: decision.amount,
    });
    decision.paymentReceipt = paymentReceipt;
    await decision.save();
    await paymentReceipt.save();
    res.send(decision);
  } catch (error) {
    log.error(error);
    res.status(400).send({ error: error.message });
  }
});

export default router;
