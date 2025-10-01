import { BrowserRouter, Routes, Route } from "react-router";
import { Toaster } from "react-hot-toast";

import PrivateRoute from "./PrivateRoute";
import LoginPage from "./LoginPage";
import SignupPage from "./SignupPage";
import ForgotPasswordPage from "./ForgotPasswordPage";
import VerifyCodePage from "./VerifyCodePage";

export default function App() {
  return (
    <BrowserRouter>
      {/* Toast container is global now */}
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 2000,
        }}
      />

      <Routes>
        <Route element={<PrivateRoute />}></Route>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-code" element={<VerifyCodePage />} />
      </Routes>
    </BrowserRouter>
  );
}
