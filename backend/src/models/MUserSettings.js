import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

// Bảng user_settings — Module 8: Settings & Admin Dashboard.
// Quan hệ 1-1 với users: user_id vừa là PK vừa là FK.
const UserSetting = sequelize.define(
  "UserSetting",
  {
    userId: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
    },
    theme: {
      // Giao diện: light, dark, system
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "system",
    },
    language: {
      // Ngôn ngữ: vi, en
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: "vi",
    },
    emailNotifications: {
      // Nhận thông báo qua email
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    encryptionPreference: {
      // Cấu hình mã hóa cá nhân
      type: DataTypes.STRING(50),
      allowNull: true,
    },
  },
  {
    tableName: "user_settings",
    underscored: true,
    timestamps: false, // Tài liệu không liệt kê created_at/updated_at cho bảng này
  }
);

export default UserSetting;
