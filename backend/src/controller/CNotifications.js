import { notificationService } from "../service/index.js";
import { asyncHandler, parsePagination } from "./Httphelper.js";

/**
 * CNotifications — Controller cho Module 5 & 6, phần thông báo.
 * Việc TẠO thông báo là hệ quả nội bộ của các service khác (chia sẻ
 * note, bình luận,... xem noteShareService/commentService) — KHÔNG có
 * endpoint tạo thông báo trực tiếp ở đây.
 *
 * Route dự kiến:
 *   GET    /api/notifications                       -> listMyNotifications  (?unreadOnly=true&limit=&offset=)
 *   GET    /api/notifications/unread-count           -> getUnreadCount
 *   PATCH  /api/notifications/:notificationId/read   -> markAsRead
 *   PATCH  /api/notifications/read-all               -> markAllAsRead
 *   DELETE /api/notifications/:notificationId        -> deleteNotification
 */

export const listMyNotifications = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { limit, offset } = parsePagination(req.query);
  const unreadOnly = req.query.unreadOnly === "true";
  const { rows, count } = await notificationService.listForUser(userId, { unreadOnly, limit, offset });
  res.json({ success: true, data: rows, meta: { limit, offset, total: count } });
});

/** Dùng cho chấm đỏ/số đếm chưa đọc trên icon chuông thông báo. */
export const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const count = await notificationService.unreadCount(userId);
  res.json({ success: true, data: { count } });
});

export const markAsRead = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const notification = await notificationService.markAsRead(req.params.notificationId, userId);
  res.json({ success: true, data: notification });
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const affectedCount = await notificationService.markAllAsRead(userId);
  res.json({ success: true, data: { affectedCount } });
});

export const deleteNotification = asyncHandler(async (req, res) => {
  const userId = req.userId;
  await notificationService.deleteNotification(req.params.notificationId, userId);
  res.json({ success: true, message: "Đã xoá thông báo." });
});

export default { listMyNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification };