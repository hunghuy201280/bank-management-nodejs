import BImage from "../models/b_image.js";
import multer from "multer";
import sharp from "sharp";
import express from "express";
import auth from "../middleware/auth.js";
import mongoose from "mongoose";
const router = express.Router();
const upload = multer({
  limits: {
    fileSize: 1000000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      cb(new Error("Please upload an image"));
    }
    cb(null, true);
  },
});
router.post(
  "/images",
  auth,
  upload.array("images"),
  async (req, res) => {
    try {
      const resultId = [];
      const files = req.files;
      console.log(files.length);

      for (var i = 0; i < files.length; i++) {
        const buffer = await sharp(files[i].buffer)
          .resize({ width: 250, height: 250 })
          .png()
          .toBuffer();
        const _id = new mongoose.Types.ObjectId();
        const orn = files[i].originalname;
        const fileName = `${_id.toString()}_${orn.slice(
          0,
          orn.lastIndexOf(".")
        )}.png`;
        const image = BImage({
          _id,
          data: buffer,
          fileName,
        });
        await image.save();
        resultId.push(image.fileName);
      }

      res.send({
        resultId,
      });
    } catch (e) {
      console.log(`upload image error ${e}`);
      res.status(400).send(e);
    }
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.toString() });
  }
);

router.get("/images/:name", async (req, res) => {
  try {
    const image = await BImage.findOne({ fileName: req.params.name });
    if (!image) throw new Error(`Image ${req.params.name} not found`);
    res.set("Content-Type", "image/png");
    res.send(image.data);
  } catch (error) {
    console.log(error);
    res.status(404).send({ error: error.toString() });
  }
});

export default router;
