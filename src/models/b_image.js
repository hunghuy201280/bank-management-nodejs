import mongoose from "mongoose";
/**
 * @swagger
 * components:
 *   schemas:
 *     BImage:
 *       type: object
 *       description: This is a model to save image in database
 *       required:
 *         - data
 *       properties:
 *         data:
 *           type: Buffer
 *           description: buffer data for image
 *         _id:
 *           type: string
 *           description: The auto generated id for this object
 */

/**
 * @swagger
 * tags:
 *   name: BImage
 */
const BImage = mongoose.model("BImage", {
  data: { type: Buffer, required: true },
});

export default BImage;
