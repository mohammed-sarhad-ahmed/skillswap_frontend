import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import { Menu } from "lucide-react";
import ChatBox from "./ChatBox";
import { getToken } from "./ManageToken";
import { API_BASE_URL } from "./Config";
import io from "socket.io-client";

const socket = io(API_BASE_URL, { transports: ["websocket"] });

export default function ChatPage() {
  const { userId: selectedUserId } = useParams();
  const [currentUser, setCurrentUser] = useState(null);
  const [chatUsers, setChatUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        // Fetch current user
        const resMe = await fetch(`${API_BASE_URL}/user/me`, {
          method: "POST",
          headers: { "Content-Type": "application/json", auth: getToken() },
        });
        const meData = await resMe.json();
        setCurrentUser(meData.data.user);

        // Fetch chat users
        const resChats = await fetch(`${API_BASE_URL}/messages`, {
          headers: { auth: getToken() },
        });
        const chatData = await resChats.json();
        let users = chatData.data.users || [];

        // If URL has a userId but not in users → fetch manually
        if (selectedUserId) {
          let user = users.find((u) => u._id === selectedUserId);
          if (!user) {
            const resUser = await fetch(
              `${API_BASE_URL}/user/teacher/${selectedUserId}`,
              { headers: { auth: getToken() } }
            );
            const userData = await resUser.json();
            user = userData.data.user;
            if (user) users = [...users, user];
          }
          setSelectedUser(user);
        } else {
          setSelectedUser(users[0] || null);
        }

        setChatUsers(users);
        setLoading(false);
      } catch (err) {
        console.error(err);
      }
    }

    init();
  }, [selectedUserId]);

  // Real-time message update (when receiving)
  useEffect(() => {
    socket.on("receive_message", (message) => {
      setChatUsers((prev) =>
        prev.map((user) => {
          if (
            user._id === message.senderId ||
            user._id === message.receiverId
          ) {
            return { ...user, lastMessage: message };
          }
          return user;
        })
      );

      if (
        selectedUser &&
        [selectedUser._id, currentUser?._id].includes(message.senderId) &&
        [selectedUser._id, currentUser?._id].includes(message.receiverId)
      ) {
        setSelectedUser((prev) => ({ ...prev, lastMessage: message }));
      }
    });

    return () => socket.off("receive_message");
  }, [selectedUser, currentUser]);

  // ✅ Update sidebar instantly when sending
  const handleLocalMessageUpdate = (message) => {
    setChatUsers((prev) =>
      prev.map((user) => {
        if (user._id === message.senderId || user._id === message.receiverId) {
          return { ...user, lastMessage: message };
        }
        return user;
      })
    );
  };

  // ✅ time formatter for sidebar
  const formatTime = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (loading)
    return <p className="text-center mt-10 text-gray-500">Loading chat...</p>;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden relative">
      {/* Hamburger for mobile */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute top-4.5 right-3 z-30 bg-white shadow-md rounded-md p-2 md:hidden"
      >
        <Menu size={22} />
      </button>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 w-72 bg-white border-r border-gray-200 flex flex-col z-20 transform transition-transform duration-300 md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <h2 className="p-4 font-bold text-xl text-white bg-gradient-to-r from-red-500 to-red-600 shadow-md border-b border-red-600">
          Chats
        </h2>

        {/* Chat user list */}
        <div className="flex-1 overflow-y-auto">
          {chatUsers.map((user) => {
            const isActive = selectedUser?._id === user._id;
            return (
              <div
                key={user._id}
                onClick={() => {
                  setSelectedUser(user);
                  setSidebarOpen(false);
                }}
                className={`flex items-center gap-3 p-3 cursor-pointer transition border-l-4 ${
                  isActive
                    ? "bg-red-100 border-red-500"
                    : "hover:bg-red-50 border-transparent"
                }`}
              >
                <img
                  src={`${API_BASE_URL}/user_avatar/${user.avatar}`}
                  alt={user.fullName}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1">
                  <p
                    className={`font-medium ${
                      isActive ? "text-red-600" : "text-gray-800"
                    }`}
                  >
                    {user.fullName}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {user.lastMessage?.text || "No messages yet"}
                  </p>
                </div>
                {/* ✅ message time on sidebar */}
                <span className="text-xs text-gray-400 whitespace-nowrap ml-1">
                  {user.lastMessage?.createdAt
                    ? formatTime(user.lastMessage.createdAt)
                    : ""}
                </span>
              </div>
            );
          })}

          {chatUsers.length === 0 && (
            <p className="text-gray-400 text-center mt-5">No chats yet</p>
          )}
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/30 z-10 md:hidden"
        />
      )}

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <ChatBox
            user={selectedUser}
            currentUser={currentUser}
            onLocalMessage={handleLocalMessageUpdate}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 text-lg">
            Select a chat to start messaging
          </div>
        )}
      </div>
    </div>
  );
}
