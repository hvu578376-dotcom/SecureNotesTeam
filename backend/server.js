import express from "express";
import cors from "cors";
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
app.use(cors());

const PORT = process.env.PORT || 3000;


// Toàn bộ API nằm sau tiền tố /api — khớp với mọi route trong docblock
// "Route dự kiến" của từng controller (VD Cauth.js: POST /api/auth/login)
// và với frontend/login.html (fetch('/api/auth/login', ...)).
app.use("/api", apiRouter);

db.sync({ alter: true }) // { alter: true } sẽ tự động cập nhật bảng nếu model thay đổi mà không làm mất dữ liệu cũ
  .then(() => {
    console.log("Đồng bộ database và tạo bảng thành công!");
    
    // Khởi động server sau khi đã kết nối và sync database thành công
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Không thể đồng bộ database:", err);
  });