import express from "express";
import userController from "../controller/Cusers.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";

const router = express.Router();

router.get("/users/me", requireAuth, userController.getMe);
router.get("/users", requirePermission("manage_users"), userController.listUsers);
router.get("/users/:userId", requirePermission("manage_users"), userController.getUserById);
router.patch("/users/:userId/status", requirePermission("manage_users"), userController.updateUserStatus);
router.patch("/users/:userId/role", requirePermission("manage_users"), userController.updateUserRole);

export default router;