import express from "express";
import commentController from "../controller/CComments.js";
import { requireAuth } from "../middleware/auth.js";

/**
 * commentRouter — Module 5 & 6, phần bình luận trên ghi chú.
 * Ánh xạ theo docblock của CComments.js.
 */
const router = express.Router();

router.post("/notes/:noteId/comments", requireAuth, commentController.addComment);
router.get("/notes/:noteId/comments", requireAuth, commentController.listComments);
router.delete("/comments/:commentId", requireAuth, commentController.deleteComment);

export default router;