import React, { useState, useRef, useEffect } from "react";
import { Button } from "./components/ui/button";
import { API_BASE_URL } from "./Config";
import { getToken } from "./ManageToken";
import { useNavigate } from "react-router";
import Peer from "peerjs";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Expand,
  Eye,
  EyeOff,
} from "lucide-react";

export default function SessionTab() {
  const [currentUser, setCurrentUser] = useState(null);
  const [nextSession, setNextSession] = useState(null);
  const [canJoin, setCanJoin] = useState(false);
  const [countdown, setCountdown] = useState("");
  const [otherJoined, setOtherJoined] = useState(false);
  const [connected, setConnected] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [videoHidden, setVideoHidden] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hasJoined, setHasJoined] = useState(false); // New state to track if user has joined

  const localVideoRef = useRef(null);
  const localVideoContainerRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerRef = useRef(null);
  const callRef = useRef(null);

  const navigate = useNavigate();

  // Check if mobile and handle resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  // Handle sidebar state and reposition local video
  useEffect(() => {
    const handleSidebarToggle = () => {
      // Small delay to ensure DOM has updated
      setTimeout(() => {
        const container = localVideoContainerRef.current;
        if (!container) return;

        const parent = container.parentElement;
        if (!parent) return;

        const parentRect = parent.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        // Get current position
        const currentLeft =
          parseInt(container.style.left) ||
          (isMobile ? 10 : parentRect.width - containerRect.width - 10);
        const currentTop =
          parseInt(container.style.top) ||
          (isMobile ? 10 : parentRect.height - containerRect.height - 10);

        // Ensure video stays within bounds
        const newLeft = Math.max(
          0,
          Math.min(currentLeft, parentRect.width - containerRect.width)
        );
        const newTop = Math.max(
          0,
          Math.min(currentTop, parentRect.height - containerRect.height)
        );

        container.style.left = newLeft + "px";
        container.style.top = newTop + "px";
      }, 100);
    };

    // Use MutationObserver to detect sidebar changes
    const observer = new MutationObserver(handleSidebarToggle);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
      childList: false,
      subtree: false,
    });

    // Also listen for resize events
    window.addEventListener("resize", handleSidebarToggle);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", handleSidebarToggle);
    };
  }, [isMobile]);

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/user/me`, {
          method: "POST",
          headers: { "Content-Type": "application/json", auth: getToken() },
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

      const date = new Date(nextSession.date);
      const [hours, minutes] = nextSession.time.split(":").map(Number);
      date.setHours(hours, minutes, 0, 0);
      const start = date;
      const end = new Date(start.getTime() + 60 * 60 * 1000);

      setCanJoin(now >= start && now <= end);

      if (!canJoin) {
        let diff = Math.max(0, start - now);
        const days = Math.floor(diff / (24 * 3600000));
        diff %= 24 * 3600000;
        const hours = Math.floor(diff / 3600000);
        diff %= 3600000;
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);

        let timeStr = "";
        if (days > 0) timeStr += `${days}d `;
        if (hours > 0 || days > 0) timeStr += `${hours}h `;
        if (mins > 0 || hours > 0 || days > 0) timeStr += `${mins}m `;
        timeStr += `${secs}s`;

        setCountdown(timeStr.trim());
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [nextSession, canJoin]);

  // Prevent horizontal scroll
  useEffect(() => {
    const preventScroll = () => {
      document.body.style.overflowX = "hidden";
      document.documentElement.style.overflowX = "hidden";
    };

    preventScroll();
    window.addEventListener("resize", preventScroll);

    return () => {
      document.body.style.overflowX = "";
      document.documentElement.style.overflowX = "";
      window.removeEventListener("resize", preventScroll);
    };
  }, []);

  const otherParticipant =
    nextSession?.teacher?._id === currentUser?._id
      ? nextSession?.student
      : nextSession?.teacher;

  const handleViewProfile = () => {
    navigate(`/profile-info/${otherParticipant._id}`);
  };

  const buildPeerId = (sessionId, userId) => `sess_${sessionId}_user_${userId}`;

  const startLocalStream = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: true,
    });
    localStreamRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    return stream;
  };

  const setupCallHandlers = (mediaConn) => {
    mediaConn.on("stream", (remoteStream) => {
      if (remoteVideoRef.current)
        remoteVideoRef.current.srcObject = remoteStream;
    });
    mediaConn.on("close", cleanupAfterCall);
    mediaConn.on("error", cleanupAfterCall);
  };

  const cleanupAfterCall = () => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    try {
      callRef.current?.close();
    } catch {}
    try {
      peerRef.current?.destroy();
    } catch {}
    callRef.current = null;
    peerRef.current = null;
    setConnected(false);
    setOtherJoined(false);
    setHasJoined(false); // Reset join state when call ends
  };

  const initPeerAndConnect = async () => {
    if (!currentUser || !nextSession) return;

    const peer = new Peer(buildPeerId(nextSession._id, currentUser._id), {
      host: "192.168.33.12",
      port: 9000,
      path: "/peerjs",
      secure: false, // <-- MUST be true for HTTPS
      config: { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] },
    });

    peerRef.current = peer;

    const attemptCallOther = async () => {
      const otherId = buildPeerId(nextSession._id, otherParticipant._id);
      if (otherId === peer.id) return;
      try {
        const localStream =
          localStreamRef.current || (await startLocalStream());
        const outgoingCall = peer.call(otherId, localStream);
        if (outgoingCall) {
          setupCallHandlers(outgoingCall);
          callRef.current = outgoingCall;
          setConnected(true);
          setOtherJoined(true);
        }
      } catch (err) {
        console.error("Call attempt failed:", err);
      }
    };

    peer.on("open", () => attemptCallOther());
    peer.on("call", async (incomingCall) => {
      const localStream = localStreamRef.current || (await startLocalStream());
      incomingCall.answer(localStream);
      setupCallHandlers(incomingCall);
      callRef.current = incomingCall;
      setConnected(true);
      setOtherJoined(true);
    });
    peer.on("error", console.error);

    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (callRef.current || attempts > 10) clearInterval(interval);
      else attemptCallOther();
    }, 1000);
  };

  const handleJoinSession = async () => {
    setHasJoined(true);
    await startLocalStream(); // Start local stream when joining
    initPeerAndConnect();
  };

  const toggleMic = () => {
    if (!localStreamRef.current) return;
    localStreamRef.current
      .getAudioTracks()
      .forEach((t) => (t.enabled = !t.enabled));
    setMicOn((prev) => !prev);
  };

  const toggleCamera = () => {
    if (!localStreamRef.current) return;
    localStreamRef.current
      .getVideoTracks()
      .forEach((t) => (t.enabled = !t.enabled));
    setCameraOn((prev) => !prev);
  };

  const toggleVideoHidden = () => {
    setVideoHidden((prev) => !prev);
  };

  const toggleShare = async () => {
    if (!callRef.current) return;
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      const displayTrack = displayStream.getVideoTracks()[0];
      const sender = callRef.current.peerConnection
        .getSenders()
        .find((s) => s.track.kind === "video");
      sender.replaceTrack(displayTrack);
      displayTrack.onended = () =>
        sender.replaceTrack(localStreamRef.current.getVideoTracks()[0]);
    } catch (err) {
      console.error(err);
    }
  };

  const endSession = () => cleanupAfterCall();

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanupAfterCall();
  }, []);

  // --- DRAGGING LOGIC ---
  const dragStart = (e) => {
    e.preventDefault();
    const container = localVideoContainerRef.current;
    const parent = container.parentElement;
    if (!container || !parent) return;

    const parentRect = parent.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    let startX = e.type.includes("touch") ? e.touches[0].clientX : e.clientX;
    let startY = e.type.includes("touch") ? e.touches[0].clientY : e.clientY;

    const offsetX = startX - containerRect.left;
    const offsetY = startY - containerRect.top;

    const move = (moveEvent) => {
      const clientX = moveEvent.type.includes("touch")
        ? moveEvent.touches[0].clientX
        : moveEvent.clientX;
      const clientY = moveEvent.type.includes("touch")
        ? moveEvent.touches[0].clientY
        : moveEvent.clientY;

      let newLeft = clientX - offsetX;
      let newTop = clientY - offsetY;

      // constrain inside parent (no safe margins)
      newLeft = Math.max(
        0,
        Math.min(newLeft, parentRect.width - containerRect.width)
      );
      newTop = Math.max(
        0,
        Math.min(newTop, parentRect.height - containerRect.height)
      );

      container.style.left = newLeft + "px";
      container.style.top = newTop + "px";
      container.style.right = "auto";
      container.style.bottom = "auto";
      container.style.position = "absolute";
    };

    const end = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", end);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", end);
    };

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", end);
    window.addEventListener("touchmove", move);
    window.addEventListener("touchend", end);
  };

  // --- RENDER ---
  if (!currentUser)
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 p-6">
        <p className="text-gray-600 text-lg mb-3">Loading...</p>
      </div>
    );

  if (!nextSession)
    return (
      <div className="flex flex-col items-center justify-center h-screen w-full bg-gradient-to-br from-purple-600 to-indigo-500 text-white p-6">
        <div className="bg-white/20 backdrop-blur-md rounded-3xl shadow-2xl p-10 flex flex-col items-center border border-white/30">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 animate-pulse">
            😎 No upcoming sessions
          </h1>
          <p className="text-xl md:text-2xl opacity-90 mb-6 text-center">
            Looks like you're free! Take a break, explore the app, or schedule a
            new session.
          </p>
          <div className="w-48 h-48 bg-white/30 rounded-full flex items-center justify-center mb-6 shadow-lg">
            <span className="text-6xl font-bold text-white">⏱️</span>
          </div>
          <Button
            onClick={() => navigate("/connectionPage")}
            className="mt-6 bg-white text-purple-600 hover:bg-purple-100 font-semibold rounded-full px-6 py-3"
          >
            Schedule a Session
          </Button>
        </div>
      </div>
    );

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
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
          <p className="text-2xl font-semibold mb-6">
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

      {canJoin && !hasJoined && (
        <div className="flex flex-col items-center justify-center text-center h-screen w-full bg-gradient-to-br from-purple-600 to-indigo-500 text-white p-10 animate-fade-in">
          <img
            src={`${API_BASE_URL}/user_avatar/${otherParticipant.avatar}`}
            alt={otherParticipant.fullName}
            className="w-32 h-32 rounded-full border-4 border-white shadow-xl mb-6 object-cover"
          />
          <h2 className="text-3xl md:text-4xl font-bold tracking-wide mb-3">
            Session Ready!
          </h2>
          <p className="text-2xl font-semibold mb-6">
            Join your session with {otherParticipant.fullName}
          </p>
          <Button
            onClick={handleJoinSession}
            className="bg-green-500 hover:bg-green-600 text-white font-bold rounded-full px-8 py-4 text-xl mb-6 transition-all duration-300 transform hover:scale-105"
          >
            Join Session
          </Button>
          <Button
            onClick={handleViewProfile}
            className="bg-white text-purple-700 hover:bg-purple-100 font-semibold rounded-full px-6 py-2 mb-6"
          >
            View Profile
          </Button>
          <p className="text-sm md:text-base opacity-90 italic mt-4">
            Click "Join Session" to start your video call
          </p>
        </div>
      )}

      {canJoin && hasJoined && (
        <div className="flex flex-col h-screen bg-gray-50 p-0 gap-0">
          {/* Waiting */}
          {!otherJoined && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center justify-center text-center bg-white/10 backdrop-blur-md px-10 py-8 rounded-3xl shadow-2xl border border-white/20 animate-fade-in">
              <p className="text-xl font-medium text-white mb-4">
                Waiting for participant to join...
              </p>
              <div className="w-24 h-24 border-4 border-white/30 border-t-purple-500 rounded-full animate-spin mb-4"></div>
              <p className="text-sm text-white/80 italic">
                Don't worry, they'll be here soon!
              </p>
            </div>
          )}

          {/* Video Container */}
          <div className="relative w-full h-full bg-black overflow-hidden">
            {/* Big remote video */}
            <video
              ref={remoteVideoRef}
              autoPlay
              className="w-full h-full object-cover bg-gray-800"
            />
            <div className="absolute top-3 left-3 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
              {otherJoined ? otherParticipant.fullName : "Waiting..."}
            </div>

            {/* Draggable local video - responsive sizing */}
            <div
              ref={localVideoContainerRef}
              className={`absolute ${
                isMobile
                  ? "bottom-4 right-4 w-32 h-24"
                  : "bottom-4 right-4 w-64 h-44"
              } bg-gray-900 border-2 border-white rounded-lg overflow-hidden shadow-md cursor-move ${
                videoHidden ? "hidden" : ""
              }`}
              onMouseDown={dragStart}
              onTouchStart={dragStart}
            >
              <video
                ref={localVideoRef}
                autoPlay
                muted
                className="w-full h-full object-cover select-none pointer-events-none"
              />
              <div className="absolute top-1 left-1 flex items-center gap-1">
                {!micOn && (
                  <MicOff className="text-white" size={isMobile ? 10 : 14} />
                )}
                {!cameraOn && (
                  <VideoOff className="text-white" size={isMobile ? 10 : 14} />
                )}
              </div>
              <div
                className={`absolute bottom-1 left-1 bg-purple-600 text-white ${
                  isMobile ? "px-1 py-0 text-xs" : "px-2 py-0.5 text-xs"
                } rounded font-semibold`}
              >
                You
              </div>
            </div>
          </div>

          {/* Controls - responsive for mobile */}
          {connected && (
            <div
              className={`absolute ${
                isMobile
                  ? "bottom-3 left-1/2 transform -translate-x-1/2"
                  : "bottom-6 left-1/2 transform -translate-x-1/2"
              } z-50 flex justify-center gap-2 flex-wrap`}
            >
              <Button
                onClick={toggleMic}
                className={`${
                  isMobile ? "p-2" : "px-4 py-2"
                } bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-full`}
              >
                {micOn ? (
                  <Mic size={isMobile ? 16 : 20} />
                ) : (
                  <MicOff size={isMobile ? 16 : 20} />
                )}
              </Button>
              <Button
                onClick={toggleCamera}
                className={`${
                  isMobile ? "p-2" : "px-4 py-2"
                } bg-green-500 hover:bg-green-600 text-white font-semibold rounded-full`}
              >
                {cameraOn ? (
                  <Video size={isMobile ? 16 : 20} />
                ) : (
                  <VideoOff size={isMobile ? 16 : 20} />
                )}
              </Button>
              <Button
                onClick={toggleVideoHidden}
                className={`${
                  isMobile ? "p-2" : "px-4 py-2"
                } bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-full`}
              >
                {videoHidden ? (
                  <Eye size={isMobile ? 16 : 20} />
                ) : (
                  <EyeOff size={isMobile ? 16 : 20} />
                )}
              </Button>
              <Button
                onClick={toggleShare}
                className={`${
                  isMobile ? "p-2 text-xs" : "px-4 py-2"
                } bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-full`}
              >
                {isMobile ? "Share" : "Share Screen"}
              </Button>
              <Button
                onClick={endSession}
                className={`${
                  isMobile ? "p-2 text-xs" : "px-4 py-2"
                } bg-red-600 hover:bg-red-700 text-white font-semibold rounded-full`}
              >
                {isMobile ? "End" : "End Session"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
