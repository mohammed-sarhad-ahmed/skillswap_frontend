import React, { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import io from "socket.io-client";
import { API_BASE_URL } from "./Config";
import { getToken } from "./ManageToken";

const socket = io(API_BASE_URL, { transports: ["websocket"] });

export default function ChatBox({
  user,
  currentUser,
  onClose,
  onLocalMessage,
}) {
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState("");
  const chatEndRef = useRef(null);

  const roomId = [currentUser._id, user._id].sort().join("_");

  // Join room and fetch messages
  useEffect(() => {
    socket.emit("join_chat", {
      userId: currentUser._id,
      otherUserId: user._id,
    });

    fetch(`${API_BASE_URL}/messages/${roomId}`, {
      headers: { auth: getToken() },
    })
      .then((res) => res.json())
      .then((data) => {
        const msgs = (data.data.messages || []).map((m) => ({
          ...m,
          senderId:
            typeof m.senderId === "object" ? m.senderId._id : m.senderId,
          receiverId:
            typeof m.receiverId === "object" ? m.receiverId._id : m.receiverId,
        }));
        setMessages(msgs);
      })
      .catch((err) => console.log(err.message));

    socket.on("receive_message", (message) => {
      // ✅ Ignore your own messages (prevents duplicates)
      if (message.roomId === roomId && message.senderId !== currentUser._id) {
        const msgObj = {
          ...message,
          senderId:
            typeof message.senderId === "object"
              ? message.senderId._id
              : message.senderId,
          receiverId:
            typeof message.receiverId === "object"
              ? message.receiverId._id
              : message.receiverId,
        };
        setMessages((prev) => [...prev, msgObj]);
      }
    });

    return () => {
      socket.off("receive_message");
    };
  }, [roomId, currentUser._id, user._id]);

  // ✅ Send message (emit + local display + sidebar update)
  const sendMessage = () => {
    if (!msg.trim()) return;

    const newMessage = {
      senderId: currentUser._id,
      receiverId: user._id,
      text: msg.trim(),
      roomId,
    };

    // Emit message to server
    socket.emit("send_message", newMessage);

    // ✅ Instantly show locally
    setMessages((prev) => [...prev, newMessage]);

    // ✅ Update sidebar last message
    onLocalMessage && onLocalMessage(newMessage);

    setMsg("");
  };

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView();
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-indigo-500 text-white shadow-md">
        <div className="flex items-center gap-3">
          <img
            src={`${API_BASE_URL}/user_avatar/${user.avatar}`}
            className="w-10 h-10 rounded-full object-cover"
            alt={user.fullName}
          />
          <p className="font-medium">{user.fullName}</p>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.length === 0 && (
          <p className="text-gray-400 text-center mt-4">No messages yet</p>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${
              m.senderId === currentUser._id ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`p-3 rounded-2xl max-w-[70%] break-words shadow ${
                m.senderId === currentUser._id
                  ? "bg-indigo-500 text-white rounded-br-none"
                  : "bg-white text-gray-900 rounded-bl-none"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        <div ref={chatEndRef}></div>
      </div>

      {/* Input */}
      <div className="flex p-3 border-t border-gray-200 bg-white gap-2">
        <Input
          placeholder="Type a message..."
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          className="rounded-full flex-1"
        />
        <Button
          onClick={sendMessage}
          className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-full px-6"
        >
          Send
        </Button>
      </div>
    </div>
  );
}
