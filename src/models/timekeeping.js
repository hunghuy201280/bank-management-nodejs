import mongoose from "mongoose";
/**
 * @swagger
 * components:
 *   schemas:
 *     Timekeeping:
 *       type: object
 *       description: Timekeeping for staff model
 *       properties:
 *         clockIn:
 *           type: Date
 *           description: Clock in time
 *         clockOut:
 *            type: Date
 *            description: Clock out time
 *         _id:
 *           type: string
 *           description: The auto generated id for this object
 */

const Timekeeping = mongoose.Schema({
  clockIn: { type: Date },
  clockOut: { type: Date },
});

export default Timekeeping;
