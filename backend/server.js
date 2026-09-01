import express from "express";
import db from "./src/config/db.js";
import dotenv from "dotenv";
import User from "./src/models/userModel.js";
dotenv.config();
const app = express();

// Bắt buộc để req.body đọc được JSON — Cusers/CNotes/CAuth/... (controller vừa viết)
// đều đọc req.body cho các route POST/PATCH. Express 5 KHÔNG tự bật body-parser,
// thiếu dòng này thì req.body sẽ luôn là undefined.
app.use(express.json());

const PORT = process.env.PORT || 3000;
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "OPTIONS, GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
} );