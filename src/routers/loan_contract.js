import express from "express";
import LoanContract from "../models/loan_contract.js";
import LoanProfile from "../models/loan_profile.js";
import BImage from "../models/b_image.js";
import { LoanType, LoanProfileStatus, StaffRole } from "../utils/enums.js";
import moment from "moment";
import multer from "multer";
import auth from "../middleware/auth.js";
import { sendMail, randomIn } from "../utils/utils.js";
import * as log from "../utils/logger.js";
const router = express.Router();

const upload = multer({
  limits: {
    fileSize: 1000000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(pdf)$/)) {
      cb(new Error("Please upload a pdf file"));
    }
    cb(null, true);
  },
});
router.post(
  "/loan_contracts/:id/send_mail",
  auth,
  upload.single("file"),
  async (req, res) => {
    try {
      const file = req.file;
      const base64String = file.buffer.toString("base64");
      const contract = await LoanContract.findById(req.params.id).populate([
        "loanProfile.customer",
      ]);

      sendMail(
        {
          data: base64String,
          filename: file.originalname,
        },
        contract
      );
      res.send();
    } catch (e) {
      console.log(`sendmail error ${e}`);
      res.status(400).send(e);
    }
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.toString() });
  }
);

///creat loan contract
router.post("/loan_contracts", auth, async (req, res) => {
  const { loanProfile, commitment, signatureImg } = req.body;
  const tempContract = await LoanContract.findOne({
    "loanProfile._id": loanProfile,
  });

  if (tempContract) {
    return res.status(400).send({
      error: "This loan profile already had loan contract",
    });
  }
  const profile = await LoanProfile.findById(loanProfile);
  profile.approver = req.staff._id;
  profile.loanStatus = LoanProfileStatus.Done;
  profile.save();

  try {
    const newContract = new LoanContract({
      branchInfo: req.staff.branchInfo,
      loanProfile: profile,
      commitment,
      signatureImg,
    });

    await newContract.save();
    await newContract.populate([
      { path: "loanProfile.staff" },
      { path: "loanProfile.approver" },
      { path: "loanProfile.customer" },
      { path: "disburseCertificates" },
      {
        path: "liquidationApplications",
      },
      {
        path: "exemptionApplications",
      },
      {
        path: "extensionApplications",
      },
    ]);

    res.status(201).send(newContract);
  } catch (error) {
    log.error(error);
    res.status(400).send({ error: error.message });
  }
});

/**
 * Get multiple loan contract
 *
 */
router.get("/loan_contracts", auth, async (req, res) => {
  try {
    let limit = 20,
      skip = 0;
    if (req.query.limit) {
      limit = parseInt(req.query.limit);
      if (limit <= 0) limit = 20;
    }
    if (req.query.skip) {
      skip = parseInt(req.query.skip);
    }
    const {
      contractNumber,
      staffName,
      approver,
      loanType,
      createdAt,
      profileNumber,
      moneyToLoan,
      customerPhone,
    } = req.query;
    const matchContract = {};
    const matchProfile = {};
    if (moneyToLoan) {
      matchProfile["loanProfile.moneyToLoan"] = parseFloat(moneyToLoan);
    }
    if (loanType) {
      matchProfile["loanProfile.loanType"] = parseInt(loanType);
    }
    if (createdAt) {
      const queryDate = moment(createdAt).startOf("day");
      matchContract.createdAt = {
        $gte: queryDate.toDate(),
        $lte: queryDate.endOf("day").toDate(),
      };
    }
    if (contractNumber) {
      matchContract.contractNumber = { $regex: contractNumber, $options: "i" };
    }
    if (profileNumber) {
      matchProfile["loanProfile.loanApplicationNumber"] = {
        $regex: profileNumber,
        $options: "i",
      };
    }
    const sort = {};
    if (req.query.sortBy) {
      const splittedSortQuery = req.query.sortBy.split(":");
      sort[splittedSortQuery[0]] = splittedSortQuery[1] === "desc" ? -1 : 1;
    }

    const contracts = await LoanContract.aggregate()
      .lookup({
        from: "staffs",
        as: "staffs",
        let: {
          queryStaffName: staffName ?? "",
          profileStaffId: "$loanProfile.staff",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $regexMatch: {
                      input: "$name",
                      regex: "$$queryStaffName",
                      options: "i",
                    },
                  },

                  { $eq: ["$_id", "$$profileStaffId"] },
                ],
              },
            },
          },
        ],
      })
      .lookup({
        from: "staffs",
        as: "approvers",
        let: {
          approverId: "$loanProfile.approver",
          queryApproverName: approver ?? "",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $regexMatch: {
                      input: "$name",
                      regex: "$$queryApproverName",
                      options: "i",
                    },
                  },

                  { $eq: ["$_id", "$$approverId"] },
                ],
              },
            },
          },
        ],
      })
      .lookup({
        from: "customers",
        as: "customers",
        let: {
          customerId: "$loanProfile.customer",
          customerPhone: customerPhone ?? "",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $regexMatch: {
                      input: "$name",
                      regex: "$$customerPhone",
                      options: "i",
                    },
                  },

                  { $eq: ["$_id", "$$customerId"] },
                ],
              },
            },
          },
        ],
      })
      .match({
        ...matchContract,
        ...matchProfile,
      })
      .match({
        staffs: {
          $ne: [],
        },
        approvers: {
          $ne: [],
        },
      })
      .sort(sort)
      .skip(skip)
      .limit(limit);
    await LoanContract.populate(contracts, [
      "loanProfile.staff",
      "loanProfile.approver",
      "loanProfile.customer",
      { path: "disburseCertificates" },
      {
        path: "liquidationApplications",
        populate: [
          {
            path: "decision",
            populate: {
              path: "paymentReceipt",
            },
          },
        ],
      },
      {
        path: "exemptionApplications",
        populate: [
          {
            path: "decision",
          },
        ],
      },
      {
        path: "extensionApplications",
        populate: [
          {
            path: "decision",
          },
        ],
      },
    ]);

    for (const item of contracts) {
      delete item.staffs;
      delete item.approvers;
      delete item.customers;
      item.extensionApplications = item.extensionApplications ?? [];
      item.disburseCertificates = item.disburseCertificates ?? [];
      item.liquidationApplications = item.liquidationApplications ?? [];
      item.exemptionApplications = item.exemptionApplications ?? [];
    }
    if (contracts.length == 0) {
      return res.status(404).send();
    }

    res.send(contracts);
  } catch (error) {
    log.error(error);
    res.status(400).send({ error: error.message });
  }
});

