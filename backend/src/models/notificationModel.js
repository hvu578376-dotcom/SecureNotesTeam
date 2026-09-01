import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

// Bảng notifications — Module 5 & 6: Thông báo.
// Khi có thao tác chia sẻ/bình luận, Socket.IO sẽ emit sự kiện realtime,
// đồng thời 1 bản ghi được lưu ở đây để hiển thị lại khi user offline.
const Notification = sequelize.define(
  "Notification",
  {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    userId: {
      // Người NHẬN thông báo -> users.id
      type: DataTypes.CHAR(36),
      allowNull: false,
    },
    actorId: {
      // Người gây ra hành động (VD: ai đó đã chia sẻ) -> users.id.
      // Cho phép NULL để thông báo vẫn giữ được nếu tài khoản actor bị xoá.
      type: DataTypes.CHAR(36),
      allowNull: true,
    },
    type: {
      // VD: note_shared, new_comment
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: "notifications",
    underscored: true,
    timestamps: true,
    updatedAt: false, // Tài liệu chỉ liệt kê created_at cho bảng này
  }
);

export default Notification;
