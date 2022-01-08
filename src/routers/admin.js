import auth from "../middleware/auth.js";
import * as log from "../utils/logger.js";
import express from "express";
import LoanContract from "../models/loan_contract.js";
import DisburseCertificate from "../models/disburse_certificate.js";
import PaymentReceipt from "../models/payment_receipt.js";
import { StaffRole, LoanType } from "../utils/enums.js";
import moment from "moment";

const router = express.Router();

/**
 * Get Statistic
 */
router.get("/statistic", auth, async (req, res) => {
  try {
    if (req.staff.role != StaffRole.Director) {
      return res.status(403).send({ error: "Forbidden" });
    }

    const { year } = req.query;
    const startDate = moment({ year: parseInt(year) })
      .startOf("year")
      .toDate();
    const endDate = moment({ year: parseInt(year) })
      .endOf("year")
      .toDate();

    //#region fetch data
    const asyncRes = await Promise.all([
      DisburseCertificate.find({
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      }),
      PaymentReceipt.find({
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      }),
      LoanContract.find({
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      }),
    ]);

    const disburseCerts = asyncRes[0];
    const paymentReceipts = asyncRes[1];
    const contracts = asyncRes[2];
    //#endregion

    //#region calculate
    let totalDisburse = 0;
    let totalPayment = 0;

    if (disburseCerts.length > 0) {
      totalDisburse = disburseCerts
        .map((it) => it.amount)
        .reduce((pre, cur) => pre + cur);
    }

    if (paymentReceipts.length > 0) {
      totalPayment = paymentReceipts
        .map((it) => it.amount)
        .reduce((pre, cur) => pre + cur);
    }
    //init value
    const revenueByType = {};
    for (const type in LoanType) {
      revenueByType[LoanType[type]] = 0;
    }
    for (const contract of contracts) {
      revenueByType[contract.loanProfile.loanType] +=
        contract.loanProfile.moneyToLoan;
    }

    const revenueByMonth = {};

    for (let i = 1; i <= 12; i++) {
      revenueByMonth[i] = 0;
    }
    for (const contract of contracts) {
      const createdDate = moment(contract.createdAt);
      revenueByMonth[createdDate.month() + 1] +=
        contract.loanProfile.moneyToLoan;
    }

    //#endregion

    res.send({
      totalPayment,
      totalDisburse,
      revenueByType,
      revenueByMonth,
    });
  } catch (e) {
    log.error(e);
    res.status(400).send({
      error: e.toString(),
    });
  }
});

export default router;
