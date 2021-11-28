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
      return res.send({
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
    if (!branchInfo) throw new Error("This branch does not exist");
    res.send({ data: branchInfo });
  } catch (error) {
    log.error(error);
    res.status(400).send({ error });
  }
});

//#endregion

export default router;
