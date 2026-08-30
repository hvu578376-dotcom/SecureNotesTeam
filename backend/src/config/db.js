import { Sequelize } from "sequelize";
import dotenv from "dotenv";

// Nạp biến môi trường ngay tại đây (thay vì chỉ ở server.js).
// Lý do: ES Module import được "hoist" (chạy trước phần code còn lại của
// file import nó), nên nếu server.js import file này TRƯỚC khi gọi
// dotenv.config(), Sequelize phía dưới sẽ được khởi tạo với
// process.env.Database_* = undefined. Gọi dotenv.config() ngay tại file
// config để đảm bảo luôn đúng, bất kể thứ tự import ở nơi khác.
dotenv.config();

const sequelize = new Sequelize(
  process.env.Database_Name,
  process.env.Database_User,
  process.env.Database_Password,
  {
    host: process.env.Database_Host,
    port: process.env.Database_Port,
    dialect: "mysql",
  }
);

export default sequelize;
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('Kết nối database MySQL thành công!');
    } catch (error) {
        console.error('Không thể kết nối đến database:', error);
    }
};

testConnection();