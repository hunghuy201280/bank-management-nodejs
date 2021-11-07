import express from "express";
import { specs } from "./utils/docs.js";
import swaggerUI from "swagger-ui-express";

import db from "./db/mongoose.js";
import staffRouter from "./routers/staff.js";
import bImageRouter from "./routers/b_image.js";
import loanProfileRouter from "./routers/loan_profile.js";
import branchInfoRouter from "./routers/branch_info.js";
import loanContractRouter from "./routers/loan_contract.js";
const app = express();
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(specs));
app.use(express.json());

app.use(staffRouter);
app.use(bImageRouter);
app.use(loanProfileRouter);
app.use(branchInfoRouter);
app.use(loanContractRouter);

export default app;
