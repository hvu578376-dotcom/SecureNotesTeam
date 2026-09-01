import express from "express";
import db from "./src/config/db.js";
import dotenv from "dotenv";
import User from "./src/models/userModel.js";
import apiRouter from "./src/router/index.js";
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
  // PATCH/DELETE và header Authorization (xem Cauth/Httphelper) khiến trình duyệt
  // gửi preflight OPTIONS trước request thật — trả 204 ngay tại đây, nếu không
  // request sẽ rơi xuống router bên dưới và bị fallback 404 của router bắt nhầm.
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// Toàn bộ API nằm sau tiền tố /api — khớp với mọi route trong docblock
// "Route dự kiến" của từng controller (VD Cauth.js: POST /api/auth/login)
// và với frontend/login.html (fetch('/api/auth/login', ...)).
app.use("/api", apiRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
} );