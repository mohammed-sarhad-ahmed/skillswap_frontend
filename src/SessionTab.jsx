import React, { useState, useRef, useEffect, useCallback } from "react";
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
  Star,
} from "lucide-react";

// Advanced Audio Processor using Web Audio API
class AdvancedAudioProcessor {
  constructor() {
    this.audioContext = null;
    this.processor = null;
    this.source = null;
    this.destination = null;
    this.gainNode = null;
    this.analyser = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return true;

    try {
      this.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)({
        latencyHint: "interactive",
        sampleRate: 48000,
      });

      await this.audioContext.resume();

      // Create audio nodes
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = 1.2;

      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 1024;
      this.analyser.smoothingTimeConstant = 0.8;

      this.destination = this.audioContext.createMediaStreamDestination();

      // Create worklet processor for better performance
      try {
        // Try to use AudioWorklet for better performance
        await this.audioContext.audioWorklet.addModule(`
          class AudioProcessor extends AudioWorkletProcessor {
            process(inputs, outputs) {
              const input = inputs[0];
              const output = outputs[0];
              
              if (input.length > 0) {
                for (let channel = 0; channel < input.length; channel++) {
                  const inputChannel = input[channel];
                  const outputChannel = output[channel];
                  
                  // Noise gate and echo suppression
                  let sum = 0;
                  for (let i = 0; i < inputChannel.length; i++) {
                    sum += Math.abs(inputChannel[i]);
                  }
                  const average = sum / inputChannel.length;
                  const threshold = 0.005;
                  
                  if (average < threshold) {
                    // Suppress noise
                    for (let i = 0; i < outputChannel.length; i++) {
                      outputChannel[i] = 0;
                    }
                  } else {
                    // Pass through with gentle compression
                    for (let i = 0; i < outputChannel.length; i++) {
                      outputChannel[i] = inputChannel[i] * Math.min(1.0, 1.3 - (average * 8));
                    }
                  }
                }
              }
              return true;
            }
          }
          registerProcessor('audio-processor', AudioProcessor);
        `);

        this.processor = new AudioWorkletNode(
          this.audioContext,
          "audio-processor"
        );
        console.log("AudioWorklet processor initialized");
      } catch (workletError) {
        console.warn(
          "AudioWorklet not supported, using ScriptProcessor:",
          workletError
        );
        // Fallback to ScriptProcessor
        this.processor = this.audioContext.createScriptProcessor(2048, 1, 1);
        this.processor.onaudioprocess = (event) => {
          this.processAudio(event);
        };
      }

      // Connect nodes
      this.gainNode.connect(this.processor);
      this.processor.connect(this.analyser);
      this.analyser.connect(this.destination);

      this.isInitialized = true;
      console.log("Advanced Audio Processor initialized successfully");
      return true;
    } catch (error) {
      console.error("Failed to initialize audio processor:", error);
      this.isInitialized = false;
      return false;
    }
  }

  processAudio(event) {
    const inputBuffer = event.inputBuffer;
    const outputBuffer = event.outputBuffer;

    for (let channel = 0; channel < inputBuffer.numberOfChannels; channel++) {
      const inputData = inputBuffer.getChannelData(channel);
      const outputData = outputBuffer.getChannelData(channel);

      // Advanced noise suppression and echo cancellation
      let sum = 0;
      let max = 0;

      for (let i = 0; i < inputData.length; i++) {
        const absValue = Math.abs(inputData[i]);
        sum += absValue;
        max = Math.max(max, absValue);
      }

      const average = sum / inputData.length;
      const dynamicThreshold = Math.max(0.003, max * 0.1);

      if (average < dynamicThreshold) {
        // Complete silence for noise suppression
        for (let i = 0; i < outputData.length; i++) {
          outputData[i] = 0;
        }
      } else {
        // Apply dynamic compression and high-pass filter
        const compressionFactor = Math.min(1.5, 1.0 / (average * 2));
        for (let i = 0; i < outputData.length; i++) {
          // Simple high-pass filter (remove DC offset and low frequencies)
          const filtered = inputData[i] - inputData[i > 0 ? i - 1 : 0] * 0.96;
          outputData[i] = filtered * compressionFactor;
        }
      }
    }
  }

  async processStream(stream) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Disconnect previous source if exists
      if (this.source) {
        this.source.disconnect();
      }

      this.source = this.audioContext.createMediaStreamSource(stream);
      this.source.connect(this.gainNode);

      // Create enhanced stream
      const enhancedStream = new MediaStream([
        ...stream.getVideoTracks(),
        ...this.destination.stream.getAudioTracks(),
      ]);

      console.log("Audio stream enhanced successfully");
      return enhancedStream;
    } catch (error) {
      console.warn("Audio processing failed, using original stream:", error);
      return stream;
    }
  }

  setVolume(volume) {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0.1, Math.min(3.0, volume));
    }
  }

  getAudioLevel() {
    if (!this.analyser || !this.isInitialized) return 0;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }

    const average = sum / dataArray.length;
    const normalized = Math.min(average / 128, 1);

    // Apply smoothing
    return Math.max(0, Math.min(1, normalized * 1.2));
  }

  async dispose() {
    if (this.source) {
      this.source.disconnect();
    }
    if (this.gainNode) {
      this.gainNode.disconnect();
    }
    if (this.processor) {
      this.processor.disconnect();
    }
    if (this.analyser) {
      this.analyser.disconnect();
    }
    if (this.audioContext && this.audioContext.state !== "closed") {
      await this.audioContext.close();
    }
    this.isInitialized = false;
  }
}

