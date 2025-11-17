export const saveToken = (token) => {
  localStorage.setItem("authToken", token);
};
export const getToken = () => {
  return localStorage.getItem("authToken");
};

export const getAdminToken = () => {
  return localStorage.getItem("admin_token");
};

export const removeAdminToken = () => {
  return localStorage.removeItem("admin_token");
};

export const removeToken = () => {
  localStorage.removeItem("authToken");
};

// ManageToken.js
export const getUserId = () => {
  const token = localStorage.getItem("authToken");
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.id;
  } catch {
    return null;
  }
};
