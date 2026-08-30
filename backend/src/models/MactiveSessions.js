import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

// Bảng active_sessions — Module 7: Quản lý phiên đăng nhập.
const ActiveSession = sequelize.define(
  "ActiveSession",
  {
    sessionId: {
      // ID phiên (Token JWT ID hoặc Session ID) — do tầng ứng dụng sinh
      // ra và truyền vào, KHÔNG autoIncrement / tự sinh UUID ở đây.
      type: DataTypes.STRING(255),
      primaryKey: true,
    },
    userId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
    },
    deviceInfo: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
  },
  {
    tableName: "active_sessions",
    underscored: true,
    timestamps: false, // Tài liệu không liệt kê created_at/updated_at cho bảng này
  }
);

export default ActiveSession;
