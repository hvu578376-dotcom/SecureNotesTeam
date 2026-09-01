import { Role } from "../models/index.js";
import { AppError } from "./appError.js";

/**
 * roleService — Module 1: Tài khoản & Phân quyền (phần Role).
 * Role hiếm khi thay đổi (thường chỉ admin thao tác), nên service này
 * khá mỏng — chủ yếu là CRUD + 1 hàm helper kiểm tra quyền hạn dùng
 * chung cho các service khác (VD: middleware phân quyền sau này).
 */

const DEFAULT_ROLE_NAME = "free_user"; // khớp với seed data cuối sql.sql — role gán mặc định khi đăng ký

export async function listRoles() {
  return Role.findAll({ order: [["id", "ASC"]] });
}

export async function getRoleById(roleId) {
  const role = await Role.findByPk(roleId);
  if (!role) throw AppError.notFound("Không tìm thấy vai trò (role) này.", "ROLE_NOT_FOUND");
  return role;
}

export async function getRoleByName(name) {
  return Role.findOne({ where: { name } });
}

/** Role gán mặc định cho user mới đăng ký. Ném lỗi rõ ràng nếu seed data (sql.sql) chưa được chạy. */
export async function getDefaultRole() {
  const role = await getRoleByName(DEFAULT_ROLE_NAME);
  if (!role) {
    throw AppError.internal(
      `Chưa tìm thấy role mặc định "${DEFAULT_ROLE_NAME}" trong DB. Hãy chạy phần SEED DATA ở cuối sql.sql trước.`,
      "DEFAULT_ROLE_MISSING"
    );
  }
  return role;
}

export async function createRole({ name, permissions = [] }) {
  if (!name || !name.trim()) {
    throw AppError.badRequest("Tên role không được để trống.", "ROLE_NAME_REQUIRED");
  }
  const existed = await getRoleByName(name.trim());
  if (existed) throw AppError.conflict(`Role "${name}" đã tồn tại.`, "ROLE_ALREADY_EXISTS");
  return Role.create({ name: name.trim(), permissions });
}

export async function updateRolePermissions(roleId, permissions) {
  const role = await getRoleById(roleId);
  role.permissions = permissions;
  await role.save();
  return role;
}

export async function deleteRole(roleId) {
  const role = await getRoleById(roleId);
  const usersCount = await role.countUsers().catch(() => null);
  // countUsers() chỉ khả dụng nếu association đã được định nghĩa (đã có trong models/index.js).
  if (usersCount) {
    throw AppError.conflict(
      `Không thể xoá role "${role.name}" vì vẫn còn ${usersCount} user đang thuộc role này.`,
      "ROLE_IN_USE"
    );
  }
  await role.destroy();
}

/** Kiểm tra 1 role có quyền `permissionName` hay không (dựa trên cột roles.permissions dạng JSON array). */
export function roleHasPermission(role, permissionName) {
  if (!role || !Array.isArray(role.permissions)) return false;
  return role.permissions.includes(permissionName);
}

export default {
  listRoles,
  getRoleById,
  getRoleByName,
  getDefaultRole,
  createRole,
  updateRolePermissions,
  deleteRole,
  roleHasPermission,
};
