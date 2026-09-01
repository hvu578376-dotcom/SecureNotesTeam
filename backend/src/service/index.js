/**
 * Barrel export cho tầng Service — cùng tinh thần với src/models/index.js
 * đã có sẵn trong dự án, để Controller (bước tiếp theo) chỉ cần:
 *
 *   import { authService, noteService } from "../service/index.js";
 *
 * thay vì phải nhớ đường dẫn từng file lẻ.
 */

export { AppError } from "./appError.js";

export * as cryptoService from "./cryptoService.js";
export * as totpService from "./totpService.js";

export * as roleService from "./roleService.js";
export * as userService from "./userService.js";
export * as userSettingService from "./userSettingService.js";
export * as sessionService from "./sessionService.js";
export * as authService from "./authService.js";

export * as noteService from "./noteService.js";
export * as trashService from "./trashService.js";
export * as attachmentService from "./attachmentService.js";
export * as noteShareService from "./noteShareService.js";
export * as commentService from "./commentService.js";
export * as notificationService from "./notificationService.js";

export * as auditLogService from "./auditLogService.js";
