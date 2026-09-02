import { roleService } from "../service/index.js";
import { asyncHandler } from "./Httphelper.js";

/**
 * CRoles — Controller cho Module 1 (Tài khoản & Phân quyền), phần Role.
 *
 * Route dự kiến:
 *   GET    /api/roles                      -> listRoles              (cần đăng nhập)
 *   GET    /api/roles/:roleId              -> getRole                (cần đăng nhập)
 *   POST   /api/roles                      -> createRole             (quyền manage_users)
 *   PATCH  /api/roles/:roleId/permissions  -> updateRolePermissions  (quyền manage_users)
 *   DELETE /api/roles/:roleId              -> deleteRole             (quyền manage_users)
 */

/** Chỉ cần đã đăng nhập là xem được danh sách role (VD: để FE hiển thị dropdown chọn role). */
export const listRoles = asyncHandler(async (req, res) => {
  const roles = await roleService.listRoles();
  res.json({ success: true, data: roles });
});

export const getRole = asyncHandler(async (req, res) => {
  const role = await roleService.getRoleById(req.params.roleId);
  res.json({ success: true, data: role });
});

export const createRole = asyncHandler(async (req, res) => {
  const { name, permissions } = req.body ?? {};
  const role = await roleService.createRole({ name, permissions });
  res.status(201).json({ success: true, data: role });
});

export const updateRolePermissions = asyncHandler(async (req, res) => {
  const { permissions } = req.body ?? {};
  const role = await roleService.updateRolePermissions(req.params.roleId, permissions);
  res.json({ success: true, data: role });
});

export const deleteRole = asyncHandler(async (req, res) => {
  await roleService.deleteRole(req.params.roleId);
  res.json({ success: true, message: "Đã xoá role." });
});

export default { listRoles, getRole, createRole, updateRolePermissions, deleteRole };