//#region get 1 contract with id or number
router.get("/loan_contracts/one", auth, async (req, res) => {
  try {
    const allowSearch = ["contractNumber", "_id"];
    const match = {};
    for (const temp in req.query) {
      const str = temp.toString();
      if (allowSearch.includes(str)) {
        match[str] = req.query[str];
      }
    }
    const contract = await LoanContract.findOne(match)
      .populate([
        { path: "loanProfile.staff" },
        { path: "loanProfile.approver" },
        { path: "loanProfile.customer" },
        { path: "disburseCertificates" },
        {
          path: "exemptionApplications",
          populate: {
            path: "decision",
          },
        },
        {
          path: "extensionApplications",
          populate: {
            path: "decision",
          },
        },
        {
          path: "liquidationApplications",
          populate: {
            path: "decision",
            populate: {
              path: "paymentReceipt",
            },
          },
        },
      ])
      .exec();
    if (!contract) {
      return res.status(404).send();
    }
    res.send(contract);
  } catch (error) {
    log.error(error);
    res.status(400).send({ error: error.message });
  }
});

//#endregion

//#region get debt

router.get("/loan_contracts/debt/:id", auth, async (req, res) => {
  try {
    const contract = await LoanContract.findById(req.params.id);
    res.status(200).json(await contract.getDebt());
  } catch (error) {
    log.error(error);
    res.status(400).send({ error: error.message });
  }
});

//#endregion

// const imgs = {
//   1: [
//     "61d6b774a7c9ba7c843353eb_labor_contract1.png",
//     "61d6b774a7c9ba7c843353ee_labor_contract2.png",
//     "61d6b774a7c9ba7c843353f1_labor_contract3.png",
//     "61d6b774a7c9ba7c843353f4_labor_contract4.png",
//     "61d6b774a7c9ba7c843353f7_labor_contract5.png",
//   ],
//   2: [
//     "61d6b774a7c9ba7c843353fa_salary1.png",
//     "61d6b774a7c9ba7c843353fd_salary2.png",
//     "61d6b775a7c9ba7c84335400_salary3.png",
//     "61d6b775a7c9ba7c84335403_salary4.png",
//     "61d6b775a7c9ba7c84335406_salary5.png",
//   ],
//   3: [
//     "61d6b773a7c9ba7c843353dc_house1.png",
//     "61d6b773a7c9ba7c843353df_house2.png",
//     "61d6b774a7c9ba7c843353e2_house3.png",
//     "61d6b774a7c9ba7c843353e5_house4.png",
//     "61d6b774a7c9ba7c843353e8_house5.png",
//   ],
//   4: [
//     "61d6b773a7c9ba7c843353cd_car1.png",
//     "61d6b773a7c9ba7c843353d0_car2.png",
//     "61d6b773a7c9ba7c843353d3_car3.png",
//     "61d6b773a7c9ba7c843353d6_car4.png",
//     "61d6b773a7c9ba7c843353d9_car5.png",
//   ],
//   5: [
//     "61d6b772a7c9ba7c843353be_business1.png",
//     "61d6b772a7c9ba7c843353c1_business2.png",
//     "61d6b773a7c9ba7c843353c4_business3.png",
//     "61d6b773a7c9ba7c843353c7_business4.png",
//     "61d6b773a7c9ba7c843353ca_business5.png",
//   ],
// };
// async function tempFunc() {
//   const contracts = await LoanContract.find();
//   for (const item of contracts) {
//     const profile = item.loanProfile;
//     const realProf = await LoanProfile.findById(profile._id.toString());
//     for (let i = 0; i < profile.proofOfIncome.length; i++) {
//       profile.proofOfIncome[i].imageId =
//         imgs[profile.proofOfIncome[i].imageType][randomIn(0, 4)];
//       realProf.proofOfIncome[i].imageId =
//         imgs[realProf.proofOfIncome[i].imageType][randomIn(0, 4)];
//     }
//     try {
//       item.save();
//       realProf.save();
//     } catch (e) {
//       log.print(`${e} ${item.contractNumber}`);
//     }
//   }
// }
// tempFunc();
export default router;
