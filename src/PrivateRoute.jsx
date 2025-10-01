import { Navigate, Outlet } from "react-router";
import { getToken } from "./ManageToken";

function isLoggedIn() {
  const token = getToken();
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

const PrivateRoute = () => {
  return isLoggedIn() ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
