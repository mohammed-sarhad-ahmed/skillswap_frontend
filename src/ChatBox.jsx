import React, { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";

export default function ChatBox({ user, onClose }) {
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState("");
  const chatEndRef = useRef(null);

  const sendMessage = () => {
    if (!msg.trim()) return;
    setMessages([...messages, { text: msg, sender: "me" }]);
    setMsg("");
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white w-full mx-1 max-w-md rounded-3xl shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
          <h2 className="font-semibold text-lg">Chat with {user.fullName}</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Chat body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {messages.length === 0 && (
            <p className="text-gray-400 text-center mt-4">No messages yet</p>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${
                m.sender === "me" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`p-3 rounded-2xl max-w-[70%] break-words ${
                  m.sender === "me"
                    ? "bg-indigo-500 text-white rounded-br-none"
                    : "bg-white text-gray-900 rounded-bl-none shadow"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          <div ref={chatEndRef}></div>
        </div>

        {/* Input area */}
        <div className="flex p-4 border-t border-gray-200 gap-2 bg-white">
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
    </div>
  );
}
