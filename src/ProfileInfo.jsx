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
  const [connectionState, setConnectionState] = useState("connect");
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [showUnconnectModal, setShowUnconnectModal] = useState(false); // 👈 NEW

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

  // Fetch profile user
  useEffect(() => {
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

  // Socket events
  useEffect(() => {
    socket.on("connection_request", ({ from }) => {
      if (from === id) setConnectionState("accept");
    });
    socket.on("connection_update", ({ from, to, status }) => {
      if (to === id || from === id) {
        if (status === "accepted") setConnectionState("connected");
        if (status === "cancelled") setConnectionState("connect");
        if (status === "rejected") setConnectionState("connect");
        fetchUser(); // 👈 REFRESH connection count in realtime
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
    } else if (connectionState === "requested") {
      socket.emit("cancel_connection_request", {
        from: currentUser._id,
        to: user._id,
      });
      setConnectionState("connect");
      toast.success("Connection cancelled");
    } else if (connectionState === "connected") {
      // 👇 Show confirmation modal instead of directly unconnecting
      setShowUnconnectModal(true);
    } else if (connectionState === "accept") {
      socket.emit("accept_connection_request", {
        from: user._id,
        to: currentUser._id,
      });
      setConnectionState("connected");
      toast.success("Connection accepted");
    }
  };

  const confirmUnconnect = () => {
    socket.emit("cancel_connection_request", {
      from: currentUser._id,
      to: user._id,
    });
    setConnectionState("connect");
    toast.success("Unconnected successfully");
    setShowUnconnectModal(false);
  };

  const handleReportSubmit = async () => {
    if (!reportReason) {
      toast.error("Please select a reason");
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          auth: getToken(),
        },
        body: JSON.stringify({ reportedUser: user._id, reason: reportReason }),
      });
      const data = await res.json();
      if (res.ok) toast.success("User reported successfully!");
      else toast.error(data.message || "Failed to report user");
      setShowReportModal(false);
      setReportReason("");
    } catch {
      toast.error("Something went wrong while reporting.");
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
    <div className="min-h-screen bg-gray-50 relative">
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

        {/* Connection count */}
        <p className="text-sm text-gray-500 mt-1">
          🔗 {user.connections?.length || 0} Connections
        </p>

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
              ? "Cancel Request"
              : connectionState === "accept"
              ? "Accept"
              : "unconnect"}
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

          {/* Message */}
          <Button
            onClick={() => navigate(`/chat/${user._id}`)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-full shadow-sm"
          >
            <MessageCircle className="h-5 w-5" />
            Message
          </Button>

          {/* Report */}
          <Button
            onClick={() => setShowReportModal(true)}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-full shadow-sm"
          >
            <Flag className="h-5 w-5" />
            Report
          </Button>
        </div>
      </div>

      {/* ✅ Unconnect Confirmation Modal */}
      {showUnconnectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl p-6 w-80 shadow-lg relative text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              Unconnect from {user.fullName}?
            </h2>
            <p className="text-sm text-gray-600 mb-5">
              Are you sure you want to remove this connection?
            </p>
            <div className="flex justify-center gap-3">
              <Button
                onClick={() => setShowUnconnectModal(false)}
                variant="outline"
                className="px-4 py-2 rounded-lg"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmUnconnect}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
              >
                Unconnect
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 shadow-lg relative">
            <button
              onClick={() => setShowReportModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Report {user.fullName}
            </h2>
            <p className="text-sm text-gray-600 mb-3">
              Select a reason for reporting:
            </p>

            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 mb-4 focus:ring-2 focus:ring-red-500 focus:outline-none"
            >
              <option value="">-- Choose a reason --</option>
              <option value="spam">Spam or scam</option>
              <option value="harassment">Harassment or bullying</option>
              <option value="inappropriate">Inappropriate content</option>
              <option value="fake">Fake account</option>
              <option value="other">Other</option>
            </select>

            {/* 👇 Show text area if "Other" is selected */}
            {reportReason === "other" && (
              <textarea
                placeholder="Please describe the issue..."
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 mb-4 focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
            )}

            <div className="flex justify-end gap-2">
              <Button
                onClick={() => setShowReportModal(false)}
                variant="outline"
                className="px-4 py-2 rounded-lg"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReportSubmit}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
              >
                Submit
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Info sections remain unchanged */}
      <div className="max-w-5xl mx-auto mt-12 px-4 space-y-10">
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
