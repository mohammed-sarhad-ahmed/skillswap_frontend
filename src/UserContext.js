import { createContext, useContext, useState, useEffect } from "react";
import { getToken, removeToken } from "./ManageToken";
import { API_BASE_URL } from "./Config";
import toast from "react-hot-toast";

const UserContext = createContext();
export const useUser = () => useContext(UserContext);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = getToken();
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/user/me`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();
        if (!res.ok) {
          removeToken();
          setUser(null);
          toast.error(data.message || "Session expired");
        } else {
          setUser(data.data.user);
        }
      } catch {
        removeToken();
        setUser(null);
        toast.error("Network error");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, loading }}>
      {children}
    </UserContext.Provider>
  );
}
