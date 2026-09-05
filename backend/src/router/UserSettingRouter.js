import express from "express";
import userSettingController from "../controller/CUserSettings.js";
import { requireAuth } from "../middleware/auth.js";

/**
 * userSettingRouter — Module 8, phần user_settings (quan hệ 1-1 với users).
 * Ánh xạ theo docblock của CUserSettings.js.
 *
 * Không xung đột với "/users/:userId" của userRouter.js: "/users/me/settings"
 * có 2 segment sau "/users" (me, settings) trong khi "/users/:userId" chỉ
 * khớp đúng 1 segment — 2 router này độc lập, thứ tự gắn vào app không
 * ảnh hưởng lẫn nhau.
 */
const router = express.Router();

router.get("/users/me/settings", requireAuth, userSettingController.getMySettings);
//Phục vụ bước Tải dữ liệu cấu hình ban đầu. Khi người dùng vừa click mở trang Cài đặt, giao 
// diện (Frontend) sẽ lập tức gọi API GET này. Dữ liệu kéo về sẽ quyết định trạng thái hiển thị 
// của các nút bấm trên màn hình. Ví dụ: Nếu API trả về theme: "dark", giao diện sẽ tự động gạt 
// công tắc (Toggle) Chế độ Tối sang trạng thái "Bật"; hoặc các hộp kiểm (Checkbox) nhận thông 
// báo qua email sẽ tự động được đánh dấu tick sẵn nếu trước đó người dùng đã chọn.
router.patch("/users/me/settings", requireAuth, userSettingController.updateMySettings);
//Tương ứng với Nút "Lưu thay đổi" hoặc tính năng Tự động lưu khi thay đổi công tắc. 
// Mỗi khi người dùng gạt tắt âm báo, đổi ngôn ngữ, hay thay đổi múi giờ, giao diện sẽ đóng 
// gói các tùy chọn mới đó và gọi API PATCH. Khi Backend báo thành công, màn hình thường sẽ hiện 
// một thông báo nhỏ (Toast message) góc dưới như "Cập nhật cài đặt thành công" mà không cần 
// tải lại trang.
export default router;