import express from "express";
import roleController from "../controller/CRoles.js";

/**
 * roleRouter — Module 1 (Tài khoản & Phân quyền), phần Role.
 * Ánh xạ theo docblock của CRoles.js.
 */
const router = express.Router();

router.get("/roles", roleController.listRoles);
router.get("/roles/:roleId", roleController.getRole);
router.post("/roles", roleController.createRole);
router.patch("/roles/:roleId/permissions", roleController.updateRolePermissions);
router.delete("/roles/:roleId", roleController.deleteRole);

export default router;