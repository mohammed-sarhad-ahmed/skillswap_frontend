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
  Eye,
  EyeOff,
  Monitor,
  MonitorOff,
  Volume2,
  VolumeX,
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
  const [hasJoined, setHasJoined] = useState(false);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [screenAudioOn, setScreenAudioOn] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  const localVideoRef = useRef(null);
  const localVideoContainerRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peerRef = useRef(null);
  const callRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioMixerRef = useRef(null);

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

  // Handle sidebar state and keep local video in top right
  useEffect(() => {
    const positionLocalVideo = () => {
      const container = localVideoContainerRef.current;
      if (!container) return;

      container.style.position = "absolute";
      container.style.top = "10px";
      container.style.right = "10px";
      container.style.left = "auto";
      container.style.bottom = "auto";
    };

    positionLocalVideo();
    window.addEventListener("resize", positionLocalVideo);

    return () => {
      window.removeEventListener("resize", positionLocalVideo);
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

  // Fetch sessions (active first, then next)
  const fetchSessions = async () => {
    try {
      // First, check for active sessions
      const activeRes = await fetch(`${API_BASE_URL}/appointments/active`, {
        headers: { auth: getToken() },
      });
      const activeData = await activeRes.json();

      if (activeData.data?.appointment) {
        setNextSession(activeData.data.appointment);
        setCanJoin(true);
        setSessionEnded(false);
        console.log("Active session found:", activeData.data.appointment);
        return;
      }

      // If no active session, get the next upcoming one
      const nextRes = await fetch(`${API_BASE_URL}/appointments/next`, {
        headers: { auth: getToken() },
      });
      const nextData = await nextRes.json();
      setNextSession(nextData.data?.appointment || null);
      setSessionEnded(false);
      console.log("Next session:", nextData.data?.appointment);
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
      setNextSession(null);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // Countdown logic for upcoming sessions
  useEffect(() => {
    if (!nextSession || canJoin || sessionEnded) return;

    const interval = setInterval(() => {
      const now = new Date();

      // Use the date field directly since it's already a full timestamp
      const sessionStart = new Date(nextSession.date);

      // Override the time with the time from the time field if needed
      if (nextSession.time) {
        const [hours, minutes] = nextSession.time.split(":").map(Number);
        sessionStart.setHours(hours, minutes, 0, 0);
      }

      const sessionEnd = new Date(sessionStart.getTime() + 60 * 60 * 1000);

      const isSessionActive = now >= sessionStart && now <= sessionEnd;
      setCanJoin(isSessionActive);

      if (!isSessionActive) {
        let diff = Math.max(0, sessionStart - now);
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
      } else {
        setCountdown("00:00:00");
        setCanJoin(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [nextSession, canJoin, sessionEnded]);

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
    if (otherParticipant) {
      navigate(`/profile-info/${otherParticipant._id}`);
    }
  };

  const buildPeerId = (sessionId, userId) => `sess_${sessionId}_user_${userId}`;

  const startLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 48000,
          googEchoCancellation: true,
          googAutoGainControl: true,
          googNoiseSuppression: true,
          googHighpassFilter: true,
        },
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      return stream;
    } catch (error) {
      console.error("Error starting local stream:", error);
      // Fallback to basic constraints
      const fallbackStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = fallbackStream;
      if (localVideoRef.current)
        localVideoRef.current.srcObject = fallbackStream;
      return fallbackStream;
    }
  };

  const setupCallHandlers = (mediaConn) => {
    mediaConn.on("stream", (remoteStream) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.setAttribute("playsinline", "true");
        remoteVideoRef.current.playsInline = true;
      }
      setOtherJoined(true);
    });

    mediaConn.on("close", () => {
      console.log("Call closed by other participant");
      handleSessionEnded();
    });

    mediaConn.on("error", (err) => {
      console.error("Call error:", err);
      handleSessionEnded();
    });
  };

  const createMixedAudioStream = (micStream, screenStream) => {
    try {
      const audioContext = new AudioContext();
      const destination = audioContext.createMediaStreamDestination();

      // Create gain nodes for volume control
      const micGain = audioContext.createGain();
      const screenGain = audioContext.createGain();

      // Set initial volumes - reduce screen audio to prevent echo
      micGain.gain.value = 0.8;
      screenGain.gain.value = 0.2;

      // Connect mic audio
      if (micStream.getAudioTracks().length > 0) {
        const micSource = audioContext.createMediaStreamSource(
          new MediaStream([micStream.getAudioTracks()[0]])
        );
        micSource.connect(micGain);
        micGain.connect(destination);
      }

      // Connect screen audio with echo prevention
      if (screenStream.getAudioTracks().length > 0) {
        const screenSource = audioContext.createMediaStreamSource(
          new MediaStream([screenStream.getAudioTracks()[0]])
        );

        // Add a highpass filter to reduce low frequencies that cause echo
        const highpassFilter = audioContext.createBiquadFilter();
        highpassFilter.type = "highpass";
        highpassFilter.frequency.value = 300;

        screenSource.connect(highpassFilter);
        highpassFilter.connect(screenGain);
        screenGain.connect(destination);
      }

      audioContextRef.current = audioContext;
      audioMixerRef.current = { micGain, screenGain };

      return destination.stream;
    } catch (error) {
      console.error("Error creating mixed audio:", error);
      // Fallback: use mic audio only to prevent echo issues
      return new MediaStream(micStream.getAudioTracks());
    }
  };

  const replaceAudioTrack = (newTrack) => {
    if (!callRef.current) return;

    const sender = callRef.current.peerConnection
      ?.getSenders()
      ?.find((s) => s.track && s.track.kind === "audio");

    if (sender && newTrack) {
      sender
        .replaceTrack(newTrack)
        .catch((err) => console.error("Error replacing audio track:", err));
    }
  };

  const cleanupAfterCall = () => {
    // Stop all media tracks
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
      audioMixerRef.current = null;
    }

    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;

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
    setHasJoined(false);
    setIsSharingScreen(false);
    setScreenAudioOn(false);
  };

  const replaceVideoTrack = (newTrack) => {
    if (!callRef.current) return;

    const sender = callRef.current.peerConnection
      ?.getSenders()
      ?.find((s) => s.track && s.track.kind === "video");

    if (sender && newTrack) {
      sender
        .replaceTrack(newTrack)
        .catch((err) => console.error("Error replacing video track:", err));
    }
  };

  const toggleScreenAudio = () => {
    if (!audioMixerRef.current || !screenStreamRef.current) return;

    const newState = !screenAudioOn;
    setScreenAudioOn(newState);

    // Adjust screen audio volume - keep it low to prevent echo
    if (audioMixerRef.current.screenGain) {
      audioMixerRef.current.screenGain.gain.value = newState ? 0.2 : 0;
    }
  };

  const toggleShare = async () => {
    if (isSharingScreen) {
      // Stop screen share and return to camera
      screenStreamRef.current?.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;

      // Close audio context
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
        audioMixerRef.current = null;
      }

      if (localStreamRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        const audioTrack = localStreamRef.current.getAudioTracks()[0];

        if (videoTrack) {
          replaceVideoTrack(videoTrack);
        }
        if (audioTrack) {
          replaceAudioTrack(audioTrack);
        }

        // Switch back to camera in local video
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
      }

      setIsSharingScreen(false);
      setScreenAudioOn(false);
    } else {
      try {
        // Start screen share with audio
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: "always",
          },
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            sampleRate: 48000,
            channelCount: 2,
          },
        });

        screenStreamRef.current = displayStream;

        // Update local video to show screen share
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = displayStream;
        }

        // Replace the video track in the call
        const videoTrack = displayStream.getVideoTracks()[0];
        if (videoTrack) {
          replaceVideoTrack(videoTrack);
        }

        // Handle audio mixing if screen has audio - start with screen audio OFF to prevent echo
        if (
          displayStream.getAudioTracks().length > 0 &&
          localStreamRef.current
        ) {
          const mixedAudioStream = createMixedAudioStream(
            localStreamRef.current,
            displayStream
          );
          const mixedAudioTrack = mixedAudioStream.getAudioTracks()[0];

          if (mixedAudioTrack) {
            replaceAudioTrack(mixedAudioTrack);
            setScreenAudioOn(false); // Start with screen audio OFF by default
          }
        }

        // Handle when screen share ends
        videoTrack.onended = () => {
          if (localStreamRef.current && localVideoRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
            const cameraTrack = localStreamRef.current.getVideoTracks()[0];
            const micAudioTrack = localStreamRef.current.getAudioTracks()[0];

            if (cameraTrack) {
              replaceVideoTrack(cameraTrack);
            }
            if (micAudioTrack) {
              replaceAudioTrack(micAudioTrack);
            }
          }

          // Cleanup audio context
          if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
            audioMixerRef.current = null;
          }

          setIsSharingScreen(false);
          setScreenAudioOn(false);
          screenStreamRef.current = null;
        };

        setIsSharingScreen(true);
      } catch (err) {
        console.error("Error sharing screen:", err);
        // If user cancels screen share prompt, reset state
        setIsSharingScreen(false);
        setScreenAudioOn(false);
      }
    }
  };

  const initPeerAndConnect = async () => {
    if (!currentUser || !nextSession) return;

    const peer = new Peer(buildPeerId(nextSession._id, currentUser._id), {
      host: "192.168.33.12",
      port: 9000,
      path: "/peerjs",
      secure: false,
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      },
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
        }
      } catch (err) {
        console.error("Call attempt failed:", err);
      }
    };

    peer.on("open", () => {
      attemptCallOther();
    });

    peer.on("call", async (incomingCall) => {
      const localStream = localStreamRef.current || (await startLocalStream());
      incomingCall.answer(localStream);
      setupCallHandlers(incomingCall);
      callRef.current = incomingCall;
      setConnected(true);
    });

    peer.on("error", (err) => {
      console.error("Peer error:", err);
    });

    // Cleanup peer on unmount
    return () => {
      if (peer && !peer.destroyed) {
        peer.destroy();
      }
    };
  };

  const handleJoinSession = async () => {
    setHasJoined(true);
    await startLocalStream();
    initPeerAndConnect();
  };

  const toggleMic = () => {
    if (!localStreamRef.current) return;
    const audioTracks = localStreamRef.current.getAudioTracks();
    if (audioTracks.length > 0) {
      audioTracks.forEach((t) => (t.enabled = !t.enabled));
      setMicOn((prev) => !prev);
    }
  };

  const toggleCamera = () => {
    if (!localStreamRef.current) return;
    const videoTracks = localStreamRef.current.getVideoTracks();
    if (videoTracks.length > 0) {
      videoTracks.forEach((t) => (t.enabled = !t.enabled));
      setCameraOn((prev) => !prev);
    }
  };

  const toggleVideoHidden = () => {
    setVideoHidden((prev) => !prev);
  };

  const increaseTeacherCredit = async () => {
    try {
      // If current user is student, increase teacher's credit
      const creditRes = await fetch(`${API_BASE_URL}/user/credits/increase`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          auth: getToken(),
        },
        body: JSON.stringify({
          teacherId: nextSession.teacher._id,
        }),
      });

      const creditData = await creditRes.json();
      if (!creditRes.ok) {
        console.error(
          "Failed to increase teacher credit:",
          creditData.message || creditRes.statusText
        );
      } else {
        console.log("Teacher credit increased successfully");
      }
    } catch (err) {
      console.error("Error increasing teacher credit:", err);
    }
  };

  const handleSessionEnded = async () => {
    // Cleanup media and connection
    cleanupAfterCall();

    // Mark session as ended
    setSessionEnded(true);
    setCanJoin(false);
    setHasJoined(false);
    setShowEndConfirm(false);

    try {
      // Update session status on backend
      await fetch(`${API_BASE_URL}/appointments/end/${nextSession._id}`, {
        method: "PATCH",
        headers: { auth: getToken() },
      });
      console.log("Session marked as completed on server");

      // Increase teacher credit if current user is student
      await increaseTeacherCredit();
    } catch (err) {
      console.error("Error ending session on server:", err);
    }

    // Fetch the next session
    await fetchSessions();
  };

  const confirmEndSession = () => {
    setShowEndConfirm(true);
  };

  const cancelEndSession = () => {
    setShowEndConfirm(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanupAfterCall();
  }, []);

  // Confirmation Dialog Component
  const EndSessionConfirmation = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <h3 className="text-xl font-bold text-gray-900 mb-4">End Session?</h3>
        <p className="text-gray-600 mb-6">
          Are you sure you want to end this session? This will end the call for
          both participants
          {currentUser?._id === nextSession?.student?._id &&
            " and the teacher will receive their credit"}
          .
        </p>
        <div className="flex gap-3 justify-end">
          <Button
            onClick={cancelEndSession}
            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-full px-6 py-2"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSessionEnded}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold rounded-full px-6 py-2"
          >
            End Session
          </Button>
        </div>
      </div>
    </div>
  );

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

  // Show session ended message
  if (sessionEnded && nextSession) {
    return (
      <div className="flex flex-col items-center justify-center text-center h-screen w-full bg-gradient-to-br from-purple-600 to-indigo-500 text-white p-10 animate-fade-in">
        <div className="bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl p-10 border border-white/20">
          <h2 className="text-3xl md:text-4xl font-bold tracking-wide mb-6">
            Session Ended
          </h2>
          <p className="text-xl mb-8">
            Your session with {otherParticipant?.fullName} has ended.
            {currentUser?._id === nextSession?.student?._id && (
              <span className="block text-green-300 font-semibold mt-2">
                Credit has been transferred to the teacher.
              </span>
            )}
          </p>

          {nextSession && (
            <div className="mb-8">
              <p className="text-lg font-medium mb-4">Your next session:</p>
              <div className="bg-white/20 rounded-2xl p-6">
                <p className="text-2xl font-semibold mb-2">
                  With {otherParticipant?.fullName}
                </p>
                <p className="text-lg mb-1">
                  Date: {new Date(nextSession.date).toLocaleDateString()}
                </p>
                <p className="text-lg mb-4">Time: {nextSession.time}</p>
                <div className="flex flex-col items-center justify-center bg-white/10 backdrop-blur-md px-6 py-4 rounded-xl">
                  <p className="text-lg font-medium">Starting in</p>
                  <p className="text-3xl md:text-4xl font-extrabold tracking-wider mt-2">
                    {countdown}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => setSessionEnded(false)}
              className="bg-white text-purple-700 hover:bg-purple-100 font-semibold rounded-full px-6 py-2"
            >
              View Session Details
            </Button>
            <Button
              onClick={() => navigate("/connectionPage")}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold rounded-full px-6 py-2"
            >
              Schedule New Session
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {/* Confirmation Dialog */}
      {showEndConfirm && <EndSessionConfirmation />}

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
              playsInline
              className="w-full h-full object-cover bg-gray-800"
            />
            <div className="absolute top-3 left-3 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
              {otherJoined ? otherParticipant.fullName : "Waiting..."}
            </div>

            {/* Fixed local video in top right corner */}
            <div
              ref={localVideoContainerRef}
              className={`absolute top-2 right-2 ${
                isMobile ? "w-32 h-24" : "w-64 h-44"
              } bg-gray-900 border-2 border-white rounded-lg overflow-hidden shadow-md ${
                videoHidden ? "hidden" : ""
              }`}
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                left: "auto",
                bottom: "auto",
                cursor: "default",
              }}
            >
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute top-1 left-1 flex items-center gap-1">
                {!micOn && (
                  <MicOff className="text-white" size={isMobile ? 10 : 14} />
                )}
                {!cameraOn && (
                  <VideoOff className="text-white" size={isMobile ? 10 : 14} />
                )}
                {isSharingScreen && (
                  <Monitor
                    className="text-green-400"
                    size={isMobile ? 10 : 14}
                  />
                )}
                {isSharingScreen &&
                  screenStreamRef.current?.getAudioTracks().length > 0 &&
                  (screenAudioOn ? (
                    <Volume2
                      className="text-blue-400"
                      size={isMobile ? 10 : 14}
                    />
                  ) : (
                    <VolumeX
                      className="text-red-400"
                      size={isMobile ? 10 : 14}
                    />
                  ))}
              </div>
              <div
                className={`absolute bottom-1 left-1 ${
                  isSharingScreen ? "bg-green-600" : "bg-purple-600"
                } text-white ${
                  isMobile ? "px-1 py-0 text-xs" : "px-2 py-0.5 text-xs"
                } rounded font-semibold`}
              >
                {isSharingScreen ? "Sharing" : "You"}
              </div>
            </div>
          </div>

          {/* Enhanced Controls with Screen Audio Toggle */}
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
                className={`${isMobile ? "p-2" : "px-4 py-2"} ${
                  micOn
                    ? "bg-green-500 hover:bg-green-600"
                    : "bg-red-500 hover:bg-red-600"
                } text-white font-semibold rounded-full`}
              >
                {micOn ? (
                  <Mic size={isMobile ? 16 : 20} />
                ) : (
                  <MicOff size={isMobile ? 16 : 20} />
                )}
              </Button>

              <Button
                onClick={toggleCamera}
                className={`${isMobile ? "p-2" : "px-4 py-2"} ${
                  cameraOn
                    ? "bg-green-500 hover:bg-green-600"
                    : "bg-red-500 hover:bg-red-600"
                } text-white font-semibold rounded-full`}
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
                  <EyeOff size={isMobile ? 16 : 20} />
                ) : (
                  <Eye size={isMobile ? 16 : 20} />
                )}
              </Button>

              {/* Screen Share Button */}
              <Button
                onClick={toggleShare}
                className={`${isMobile ? "p-2 text-xs" : "px-4 py-2"} ${
                  isSharingScreen
                    ? "bg-orange-500 hover:bg-orange-600"
                    : "bg-blue-500 hover:bg-blue-600"
                } text-white font-semibold rounded-full`}
              >
                {isMobile ? (
                  isSharingScreen ? (
                    <MonitorOff size={16} />
                  ) : (
                    <Monitor size={16} />
                  )
                ) : isSharingScreen ? (
                  "Stop Share"
                ) : (
                  "Share Screen"
                )}
              </Button>

              {/* Screen Audio Toggle - Only show when sharing screen with audio */}
              {isSharingScreen &&
                screenStreamRef.current?.getAudioTracks().length > 0 && (
                  <Button
                    onClick={toggleScreenAudio}
                    className={`${isMobile ? "p-2 text-xs" : "px-4 py-2"} ${
                      screenAudioOn
                        ? "bg-blue-500 hover:bg-blue-600"
                        : "bg-gray-500 hover:bg-gray-600"
                    } text-white font-semibold rounded-full`}
                  >
                    {isMobile ? (
                      screenAudioOn ? (
                        <Volume2 size={16} />
                      ) : (
                        <VolumeX size={16} />
                      )
                    ) : screenAudioOn ? (
                      "Screen Audio On"
                    ) : (
                      "Screen Audio Off"
                    )}
                  </Button>
                )}

              <Button
                onClick={confirmEndSession}
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
