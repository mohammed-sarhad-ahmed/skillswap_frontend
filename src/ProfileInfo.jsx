import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  MessageCircle,
  Flag,
  Mail,
  UserPlus,
  X,
} from "lucide-react";
import { Button } from "./components/ui/button";
import { API_BASE_URL } from "./Config";
import { getToken } from "./ManageToken";
import toast from "react-hot-toast";
import io from "socket.io-client";

const socket = io(API_BASE_URL);

export default function ProfileInfo({ isSidebarOpen }) {
  const { userId: id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [connectionState, setConnectionState] = useState("connect"); // connect, requested, connected, accept

  // Fetch profile user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/user/teacher/${id}`, {
          headers: { auth: getToken() },
        });
        const data = await res.json();
        setUser(data.data.user);
      } catch {
        toast.error("Could not fetch user info");
      }
    };
    fetchUser();
  }, [id]);

  // Fetch current logged-in user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/user/me`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            auth: getToken(),
          },
        });
        const data = await res.json();
        const me = data.data.user;
        setCurrentUser(me);
        socket.emit("register_user", me._id);

        const targetId = String(id);

        if (me.connections.map(String).includes(targetId))
          setConnectionState("connected");
        else if (me.sentRequests.map(String).includes(targetId))
          setConnectionState("requested");
        else if (me.receivedRequests.map(String).includes(targetId))
          setConnectionState("accept");
        else setConnectionState("connect");
      } catch {
        toast.error("Could not fetch current user info");
      }
    };
    fetchCurrentUser();
  }, [id]);

  // Listen to socket events
  useEffect(() => {
    socket.on("connection_request", ({ from }) => {
      if (from === id) setConnectionState("accept");
    });
    socket.on("connection_update", ({ from, to, status }) => {
      if (to === id || from === id) {
        if (status === "accepted") setConnectionState("connected");
        if (status === "cancelled") setConnectionState("connect");
        if (status === "rejected") setConnectionState("connect");
      }
    });
    return () => {
      socket.off("connection_request");
      socket.off("connection_update");
    };
  }, [id]);

  const handleConnect = async () => {
    if (!currentUser || !user) return;
    if (connectionState === "connect") {
      socket.emit("send_connection_request", {
        from: currentUser._id,
        to: user._id,
      });
      setConnectionState("requested");
      toast.success("Connection request sent!");
    } else if (
      connectionState === "requested" ||
      connectionState === "connected"
    ) {
      socket.emit("cancel_connection_request", {
        from: currentUser._id,
        to: user._id,
      });
      setConnectionState("connect");
      toast.success("Connection cancelled");
    } else if (connectionState === "accept") {
      socket.emit("accept_connection_request", {
        from: user._id,
        to: currentUser._id,
      });
      setConnectionState("connected");
      toast.success("Connection accepted");
    }
  };

  if (!user || !currentUser)
    return (
      <div className="flex justify-center items-center h-screen text-lg text-gray-500">
        Loading...
      </div>
    );

  const sidebarWidth = isSidebarOpen ? 256 : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Button */}
      <div className="px-4 py-4">
        <Button
          variant="outline"
          className="rounded-full shadow-sm border-gray-200 bg-white hover:bg-gray-100 text-gray-700 flex items-center gap-2"
          style={{ marginLeft: sidebarWidth }}
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>

      {/* Profile Header */}
      <div className="max-w-5xl mx-auto text-center mt-6 px-4">
        <img
          src={`${API_BASE_URL}/user_avatar/${user.avatar}`}
          alt={user.fullName}
          className="w-36 h-36 rounded-full mx-auto border border-gray-300 shadow-sm object-cover"
        />
        <h1 className="mt-4 text-3xl font-bold text-gray-900">
          {user.fullName}
        </h1>
        <div className="flex justify-center items-center gap-2 mt-1 text-gray-600">
          <Mail className="w-4 h-4" />
          <span>{user.email}</span>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap justify-center gap-3 mt-6">
          <Button
            onClick={handleConnect}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full shadow-sm ${
              connectionState === "connected"
                ? "bg-gray-300 text-gray-700"
                : connectionState === "requested"
                ? "bg-yellow-500 text-white"
                : connectionState === "accept"
                ? "bg-blue-600 text-white"
                : "bg-green-600 text-white"
            }`}
          >
            <UserPlus className="h-5 w-5" />
            {connectionState === "connect"
              ? "Connect"
              : connectionState === "requested"
              ? "Requested"
              : connectionState === "accept"
              ? "Accept"
              : "Connected"}
          </Button>

          {connectionState === "accept" && (
            <Button
              onClick={() => {
                socket.emit("cancel_connection_request", {
                  from: user._id,
                  to: currentUser._id,
                });
                setConnectionState("connect");
                toast.success("Connection rejected");
              }}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-full shadow-sm"
            >
              <X className="h-5 w-5" />
              Reject
            </Button>
          )}

          {/* Message button */}
          <Button
            onClick={() => navigate(`/chat/${user._id}`)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-full shadow-sm"
          >
            <MessageCircle className="h-5 w-5" />
            Message
          </Button>

          {/* Report button */}
          <Button
            onClick={async () => {
              try {
                const res = await fetch(`${API_BASE_URL}/report`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    auth: getToken(),
                  },
                  body: JSON.stringify({ reportedUser: user._id }),
                });
                const data = await res.json();
                if (res.ok) toast.success("User reported successfully!");
                else toast.error(data.message || "Failed to report user");
              } catch {
                toast.error("Something went wrong while reporting.");
              }
            }}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-full shadow-sm"
          >
            <Flag className="h-5 w-5" />
            Report
          </Button>
        </div>
      </div>

      {/* Info Sections */}
      <div className="max-w-5xl mx-auto mt-12 px-4 space-y-10">
        {/* Availability */}
        {user.availability && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">
              Availability
            </h2>
            <ul className="divide-y text-gray-700">
              {Object.entries(user.availability).map(([day, info]) => (
                <li key={day} className="py-2 flex justify-between">
                  <span className="font-medium">{day}</span>
                  {info.off ? (
                    <span className="text-red-500 font-medium">Off</span>
                  ) : (
                    <span className="text-green-600 font-medium">
                      {info.start} - {info.end}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Teaching Skills */}
        {user.teachingSkills?.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">
              Teaching Skills
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {user.teachingSkills.map((skill, i) => (
                <div
                  key={i}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition bg-white"
                >
                  <h3 className="text-lg font-bold text-gray-900">
                    {skill.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {skill.category} • {skill.level}
                  </p>
                  {skill.experience && (
                    <p className="mt-2 text-gray-700 text-sm">
                      <strong>Experience:</strong> {skill.experience} year(s)
                    </p>
                  )}
                  {skill.certifications?.length > 0 && (
                    <p className="mt-1 text-gray-700 text-sm">
                      <strong>Certifications:</strong>{" "}
                      {skill.certifications.join(", ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Learning Skills */}
        {user.learningSkills?.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">
              Learning Skills
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {user.learningSkills.map((skill, i) => (
                <div
                  key={i}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition bg-white"
                >
                  <h3 className="text-lg font-bold text-gray-900">
                    {skill.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {skill.category} • {skill.level}
                  </p>
                  {skill.description && (
                    <p className="mt-2 text-gray-700 text-sm">
                      {skill.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="h-20" />
    </div>
  );
}
