import express from "express";
import db from "./src/config/db.js";
import dotenv from "dotenv";
import User from "./src/models/userModel.js";
dotenv.config();
const app = express();

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