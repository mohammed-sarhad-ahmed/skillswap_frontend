import { useNavigate } from "react-router";
import { Home } from "lucide-react";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-center p-6">
      <h1 className="text-8xl font-extrabold text-blue-600 mb-4">404</h1>
      <h2 className="text-3xl font-bold text-gray-800 mb-2">Page Not Found</h2>
      <p className="text-gray-600 max-w-md mb-6">
        Oops... the page you’re looking for doesn’t exist or has been moved.
      </p>
      <button
        onClick={() => navigate("/dashboard")}
        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:bg-blue-700 transition"
      >
        <Home size={20} />
        Go Back Home
      </button>
    </div>
  );
}
