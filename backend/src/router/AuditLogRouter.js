import express from "express";
import auditLogController from "../controller/CAuditLogs.js";

/**
 * auditLogRouter — Module 7, phần audit_logs (chỉ đọc — việc ghi log là
 * hệ quả nội bộ của các service khác, xem CAuditLogs.js).
 * Ánh xạ theo docblock của CAuditLogs.js.
 */
const router = express.Router();

router.get("/audit-logs/me", auditLogController.listMyAuditLogs);
router.get("/audit-logs", auditLogController.listAllAuditLogs);

export default router;