import { Op } from "sequelize";
import Note from "./noteModel.js";

// "Model" cho Module 4 — Thùng rác (Trash) — tương ứng với MTrash.cs bạn đã tạo.
//
// Theo tài liệu đặc tả, Thùng rác KHÔNG phải là một bảng riêng: nó là 2
// cột (is_trashed, deleted_at) được thêm ngay vào bảng `notes` (xem
// noteModel.js). Vì vậy file này KHÔNG gọi sequelize.define() lần nữa —
// làm vậy sẽ tạo ra một bảng trùng/xung đột với Note. Thay vào đó, nó
// chỉ bọc lại các thao tác thường dùng cho tính năng Thùng rác trên
// chính model Note, để bạn vẫn có 1 file riêng cho module này.
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const Trash = {
  // Đưa 1 note vào thùng rác (soft delete)
  moveToTrash(noteId) {
    return Note.update(
      { isTrashed: true, deletedAt: new Date() },
      { where: { id: noteId } }
    );
  },

  // Khôi phục 1 note ra khỏi thùng rác
  restoreFromTrash(noteId) {
    return Note.update(
      { isTrashed: false, deletedAt: null },
      { where: { id: noteId } }
    );
  },

  // Lấy danh sách note đang ở trong thùng rác của 1 user
  listTrashed(userId) {
    return Note.findAll({ where: { userId, isTrashed: true } });
  },

  // Dùng cho cronjob: xoá vĩnh viễn các note đã nằm trong thùng rác quá
  // 30 ngày — đúng như mô tả của cột deleted_at trong tài liệu.
  purgeExpired() {
    const cutoff = new Date(Date.now() - THIRTY_DAYS_MS);
    return Note.destroy({
      where: {
        isTrashed: true,
        deletedAt: { [Op.lte]: cutoff },
      },
    });
  },
};

export default Trash;
