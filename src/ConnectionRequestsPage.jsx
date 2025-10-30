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
          if (notif.type !== "connection_request") return;

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
                ? { ...n, read: true, status }
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

  // 🔹 Step 2: Load connection requests & mark new ones immediately
  useEffect(() => {
    if (!user) return;

    const loadNotifications = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/notifications`, {
          headers: { auth: getToken() },
        });
        const data = await res.json();

        const filtered = data.data.notifications.filter(
          (n) => n.type === "connection_request"
        );

        const prevIds = JSON.parse(
          localStorage.getItem("prevConnectionRequests") || "[]"
        );
        const currentIds = filtered.map((n) => n._id);

        const updated = filtered.map((n) => ({
          ...n,
          seenTwice: n.read || prevIds.includes(n._id),
        }));

        setNotifications(updated);

        const newlySeen = updated.filter((n) => !n.seenTwice).map((n) => n._id);
        if (newlySeen.length > 0) {
          await fetch(`${API_BASE_URL}/notifications/mark-many-read`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              auth: getToken(),
            },
            body: JSON.stringify({ ids: newlySeen }),
          });

          setNotifications((prev) =>
            prev.map((n) =>
              newlySeen.includes(n._id) ? { ...n, seenTwice: true } : n
            )
          );
        }

        localStorage.setItem(
          "prevConnectionRequests",
          JSON.stringify(currentIds)
        );
      } catch (err) {
        toast.error("Failed to load notifications");
      }
    };

    loadNotifications();
  }, [user]);

  // 🔹 Step 3: Handle Accept
  const handleAccept = (notif) => {
    socket.emit("accept_connection_request", {
      notifId: notif._id,
      from: notif.from._id,
      to: user._id,
    });

    setNotifications((prev) =>
      prev.map((n) =>
        n._id === notif._id ? { ...n, read: true, status: "accepted" } : n
      )
    );
    toast.success("Connection accepted!");
  };

  // 🔹 Step 4: Handle Reject
  const handleReject = (notif) => {
    socket.emit("reject_connection_request", {
      notifId: notif._id,
      from: notif.from._id,
      to: user._id,
    });

    setNotifications((prev) =>
      prev.map((n) =>
        n._id === notif._id ? { ...n, read: true, status: "rejected" } : n
      )
    );
    toast.success("Connection rejected!");
  };

  // 🔹 Step 5: UI
  const newNotifs = notifications.filter((n) => !n.seenTwice);

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="bg-white shadow-sm sticky top-0 z-10 py-3 px-6 flex items-center justify-between border-b">
        <h1 className="text-2xl font-bold text-blue-600">
          Connection Requests
        </h1>
      </div>

      <div className="max-w-2xl mx-auto mt-6 px-4 pb-12 space-y-4">
        {newNotifs.length === 0 ? (
          <div className="flex flex-col items-center mt-20 text-gray-400">
            <User size={50} className="mb-2 opacity-70" />
            <p className="text-lg">No new connection requests</p>
          </div>
        ) : (
          newNotifs.map((notif) => (
            <div
              key={notif._id}
              className={`flex items-start gap-4 p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-blue-200`}
            >
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                  <User size={24} className="text-gray-500" />
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-800 text-[15px] leading-snug">
                    {notif.content}
                  </p>
                  <span className="ml-2 text-[11px] font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                    NEW
                  </span>
                </div>

                <p className="text-xs text-gray-500 mb-3">
                  {new Date(notif.createdAt).toLocaleString()}
                </p>

                <div className="flex gap-2 flex-wrap">
                  {notif.content.includes("sent you a connection request") &&
                    !notif.status && (
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
