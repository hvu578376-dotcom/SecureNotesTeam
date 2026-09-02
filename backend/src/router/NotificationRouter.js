import express from "express";
import notificationController from "../controller/CNotifications.js";
import { requireAuth } from "../middleware/auth.js";

/**
 * notificationRouter — Module 5 & 6, phần thông báo.
 * Ánh xạ theo docblock của CNotifications.js. Không có route tạo thông
 * báo trực tiếp — thông báo được tạo nội bộ bởi các service khác (chia
 * sẻ note, bình luận,...).
 */
const router = express.Router();

router.get("/notifications", requireAuth, notificationController.listMyNotifications);
router.get("/notifications/unread-count", requireAuth, notificationController.getUnreadCount);
router.patch("/notifications/:notificationId/read", requireAuth, notificationController.markAsRead);
router.patch("/notifications/read-all", requireAuth, notificationController.markAllAsRead);
router.delete("/notifications/:notificationId", requireAuth, notificationController.deleteNotification);

export default router;