// tokenService.js — lưu / đọc / xoá token đăng nhập ở localStorage.
//
// Dùng chung 1 key "cn_token" với authHeaders() trong page/homePage.jsx
// (Authorization: Bearer <token>) — đổi key ở đây thì phải đổi luôn bên đó.
const TOKEN_KEY = "cn_token";

export function saveToken(token) {
  if (typeof window === "undefined" || !token) return;
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function getToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated() {
  return !!getToken();
}

export default { saveToken, getToken, clearToken, isAuthenticated };