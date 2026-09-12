import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AuthLayout from "../component/AuthLayout";
import "../style/style.css";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState("Đang xác minh email...");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setMessage("Liên kết xác minh không hợp lệ.");
      return;
    }

    fetch("http://localhost:3000/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Xác minh email thất bại.");
        setMessage("Email đã được xác minh. Bạn có thể đăng nhập.");
      })
      .catch((error) => setMessage(error.message));
  }, [searchParams]);

  return (
    <AuthLayout>
      <div className="card">
        <h1>Xác minh email</h1>
        <p className="sub">{message}</p>
        <p className="footer-line"><Link to="/login">Đến trang đăng nhập</Link></p>
      </div>
    </AuthLayout>
  );
}