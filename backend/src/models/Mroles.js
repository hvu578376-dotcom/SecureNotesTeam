import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

// Bảng roles — Module 1: Tài khoản & Phân quyền (Account & RBAC).
// Định nghĩa các vai trò và danh sách quyền hạn tương ứng trong hệ thống.
const Role = sequelize.define(
  "Role",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      // Tên vai trò. VD: super_admin, admin, premium_user, free_user.
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    permissions: {
      // Tài liệu gốc ghi kiểu JSONB (cú pháp của PostgreSQL), nhưng
      // src/config/db.js khai báo dialect: "mysql" nên ở đây dùng
      // DataTypes.JSON (kiểu JSON gốc của MySQL) — MySQL không có JSONB.
      // VD: ["create_note", "share_note", "manage_users"]
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
  },
  {
    tableName: "roles",
    underscored: true,
    timestamps: false, // Tài liệu không liệt kê created_at/updated_at cho bảng roles
  }
);

export default Role;
