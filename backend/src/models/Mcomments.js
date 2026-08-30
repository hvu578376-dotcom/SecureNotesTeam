import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

// Bảng comments — Module 5 & 6: Bình luận & Tương tác.
const Comment = sequelize.define(
  "Comment",
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
    userId: {
      // Người bình luận -> users.id
      type: DataTypes.CHAR(36),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    tableName: "comments",
    underscored: true,
    timestamps: true,
    updatedAt: false, // Tài liệu chỉ liệt kê created_at cho bảng này
  }
);

export default Comment;
