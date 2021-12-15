import Customer from "../models/customer.js";
import LoanProfile from "../models/loan_profile.js";
import express from "express";
import * as log from "../utils/logger.js";
import auth from "../middleware/auth.js";
import { CustomerType } from "../utils/enums.js";

const router = express.Router();

/**
 * get customer
 */
router.get("/customers", auth, async (req, res) => {
  try {
    const { phoneNumber, id, name, address, email, matchExact, isStartWith } =
      req.query;
    console.log(`name ${name}`);
    const match = {};
    let startWith;
    if (isStartWith === "true") {
      startWith = "^";
    } else {
      startWith = "";
    }
    if (matchExact === "true") {
      if (phoneNumber) {
        match.phoneNumber = phoneNumber;
      }
      if (id) {
        match._id = id;
      }
      if (name) {
        match.name = name;
      }
      if (address) {
        match.address = address;
      }
      if (email) {
        match.email = email;
      }
    } else {
      if (phoneNumber) {
        match.phoneNumber = {
          $regex: startWith + phoneNumber,
          $options: "i",
        };
      }
      if (id) {
        match._id = { $regex: startWith + id, $options: "i" };
      }
      if (name) {
        match.name = { $regex: startWith + name, $options: "i" };
      }
      if (address) {
        match.address = { $regex: startWith + address, $options: "i" };
      }
      if (email) {
        match.email = { $regex: startWith + email, $options: "i" };
      }
    }

    const result = await Customer.find(match);
    res.json({ data: result });
  } catch (error) {
    log.error(error);
    res.status(500).send(error);
  }
});

/**
 * add customer
 */
router.post("/customers", async (req, res) => {
  try {
    const {
      dateOfBirth,
      permanentResidence,
      businessRegistrationCertificate,
      companyRules,
      customerType,
    } = req.body;

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
    const customer = new Customer(req.body);
    await customer.save();
    res.send(customer);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

export default router;
