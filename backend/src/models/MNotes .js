import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

// Bảng notes — gộp Module 2 & 3 (Notes & Private Notes, mã hóa dữ liệu)
// và phần mở rộng ở Module 4 (is_trashed, deleted_at cho Thùng rác).
//
// Lưu ý quan trọng: tài liệu đặc tả mô tả Thùng rác là "Bảng notes (Cập
// nhật thêm cho Thùng rác)" — tức KHÔNG có bảng trash riêng, is_trashed
// và deleted_at chỉ là 2 cột nằm ngay trong bảng notes này. File
// trashModel.js đi kèm (tương ứng với MTrash.cs bạn đã tạo) không định
// nghĩa lại bảng — nó chỉ export thêm các hàm tiện ích thao tác với
// Thùng rác trên chính model Note bên dưới.
const Note = sequelize.define(
  "Note",
  {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    userId: {
      // Chủ sở hữu ghi chú -> users.id
      type: DataTypes.CHAR(36),
      allowNull: false,
    },
    title: {
      // Có thể mã hóa hoặc để plaintext tùy thiết kế
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    content: {
      // Bắt buộc mã hóa (VD: AES-256-GCM) ở tầng ứng dụng trước khi lưu xuống đây
      type: DataTypes.TEXT,
      allowNull: false,
    },
    isPrivate: {
      // Đánh dấu ghi chú cá nhân, yêu cầu mật khẩu cấp 2 để mở
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isEncrypted: {
      // Đánh dấu dữ liệu đã được mã hóa (End-to-End hoặc Server-side)
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    encryptionIv: {
      // Initialization Vector (IV) - chuỗi ngẫu nhiên cần thiết để giải mã AES
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    color: {
      // Màu sắc giao diện của note
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    isTrashed: {
      // Module 4: trạng thái nằm trong thùng rác (Mặc định: false)
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    deletedAt: {
      // Thời gian bị đưa vào thùng rác — dùng cho cronjob dọn dẹp tự
      // động sau 30 ngày (xem Trash.purgeExpired trong trashModel.js).
      // KHÔNG bật `paranoid: true` của Sequelize ở model này: đây là
      // trạng thái "thùng rác" người dùng vẫn xem/khôi phục được trên
      // giao diện, khác với soft-delete ẩn hoàn toàn ở tầng ORM.
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    tableName: "notes",
    underscored: true,
    timestamps: true, // created_at, updated_at theo đúng tài liệu
  }
);

export default Note;
