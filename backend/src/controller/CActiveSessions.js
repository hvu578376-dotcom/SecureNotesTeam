import { sessionService } from "../service/index.js";
import { asyncHandler, getCurrentAuth, getCurrentUserId } from "./Httphelper.js";

/**
 * CActiveSessions — Controller cho Module 7, quản lý phiên đăng nhập
 * (active_sessions). Việc TẠO session nằm trong luồng đăng nhập
 * (CAuth.login / CAuth.verifyTwoFactor) — file này chỉ lo xem và thu hồi.
 *
 * Route dự kiến:
 *   GET    /api/sessions             -> listMySessions
 *   DELETE /api/sessions/:sessionId  -> revokeSession
 *   DELETE /api/sessions             -> revokeAllOtherSessions   (giữ lại phiên hiện tại)
 */

/** Danh sách thiết bị đang đăng nhập — dùng cho màn "Quản lý phiên đăng nhập". */
export const listMySessions = asyncHandler(async (req, res) => {
  const userId = await getCurrentUserId(req);
  const sessions = await sessionService.listSessions(userId);
  res.json({ success: true, data: sessions });
});

/** Thu hồi 1 thiết bị cụ thể (VD bấm "Đăng xuất" trên 1 dòng trong danh sách thiết bị). Đã kiểm tra sở hữu trong sessionService. */
export const revokeSession = asyncHandler(async (req, res) => {
  const userId = await getCurrentUserId(req);
  await sessionService.revokeSessionById(req.params.sessionId, userId);
  res.json({ success: true, message: "Đã thu hồi phiên đăng nhập." });
});

/** "Đăng xuất khỏi mọi thiết bị khác" — giữ lại đúng phiên đang gửi request này. */
export const revokeAllOtherSessions = asyncHandler(async (req, res) => {
  const { userId, token } = await getCurrentAuth(req);
  const revokedCount = await sessionService.revokeAllSessions(userId, { exceptToken: token });
  res.json({ success: true, data: { revokedCount } });
});

export default { listMySessions, revokeSession, revokeAllOtherSessions };