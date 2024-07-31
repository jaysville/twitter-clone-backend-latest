const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const ExpressError = require("./utils/ExpressError");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const postRoutes = require("./routes/post");

require("dotenv").config();

const app = express();

app.use(
  cors({
    origin: `${process.env.CLIENT_SIDE_URL}`,
  })
);
const multer = require("multer");

const storage = multer.memoryStorage();
// multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "images");
//   },
//   filename: (req, file, cb) => {
//     cb(null, file.originalname);
//   },
// });
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.use(bodyParser.json());

app.use(authRoutes);

app.use(userRoutes);

app.use(multer({ storage, fileFilter }).array("images"));
// app.use(multer({ storage, fileFilter }).single("image"));

app.use(postRoutes);

app.use((err, req, res, next) => {
  if (!err.statusCode) err.statusCode = 500;
  if (!err.message) err.message = "Something went wrong";
  res.status(err.statusCode).json({ error: err.message });
});

const startServer = async () => {
  try {
    await mongoose.connect(process.env.DB_URL);

    app.listen(8080, () => {
      console.log("Server Connected Success");
    });
  } catch (err) {
    throw new ExpressError("Database Connection Failed", 500);
  }
};

startServer();
