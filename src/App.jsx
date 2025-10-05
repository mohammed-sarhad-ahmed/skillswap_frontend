import { BrowserRouter, Routes, Route } from "react-router";
import { Toaster } from "react-hot-toast";

import PrivateRoute from "./PrivateRoute";
import LoginPage from "./LoginPage";
import SignupPage from "./SignupPage";
import ForgotPasswordPage from "./ForgotPasswordPage";
import VerifyCodePage from "./VerifyCodePage";
import NotFoundPage from "./NotFoundPage";
import PublicRoute from "./PublicRoute";
import ResetPasswordPage from "./ResetPassword";
import MainLayout from "./MainLayout";
import SkillsPage from "./Skills";
import ProfilePage from "./Profile";

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 2000,
          style: { fontSize: "16px" },
        }}
      />

      <Routes>
        <Route element={<PrivateRoute requireVerified={true} />}>
          <Route element={<MainLayout />}>
            <Route path="/sessions" element={<div>Sessions Page</div>} />
            <Route
              path="/appointments"
              element={<div>Appointments Page</div>}
            />
            <Route path="/skills" element={<SkillsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/buy-credits" element={<div>Buy Credits Page</div>} />
          </Route>
        </Route>

        <Route element={<PrivateRoute requireVerified={false} />}>
          <Route path="/verify-code" element={<VerifyCodePage />} />
        </Route>

        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route
            path="/reset-password/:token"
            element={<ResetPasswordPage />}
          />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
