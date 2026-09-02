import express from "express";
import noteShareController from "../controller/CNoteshares.js";
import { requireAuth } from "../middleware/auth.js";

/**
 * noteShareRouter — Module 5 & 6, phần chia sẻ ghi chú (note_shares).
 * Ánh xạ theo docblock của CNoteshares.js.
 */
const router = express.Router();

router.post("/notes/:noteId/shares", requireAuth, noteShareController.shareNote);
router.get("/notes/:noteId/shares", requireAuth, noteShareController.listSharesForNote);
router.patch("/shares/:shareId", requireAuth, noteShareController.updateSharePermission);
router.delete("/shares/:shareId", requireAuth, noteShareController.revokeShare);

export default router;