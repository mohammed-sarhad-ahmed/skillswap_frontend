import React, { useState, useRef, useEffect } from "react";
import { Button } from "./components/ui/button";
import io from "socket.io-client";
import { API_BASE_URL } from "./Config";
import { getToken } from "./ManageToken";
import { useNavigate } from "react-router";

const socket = io(API_BASE_URL, { transports: ["websocket"] });

export default function SessionTab() {
  const [currentUser, setCurrentUser] = useState(null);
  const [nextSession, setNextSession] = useState(null);
  const [canJoin, setCanJoin] = useState(false);
  const [countdown, setCountdown] = useState("");
  const [otherJoined, setOtherJoined] = useState(false);
  const [connected, setConnected] = useState(false);

  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const pcRef = useRef();
  const navigate = useNavigate();

  // Fetch current logged-in user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/user/me`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            auth: getToken(),
          },
        });
        const data = await res.json();
        setCurrentUser(data.data.user);
      } catch (err) {
        console.error("Failed to fetch current user:", err);
      }
    };
    fetchUser();
  }, []);

  // Fetch next session
  useEffect(() => {
    const fetchNext = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/appointments/next`, {
          headers: { auth: getToken() },
        });
        const data = await res.json();
        setNextSession(data.data?.appointment || null);
      } catch (err) {
        console.error(err);
        setNextSession(null);
      }
    };
    fetchNext();
  }, []);

  // Countdown logic
  useEffect(() => {
    if (!nextSession) return;
    const interval = setInterval(() => {
      const now = new Date();
      const start = new Date(nextSession.date);
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      setCanJoin(now >= start && now <= end);

      if (!canJoin) {
        const diff = Math.max(0, start - now);
        const hours = Math.floor(diff / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        const secs = Math.floor((diff % 60000) / 1000);

        let timeStr = "";
        if (hours > 0) timeStr += `${hours}h `;
        if (mins > 0 || hours > 0) timeStr += `${mins}m `;
        timeStr += `${secs}s`;

        setCountdown(timeStr.trim());
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [nextSession, canJoin]);

  // WebRTC + Socket.IO setup
  useEffect(() => {
    if (!canJoin || !nextSession) return;

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    pcRef.current = pc;

    pc.ontrack = (event) => {
      if (remoteVideoRef.current)
        remoteVideoRef.current.srcObject = event.streams[0];
    };

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localVideoRef.current.srcObject = stream;
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      })
      .catch(console.error);

    socket.emit("join_session", { sessionId: nextSession._id });

    socket.on("user_joined_session", () => setOtherJoined(true));
    socket.on("offer", async ({ offer }) => {
      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer", { sessionId: nextSession._id, answer });
    });
    socket.on("answer", async ({ answer }) => pc.setRemoteDescription(answer));
    socket.on("ice_candidate", ({ candidate }) =>
      pc.addIceCandidate(new RTCIceCandidate(candidate))
    );
    pc.onicecandidate = (event) => {
      if (event.candidate)
        socket.emit("ice_candidate", {
          sessionId: nextSession._id,
          candidate: event.candidate,
        });
    };
    socket.on("session_ended", () => {
      pc.close();
      setConnected(false);
      setOtherJoined(false);
      alert("Session ended");
    });

    setConnected(true);

    return () => {
      pc.close();
      socket.off("user_joined_session");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice_candidate");
      socket.off("session_ended");
    };
  }, [canJoin, nextSession]);

  const endSession = () =>
    socket.emit("end_session", { sessionId: nextSession._id });

  // 🩶 Loading user
  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 p-6">
        <p className="text-gray-600 text-lg mb-3">Loading...</p>
      </div>
    );
  }

  // 🩶 No session case
  if (!nextSession) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 p-6">
        <p className="text-gray-600 text-2xl font-semibold">
          No upcoming sessions
        </p>
      </div>
    );
  }

  const otherParticipant =
    nextSession.teacher._id === currentUser._id
      ? nextSession.student
      : nextSession.teacher;

  const handleViewProfile = () => {
    navigate(`/profile-info/${otherParticipant._id}`);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Full-Screen Countdown + Person Info */}
      {!canJoin && (
        <div className="flex flex-col items-center justify-center text-center h-screen w-full bg-gradient-to-br from-purple-600 to-indigo-500 text-white p-10 animate-fade-in">
          <img
            src={`${API_BASE_URL}/user_avatar/${otherParticipant.avatar}`}
            alt={otherParticipant.fullName}
            className="w-32 h-32 rounded-full border-4 border-white shadow-xl mb-6 object-cover"
          />
          <h2 className="text-3xl md:text-4xl font-bold tracking-wide mb-3">
            Your next session is with
          </h2>
          <p className="text-2xl font-semibold mb-4">
            {otherParticipant.fullName}
          </p>
          <Button
            onClick={handleViewProfile}
            className="bg-white text-purple-700 hover:bg-purple-100 font-semibold rounded-full px-6 py-2 mb-6"
          >
            View Profile
          </Button>

          <div className="flex flex-col items-center justify-center bg-white/10 backdrop-blur-md px-10 py-8 rounded-3xl shadow-2xl">
            <p className="text-xl font-medium">Starting in</p>
            <p className="text-5xl md:text-6xl font-extrabold tracking-wider mt-2 animate-pulse">
              {countdown}
            </p>
          </div>

          <p className="text-sm md:text-base opacity-90 italic mt-8">
            Get ready — you can join once the timer hits zero.
          </p>
        </div>
      )}

      {/* Active Session */}
      {canJoin && (
        <div className="flex flex-col h-full bg-gray-50 p-6 gap-6">
          {/* Header */}
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-md border border-gray-200">
            <div className="flex items-center gap-4">
              <img
                src={`${API_BASE_URL}/user_avatar/${otherParticipant.avatar}`}
                alt={otherParticipant.fullName}
                className="w-16 h-16 rounded-full object-cover border-2 border-purple-500"
              />
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {otherParticipant.fullName}
                </h2>
                <p className="text-gray-500 mt-1">
                  Session started at{" "}
                  {new Date(nextSession.date).toLocaleString()}
                </p>
              </div>
            </div>
            <Button
              onClick={handleViewProfile}
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-5 py-2 font-semibold"
            >
              View Profile
            </Button>
          </div>

          {/* Waiting for other user */}
          {!otherJoined && (
            <div className="flex flex-col items-center bg-white p-4 rounded-2xl shadow-md border border-gray-200 mb-4">
              <p className="text-gray-700 mb-2">
                Waiting for participant to join...
              </p>
              <div className="loader border-4 border-gray-300 border-t-purple-500 rounded-full w-12 h-12 animate-spin"></div>
            </div>
          )}

          {/* Video Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Local video */}
            <div className="relative bg-gray-900 rounded-2xl overflow-hidden shadow-lg">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                className="w-full h-80 object-cover"
              />
              <div className="absolute bottom-2 left-2 bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                You
              </div>
            </div>

            {/* Remote video */}
            <div className="relative bg-gray-800 rounded-2xl overflow-hidden shadow-lg">
              <video
                ref={remoteVideoRef}
                autoPlay
                className="w-full h-80 object-cover bg-gray-100"
              />
              <div className="absolute bottom-2 left-2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                {otherJoined ? otherParticipant.fullName : "Waiting..."}
              </div>
            </div>
          </div>

          {connected && (
            <Button
              onClick={endSession}
              className="mt-4 self-center bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2 rounded-full"
            >
              End Session
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
