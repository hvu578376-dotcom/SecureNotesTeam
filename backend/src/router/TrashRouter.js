import express from "express";
import trashController from "../controller/CTrash.js";

/**
 * trashRouter — Module 4 (phần 1): Thùng rác.
 * Ánh xạ theo docblock của CTrash.js. Router này có 2 tiền tố khác nhau
 * ("/trash" và "/notes/:noteId/...") vì thùng rác không có bảng riêng —
 * vẫn thao tác trên bảng notes (cột is_trashed/deleted_at, xem
 * trashModel.js / sql.sql).
 */
const router = express.Router();

router.get("/trash", trashController.listMyTrash);
router.post("/notes/:noteId/trash", trashController.moveToTrash);
router.post("/notes/:noteId/restore", trashController.restoreFromTrash);
router.delete("/trash/:noteId", trashController.permanentlyDelete);
// Quyền manage_users — kiểm tra trong chính controller (requirePermission).
router.post("/trash/purge-expired", trashController.purgeExpiredTrash);

export default router;