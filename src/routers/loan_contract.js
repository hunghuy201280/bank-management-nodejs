import express from "express";
import LoanContract from "../models/loan_contract.js";
import auth from "../middleware/auth.js";
import * as log from "../utils/logger.js";
const router = express.Router();

router.post("/loan_contract", auth, async (req, res) => {
  const tempContract = await LoanContract.findOne()
    .populate({
      path: "loanProfile",
      match: {
        _id: req.loanProfile,
      },
    })
    .exec();
  console.log(tempContract);

  if (tempContract) {
    console.log(tempContract);
    return res.status(400).send({
      error: "This loan profile already had loan contract",
    });
  }
  try {
    const newContract = new LoanContract({
      branchInfo: req.staff.branchInfo,
      loanProfile: req.body.loanProfile,
      commitment: req.body.commitment,
      signatureImg: req.body.signatureImg,
    });
    await newContract.save();
    res.status(201).send();
  } catch (error) {
    log.error(error);
    res.status(400).send({ error });
  }
});

export default router;