// Advanced WebRTC audio constraints
const getAdvancedAudioConstraints = () => ({
  audio: {
    // Basic constraints
    channelCount: 1,
    sampleRate: 48000,
    sampleSize: 16,
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,

    // Advanced Chrome-specific constraints
    googEchoCancellation: true,
    googAutoGainControl: true,
    googNoiseSuppression: true,
    googHighpassFilter: true,
    googAudioMirroring: false,

    // Experimental constraints for better quality
    googEchoCancellation2: true,
    googNoiseSuppression2: true,
    googAutoGainControl2: true,
    googExperimentalAutoGainControl: true,
    googExperimentalNoiseSuppression: true,
    googExperimentalEchoCancellation: true,

    // Latency optimization
    latency: 0,
  },
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 },
  },
});

const getFallbackConstraints = () => ({
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
  video: true,
});

// Separate Rating Modal Component
const RatingModal = ({
  showRating,
  setShowRating,
  endedSession,
  rating,
  setRating,
  hoverRating,
  setHoverRating,
  review,
  setReview,
  ratingError,
  ratingSubmitted,
  submitRating,
  skipRating,
  handleRatingContinue,
}) => {
  const reviewTextareaRef = useRef(null);

  const handleReviewChange = (e) => {
    setReview(e.target.value);
  };

  if (!showRating) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setShowRating(false);
        }
      }}
    >
      <div
        className="bg-gradient-to-br from-purple-600 to-indigo-500 rounded-2xl p-8 max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {!ratingSubmitted ? (
          <>
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">
                Rate Your Session
              </h3>
              <p className="text-white/80">
                How was your session with {endedSession?.teacher?.fullName}?
              </p>
            </div>

            <div className="flex justify-center mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-2 transition-transform hover:scale-110"
                >
                  <Star
                    size={40}
                    className={`${
                      star <= (hoverRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-white/60"
                    } transition-colors duration-200`}
                  />
                </button>
              ))}
            </div>

            <div className="mb-4">
              <label
                htmlFor="review"
                className="block text-sm font-medium text-white mb-2"
              >
                Optional Review
              </label>
              <textarea
                ref={reviewTextareaRef}
                id="review"
                value={review}
                onChange={handleReviewChange}
                placeholder="Share your experience with this teacher (what you liked, what could be improved, etc.)"
                className="w-full px-3 py-2 border border-white/30 bg-white/10 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-white resize-none placeholder-white/60"
                rows="4"
                maxLength="500"
              />
              <div className="text-right text-sm text-white/60 mt-1">
                {review.length}/500 characters
              </div>
            </div>

            {ratingError && (
              <div className="mb-4 p-3 bg-red-400/20 border border-red-300/30 rounded-lg">
                <p className="text-red-100 text-sm text-center">
                  {ratingError}
                </p>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <Button
                onClick={skipRating}
                className="bg-white/20 hover:bg-white/30 text-white font-semibold rounded-full px-6 py-2 border border-white/30"
              >
                Skip
              </Button>
              <Button
                onClick={submitRating}
                disabled={rating === 0}
                className="bg-white hover:bg-white/90 text-purple-600 font-semibold rounded-full px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Rating
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Thank You!</h3>
            <p className="text-white/80 mb-6">
              Your {rating}-star rating{review && " and review"} has been
              submitted.
            </p>
            <Button
              onClick={handleRatingContinue}
              className="bg-white hover:bg-white/90 text-purple-600 font-semibold rounded-full px-6 py-2"
            >
              Continue
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default function SessionTab() {
  const [currentUser, setCurrentUser] = useState(null);
  const [nextSession, setNextSession] = useState(null);
  const [canJoin, setCanJoin] = useState(false);
  const [countdown, setCountdown] = useState("");
  const [otherJoined, setOtherJoined] = useState(false);
  const [connected, setConnected] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [videoHidden, setVideoHidden] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [screenAudioOn, setScreenAudioOn] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [endedSession, setEndedSession] = useState(null);
  const [review, setReview] = useState("");
  const [ratingError, setRatingError] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);
  const [audioInitialized, setAudioInitialized] = useState(false);

  const localVideoRef = useRef(null);
  const localVideoContainerRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peerRef = useRef(null);
  const callRef = useRef(null);
  const audioProcessorRef = useRef(null);
  const audioLevelIntervalRef = useRef(null);

  const navigate = useNavigate();

  // Initialize advanced audio processor
  useEffect(() => {
    audioProcessorRef.current = new AdvancedAudioProcessor();

    const initAudio = async () => {
      const success = await audioProcessorRef.current.initialize();
      setAudioInitialized(success);
      console.log("Audio processor initialized:", success);
    };

    initAudio();

    return () => {
      if (audioLevelIntervalRef.current) {
        clearInterval(audioLevelIntervalRef.current);
      }
      audioProcessorRef.current?.dispose();
    };
  }, []);

  // Audio level monitoring
  useEffect(() => {
    if (micOn && audioInitialized) {
      audioLevelIntervalRef.current = setInterval(() => {
        const level = audioProcessorRef.current.getAudioLevel();
        setAudioLevel(level);
      }, 100);
    } else {
      if (audioLevelIntervalRef.current) {
        clearInterval(audioLevelIntervalRef.current);
      }
      setAudioLevel(0);
    }

    return () => {
      if (audioLevelIntervalRef.current) {
        clearInterval(audioLevelIntervalRef.current);
      }
    };
  }, [micOn, audioInitialized]);

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
      const activeRes = await fetch(`${API_BASE_URL}/appointments/active`, {
        headers: { auth: getToken() },
      });
      const activeData = await activeRes.json();

      if (activeData.data?.appointment) {
        setNextSession(activeData.data.appointment);
        setCanJoin(true);
        setSessionEnded(false);
        return;
      }

      const nextRes = await fetch(`${API_BASE_URL}/appointments/next`, {
        headers: { auth: getToken() },
      });
      const nextData = await nextRes.json();
      setNextSession(nextData.data?.appointment || null);
      setSessionEnded(false);
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
      const sessionStart = new Date(nextSession.date);

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
      console.log("Starting local stream with advanced audio processing...");

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(
          getAdvancedAudioConstraints()
        );
        console.log("Advanced audio constraints applied successfully");
      } catch (advancedError) {
        console.warn(
          "Advanced constraints failed, using fallback:",
          advancedError
        );
        stream = await navigator.mediaDevices.getUserMedia(
          getFallbackConstraints()
        );
        console.log("Fallback audio constraints applied");
      }

      // Process stream with advanced audio processor
      if (audioInitialized) {
        console.log("Processing audio stream with advanced processor...");
        try {
          stream = await audioProcessorRef.current.processStream(stream);
        } catch (processingError) {
          console.warn(
            "Audio processing failed, using original stream:",
            processingError
          );
        }
      }

      localStreamRef.current = stream;

      // Turn off video and audio by default
      const videoTracks = stream.getVideoTracks();
      const audioTracks = stream.getAudioTracks();

      if (videoTracks.length > 0) {
        videoTracks.forEach((track) => (track.enabled = false));
      }

      if (audioTracks.length > 0) {
        audioTracks.forEach((track) => (track.enabled = false));
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.volume = 1.0;
      }

      console.log("Local stream started successfully");
      return stream;
    } catch (error) {
      console.error("Error starting local stream:", error);
      throw error;
    }
  };

  const setupCallHandlers = (mediaConn) => {
    mediaConn.on("stream", (remoteStream) => {
      console.log("Remote stream received");
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.setAttribute("playsinline", "true");
        remoteVideoRef.current.playsInline = true;
        remoteVideoRef.current.volume = 1.0;
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

  const replaceAudioTrack = (newTrack) => {
    if (!callRef.current || !newTrack) {
      console.warn("Cannot replace audio track: no active call or track");
      return;
    }

    try {
      const senders = callRef.current.peerConnection?.getSenders();
      if (!senders) {
        console.warn("No senders available");
        return;
      }

      const audioSender = senders.find(
        (s) => s.track && s.track.kind === "audio"
      );

      if (audioSender) {
        audioSender
          .replaceTrack(newTrack)
          .then(() => {
            console.log("Audio track replaced successfully");
          })
          .catch((err) => {
            console.error("Error replacing audio track:", err);
          });
      } else {
        console.warn("No audio sender found");
      }
    } catch (error) {
      console.error("Error in replaceAudioTrack:", error);
    }
  };

  const cleanupAfterCall = () => {
    console.log("Cleaning up call...");

    if (audioLevelIntervalRef.current) {
      clearInterval(audioLevelIntervalRef.current);
    }

    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());

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
    setAudioLevel(0);
  };

  const replaceVideoTrack = (newTrack) => {
    if (!callRef.current || !newTrack) {
      console.warn("Cannot replace video track: no active call or track");
      return;
    }

    try {
      const senders = callRef.current.peerConnection?.getSenders();
      if (!senders) {
        console.warn("No senders available");
        return;
      }

      const videoSender = senders.find(
        (s) => s.track && s.track.kind === "video"
      );

      if (videoSender) {
        videoSender
          .replaceTrack(newTrack)
          .then(() => {
            console.log("Video track replaced successfully");
          })
          .catch((err) => {
            console.error("Error replacing video track:", err);
          });
      } else {
        console.warn("No video sender found");
      }
    } catch (error) {
      console.error("Error in replaceVideoTrack:", error);
    }
  };

  const toggleScreenAudio = () => {
    if (!screenStreamRef.current) return;

    const newState = !screenAudioOn;
    setScreenAudioOn(newState);

    const audioTracks = screenStreamRef.current.getAudioTracks();
    if (audioTracks.length > 0) {
      audioTracks.forEach((track) => {
        track.enabled = newState;
      });
    }
  };

  const toggleShare = async () => {
    if (isSharingScreen) {
      console.log("Stopping screen share...");

      // Stop screen sharing
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => {
          track.stop();
          console.log(`Stopped screen track: ${track.kind}`);
        });
        screenStreamRef.current = null;
      }

      // Switch back to camera and microphone
      if (localStreamRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        const audioTrack = localStreamRef.current.getAudioTracks()[0];

        console.log("Restoring camera and microphone...");

        // Replace video track first
        if (videoTrack) {
          replaceVideoTrack(videoTrack);
          console.log("Camera video track restored");
        }

        // Replace audio track with proper error handling
        if (audioTrack) {
          // Small delay to ensure proper synchronization
          setTimeout(() => {
            try {
              replaceAudioTrack(audioTrack);
              console.log("Microphone audio track restored");
            } catch (error) {
              console.error("Failed to restore audio track:", error);
            }
          }, 100);
        }

        // Update local video display
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
      }

      setIsSharingScreen(false);
      setScreenAudioOn(false);
      console.log("Screen sharing stopped successfully");
    } else {
      // Start screen sharing
      try {
        console.log("Starting screen share...");

        // Create a clean screen stream without audio processing during screen share
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: "always",
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
          },
          audio: {
            echoCancellation: false, // Disable echo cancellation for screen audio
            noiseSuppression: false, // Disable noise suppression for screen audio
            autoGainControl: false, // Disable auto gain for screen audio
            sampleRate: 48000,
            channelCount: 1,
          },
        });

        screenStreamRef.current = displayStream;

        // Update local video display to show screen share
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = displayStream;
        }

        // Replace video track with screen share
        const videoTrack = displayStream.getVideoTracks()[0];
        if (videoTrack) {
          replaceVideoTrack(videoTrack);
          console.log("Screen video track applied");
        }

        // Handle screen audio if available - KEEP MICROPHONE AUDIO ACTIVE
        if (displayStream.getAudioTracks().length > 0) {
          const screenAudioTrack = displayStream.getAudioTracks()[0];
          if (screenAudioTrack) {
            // For screen sharing, we'll keep both microphone and screen audio active
            // but prioritize screen audio by replacing the track
            setTimeout(() => {
              replaceAudioTrack(screenAudioTrack);
            }, 100);
            setScreenAudioOn(true);
            console.log("Screen audio track applied");
          }
        } else {
          // If no screen audio, ensure microphone continues working
          const micAudioTrack = localStreamRef.current?.getAudioTracks()[0];
          if (micAudioTrack && micOn) {
            setTimeout(() => {
              replaceAudioTrack(micAudioTrack);
            }, 100);
          }
          console.log("No screen audio tracks available, using microphone");
        }

        // Handle screen share ending by user (browser controls)
        videoTrack.onended = () => {
          console.log("Screen share ended by user (browser controls)");
          handleStopScreenShare();
        };

        setIsSharingScreen(true);
        console.log("Screen sharing started successfully");
      } catch (err) {
        console.error("Error sharing screen:", err);
        setIsSharingScreen(false);
        setScreenAudioOn(false);

        // If user cancels screen share prompt, don't show error
        if (err.name !== "NotAllowedError" && err.name !== "AbortError") {
          alert(
            "Failed to share screen. Please check your browser permissions."
          );
        }
      }
    }
  };

  const handleStopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }

    if (localStreamRef.current && localVideoRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
      const cameraTrack = localStreamRef.current.getVideoTracks()[0];
      const micAudioTrack = localStreamRef.current.getAudioTracks()[0];

      if (cameraTrack) {
        replaceVideoTrack(cameraTrack);
      }
      if (micAudioTrack) {
        setTimeout(() => {
          replaceAudioTrack(micAudioTrack);
        }, 100);
      }
    }

    setIsSharingScreen(false);
    setScreenAudioOn(false);
  };

  const initPeerAndConnect = async () => {
    if (!currentUser || !nextSession) return;

    const peer = new Peer(buildPeerId(nextSession._id, currentUser._id), {
      host: "localhost",
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
      const newState = !micOn;
      audioTracks.forEach((t) => {
        t.enabled = newState;
      });
      setMicOn(newState);

      if (newState) {
        console.log("Microphone enabled with advanced audio processing");
      } else {
        console.log("Microphone disabled");
      }
    }
  };

  const toggleCamera = () => {
    if (!localStreamRef.current) return;
    const videoTracks = localStreamRef.current.getVideoTracks();
    if (videoTracks.length > 0) {
      const newState = !cameraOn;
      videoTracks.forEach((t) => (t.enabled = newState));
      setCameraOn(newState);

      if (newState) {
        console.log("Camera enabled");
      } else {
        console.log("Camera disabled");
      }
    }
  };

  const toggleVideoHidden = () => {
    setVideoHidden((prev) => !prev);
  };

  const increaseTeacherCredit = async () => {
    try {
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

  const submitRating = async () => {
    if (rating === 0) return;

    try {
      setRatingError("");

      const ratingRes = await fetch(`${API_BASE_URL}/ratings/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          auth: getToken(),
        },
        body: JSON.stringify({
          teacherId: endedSession.teacher._id,
          sessionId: endedSession._id,
          rating: rating,
          review: review.trim(),
        }),
      });

      const ratingData = await ratingRes.json();

      if (!ratingRes.ok) {
        const errorMessage = ratingData.message || "Failed to submit rating";
        console.error("Failed to submit rating:", errorMessage);
        setRatingError(errorMessage);
        return;
      }

      if (ratingData.status.toLowerCase() === "success") {
        console.log("Rating and review submitted successfully");
        setRatingSubmitted(true);
        setRatingError("");
      } else {
        const errorMessage = ratingData.message || "Rating submission failed";
        console.error("Rating submission failed:", errorMessage);
        setRatingError(errorMessage);
      }
    } catch (err) {
      console.error("Error submitting rating:", err.message);
      setRatingError("Network error occurred while submitting rating");
    }
  };

  const handleSessionEnded = async () => {
    const currentSession = nextSession;

    cleanupAfterCall();

    setSessionEnded(true);
    setCanJoin(false);
    setHasJoined(false);
    setShowEndConfirm(false);

    try {
      await fetch(`${API_BASE_URL}/appointments/end/${currentSession._id}`, {
        method: "PATCH",
        headers: { auth: getToken() },
      });
      console.log("Session marked as completed on server");

      await increaseTeacherCredit();

      if (currentUser?._id === currentSession?.student?._id) {
        console.log("Showing rating modal for student");
        setEndedSession(currentSession);
        setShowRating(true);
      } else {
        console.log("Not showing rating modal - user is teacher");
        await fetchSessions();
      }
    } catch (err) {
      console.error("Error ending session on server:", err);
    }
  };

  const confirmEndSession = () => {
    setShowEndConfirm(true);
  };

  const cancelEndSession = () => {
    setShowEndConfirm(false);
  };

  const skipRating = async () => {
    setShowRating(false);
    setRating(0);
    setRatingSubmitted(false);
    setReview("");
    setRatingError("");
    await fetchSessions();
  };

  const handleRatingContinue = () => {
    setShowRating(false);
    setRating(0);
    setRatingSubmitted(false);
    setReview("");
    setRatingError("");
    fetchSessions();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAfterCall();
      audioProcessorRef.current?.dispose();
    };
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

  // Audio level indicator component
  const AudioLevelIndicator = () => (
    <div className="absolute top-3 right-16 bg-black/70 rounded-full px-3 py-1 flex items-center gap-2">
      <div
        className="w-3 h-3 rounded-full transition-all duration-200"
        style={{
          backgroundColor:
            audioLevel > 0.3
              ? "#22c55e"
              : audioLevel > 0.1
              ? "#eab308"
              : "#ef4444",
          opacity: audioLevel > 0.05 ? 1 : 0.5,
          transform: `scale(${1 + audioLevel})`,
        }}
      />
      <span className="text-white text-xs font-semibold">
        {Math.round(audioLevel * 100)}%
      </span>
    </div>
  );

  if (!currentUser)
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-purple-600 to-indigo-500 p-6">
        <p className="text-white text-lg mb-3">Loading...</p>
      </div>
    );

  if (!nextSession && !showRating)
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

  // Show rating modal if it should be shown - this takes priority over everything
  if (showRating) {
    return (
      <div className="flex flex-col h-screen bg-gradient-to-br from-purple-600 to-indigo-500 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <div className="bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl p-8 max-w-2xl w-full text-center border border-white/20">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Your Next Session
            </h2>
            {nextSession && (
              <div className="space-y-4">
                <p className="text-xl text-white/90">
                  With{" "}
                  <span className="font-semibold">
                    {otherParticipant?.fullName}
                  </span>
                </p>
                <p className="text-lg text-white/80">
                  Date: {new Date(nextSession.date).toLocaleDateString()}
                </p>
                <p className="text-lg text-white/80">
                  Time: {nextSession.time}
                </p>
                <div className="bg-white/10 rounded-xl p-4 mt-4">
                  <p className="text-lg font-medium text-white">Starting in</p>
                  <p className="text-3xl md:text-4xl font-extrabold text-white tracking-wider mt-2">
                    {countdown}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        <RatingModal
          showRating={showRating}
          setShowRating={setShowRating}
          endedSession={endedSession}
          rating={rating}
          setRating={setRating}
          hoverRating={hoverRating}
          setHoverRating={setHoverRating}
          review={review}
          setReview={setReview}
          ratingError={ratingError}
          ratingSubmitted={ratingSubmitted}
          setRatingSubmitted={setRatingSubmitted}
          setRatingError={setRatingError}
          submitRating={submitRating}
          skipRating={skipRating}
          handleRatingContinue={handleRatingContinue}
        />
      </div>
    );
  }

  // Show session ended message (without rating)
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
    <div className="flex flex-col h-screen bg-gradient-to-br from-purple-600 to-indigo-500 overflow-hidden">
      {showEndConfirm && <EndSessionConfirmation />}

      {!canJoin && (
        <div className="flex flex-col items-center justify-center text-center h-screen w-full text-white p-10 animate-fade-in">
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
        <div className="flex flex-col items-center justify-center text-center h-screen w-full text-white p-10 animate-fade-in">
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
          {micOn && <AudioLevelIndicator />}

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

          <div className="relative w-full h-full bg-black overflow-hidden">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover bg-gray-800"
            />
            <div className="absolute top-3 left-3 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
              {otherJoined ? otherParticipant.fullName : "Waiting..."}
            </div>

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
