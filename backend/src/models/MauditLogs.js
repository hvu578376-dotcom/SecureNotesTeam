import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

// Bảng audit_logs — Module 7: Bảo mật nâng cao & Hạ tầng.
// Ghi log toàn bộ hành động nhạy cảm để phục vụ điều tra bảo mật sau này.
const AuditLog = sequelize.define(
  "AuditLog",
  {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    userId: {
      // Có thể NULL nếu là khách (hành động chưa đăng nhập)
      type: DataTypes.CHAR(36),
      allowNull: true,
    },
    action: {
      // VD: login_success, login_failed, change_password, export_data
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    ipAddress: {
      // Đủ dài để chứa cả địa chỉ IPv6
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    userAgent: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    tableName: "audit_logs",
    underscored: true,
    timestamps: true,
    updatedAt: false, // Tài liệu chỉ liệt kê created_at — nhật ký không nên bị sửa lại
  }
);

export default AuditLog;
