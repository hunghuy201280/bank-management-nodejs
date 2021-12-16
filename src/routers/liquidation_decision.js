import Customer from "../models/customer.js";
import LoanProfile from "../models/loan_profile.js";
import LiquidationApplication from "../models/liquidation_application.js";
import LiquidationDecision from "../models/liquidation_decision.js";
import express from "express";
import * as log from "../utils/logger.js";
import auth from "../middleware/auth.js";
import { LoanProfileStatus } from "../utils/enums.js";
const router = express.Router();

export default router;
