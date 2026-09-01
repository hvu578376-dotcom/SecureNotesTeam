import express from "express";
import noteShareController from "../controller/CNoteshares.js";

/**
 * noteShareRouter — Module 5 & 6, phần chia sẻ ghi chú (note_shares).
 * Ánh xạ theo docblock của CNoteshares.js.
 */
const router = express.Router();

router.post("/notes/:noteId/shares", noteShareController.shareNote);
router.get("/notes/:noteId/shares", noteShareController.listSharesForNote);
router.patch("/shares/:shareId", noteShareController.updateSharePermission);
router.delete("/shares/:shareId", noteShareController.revokeShare);

export default router;