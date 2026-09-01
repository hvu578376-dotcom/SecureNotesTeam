import express from "express";
import commentController from "../controller/CComments.js";

/**
 * commentRouter — Module 5 & 6, phần bình luận trên ghi chú.
 * Ánh xạ theo docblock của CComments.js.
 */
const router = express.Router();

router.post("/notes/:noteId/comments", commentController.addComment);
router.get("/notes/:noteId/comments", commentController.listComments);
router.delete("/comments/:commentId", commentController.deleteComment);

export default router;