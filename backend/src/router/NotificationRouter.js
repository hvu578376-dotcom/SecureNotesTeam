import express from "express";
import notificationController from "../controller/CNotifications.js";

/**
 * notificationRouter — Module 5 & 6, phần thông báo.
 * Ánh xạ theo docblock của CNotifications.js. Không có route tạo thông
 * báo trực tiếp — thông báo được tạo nội bộ bởi các service khác (chia
 * sẻ note, bình luận,...).
 */
const router = express.Router();

router.get("/notifications", notificationController.listMyNotifications);
router.get("/notifications/unread-count", notificationController.getUnreadCount);
router.patch("/notifications/:notificationId/read", notificationController.markAsRead);
router.patch("/notifications/read-all", notificationController.markAllAsRead);
router.delete("/notifications/:notificationId", notificationController.deleteNotification);

export default router;