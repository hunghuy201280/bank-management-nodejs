import Customer from "../models/customer.js";
import LoanProfile from "../models/loan_profile.js";
import LoanContract from "../models/loan_contract.js";
import DisburseCertificate from "../models/disburse_certificate.js";
import express from "express";
import * as log from "../utils/logger.js";
import auth from "../middleware/auth.js";

const router = express.Router();

/**
 * add disburse certificate.
 */
router.post("/disburse_certificates", auth, async (req, res) => {
  try {
    let { loanContract, amount, isMax } = req.body;
    if (isMax) {
      const contract = await LoanContract.findById(loanContract);
      amount = await contract.getRemainingDisburse();
    }

    const certificate = new DisburseCertificate({
      loanContract,
      amount,
      certNumber: await DisburseCertificate.getDisburseCertificateNumber(),
    });
    await certificate.save();
    res.send(certificate);
  } catch (error) {
    log.error(error);
    res.status(400).send({ error: error.message });
  }
});

export default router;
