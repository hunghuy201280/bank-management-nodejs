import Customer from "../models/customer.js";
import LoanProfile from "../models/loan_profile.js";
import PaymentReceipt from "../models/payment_receipt.js";
import express from "express";
import * as log from "../utils/logger.js";
import auth from "../middleware/auth.js";

const router = express.Router();

/**
 * add payment receipt.
 */
router.post("/payment_receipts", auth, async (req, res) => {
  try {
    const { loanContract, amount } = req.body;
    const paymentReceipt = new PaymentReceipt({
      loanContract,
      amount,
      receiptNumber: await PaymentReceipt.getPaymentReceiptNumber(),
    });
    await paymentReceipt.save();
    res.send(paymentReceipt);
  } catch (error) {
    log.error(error);
    res.status(400).send({ error: error.message });
  }
});

export default router;
