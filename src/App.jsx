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
import AppointmentsPage from "./AppointmentsPage";
import BuyCredit from "./BuyCredit";
import ProfileInfo from "./ProfileInfo";
import ChatPage from "./ChatPage";
import ConnectionRequestsPage from "./ConnectionRequestsPage";
import ConnectionsPage from "./ConnectionPage";
import SessionTab from "./SessionTab";
import ReviewsManagement from "./Reviews";
import CoursePage from "./CoursePage";
import CourseManagementPage from "./Courses";

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
            <Route path="/sessions" element={<SessionTab />} />
            <Route path="/appointments" element={<AppointmentsPage />} />
            <Route path="/skills" element={<SkillsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile-info/:userId" element={<ProfileInfo />} />
            <Route path="/buy-credits" element={<BuyCredit />} />
            <Route path="/chat/:userId" element={<ChatPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/reviews" element={<ReviewsManagement />} />
            <Route path="/courses" element={<CourseManagementPage />} />
            <Route path="/courses/:courseId" element={<CoursePage />} />
            <Route
              path="/ConnectionRequests"
              element={<ConnectionRequestsPage />}
            />
            <Route path="/ConnectionPage" element={<ConnectionsPage />} />

            <Route path="/" element={<ProfilePage />} />
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
