import { BrowserRouter, Routes, Route } from "react-router";
import SignupPage from "./SignupPage.jsx";
import LoginPage from "./LoginPage.jsx";
import ForgotPasswordPage from "./ForgotPasswordPage.jsx";
import PrivateRoute from "./PrivateRoute.jsx";
import VerifyCodePage from "./VerifyCodePage.jsx";

function App() {
  return (
    <BrowserRouter>
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

export default App;
