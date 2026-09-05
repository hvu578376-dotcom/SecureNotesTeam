import express from "express";
import authController from "../controller/Cauth.js";
import { requireAuth } from "../middleware/auth.js";

/**
 * authRouter — Module 1 (Tài khoản & Phân quyền), phần xác thực.
 *
 * Ánh xạ đúng theo khối "Route đã gắn" trong docblock của CAuth.js.
 * Đây chính là router mà frontend/login.html gọi tới — fetch('/api/auth/login')
 * hoạt động được nhờ router này (xem server.js).
 *
 * register/verify-email/login/login/2fa/logout KHÔNG gắn middleware
 * (4 route đầu vì chưa đăng nhập thì đương nhiên chưa có token; logout
 * thì cố tình khoan dung — xem LƯU Ý trong CAuth.js). 4 route còn lại
 * (đổi mật khẩu, 2FA) bắt buộc requireAuth — token hợp lệ sẽ được gán
 * sẵn vào req.userId/req.token, controller không tự đọc header nữa.
 */
const router = express.Router();

router.post("/auth/register", authController.register);
///auth/register (Đăng ký): Xử lý dữ liệu từ form Đăng ký (Tên, Email, Mật khẩu). Nếu thành công,
//giao diện thường tự động chuyển hướng người dùng sang trang đăng nhập hoặc trang xác thực.
router.post("/auth/verify-email", authController.verifyEmail);
//(Xác thực Email): Phục vụ màn hình Nhập mã OTP hoặc trang thông báo "Xác thực thành công" 
// khi người dùng click vào link gửi qua email.
router.post("/auth/login", authController.login);
//(Đăng nhập): Phục vụ form Đăng nhập. Điểm quan trọng: Khi API này trả về thành công, nó cấp 
// một "Token" (chìa khóa). Giao diện frontend sẽ phải lưu Token này lại (vào LocalStorage hoặc 
// Cookie) để gắn vào các yêu cầu tiếp theo.
router.post("/auth/login/2fa", authController.verifyTwoFactor);
//(Xác thực 2 bước khi login): Nếu tài khoản bật 2FA, sau khi nhập đúng mật khẩu ở /login, 
// giao diện chưa cho vào app vội mà sẽ hiển thị thêm một popup/màn hình Nhập mã 6 số 
// (Google Authenticator). API này xử lý bước đó.
router.post("/auth/logout", authController.logout);
//Phục vụ nút Đăng xuất thường nằm ở avatar góc phải hoặc menu bên trái.
//API này cố tình không dùng requireAuth (được ghi trong comment là "khoan dung"). Lý do UX/UI: 
// Nếu token của người dùng bị lỗi, họ không thể gọi các API có requireAuth. Nếu bắt ép 
// requireAuth ở logout, họ sẽ bị kẹt không thể đăng xuất được. Thiết kế mở này giúp frontend 
// luôn có thể xóa phiên đăng nhập hiện tại dù trạng thái token ra sao.
router.patch("/auth/password", requireAuth, authController.changePassword);
//Phục vụ form Đổi mật khẩu (thường có 3 ô: Mật khẩu hiện tại, Mật khẩu mới, Xác nhận mật khẩu mới).
router.post("/auth/2fa/setup", requireAuth, authController.beginTwoFactorSetup);
//Phục vụ nút Bật bảo mật 2 lớp. Khi bấm nút này, giao diện gọi API để lấy dữ liệu sinh ra một 
// Mã QR hiển thị lên màn hình.
router.post("/auth/2fa/confirm", requireAuth, authController.confirmTwoFactorSetup);
//Phục vụ ô Nhập mã xác nhận nằm ngay dưới mã QR. Người dùng quét QR xong phải nhập 6 số 
// vào ô này, bấm "Xác nhận" gọi API này thì 2FA mới thực sự kích hoạt.
router.post("/auth/2fa/disable", requireAuth, authController.disableTwoFactor);
//Phục vụ nút màu đỏ hoặc công tắc gạt Tắt 2FA. Dùng khi người dùng muốn gỡ bỏ bảo mật 2 lớp.

export default router;