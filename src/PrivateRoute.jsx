import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import toast from "react-hot-toast";
import { getToken, removeToken } from "./ManageToken";
import { API_BASE_URL } from "./Config";

export default function PrivateRoute({ requireVerified = true }) {
  const [checking, setChecking] = useState(true);
  const [redirect, setRedirect] = useState(null);
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();
      if (!token) {
        setRedirect("/login");
        setChecking(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/user/me`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if ([401, 403, 404].includes(res.status)) {
          toast.error(
            data.message || "Your session has expired. Please log in again.",
            { duration: 4000 }
          );
          removeToken();
          setRedirect("/login");
          return;
        }

        if (!res.ok) {
          toast.error(data.message || "Something went wrong.", {
            duration: 3000,
          });
          return;
        }

        const userData = data.data.user;
        setUser(userData);

        // Only redirect to verify if verification is required
        if (requireVerified && !userData.isEmailVerified) {
          await fetch(`${API_BASE_URL}/auth/resend-verification-code`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          });
          setRedirect("/verify-code");
        }
      } catch {
        toast.error("Network error. Please try again later.", {
          duration: 3000,
        });
      } finally {
        setChecking(false);
      }
    };

    checkAuth();
  }, [requireVerified]);

  if (user && !user.isEmailVerified && location.pathname === "/verify-code") {
    return <Outlet />;
  }

  if (user && user.isEmailVerified && location.pathname === "/verify-code") {
    return <Navigate to="/dashboard" replace />;
  }

  if (redirect) {
    return <Navigate to={redirect} replace />;
  }

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return <Outlet />;
}
