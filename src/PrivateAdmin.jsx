import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router";
import toast from "react-hot-toast";
import { getAdminToken, removeAdminToken } from "./ManageToken";
import { API_BASE_URL } from "./Config";

export default function AdminPrivateRoute() {
  const [checking, setChecking] = useState(true);
  const [redirect, setRedirect] = useState(null);
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    const checkAdmin = async () => {
      const token = getAdminToken();

      if (!token) {
        setRedirect("/admin-login");
        setChecking(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/admin/me`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            adminAuth: token, // IMPORTANT!! backend requires this
          },
        });

        const data = await res.json();

        if ([401, 403, 404].includes(res.status)) {
          toast.error(data.message || "Your admin session expired.", {
            duration: 3000,
          });
          removeAdminToken();
          setRedirect("/admin-login");
          return;
        }

        if (!res.ok) {
          toast.error(data.message || "Something went wrong.", {
            duration: 3000,
          });
          return;
        }

        const adminData = data.data.admin;

        if (!adminData || adminData.role !== "admin") {
          toast.error("Access denied. Admins only.", {
            duration: 3000,
          });
          setRedirect("/admin-login");
          return;
        }

        setAdmin(adminData);
      } catch (err) {
        toast.error("Network error. Please try again later.", {
          duration: 3000,
        });
      } finally {
        setChecking(false);
      }
    };

    checkAdmin();
  }, []);

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (redirect) {
    return <Navigate to={redirect} replace />;
  }

  return <Outlet />;
}
