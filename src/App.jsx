import { Button } from "./components/ui/Button";
import { BrowserRouter, Routes, Route } from "react-router";
import SignupPage from "./SignupPage.jsx";
import LoginPage from "./LoginPage.jsx";
import ForgotPasswordPage from "./ForgotPasswordPage.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
