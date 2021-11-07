import BImage from "../models/b_image.js";
import multer from "multer";
import sharp from "sharp";
import express from "express";
import auth from "../middleware/auth.js";
const router = express.Router();
const upload = multer({
  limits: {
    fileSize: 1000000,
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
      for (var i = 0; i < files.length; i++) {
        const buffer = await sharp(files[i].buffer)
          .resize({ width: 250, height: 250 })
          .png()
          .toBuffer();
        const image = BImage({
          data: buffer,
        });
        await image.save();
        resultId.push(image._id);
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
    res.status(400).send({ error: error.message });
  }
);

router.get("/images/:id", async (req, res) => {
  try {
    const image = await BImage.findById(req.params.id);
    if (!image) throw new Error(`Image ${req.params.id} not found`);
    res.set("Content-Type", "image/png");
    res.send(image.data);
  } catch (error) {
    console.log(error);
    res.status(404).send({ error: error.toString() });
  }
});

export default router;
