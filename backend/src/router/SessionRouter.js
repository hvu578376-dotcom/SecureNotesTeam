import express from "express";
import sessionController from "../controller/CActiveSessions.js";
import { requireAuth } from "../middleware/auth.js";

/**
 * sessionRouter — Module 7, quản lý phiên đăng nhập (active_sessions).
 * Ánh xạ theo docblock của CActiveSessions.js. Việc TẠO session nằm
 * trong luồng đăng nhập ở authRouter.js (login / login/2fa).
 */
const router = express.Router();

router.get("/sessions", requireAuth, sessionController.listMySessions);
router.delete("/sessions/:sessionId", requireAuth, sessionController.revokeSession);
router.delete("/sessions", requireAuth, sessionController.revokeAllOtherSessions);

export default router;