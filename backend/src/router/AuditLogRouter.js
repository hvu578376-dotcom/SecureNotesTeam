import express from "express";
import auditLogController from "../controller/CAuditLogs.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";

/**
 * auditLogRouter — Module 7, phần audit_logs (chỉ đọc — việc ghi log là
 * hệ quả nội bộ của các service khác, xem CAuditLogs.js).
 * Ánh xạ theo docblock của CAuditLogs.js.
 */
const router = express.Router();

router.get("/audit-logs/me", requireAuth, auditLogController.listMyAuditLogs);
router.get("/audit-logs", requirePermission("view_audit_logs"), auditLogController.listAllAuditLogs);

export default router;