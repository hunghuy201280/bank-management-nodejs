import express from "express";
import BranchInfo from "../models/branch_info.js";
import auth from "../middleware/auth.js";
import * as log from "../utils/logger.js";
import { StaffRole } from "../utils/enums.js";

const router = express.Router();

//#region create branch

router.post("/branch_info", auth, async (req, res) => {
  try {
    if (req.staff.role != StaffRole.Director)
      return res.status(403).send({
        error: "Invalid permission",
      });
    const branchInfo = new BranchInfo(req.body);
    await branchInfo.save();
    res.send(branchInfo);
  } catch (error) {
    log.error(error);
    res.status(400).send({ error });
  }
});

//#endregion

//#region get branch info

router.get("/branch_info/:branchCode", async (req, res) => {
  try {
    const branchInfo = await BranchInfo.findOne({
      branchCode: req.params.branchCode,
    }).exec();
    if (!branchInfo) throw new Error("This branch does not exist!");
    res.send({ data: branchInfo });
  } catch (error) {
    log.error(error);
    res.status(400).send({ error: error.message });
  }
});

//#endregion

//#region deposit

router.post("/branch_info/deposit/:branchCode", auth, async (req, res) => {
  try {
    if (req.staff.role != StaffRole.Director)
      return res.status(403).send({
        error: "Invalid permission",
      });

    const branchInfo = await BranchInfo.findOne({
      branchCode: req.params.branchCode,
    }).exec();
    if (!branchInfo) throw new Error("This branch does not exist!");
    const { amount } = req.body;
    if (amount <= 0 || !amount) {
      throw new Error("Amount is not valid");
    }
    branchInfo.branchBalance += amount;
    await branchInfo.save();
    res.send({ data: branchInfo });
  } catch (error) {
    log.error(error);
    res.status(400).send({ error: error.message });
  }
});

//#endregion

export default router;
