import express from "express";
import noteController from "../controller/CNotes.js";

/**
 * noteRouter — Module 2 & 3 (Notes & Private Notes).
 * Ánh xạ theo docblock của CNotes.js. Xoá/khôi phục (thùng rác) nằm ở
 * trashRouter.js; đính kèm/bình luận/chia sẻ nằm ở attachmentRouter.js /
 * commentRouter.js / noteShareRouter.js — cùng dùng tiền tố
 * "/notes/:noteId/..." nhưng khác controller/service phụ trách.
 *
 * QUAN TRỌNG VỀ THỨ TỰ: "/notes/shared-with-me" phải khai báo TRƯỚC
 * "/notes/:noteId" — cùng lý do như userRouter.js (tránh Express hiểu
 * nhầm "shared-with-me" là giá trị :noteId).
 */
const router = express.Router();

router.post("/notes", noteController.createNote);
router.get("/notes", noteController.listMyNotes);
router.get("/notes/shared-with-me", noteController.listSharedWithMe);
router.get("/notes/:noteId", noteController.getNote);
router.patch("/notes/:noteId", noteController.updateNote);
router.patch("/notes/:noteId/private", noteController.setPrivate);

export default router;