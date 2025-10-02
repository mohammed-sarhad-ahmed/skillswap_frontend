import { Navigate, Outlet } from "react-router";
import { getToken } from "./ManageToken";

const isAuthenticated = () => {
  return !!getToken();
};

export default function PublicRoute() {
  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}
