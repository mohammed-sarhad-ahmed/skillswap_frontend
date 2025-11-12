export const saveToken = (token) => {
  localStorage.setItem("authToken", token);
};
export const getToken = () => {
  return localStorage.getItem("authToken");
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
    console.log(payload);
    return payload.id;
  } catch {
    return null;
  }
};
