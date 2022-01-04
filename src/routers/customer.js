import Customer from "../models/customer.js";
import LoanProfile from "../models/loan_profile.js";
import LoanContract from "../models/loan_contract.js";
import express from "express";
import * as log from "../utils/logger.js";
import auth from "../middleware/auth.js";
import { CustomerType } from "../utils/enums.js";
import moment from "moment";
const router = express.Router();

/**
 * get multiple customer
 */
router.get("/customers", auth, async (req, res) => {
  try {
    const {
      id,
      name,
      phoneNumber,
      identityNumber,
      customerType,
      email,
      isStartWith,
    } = req.query;
    const match = {};

    let startWith = "";
    if (isStartWith == true) {
      startWith = "^";
    }
    if (id) {
      match._id = id;
    }
    if (phoneNumber) {
      match.phoneNumber = {
        $regex: startWith + phoneNumber,
        $options: "i",
      };
    }
    if (name) {
      match.name = { $regex: startWith + name, $options: "i" };
    }
    if (identityNumber) {
      match.identityNumber = {
        $regex: startWith + identityNumber,
        $options: "i",
      };
    }
    if (email) {
      match.email = { $regex: startWith + email, $options: "i" };
    }
    if (customerType) {
      match.customerType = parseInt(customerType);
    }

    const result = await Customer.find(match);
    res.json({ data: result });
  } catch (error) {
    log.error(error);
    res.status(500).send({ error: error.toString() });
  }
});

/**
 * add customer
 */
router.post("/customers", async (req, res) => {
  try {
    let {
      name,
      dateOfBirth,
      address,
      identityNumber,
      identityCardCreatedDate,
      phoneNumber,
      permanentResidence,
      customerType,
      businessRegistrationCertificate,
      companyRules,
      email,
    } = req.body;
    log.print(req.body);
    if (
      customerType == CustomerType.Business &&
      (!businessRegistrationCertificate || !companyRules)
    ) {
      throw new Error(
        "Business customer must have businessRegistrationCertificate and companyRules fileds"
      );
    }
    if (
      customerType == CustomerType.Resident &&
      (!dateOfBirth || !permanentResidence)
    ) {
      throw new Error(
        "Business customer must have dateOfBirth and permanentResidence fileds"
      );
    }
    if (customerType == CustomerType.Resident) {
      dateOfBirth = moment(dateOfBirth);
    }

    identityCardCreatedDate = moment(identityCardCreatedDate);
    const customer = new Customer({
      name,
      dateOfBirth,
      address,
      identityNumber,
      identityCardCreatedDate,
      phoneNumber,
      permanentResidence,
      customerType,
      businessRegistrationCertificate,
      companyRules,
      email,
    });
    await customer.save();
    res.send(customer);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

/**
 * get multiple customer
 */
router.get("/customers/details/:id", auth, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    const asyncResults = await Promise.all([
      customer.getRecentContracts(),
      customer.getStatistic(),
    ]);
    const recentContracts = asyncResults[0];
    const statistics = asyncResults[1];

    res.send({
      customer,
      recentContracts,
      statistics,
    });
  } catch (error) {
    log.error(error);
    res.status(400).send({ error: error.toString() });
  }
});

/**
 * update customer
 */
router.patch("/customers/:id", auth, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      throw new Error("Customer not found");
    }
    const {
      name,
      dateOfBirth,
      address,
      identityNumber,
      identityCardCreatedDate,
      phoneNumber,
      permanentResidence,
      businessRegistrationCertificate,
      companyRules,
      email,
    } = req.body;
    customer.name = name;
    customer.address = address;
    customer.identityNumber = identityNumber;
    customer.identityCardCreatedDate = moment(identityCardCreatedDate);
    customer.phoneNumber = phoneNumber;
    if (customer.type == CustomerType.Business) {
      customer.businessRegistrationCertificate =
        businessRegistrationCertificate;
      customer.companyRules = companyRules;
    } else if (customer.type == CustomerType.Resident) {
      customer.dateOfBirth = moment(dateOfBirth);
      customer.permanentResidence = permanentResidence;
    }
    customer.email = email;
    await customer.save();
    res.send();
  } catch (error) {
    log.error(error);
    res.status(400).send({ error: error.toString() });
  }
});

export default router;
