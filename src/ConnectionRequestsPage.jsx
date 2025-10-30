import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "./components/ui/button";
import { API_BASE_URL } from "./Config";
import { getToken } from "./ManageToken";
import toast from "react-hot-toast";
import io from "socket.io-client";
import { Check, X, User } from "lucide-react";

const socket = io(API_BASE_URL, { transports: ["websocket"] });

export default function ConnectionRequestsPage() {
  const [notifications, setNotifications] = useState([]);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // 🔹 Step 1: Fetch user and setup socket
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/user/me`, {
          method: "POST",
          headers: { "Content-Type": "application/json", auth: getToken() },
        });
        const data = await res.json();
        setUser(data.data.user);

        socket.emit("register_user", data.data.user._id);

        socket.on("notification", async (notif) => {
          if (
            !["connection_request", "connection_accepted"].includes(notif.type)
          )
            return;

          if (typeof notif.from === "string") {
            try {
              const res = await fetch(
                `${API_BASE_URL}/user/teacher/${notif.from}`,
                { headers: { auth: getToken() } }
              );
              const data = await res.json();
              notif.from = data.data.user;
            } catch {
              notif.from = { _id: notif.from };
            }
          }

          setNotifications((prev) => [notif, ...prev]);
        });

        socket.on("connection_update", ({ from, to, status }) => {
          setNotifications((prev) =>
            prev.map((n) =>
              n.from?._id === from && n.type === "connection_request"
                ? { ...n, status }
                : n
            )
          );
        });
      } catch {
        toast.error("Failed to load user");
      }
    };

    fetchUser();
  }, []);

  // 🔹 Step 2: Load notifications
  useEffect(() => {
    if (!user) return;

    const loadNotifications = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/notifications`, {
          headers: { auth: getToken() },
        });
        const data = await res.json();

        const filtered = data.data.notifications.filter((n) =>
          ["connection_request", "connection_accepted"].includes(n.type)
        );

        setNotifications(filtered);
      } catch {
        toast.error("Failed to load notifications");
      }
    };

    loadNotifications();
  }, [user]);

  // 🔹 Step 3: Handle Accept
  const handleAccept = async (notif) => {
    socket.emit("accept_connection_request", {
      notifId: notif._id,
      from: notif.from._id,
      to: user._id,
    });

    try {
      await fetch(
        `${API_BASE_URL}/user/connections/delete-notification/${notif._id}`,
        {
          method: "DELETE",
          headers: { auth: getToken() },
        }
      );
    } catch (err) {
      console.error(err);
    }

    setNotifications((prev) => prev.filter((n) => n._id !== notif._id));
    toast.success("Connection accepted!");
  };

  // 🔹 Step 4: Handle Reject
  const handleReject = async (notif) => {
    socket.emit("reject_connection_request", {
      notifId: notif._id,
      from: notif.from._id,
      to: user._id,
    });

    try {
      await fetch(
        `${API_BASE_URL}/user/connections/delete-notification/${notif._id}`,
        {
          method: "DELETE",
          headers: { auth: getToken() },
        }
      );
    } catch (err) {
      console.error(err);
    }

    setNotifications((prev) => prev.filter((n) => n._id !== notif._id));
    toast.success("Connection rejected!");
  };

  // 🔹 Step 5: Auto-hide "accepted your connection request" notifications after second view
  useEffect(() => {
    notifications.forEach(async (notif) => {
      if (
        notif.content.includes("accepted your connection request.") ||
        notif.content.includes("rejected your connection request.")
      ) {
        try {
          const res = await fetch(
            `${API_BASE_URL}/user/connections/mark-seen-or-delete/${notif._id}`,
            {
              method: "PATCH",
              headers: { auth: getToken() },
            }
          );
          const data = await res.json();
          // If deleted on backend, remove from frontend
          if (data.message.includes("deleted")) {
            setNotifications((prev) => prev.filter((n) => n._id !== notif._id));
          }
        } catch (err) {
          console.error(err);
        }
      }
    });
  }, [notifications]);

  // 🔹 Step 6: UI
  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="bg-white shadow-sm sticky top-0 z-10 py-3 px-6 flex items-center justify-between border-b">
        <h1 className="text-2xl font-bold text-blue-600">
          Connection Requests
        </h1>
      </div>

      <div className="max-w-2xl mx-auto mt-6 px-4 pb-12 space-y-4">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center mt-20 text-gray-400">
            <User size={50} className="mb-2 opacity-70" />
            <p className="text-lg">No connection requests</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif._id}
              className="flex items-start gap-4 p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-blue-200"
            >
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                  <User size={24} className="text-gray-500" />
                </div>
              </div>

              <div className="flex-1">
                <p className="text-gray-800 text-[15px] leading-snug mb-2">
                  {notif.content}
                </p>

                <p className="text-xs text-gray-500 mb-3">
                  {new Date(notif.createdAt).toLocaleString()}
                </p>

                <div className="flex gap-2 flex-wrap">
                  {notif.type === "connection_request" &&
                  !notif.status &&
                  !notif.content.includes(
                    "accepted your connection request."
                  ) &&
                  !notif.content.includes(
                    "rejected your connection request."
                  ) ? (
                    <>
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1"
                        onClick={() => handleAccept(notif)}
                      >
                        <Check size={16} /> Accept
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1 border-gray-300 text-gray-700 hover:bg-gray-100"
                        onClick={() => handleReject(notif)}
                      >
                        <X size={16} /> Reject
                      </Button>
                    </>
                  ) : (
                    (notif.status || notif.type === "connection_accepted") && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-sm font-semibold ${
                          notif.status === "accepted" ||
                          notif.type === "connection_accepted"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {notif.status === "accepted" ||
                        notif.type === "connection_accepted"
                          ? "Accepted"
                          : "Rejected"}
                      </span>
                    )
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    className="flex items-center gap-1 text-gray-600 hover:text-blue-600"
                    onClick={() => navigate(`/profile-info/${notif.from._id}`)}
                  >
                    <User size={16} /> View Profile
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
