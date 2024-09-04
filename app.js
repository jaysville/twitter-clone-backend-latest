require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const { createServer } = require("http");

const ExpressError = require("./utils/ExpressError");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const postRoutes = require("./routes/post");

const app = express();

const helmet = require("helmet");
const server = createServer(app);
const io = require("./socket").init(server);

const allowedOrigins = [
  "http://localhost:3000",
  "https://jays-twitter-clone.vercel.app",
];

const corsOptions = {
  origin: (origin, callback) => {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));

const multer = require("multer");

const storage = multer.memoryStorage();

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

app.use(helmet());

app.use(authRoutes);

app.use(multer({ storage, fileFilter }).array("images"));

app.use(userRoutes);
app.use(postRoutes);

app.use((err, req, res, next) => {
  if (!err.statusCode) err.statusCode = 500;
  if (!err.message) err.message = "Something went wrong";
  console.log(err);
  res.status(err.statusCode).json({
    error: err.statusCode === 500 ? "Something went wrong" : err.message,
  });
});

(async () => {
  try {
    await mongoose.connect(process.env.DB_URL);
    server.listen(process.env.PORT, () => {
      console.log("Server Connected Success");
    });
  } catch (err) {
    throw new ExpressError("Database Connection Failed", 500);
  }
})();
