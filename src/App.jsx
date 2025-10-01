import { BrowserRouter, Routes, Route } from "react-router";
import SignupPage from "./SignupPage.jsx";
import LoginPage from "./LoginPage.jsx";
import ForgotPasswordPage from "./ForgotPasswordPage.jsx";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            fontSize: "14px",
            borderRadius: "10px",
            background: "#fff",
            color: "#333",
          },
        }}
      />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
