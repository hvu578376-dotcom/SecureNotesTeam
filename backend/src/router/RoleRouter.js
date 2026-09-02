import express from "express";
import roleController from "../controller/CRoles.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";

/**
 * roleRouter — Module 1 (Tài khoản & Phân quyền), phần Role.
 * Ánh xạ theo docblock của CRoles.js.
 */
const router = express.Router();

router.get("/roles", requireAuth, roleController.listRoles);
router.get("/roles/:roleId", requireAuth, roleController.getRole);
router.post("/roles", requirePermission("manage_users"), roleController.createRole);
router.patch("/roles/:roleId/permissions", requirePermission("manage_users"), roleController.updateRolePermissions);
router.delete("/roles/:roleId", requirePermission("manage_users"), roleController.deleteRole);

export default router;