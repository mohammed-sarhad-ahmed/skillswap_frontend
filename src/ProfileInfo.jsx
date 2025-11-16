import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  MessageCircle,
  Flag,
  Mail,
  UserPlus,
  X,
  Star,
  Users,
  Upload,
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
  const [reportTitle, setReportTitle] = useState(""); // Changed from reportReason
  const [reportReason, setReportReason] = useState(""); // This is the detailed reason
  const [reportProof, setReportProof] = useState(null);
  const [showUnconnectModal, setShowUnconnectModal] = useState(false);
  const [ratings, setRatings] = useState([]);
  const [ratingFilter, setRatingFilter] = useState(0);
  const [ratingStats, setRatingStats] = useState({
    averageRating: 0,
    totalRatings: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/user/teacher/${id}`, {
        headers: { auth: getToken() },
      });
      const data = await res.json();

      if (data.status.toLowerCase() === "success") {
        setUser(data.data.user);
      } else {
        toast.error("Could not fetch user info");
      }
    } catch {
      toast.error("Could not fetch user info");
    }
  };

  const fetchRatingStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/ratings/teacher/${id}/stats`, {
        headers: { auth: getToken() },
      });
      const data = await res.json();

      if (data.status.toLowerCase() === "success") {
        setRatingStats(data.data);
      }
    } catch (error) {
      console.error("Could not fetch rating stats");
    }
  };

  const fetchRatings = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/ratings/teacher/${id}`, {
        headers: { auth: getToken() },
      });
      const data = await res.json();

      if (data.status.toLowerCase() === "success") {
        const ratingsData = Array.isArray(data.data)
          ? data.data
          : data.data.ratings || [];
        setRatings(ratingsData);
      }
    } catch (error) {
      console.error("Could not fetch ratings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
    fetchRatingStats();
    fetchRatings();
  }, [id]);

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

        if (data.status.toLowerCase() === "success") {
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
        }
      } catch {
        toast.error("Could not fetch current user info");
      }
    };
    fetchCurrentUser();
  }, [id]);

  useEffect(() => {
    socket.on("connection_request", ({ from }) => {
      if (from === id) setConnectionState("accept");
    });
    socket.on("connection_update", ({ from, to, status }) => {
      if (to === id || from === id) {
        if (status === "accepted") setConnectionState("connected");
        if (status === "cancelled") setConnectionState("connect");
        if (status === "rejected") setConnectionState("connect");
        fetchUser();
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

  // ===========================
  // REPORT SUBMISSION HANDLER
  // ===========================
  const handleReportSubmit = async () => {
    // Validate title
    if (!reportTitle) {
      toast.error("Please select a report category");
      return;
    }

    // Validate reason (minlength 5)
    if (!reportReason || reportReason.trim().length < 5) {
      toast.error("Please provide a detailed reason (at least 5 characters)");
      return;
    }

    // Validate proof
    if (!reportProof) {
      toast.error("Please upload proof image");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("reportedUser", user._id);
      formData.append("title", reportTitle); // This is the enum value
      formData.append("reason", reportReason.trim()); // This is the detailed description
      formData.append("proof", reportProof);

      const res = await fetch(`${API_BASE_URL}/report`, {
        method: "POST",
        headers: {
          auth: getToken(),
        },
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.status.toLowerCase() === "success") {
        toast.success(
          "Report submitted successfully! Our team will review it."
        );
        setShowReportModal(false);
        setReportTitle("");
        setReportReason("");
        setReportProof(null);
      } else {
        const errorMessage = data.message || "Failed to submit report";
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Report submission error:", error);
      toast.error("Something went wrong while submitting the report.");
    }
  };

  const renderStars = (rating, size = "text-base") => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={i} className={`${size} text-yellow-500 fill-yellow-500`} />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Star
          key="half"
          className={`${size} text-yellow-500 fill-yellow-500`}
        />
      );
    }

    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} className={`${size} text-gray-300`} />
      );
    }

    return <div className="flex items-center gap-1">{stars}</div>;
  };

  const ratingOptions = [
    { value: 0, label: "All Ratings", count: ratingStats.totalRatings },
    { value: 5, label: "5 Stars", count: ratingStats.ratingDistribution[5] },
    { value: 4, label: "4 Stars", count: ratingStats.ratingDistribution[4] },
    { value: 3, label: "3 Stars", count: ratingStats.ratingDistribution[3] },
    { value: 2, label: "2 Stars", count: ratingStats.ratingDistribution[2] },
    { value: 1, label: "1 Star", count: ratingStats.ratingDistribution[1] },
  ];

  const filteredRatings =
    ratingFilter === 0
      ? ratings
      : ratings.filter((rating) => rating.rating === ratingFilter);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-lg text-gray-500">
        Loading...
      </div>
    );
  }

  if (!user || !currentUser) {
    return (
      <div className="flex justify-center items-center h-screen text-lg text-gray-500">
        User not found
      </div>
    );
  }

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

        <div className="flex flex-wrap justify-center gap-8 mt-4">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 text-gray-700">
              <Users className="w-5 h-5" />
              <span className="text-lg font-semibold">
                {user.connections?.length || 0}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">Connections</p>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2">
              {renderStars(ratingStats.averageRating, "text-lg")}
              <span className="text-lg font-bold text-gray-900">
                {ratingStats.averageRating.toFixed(1)}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              ({ratingStats.totalRatings}{" "}
              {ratingStats.totalRatings === 1 ? "rating" : "ratings"})
            </p>
          </div>
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

          <Button
            onClick={() => navigate(`/chat/${user._id}`)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-full shadow-sm"
          >
            <MessageCircle className="h-5 w-5" />
            Message
          </Button>

          {/* Report Button */}
          <Button
            onClick={() => setShowReportModal(true)}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-full shadow-sm"
          >
            <Flag className="h-5 w-5" />
            Report
          </Button>
        </div>
      </div>

      {/* Unconnect Confirmation Modal */}
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

      {/* =========================== */}
      {/* REPORT MODAL - FIXED */}
      {/* =========================== */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div
            className="bg-white rounded-xl p-6 w-96 max-h-[90vh] overflow-y-auto shadow-lg relative"
            onClick={(e) => e.stopPropagation()} // Prevent click propagation
          >
            <button
              onClick={() => {
                setShowReportModal(false);
                setReportTitle("");
                setReportReason("");
                setReportProof(null);
              }}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Report {user.fullName}
            </h2>
            <p className="text-sm text-gray-600 mb-3">
              Please provide evidence for your report:
            </p>

            {/* Report Title Selection (enum) */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Category *
              </label>
              <select
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-red-500 focus:outline-none"
                required
              >
                <option value="">-- Choose a category --</option>
                <option value="spam">Spam or scam</option>
                <option value="harassment">Harassment or bullying</option>
                <option value="inappropriate">Inappropriate content</option>
                <option value="fake">Fake account</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Detailed Reason (always required) */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Detailed Reason *
                <span className="text-red-500 ml-1">
                  (Minimum 5 characters)
                </span>
              </label>
              <textarea
                placeholder="Please provide a detailed description of the issue..."
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-red-500 focus:outline-none"
                rows="4"
                required
              />
              <div className="text-xs text-gray-500 mt-1">
                Characters: {reportReason.length}/5 minimum
                {reportReason.length < 5 && (
                  <span className="text-red-500 ml-2">
                    (More characters needed)
                  </span>
                )}
              </div>
            </div>

            {/* Proof Upload - REQUIRED */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Proof *
                <span className="text-red-500 ml-1">(Required)</span>
              </label>

              {/* File Upload Area - Fixed with separate button */}
              <div
                className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                  reportProof
                    ? "border-green-500 bg-green-50"
                    : "border-gray-300 bg-gray-50"
                }`}
              >
                {reportProof ? (
                  <div className="flex flex-col items-center">
                    <Upload className="w-8 h-8 text-green-500 mb-2" />
                    <p className="text-sm font-medium text-green-700">
                      File selected: {reportProof.name}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-2 text-xs"
                      onClick={() =>
                        document.getElementById("proof-upload").click()
                      }
                    >
                      Change File
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      No file selected
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      className="text-xs"
                      onClick={() =>
                        document.getElementById("proof-upload").click()
                      }
                    >
                      Select Proof Image
                    </Button>
                  </div>
                )}
                <input
                  id="proof-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setReportProof(e.target.files[0])}
                  className="hidden"
                  required
                />
              </div>

              {/* File Requirements */}
              <div className="mt-2 text-xs text-gray-500">
                <p>• Proof is required for all reports</p>
                <p>• Upload screenshots or images as evidence</p>
                <p>• Supported formats: JPG, PNG, GIF, WEBP</p>
                <p>• Maximum file size: 5MB</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => {
                  setShowReportModal(false);
                  setReportTitle("");
                  setReportReason("");
                  setReportProof(null);
                }}
                variant="outline"
                className="px-4 py-2 rounded-lg"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReportSubmit}
                disabled={
                  !reportTitle || !reportProof || reportReason.trim().length < 5
                }
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Submit Report
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Rest of the profile sections */}
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

        {/* Teaching Skills Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">
            Teaching Skills
          </h2>
          {user.teachingSkills?.length > 0 ? (
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
          ) : (
            <p className="text-gray-400 italic text-center py-4">
              Teaching skills does not exist
            </p>
          )}
        </div>

        {/* Learning Skills Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">
            Learning Skills
          </h2>
          {user.learningSkills?.length > 0 ? (
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
          ) : (
            <p className="text-gray-400 italic text-center py-4">
              Learning skills does not exist
            </p>
          )}
        </div>

        {/* Ratings & Reviews Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">
            Ratings & Reviews
          </h2>

          <div className="flex flex-wrap gap-2 mb-6">
            {ratingOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setRatingFilter(option.value)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                  ratingFilter === option.value
                    ? "bg-blue-50 border-blue-300 text-blue-700"
                    : "bg-white border-gray-300 hover:bg-gray-50 text-gray-700"
                }`}
              >
                {option.value > 0 ? (
                  <>
                    {renderStars(option.value, "text-sm")}
                    <span className="text-xs font-medium">
                      ({option.count})
                    </span>
                  </>
                ) : (
                  <span className="text-sm font-medium">
                    All Ratings ({option.count})
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {filteredRatings.length > 0 ? (
              filteredRatings.map((rating, index) => (
                <div
                  key={rating._id || index}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={`${API_BASE_URL}/user_avatar/${
                          rating.student?.avatar || "default-avatar.jpg"
                        }`}
                        alt={rating.student?.fullName || "Student"}
                        className="w-10 h-10 rounded-full object-cover border border-gray-300"
                      />
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {rating.student?.fullName || "Anonymous Student"}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          {renderStars(rating.rating, "text-sm")}
                          <span className="text-xs text-gray-500">
                            {new Date(rating.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {rating.review && rating.review.trim() !== "" && (
                    <p className="text-gray-700 text-sm mt-2 bg-gray-50 p-3 rounded-lg">
                      {rating.review}
                    </p>
                  )}

                  {rating.reply && (
                    <div className="mt-3 bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageCircle className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-blue-900 text-sm">
                          Response from {user.fullName}
                        </span>
                      </div>
                      <p className="text-blue-800 text-sm">{rating.reply}</p>
                      {rating.repliedAt && (
                        <p className="text-xs text-blue-600 mt-2">
                          Replied on{" "}
                          {new Date(rating.repliedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-400 italic text-center py-8">
                {ratingFilter === 0
                  ? "No ratings yet"
                  : `No ${ratingFilter}-star ratings`}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="h-20" />
    </div>
  );
}
