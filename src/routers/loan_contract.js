import express from "express";
import LoanContract from "../models/loan_contract.js";
import auth from "../middleware/auth.js";
import * as log from "../utils/logger.js";
const router = express.Router();

///creat loan contract
router.post("/loan_contract", auth, async (req, res) => {
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
    await newContract.save();
    await newContract.populate("loanProfile");
    res.status(201).send(newContract);
  } catch (error) {
    log.error(error);
    res.status(400).send({ error: error.message });
  }
});

export default router;
