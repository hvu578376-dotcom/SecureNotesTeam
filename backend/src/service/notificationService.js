import { Notification } from "../models/index.js";
import { AppError } from "./appError.js";

/**
 * notificationService — Module 5 & 6: Thông báo.
 *
 * Lưu ý về Realtime: comment trong notificationModel.js có nhắc tới
 * Socket.IO ("Khi có thao tác chia sẻ/bình luận, Socket.IO sẽ emit sự
 * kiện realtime"). Cố tình KHÔNG import/emit Socket.IO ngay trong service
 * này — service layer chỉ lo phần dữ liệu (tạo/đọc/đánh dấu đã đọc).
 * Việc emit realtime nên làm ở tầng controller/socket-gateway (gọi
 * createNotification() xong rồi mới io.to(userId).emit(...)), để service
 * này không phụ thuộc ngược vào hạ tầng transport — dễ test và tái sử
 * dụng hơn (VD sau này đổi sang WebSocket khác vẫn không phải sửa file này).
 */

export async function createNotification({ userId, actorId = null, type, message }) {
  if (!userId || !type || !message) {
    throw AppError.badRequest("Thiếu userId, type hoặc message khi tạo thông báo.", "NOTIFICATION_INVALID");
  }
  return Notification.create({ userId, actorId, type, message, isRead: false });
}

export async function listForUser(userId, { unreadOnly = false, limit = 20, offset = 0 } = {}) {
  const where = { userId };
  if (unreadOnly) where.isRead = false;
  return Notification.findAndCountAll({
    where,
    order: [["createdAt", "DESC"]],
    limit,
    offset,
  });
}

export async function unreadCount(userId) {
  return Notification.count({ where: { userId, isRead: false } });
}

async function getOwnedNotification(notificationId, userId) {
  const notification = await Notification.findByPk(notificationId);
  if (!notification) throw AppError.notFound("Không tìm thấy thông báo.", "NOTIFICATION_NOT_FOUND");
  if (notification.userId !== userId) {
    throw AppError.forbidden("Đây không phải thông báo của bạn.", "NOTIFICATION_NOT_OWNED");
  }
  return notification;
}

export async function markAsRead(notificationId, userId) {
  const notification = await getOwnedNotification(notificationId, userId);
  if (!notification.isRead) {
    notification.isRead = true;
    await notification.save();
  }
  return notification;
}

export async function markAllAsRead(userId) {
  const [affectedCount] = await Notification.update(
    { isRead: true },
    { where: { userId, isRead: false } }
  );
  return affectedCount;
}

export async function deleteNotification(notificationId, userId) {
  const notification = await getOwnedNotification(notificationId, userId);
  await notification.destroy();
}

export default { createNotification, listForUser, unreadCount, markAsRead, markAllAsRead, deleteNotification };
