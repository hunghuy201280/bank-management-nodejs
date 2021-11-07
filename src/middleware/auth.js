import jwt from "jsonwebtoken";
import Staff from "../models/staff.js";
import * as log from "../utils/logger.js";
async function auth(req, res, next) {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const staff = await Staff.findOne({
      _id: decodedToken._id,
      "tokens.token": token,
    }).exec();
    if (!staff) {
      throw new Error("Invalid token");
    }
    req.token = token;
    req.staff = staff;
    next();
  } catch (err) {
    res.status(401).send({ error: "Please authenticate" });
  }
}

export default auth;
