import React, { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Calendar } from "./components/ui/calendar";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "./components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./components/ui/tabs";
import { Textarea } from "./components/ui/textarea";
import { Star, Filter, Search, User, Users } from "lucide-react";
import { API_BASE_URL } from "./Config";
import { getToken } from "./ManageToken";

// Star Rating Component
function StarRating({ rating, onRatingChange, editable = false, size = "md" }) {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= (hoverRating || rating);
        return (
          <button
            key={star}
            type="button"
            disabled={!editable}
            onClick={() => editable && onRatingChange(star)}
            onMouseEnter={() => editable && setHoverRating(star)}
            onMouseLeave={() => editable && setHoverRating(0)}
            className={`${sizeClasses[size]} transition-all duration-200 ${
              isFilled ? "text-yellow-500" : "text-gray-300"
            } ${
              editable ? "cursor-pointer hover:scale-110" : "cursor-default"
            }`}
          >
            <Star
              className={`w-full h-full ${isFilled ? "fill-yellow-500" : ""}`}
            />
          </button>
        );
      })}
      {rating > 0 && (
        <span className="text-sm text-gray-600 ml-2">{rating.toFixed(1)}</span>
      )}
    </div>
  );
}

// Rating Dialog Component
function RatingDialog({
  open,
  onOpenChange,
  appointment,
  onRatingSubmit,
  existingRating,
}) {
  const [rating, setRating] = useState(existingRating?.rating || 0);
  const [review, setReview] = useState(existingRating?.review || "");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setRating(existingRating?.rating || 0);
      setReview(existingRating?.review || "");
    }
  }, [open, existingRating]);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setSubmitting(true);
    try {
      await onRatingSubmit(appointment._id, rating, review);
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  const isEditing = !!existingRating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md mx-4">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {isEditing ? "Edit Your Review" : "Rate Your Session"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Your Rating *
            </label>
            <StarRating
              rating={rating}
              onRatingChange={setRating}
              editable={true}
              size="lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Your Review
            </label>
            <Textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share your experience with this session..."
              rows={4}
              className="resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors duration-200 text-sm sm:text-base"
            />
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-3 sm:gap-2 mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            className="w-full sm:w-auto px-4 sm:px-6 py-2 text-sm sm:text-base"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
            className="w-full sm:w-auto px-4 sm:px-6 py-2 text-sm sm:text-base"
          >
            {submitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {isEditing ? "Updating..." : "Submitting..."}
              </div>
            ) : isEditing ? (
              "Update Review"
            ) : (
              "Submit Review"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Pagination component
function Pagination({ currentPage, totalItems, itemsPerPage, onPageChange }) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (totalPages <= 1) return null;

  return (
    <div className="flex gap-2 justify-center mt-4 flex-wrap">
      <button
        className={`px-3 py-2 text-sm rounded-lg transition-all duration-300 ${
          currentPage === 1
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-black text-white hover:bg-gray-800"
        }`}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Previous
      </button>

      <span className="px-3 py-2 text-sm bg-gray-100 rounded-lg">
        Page {currentPage} of {totalPages}
      </span>

      <button
        className={`px-3 py-2 text-sm rounded-lg transition-all duration-300 ${
          currentPage === totalPages
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-black text-white hover:bg-gray-800"
        }`}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next
      </button>
    </div>
  );
}

// Mobile Filter Drawer
function MobileFilterDrawer({ open, onClose, filters, onFiltersChange }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <Select
              value={filters.status}
              onValueChange={(value) =>
                onFiltersChange({ ...filters, status: value })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="canceled">Canceled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Request Type
            </label>
            <Select
              value={filters.requestType}
              onValueChange={(value) =>
                onFiltersChange({ ...filters, requestType: value })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All requests" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Requests</SelectItem>
                <SelectItem value="i-requested">I Requested</SelectItem>
                <SelectItem value="they-requested">They Requested</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Date Range</label>
            <Select
              value={filters.dateRange}
              onValueChange={(value) =>
                onFiltersChange({ ...filters, dateRange: value })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All dates" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="past">Past</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Sort By</label>
            <Select
              value={filters.sortBy}
              onValueChange={(value) =>
                onFiltersChange({ ...filters, sortBy: value })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Date (Newest First)</SelectItem>
                <SelectItem value="date-asc">Date (Oldest First)</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Role Badge Component
function RoleBadge({ role, isCurrentUser }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
        isCurrentUser
          ? "bg-blue-100 text-blue-700 border border-blue-300"
          : role === "teacher"
          ? "bg-purple-100 text-purple-700 border border-purple-300"
          : "bg-green-100 text-green-700 border border-green-300"
      }`}
    >
      {role === "teacher" ? (
        <User className="w-3 h-3" />
      ) : (
        <Users className="w-3 h-3" />
      )}
      {isCurrentUser ? "You" : role}
    </span>
  );
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [ratings, setRatings] = useState({});
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [newDate, setNewDate] = useState(null);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [newTime, setNewTime] = useState("");
  const [activeTab, setActiveTab] = useState("awaiting-action");

  // Rating states
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [selectedApptForRating, setSelectedApptForRating] = useState(null);
  const [existingRatingForAppt, setExistingRatingForAppt] = useState(null);

  // Pagination
  const itemsPerPage = 6;
  const [currentPage, setCurrentPage] = useState(1);
  const [pageKey, setPageKey] = useState(0);

  // Filters
  const [filters, setFilters] = useState({
    status: "all",
    requestType: "all",
    dateRange: "all",
    sortBy: "date-desc",
    search: "",
  });

  // Mobile states
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/appointments`, {
        headers: { auth: getToken() },
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Failed to fetch appointments");

      const now = new Date();
      const updatedAppointments = await Promise.all(
        data.data.map(async (appt) => {
          const apptDate = new Date(`${appt.date}T${appt.time}`);
          if (appt.status === "pending" && apptDate < now) {
            await fetch(`${API_BASE_URL}/appointments/${appt._id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json", auth: getToken() },
              body: JSON.stringify({ status: "canceled" }),
            });
            return { ...appt, status: "canceled" };
          }
          return appt;
        })
      );
      setAppointments(updatedAppointments);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUser = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/user/me`, {
        method: "POST",
        headers: { "Content-Type": "application/json", auth: getToken() },
      });
      const data = await res.json();
      if (res.ok) {
        setUserId(data.data.user._id);
        setUserRole(data.data.user.role);
      }
    } catch (err) {
      toast.error("Failed to fetch user info");
      console.log(err);
    }
  };

  const fetchRatings = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/ratings/my-ratings`, {
        headers: { auth: getToken() },
      });
      const data = await res.json();
      if (res.ok && data.status.toLowerCase() === "success") {
        const ratingsMap = {};
        data.data.ratings?.forEach((rating) => {
          ratingsMap[rating.session] = rating;
        });
        setRatings(ratingsMap);
      }
    } catch (err) {
      console.error("Failed to fetch ratings:", err);
    }
  };

  useEffect(() => {
    fetchUser();
    fetchAppointments();
    fetchRatings();
  }, []);

  // Filter and sort appointments
  const getFilteredAppointments = (appointmentsList) => {
    let filtered = appointmentsList.filter((appt) => {
      // Status filter
      if (filters.status !== "all" && appt.status !== filters.status) {
        return false;
      }

      // Request type filter - FIXED: Compare with userId, not role
      if (filters.requestType !== "all") {
        const iRequested = appt.proposedBy === userId;
        if (filters.requestType === "i-requested" && !iRequested) return false;
        if (filters.requestType === "they-requested" && iRequested)
          return false;
      }

      // Date range filter
      const apptDate = new Date(`${appt.date}T${appt.time}`);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      const monthAgo = new Date(today);
      monthAgo.setMonth(today.getMonth() - 1);

      switch (filters.dateRange) {
        case "today":
          if (apptDate.toDateString() !== today.toDateString()) return false;
          break;
        case "week":
          if (apptDate < weekAgo) return false;
          break;
        case "month":
          if (apptDate < monthAgo) return false;
          break;
        case "upcoming":
          if (apptDate < now) return false;
          break;
        case "past":
          if (apptDate >= now) return false;
          break;
      }

      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const otherPerson =
          userRole === "teacher" ? appt.student : appt.teacher;
        if (!otherPerson.fullName.toLowerCase().includes(searchTerm))
          return false;
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);

      switch (filters.sortBy) {
        case "date-asc":
          return dateA - dateB;
        case "status":
          const statusOrder = {
            pending: 1,
            confirmed: 2,
            completed: 3,
            canceled: 4,
          };
          return statusOrder[a.status] - statusOrder[b.status];
        case "date-desc":
        default:
          return dateB - dateA;
      }
    });

    return filtered;
  };

  // FIXED: Correct categorization using userId comparison
  const getCategorizedAppointments = () => {
    const needMyApproval = []; // They requested (proposedBy !== userId), I need to approve
    const myPendingRequests = []; // I requested (proposedBy === userId), waiting for their approval
    const otherAppointments = []; // Everything else (confirmed, completed)

    appointments.forEach((appt) => {
      const iRequested = appt.proposedBy === userId;

      if (appt.status === "pending") {
        if (iRequested) {
          myPendingRequests.push(appt);
        } else {
          needMyApproval.push(appt);
        }
      } else {
        otherAppointments.push(appt);
      }
    });

    return { needMyApproval, myPendingRequests, otherAppointments };
  };

  const { needMyApproval, myPendingRequests, otherAppointments } =
    getCategorizedAppointments();

  const handleRateAppointment = (appointment) => {
    setSelectedApptForRating(appointment);
    const existingRating = ratings[appointment._id];
    setExistingRatingForAppt(existingRating || null);
    setRatingDialogOpen(true);
  };

  const handleRatingSubmit = async (appointmentId, rating, review) => {
    try {
      const isEditing = !!existingRatingForAppt;
      const url = isEditing
        ? `${API_BASE_URL}/ratings/${existingRatingForAppt._id}`
        : `${API_BASE_URL}/ratings/submit`;

      const method = isEditing ? "PUT" : "POST";

      const payload = isEditing
        ? { rating, review }
        : {
            teacherId: selectedApptForRating.teacher._id,
            sessionId: appointmentId,
            rating,
            review: review || "No review provided.",
          };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          auth: getToken(),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to submit rating");
      }

      toast.success(
        isEditing
          ? "Review updated successfully!"
          : "Thank you for your review!"
      );

      await fetchRatings();
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    }
  };

  const getWeekday = (date) =>
    date.toLocaleDateString("en-US", { weekday: "long" });

  const generateTimeSlots = (start, end) => {
    const times = [];
    let [h, m] = start.split(":").map(Number);
    let [endH, endM] = end.split(":").map(Number);
    while (h < endH || (h === endH && m < endM)) {
      const hh = String(h).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      times.push(`${hh}:${mm}`);
      m += 30;
      if (m >= 60) {
        h++;
        m -= 60;
      }
    }
    return times;
  };

  const isDateDisabled = (date) => {
    if (!selectedAppt || !selectedAppt.teacher.availability) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return true;
    const weekday = getWeekday(date);
    const dayData = selectedAppt.teacher.availability[weekday];
    return !dayData || dayData.off;
  };

  const handleDateSelect = (date) => {
    if (isDateDisabled(date)) return;
    setNewDate(date);

    const weekday = getWeekday(date);
    const dayData = selectedAppt.teacher.availability[weekday];
    if (!dayData || dayData.off) {
      setAvailableTimes([]);
      return;
    }

    let times = generateTimeSlots(dayData.start, dayData.end);

    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(
        Math.floor(now.getMinutes() / 30) * 30
      ).padStart(2, "0")}`;
      times = times.filter((t) => t > currentTime);
    }

    setAvailableTimes(times);
  };

  const handleConfirm = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", auth: getToken() },
        body: JSON.stringify({ status: "confirmed" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to confirm");
      toast.success("Appointment confirmed");
      fetchAppointments();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleCancel = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", auth: getToken() },
        body: JSON.stringify({ status: "canceled" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to cancel");
      toast.success("Appointment canceled");
      fetchAppointments();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRescheduleClick = (appt) => {
    setSelectedAppt(appt);
    setNewDate(null);
    setNewTime(appt.time);
    setAvailableTimes([]);
    setOpenModal(true);
  };

  const handleRescheduleConfirm = async () => {
    if (!newDate || !newTime) {
      toast.error("Please select both a new date and time");
      return;
    }
    try {
      const res = await fetch(
        `${API_BASE_URL}/appointments/change-schedule/${selectedAppt._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            auth: getToken(),
          },
          body: JSON.stringify({
            date: newDate,
            time: newTime,
            teacher: selectedAppt.teacher._id,
            status: selectedAppt.status,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to reschedule");
      toast.success("Appointment rescheduled");
      setOpenModal(false);
      fetchAppointments();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const renderCards = (list) =>
    list.length === 0 ? (
      <p className="text-center text-gray-500 mt-8 text-sm sm:text-base">
        No appointments found.
      </p>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {list.map((appt) => {
          const existingRating = ratings[appt._id];

          // FIXED: Compare proposedBy with userId, not role
          const iRequested = appt.proposedBy === userId;

          // Always show the person you're exchanging with
          const otherPerson =
            userRole === "teacher" ? appt.student : appt.teacher;
          const otherPersonRole =
            userRole === "teacher" ? "student" : "teacher";

          const canRate =
            appt.status === "completed" && iRequested && userRole === "student";

          const hasRated = !!existingRating;

          // FIXED: Correct logic using userId comparison
          const needsMyApproval = !iRequested && appt.status === "pending";
          const waitingTheirApproval = iRequested && appt.status === "pending";

          return (
            <Card
              key={appt._id}
              className={`flex flex-col justify-between h-full p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 bg-white border ${
                needsMyApproval
                  ? "border-yellow-400 border-2"
                  : "border-gray-200 hover:border-blue-300"
              }`}
            >
              <div className="flex-1">
                <CardHeader className="flex items-center gap-3 p-0 mb-3">
                  <img
                    src={`${API_BASE_URL}/user_avatar/${otherPerson.avatar}`}
                    alt={otherPerson.fullName}
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-blue-500"
                  />
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base sm:text-lg font-semibold truncate">
                      {otherPerson.fullName}
                    </CardTitle>

                    <div className="flex flex-wrap gap-1 mt-1">
                      {/* Role badges */}
                      <div className="flex gap-1">
                        <RoleBadge role={userRole} isCurrentUser={true} />
                        <RoleBadge
                          role={otherPersonRole}
                          isCurrentUser={false}
                        />
                      </div>

                      {/* Request badge */}
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          iRequested
                            ? "bg-blue-100 text-blue-700 border border-blue-300"
                            : "bg-purple-100 text-purple-700 border border-purple-300"
                        }`}
                      >
                        {iRequested ? "You Requested" : "They Requested"}
                      </span>

                      {/* Action required badge - ONLY when they requested and pending */}
                      {needsMyApproval && (
                        <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-300">
                          Your Approval Needed
                        </span>
                      )}
                    </div>

                    {/* Rating display */}
                    {userRole === "student" && existingRating && (
                      <div className="flex items-center gap-2 mt-1">
                        <StarRating rating={existingRating.rating} size="sm" />
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-0 space-y-2 text-sm sm:text-base">
                  <p>
                    <strong>Date:</strong> {new Date(appt.date).toDateString()}
                  </p>
                  <p>
                    <strong>Time:</strong> {appt.time}
                  </p>
                  <p>
                    <strong>Status:</strong>{" "}
                    <span
                      className={`font-semibold ${
                        appt.status === "pending"
                          ? "text-yellow-500"
                          : appt.status === "confirmed"
                          ? "text-green-500"
                          : appt.status === "completed"
                          ? "text-blue-500"
                          : "text-red-500"
                      }`}
                    >
                      {appt.status.toUpperCase()}
                    </span>
                  </p>

                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      {userRole === "teacher"
                        ? "Student wants to learn:"
                        : "Teacher can teach:"}
                    </p>
                    {(() => {
                      const skills =
                        userRole === "teacher"
                          ? appt.student?.learningSkills
                          : appt.teacher?.teachingSkills;

                      if (!skills || skills.length === 0)
                        return (
                          <span className="text-gray-400 text-sm italic">
                            Not specified
                          </span>
                        );

                      let skillsArray = [];
                      if (Array.isArray(skills)) {
                        skillsArray = skills.map((s) =>
                          typeof s === "object" && s.name ? s.name : String(s)
                        );
                      } else if (typeof skills === "string") {
                        skillsArray = skills
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean);
                      }

                      return (
                        <div className="flex flex-wrap gap-1">
                          {skillsArray.slice(0, 3).map((skill, i) => (
                            <span
                              key={i}
                              className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full"
                            >
                              {skill}
                            </span>
                          ))}
                          {skillsArray.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{skillsArray.length - 3} more
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </CardContent>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {/* Case 1: They requested & pending - I need to approve */}
                {needsMyApproval && (
                  <>
                    <Button
                      className="bg-green-500 hover:bg-green-600 text-white flex-1 min-w-[80px] text-sm py-2"
                      onClick={() => handleConfirm(appt._id)}
                    >
                      Accept
                    </Button>
                    <Button
                      variant="outline"
                      className="text-red-500 border-red-500 hover:bg-red-50 flex-1 min-w-[80px] text-sm py-2"
                      onClick={() => handleCancel(appt._id)}
                    >
                      Decline
                    </Button>
                  </>
                )}

                {/* Case 2: I requested & pending - waiting for their approval */}
                {waitingTheirApproval && (
                  <div className="w-full text-center">
                    <p className="text-sm text-gray-600 mb-2">
                      Waiting for {otherPerson.fullName}'s approval
                    </p>
                    <Button
                      variant="outline"
                      className="text-red-500 border-red-500 hover:bg-red-50 w-full text-sm py-2"
                      onClick={() => handleCancel(appt._id)}
                    >
                      Cancel Request
                    </Button>
                  </div>
                )}

                {/* Case 3: Confirmed appointments */}
                {appt.status === "confirmed" && (
                  <>
                    <Button
                      variant="outline"
                      className="text-red-500 border-red-500 hover:bg-red-50 flex-1 min-w-[80px] text-sm py-2"
                      onClick={() => handleCancel(appt._id)}
                    >
                      Cancel
                    </Button>
                    {iRequested && (
                      <Button
                        variant="outline"
                        className="text-blue-500 border-blue-500 hover:bg-blue-50 flex-1 min-w-[80px] text-sm py-2"
                        onClick={() => handleRescheduleClick(appt)}
                      >
                        Reschedule
                      </Button>
                    )}
                  </>
                )}

                {/* Case 4: Completed sessions - rate if student requested */}
                {appt.status === "completed" && canRate && (
                  <Button
                    className={`w-full text-sm py-2 ${
                      hasRated
                        ? "bg-yellow-500 hover:bg-yellow-600"
                        : "bg-purple-500 hover:bg-purple-600"
                    } text-white`}
                    onClick={() => handleRateAppointment(appt)}
                  >
                    {hasRated ? "Edit Review" : "Rate Session"}
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    );

  const paginate = (list) => {
    const start = (currentPage - 1) * itemsPerPage;
    return list.slice(start, start + itemsPerPage);
  };

  if (loading || userId === null)
    return (
      <p className="text-center mt-6 text-sm sm:text-base">
        Loading appointments...
      </p>
    );

  // Use the correct filtered appointments for each tab
  const filteredNeedMyApproval = getFilteredAppointments(needMyApproval);
  const filteredMyPendingRequests = getFilteredAppointments(myPendingRequests);
  const filteredOtherAppointments = getFilteredAppointments(otherAppointments);

  return (
    <>
      <div className="p-3 sm:p-4 md:p-6">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold">Skill Exchange Sessions</h1>
            <p className="text-gray-600 text-sm">
              Manage your learning and teaching appointments
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMobileFiltersOpen(true)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            <span className="sm:hidden">Filter</span>
          </Button>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:block mb-6">
          <h1 className="text-2xl font-semibold mb-2">
            Skill Exchange Sessions
          </h1>
          <p className="text-gray-600">
            Manage your learning and teaching appointments
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(val) => {
            setActiveTab(val);
            setCurrentPage(1);
            setPageKey((prev) => prev + 1);
          }}
          className="w-full"
        >
          <TabsList className="flex w-full max-w-full overflow-x-auto mb-6">
            <TabsTrigger
              value="awaiting-action"
              className="flex-1 min-w-0 text-xs sm:text-sm px-3 sm:px-6 py-2"
            >
              Need My Approval
              {needMyApproval.length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                  {needMyApproval.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="my-requests"
              className="flex-1 min-w-0 text-xs sm:text-sm px-3 sm:px-6 py-2"
            >
              My Requests
              {myPendingRequests.length > 0 && (
                <span className="ml-2 bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                  {myPendingRequests.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="all"
              className="flex-1 min-w-0 text-xs sm:text-sm px-3 sm:px-6 py-2"
            >
              All Sessions
            </TabsTrigger>
          </TabsList>

          {/* Search and Filters */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setMobileFiltersOpen(true)}
                className="lg:hidden flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filters
              </Button>
            </div>

            {/* Desktop Filters */}
            <div className="hidden lg:block bg-white p-4 rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Status
                  </label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) =>
                      setFilters({ ...filters, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="canceled">Canceled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Request Type
                  </label>
                  <Select
                    value={filters.requestType}
                    onValueChange={(value) =>
                      setFilters({ ...filters, requestType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All requests" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Requests</SelectItem>
                      <SelectItem value="i-requested">I Requested</SelectItem>
                      <SelectItem value="they-requested">
                        They Requested
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Date Range
                  </label>
                  <Select
                    value={filters.dateRange}
                    onValueChange={(value) =>
                      setFilters({ ...filters, dateRange: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All dates" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Dates</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="past">Past</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Sort By
                  </label>
                  <Select
                    value={filters.sortBy}
                    onValueChange={(value) =>
                      setFilters({ ...filters, sortBy: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date-desc">
                        Date (Newest First)
                      </SelectItem>
                      <SelectItem value="date-asc">
                        Date (Oldest First)
                      </SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Tab content */}
          <TabsContent value="awaiting-action">
            <div
              key={pageKey}
              className="transition-all duration-500 ease-in-out transform opacity-0 animate-fadeIn"
            >
              {renderCards(paginate(filteredNeedMyApproval))}
            </div>
            <Pagination
              currentPage={currentPage}
              totalItems={filteredNeedMyApproval.length}
              itemsPerPage={itemsPerPage}
              onPageChange={(page) => {
                setCurrentPage(page);
                setPageKey((prev) => prev + 1);
              }}
            />
          </TabsContent>

          <TabsContent value="my-requests">
            <div
              key={pageKey}
              className="transition-all duration-500 ease-in-out transform opacity-0 animate-fadeIn"
            >
              {renderCards(paginate(filteredMyPendingRequests))}
            </div>
            <Pagination
              currentPage={currentPage}
              totalItems={filteredMyPendingRequests.length}
              itemsPerPage={itemsPerPage}
              onPageChange={(page) => {
                setCurrentPage(page);
                setPageKey((prev) => prev + 1);
              }}
            />
          </TabsContent>

          <TabsContent value="all">
            <div
              key={pageKey}
              className="transition-all duration-500 ease-in-out transform opacity-0 animate-fadeIn"
            >
              {renderCards(paginate(filteredOtherAppointments))}
            </div>
            <Pagination
              currentPage={currentPage}
              totalItems={filteredOtherAppointments.length}
              itemsPerPage={itemsPerPage}
              onPageChange={(page) => {
                setCurrentPage(page);
                setPageKey((prev) => prev + 1);
              }}
            />
          </TabsContent>
        </Tabs>

        {/* Reschedule Modal */}
        <Dialog open={openModal} onOpenChange={setOpenModal}>
          <DialogContent className="w-full max-w-md mx-4">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                Reschedule Session
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="font-medium mb-2 block text-sm sm:text-base">
                  Select New Date
                </label>
                <Calendar
                  mode="single"
                  selected={newDate}
                  onSelect={handleDateSelect}
                  className="rounded-md border w-full"
                  disabled={isDateDisabled}
                />
              </div>

              {newDate &&
                (availableTimes.length > 0 ? (
                  <div>
                    <label className="font-medium mb-2 block text-sm sm:text-base">
                      Available Times
                    </label>
                    <Select onValueChange={setNewTime} value={newTime}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a time" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTimes.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">
                    {selectedAppt?.teacher?.fullName} is not available on this
                    day.
                  </p>
                ))}
            </div>

            <DialogFooter className="mt-4 flex flex-col sm:flex-row gap-3 sm:gap-2">
              <Button
                variant="outline"
                onClick={() => setOpenModal(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRescheduleConfirm}
                disabled={!newTime || !newDate}
                className="w-full sm:w-auto"
              >
                Confirm Reschedule
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Mobile Filter Drawer */}
        <MobileFilterDrawer
          open={mobileFiltersOpen}
          onClose={() => setMobileFiltersOpen(false)}
          filters={filters}
          onFiltersChange={setFilters}
        />

        {/* Rating Dialog */}
        <RatingDialog
          open={ratingDialogOpen}
          onOpenChange={setRatingDialogOpen}
          appointment={selectedApptForRating}
          onRatingSubmit={handleRatingSubmit}
          existingRating={existingRatingForAppt}
        />
      </div>
    </>
  );
}
