import express from "express";
import { specs } from "./utils/docs.js";
import swaggerUI from "swagger-ui-express";

import db from "./db/mongoose.js";

import loanProfileRouter from "./routers/loan_profile.js";
import staffRouter from "./routers/staff.js";
import bImageRouter from "./routers/b_image.js";
import branchInfoRouter from "./routers/branch_info.js";
import loanContractRouter from "./routers/loan_contract.js";
import customerRouter from "./routers/customer.js";
import paymentReceiptRouter from "./routers/payment_receipt.js";
import disburseCertificateRouter from "./routers/disburse_certificate.js";
import liquidationApplicationRouter from "./routers/liquidation_application.js";
import exemptionApplicationRouter from "./routers/exemption_application.js";
import extensionApplicationRouter from "./routers/extension_application.js";
import adminRouter from "./routers/admin.js";
import cors from "cors";
const app = express();
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(specs));
app.use(express.json());
app.use(cors());

app.use(loanProfileRouter);
app.use(staffRouter);
app.use(bImageRouter);
app.use(branchInfoRouter);
app.use(loanContractRouter);
app.use(customerRouter);
app.use(paymentReceiptRouter);
app.use(disburseCertificateRouter);
app.use(liquidationApplicationRouter);
app.use(extensionApplicationRouter);
app.use(exemptionApplicationRouter);
app.use(adminRouter);

export default app;
