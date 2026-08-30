import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

// Bảng note_shares — Module 5 & 6: Chia sẻ ghi chú.
const NoteShare = sequelize.define(
  "NoteShare",
  {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    noteId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
    },
    sharedBy: {
      // Người chia sẻ -> users.id
      type: DataTypes.CHAR(36),
      allowNull: false,
    },
    sharedWith: {
      // Người được chia sẻ -> users.id
      type: DataTypes.CHAR(36),
      allowNull: false,
    },
    permissionLevel: {
      // Quyền truy cập
      type: DataTypes.ENUM("view", "comment", "edit"),
      allowNull: false,
      defaultValue: "view",
    },
  },
  {
    tableName: "note_shares",
    underscored: true,
    timestamps: true,
    updatedAt: false, // Tài liệu chỉ liệt kê created_at cho bảng này
  }
);

export default NoteShare;
