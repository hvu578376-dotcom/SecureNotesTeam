import sequelize from "../config/db.js";
import User from "./userModel.js";
import Role from "./roleModel.js";
import Note from "./noteModel.js";
import Trash from "./trashModel.js";
import Attachment from "./attachmentModel.js";
import NoteShare from "./noteShareModel.js";
import Comment from "./commentModel.js";
import Notification from "./notificationModel.js";
import AuditLog from "./auditLogModel.js";
import ActiveSession from "./activeSessionModel.js";
import UserSetting from "./userSettingModel.js";

// ==================== Module 1: Tài khoản & Phân quyền ====================
// 1 role có nhiều user, 1 user thuộc về đúng 1 role
// (users.role_id -> roles.id, khớp với fk_users_role trong sql.sql)
Role.hasMany(User, { foreignKey: "roleId", as: "users" });
User.belongsTo(Role, { foreignKey: "roleId", as: "role" });

// ==================== Module 2 & 3: Notes & Private Notes ====================
// 1 user có nhiều note, 1 note thuộc về đúng 1 user (chủ sở hữu)
// (notes.user_id -> users.id, khớp với fk_notes_user trong sql.sql)
User.hasMany(Note, { foreignKey: "userId", as: "notes" });
Note.belongsTo(User, { foreignKey: "userId", as: "owner" });

// ==================== Module 4: Tệp đính kèm & Thùng rác ====================
// 1 note có nhiều attachment (notes.id -> attachments.note_id)
Note.hasMany(Attachment, { foreignKey: "noteId", as: "attachments" });
Attachment.belongsTo(Note, { foreignKey: "noteId", as: "note" });
// Thùng rác không có bảng riêng — xem ghi chú trong trashModel.js

// ==================== Module 5 & 6: Chia sẻ, Bình luận, Thông báo ====================
// 1 note được chia sẻ tới nhiều user, qua bảng trung gian note_shares
Note.hasMany(NoteShare, { foreignKey: "noteId", as: "shares" });
NoteShare.belongsTo(Note, { foreignKey: "noteId", as: "note" });

User.hasMany(NoteShare, { foreignKey: "sharedBy", as: "sharesMade" });
NoteShare.belongsTo(User, { foreignKey: "sharedBy", as: "sharedByUser" });

User.hasMany(NoteShare, { foreignKey: "sharedWith", as: "sharesReceived" });
NoteShare.belongsTo(User, { foreignKey: "sharedWith", as: "sharedWithUser" });

Note.hasMany(Comment, { foreignKey: "noteId", as: "comments" });
Comment.belongsTo(Note, { foreignKey: "noteId", as: "note" });

User.hasMany(Comment, { foreignKey: "userId", as: "comments" });
Comment.belongsTo(User, { foreignKey: "userId", as: "author" });

User.hasMany(Notification, { foreignKey: "userId", as: "notifications" });
Notification.belongsTo(User, { foreignKey: "userId", as: "recipient" });

User.hasMany(Notification, { foreignKey: "actorId", as: "triggeredNotifications" });
Notification.belongsTo(User, { foreignKey: "actorId", as: "actor" });

// ==================== Module 7: Bảo mật nâng cao & Hạ tầng ====================
User.hasMany(AuditLog, { foreignKey: "userId", as: "auditLogs" });
AuditLog.belongsTo(User, { foreignKey: "userId", as: "user" });

User.hasMany(ActiveSession, { foreignKey: "userId", as: "sessions" });
ActiveSession.belongsTo(User, { foreignKey: "userId", as: "user" });

// ==================== Module 8: Settings & Admin Dashboard ====================
// Quan hệ 1-1: mỗi user có đúng 1 bản ghi user_settings
// (user_settings.user_id vừa là PK vừa là FK -> users.id)
User.hasOne(UserSetting, { foreignKey: "userId", as: "settings" });
UserSetting.belongsTo(User, { foreignKey: "userId", as: "user" });

export {
  sequelize,
  User,
  Role,
  Note,
  Trash,
  Attachment,
  NoteShare,
  Comment,
  Notification,
  AuditLog,
  ActiveSession,
  UserSetting,
};
