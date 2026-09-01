import { userService } from "../service/index.js";
import { asyncHandler, getCurrentUserId, requirePermission, parsePagination } from "./Httphelper.js";

/**
 * Cusers — Controller cho Module 1 (Tài khoản) & Module 8 (Admin Dashboard),
 * phần quản lý User. Đăng ký/đăng nhập/đổi mật khẩu/2FA nằm ở CAuth.js —
 * file này chỉ lo phần đọc thông tin user và các thao tác quản trị.
 *
 * Route dự kiến:
 *   GET   /api/users/me              -> getMe                (cần đăng nhập)
 *   GET   /api/users                 -> listUsers             (quyền manage_users)
 *   GET   /api/users/:userId         -> getUserById           (quyền manage_users)
 *   PATCH /api/users/:userId/status  -> updateUserStatus      (quyền manage_users)
 *   PATCH /api/users/:userId/role    -> updateUserRole        (quyền manage_users)
 */

export const getMe = asyncHandler(async (req, res) => {
  const userId = await getCurrentUserId(req);
  const user = await userService.getUserById(userId, { includeRole: true });
  res.json({ success: true, data: { user } });
});

/** Module 8: Admin Dashboard — danh sách user có phân trang, lọc theo status. */
export const listUsers = asyncHandler(async (req, res) => {
  await requirePermission(req, "manage_users");
  const { limit, offset } = parsePagination(req.query);
  const { rows, count } = await userService.listUsers({ limit, offset, status: req.query.status });
  res.json({ success: true, data: rows, meta: { limit, offset, total: count } });
});

export const getUserById = asyncHandler(async (req, res) => {
  await requirePermission(req, "manage_users");
  const user = await userService.getUserById(req.params.userId, { includeRole: true });
  res.json({ success: true, data: { user } });
});

/** Admin đổi trạng thái tài khoản: active / banned / unverified. */
export const updateUserStatus = asyncHandler(async (req, res) => {
  await requirePermission(req, "manage_users");
  const { status } = req.body ?? {};
  const user = await userService.setStatus(req.params.userId, status);
  res.json({ success: true, data: { user } });
});

/** Admin đổi role của 1 user (VD: free_user -> premium_user). */
export const updateUserRole = asyncHandler(async (req, res) => {
  await requirePermission(req, "manage_users");
  const { roleId } = req.body ?? {};
  const user = await userService.updateUserRole(req.params.userId, roleId);
  res.json({ success: true, data: { user } });
});

export default { getMe, listUsers, getUserById, updateUserStatus, updateUserRole };