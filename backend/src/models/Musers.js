import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const User = sequelize.define(
  "User",
  {
    id: {
      // CHAR(36) UUID — trigger trg_users_uuid ở DB sẽ tự sinh nếu để trống,
      // nhưng khai báo defaultValue ở đây để Sequelize cũng sinh sẵn UUID
      // ngay khi build() (hữu ích khi cần dùng id trước khi lưu xuống DB).
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    passwordHash: {
      // Cột password_hash — lưu Bcrypt/Argon2 hash, KHÔNG BAO GIỜ lưu plaintext
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    roleId: {
      // Khóa ngoại tới roles.id (cột role_id)
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("active", "banned", "unverified"),
      allowNull: false,
      defaultValue: "unverified",
    },
    isTwoFactorEnabled: {
      // Cột is_2fa_enabled — phải khai báo "field" tường minh vì tên cột
      // chứa số "2fa" nên Sequelize không tự suy ra đúng từ underscored:true
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "is_2fa_enabled",
    },
    twoFactorSecret: {
      // TOTP secret, đã mã hóa — chỉ có giá trị khi isTwoFactorEnabled = true
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    tableName: "users",
    underscored: true, // roleId -> role_id, passwordHash -> password_hash, createdAt -> created_at,...
    timestamps: true,
    defaultScope: {
      // Mặc định KHÔNG trả passwordHash/twoFactorSecret khi query User,
      // tránh vô tình lộ hash ra API. Khi nào cần (lúc kiểm tra mật khẩu ở
      // bước Controller đăng nhập sau này) thì dùng User.unscoped().
      attributes: { exclude: ["passwordHash", "twoFactorSecret"] },
    },
  }
);

export default User;