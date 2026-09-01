import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

// Bảng attachments — Module 4: Tệp đính kèm.
const Attachment = sequelize.define(
  "Attachment",
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
    fileName: {
      // Tên file gốc
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    fileUrl: {
      // Đường dẫn lưu trữ (AWS S3, Cloudinary,...) — để dài hơn VARCHAR
      // thường vì URL ký (signed URL) hay kèm theo query string/token.
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    fileType: {
      // Định dạng (PDF, JPG, PNG,...)
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    fileSize: {
      // Dung lượng file (Bytes)
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    encryptionIv: {
      // Chỉ có giá trị nếu file đính kèm cũng được mã hóa
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    tableName: "attachments",
    underscored: true,
    timestamps: false, // Tài liệu không liệt kê created_at/updated_at cho bảng này
  }
);

export default Attachment;
