import React, { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Badge } from "./components/ui/badge";
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
import {
  Star,
  Filter,
  Search,
  Book,
  Calendar as CalendarIcon,
  Clock,
  ChevronDown,
  ChevronRight,
  Users,
  User,
  CheckCircle,
  XCircle,
  Clock as ClockIcon,
  BookOpen,
  GraduationCap,
  ExternalLink,
  RotateCcw,
} from "lucide-react";
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
      <DialogContent className="sm:max-w-md mx-4 rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
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
            className="w-full sm:w-auto px-4 sm:px-6 py-2 text-sm sm:text-base bg-blue-600 hover:bg-blue-700"
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
            : "bg-blue-600 text-white hover:bg-blue-700"
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
            : "bg-blue-600 text-white hover:bg-blue-700"
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
      <DialogContent className="w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto rounded-lg">
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
                <SelectItem value="ongoing">Ongoing</SelectItem>
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

// Format date in local style - FIXED to handle the date format properly
const formatLocalDate = (dateString) => {
  // Extract just the date part if it's an ISO string with time
  const dateOnly = dateString.split("T")[0];
  const date = new Date(dateOnly);

  if (isNaN(date.getTime())) {
    return "Invalid Date";
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
};

// Helper function to parse appointment date and time properly
const parseAppointmentDateTime = (appt) => {
  try {
    // Extract just the date part from the ISO string
    const dateOnly = appt.date.split("T")[0];
    const dateTimeString = `${dateOnly}T${appt.time}`;
    const dateTime = new Date(dateTimeString);

    console.log(dateTime);

    if (isNaN(dateTime.getTime())) {
      console.warn(
        "Invalid date for appointment:",
        appt._id,
        appt.date,
        appt.time
      );
      return null;
    }

    return dateTime;
  } catch (error) {
    console.error("Error parsing appointment date:", error);
    return null;
  }
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [ratings, setRatings] = useState({});
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [courses, setCourses] = useState({});
  const [openModal, setOpenModal] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [newDate, setNewDate] = useState(null);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [newTime, setNewTime] = useState("");
  const [activeTab, setActiveTab] = useState("as-teacher");

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

  // Reset filters when tab changes
  useEffect(() => {
    setFilters({
      status: "all",
      requestType: "all",
      dateRange: "all",
      sortBy: "date-desc",
      search: "",
    });
    setCurrentPage(1);
  }, [activeTab]);

  // Fetch course information with better error handling
  const fetchCoursesForAppointments = async (appointmentsList) => {
    const courseIds = [
      ...new Set(appointmentsList.map((appt) => appt.courseId).filter(Boolean)),
    ];
    const coursesMap = {};

    await Promise.all(
      courseIds.map(async (courseId) => {
        try {
          const res = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
            headers: { auth: getToken() },
          });
          if (res.ok) {
            const data = await res.json();
            coursesMap[courseId] = data.data.course;
          } else {
            console.warn(`Failed to fetch course ${courseId}`);
            // Create a fallback course object with the ID as title
            coursesMap[courseId] = {
              title: `Course ${courseId.substring(0, 8)}...`,
              _id: courseId,
              endDate: null,
            };
          }
        } catch (err) {
          console.error(`Failed to fetch course ${courseId}:`, err);
          // Create a fallback course object
          coursesMap[courseId] = {
            title: `Course ${courseId.substring(0, 8)}...`,
            _id: courseId,
            endDate: null,
          };
        }
      })
    );

    setCourses(coursesMap);
  };

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
          const apptDateTime = parseAppointmentDateTime(appt);
          if (appt.status === "pending" && apptDateTime && apptDateTime < now) {
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

      await fetchCoursesForAppointments(updatedAppointments);
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

  // Filter and sort appointments - FIXED VERSION with proper date parsing
  const getFilteredAppointments = (appointmentsList) => {
    let filtered = appointmentsList.filter((appt) => {
      // Status filter
      if (filters.status !== "all" && appt.status !== filters.status) {
        return false;
      }

      // Request type filter
      if (filters.requestType !== "all") {
        const iRequested = appt.proposedBy === userId;
        if (filters.requestType === "i-requested" && !iRequested) return false;
        if (filters.requestType === "they-requested" && iRequested)
          return false;
      }

      // Date range filter - FIXED with proper date parsing
      if (filters.dateRange !== "all") {
        const apptDateTime = parseAppointmentDateTime(appt);

        if (!apptDateTime) {
          return false; // Skip appointments with invalid dates
        }

        const now = new Date();

        switch (filters.dateRange) {
          case "today": {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const apptDate = new Date(apptDateTime);
            apptDate.setHours(0, 0, 0, 0);

            if (apptDate < today || apptDate >= tomorrow) return false;
            break;
          }
          case "week": {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 7); // Next Sunday

            if (apptDateTime < startOfWeek || apptDateTime >= endOfWeek)
              return false;
            break;
          }
          case "month": {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const startOfMonth = new Date(
              today.getFullYear(),
              today.getMonth(),
              1
            );
            const endOfMonth = new Date(
              today.getFullYear(),
              today.getMonth() + 1,
              1
            );

            if (apptDateTime < startOfMonth || apptDateTime >= endOfMonth)
              return false;
            break;
          }
          case "upcoming":
            if (apptDateTime <= now) return false;
            break;
          case "past":
            if (apptDateTime >= now) return false;
            break;
          default:
            break;
        }
      }

      // Search filter - searches in title and course name only
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const course = courses[appt.courseId];
        const courseName = course?.title || "";
        const sessionTitle = appt.title || "";

        if (
          !sessionTitle.toLowerCase().includes(searchTerm) &&
          !courseName.toLowerCase().includes(searchTerm)
        ) {
          return false;
        }
      }

      return true;
    });

    // Sort - FIXED with proper date parsing
    filtered.sort((a, b) => {
      const dateA = parseAppointmentDateTime(a);
      const dateB = parseAppointmentDateTime(b);

      // Handle invalid dates by putting them at the end
      if (!dateA) return 1;
      if (!dateB) return -1;

      switch (filters.sortBy) {
        case "date-asc":
          return dateA - dateB; // Oldest first
        case "date-desc":
          return dateB - dateA; // Newest first
        case "status":
          const statusOrder = {
            pending: 1,
            confirmed: 2,
            ongoing: 3,
            completed: 4,
            canceled: 5,
          };
          return statusOrder[a.status] - statusOrder[b.status];
        default:
          return dateB - dateA; // Default to newest first
      }
    });

    return filtered;
  };

  // Categorize appointments into the 3 clear tabs
  const getCategorizedAppointments = () => {
    const asTeacher = []; // All appointments where I'm the teacher
    const asStudent = []; // All appointments where I'm the student
    const needMyAction = []; // Only pending appointments that need my approval

    appointments.forEach((appt) => {
      const iAmTeacher = appt.teacher._id === userId;
      const iAmStudent = appt.student._id === userId;
      const iRequested = appt.proposedBy === userId;

      // As Teacher tab - all appointments where I'm the teacher
      if (iAmTeacher) {
        asTeacher.push(appt);
      }

      // As Student tab - all appointments where I'm the student
      if (iAmStudent) {
        asStudent.push(appt);
      }

      // Need My Action tab - only pending appointments where I didn't request it
      if (appt.status === "pending" && !iRequested) {
        needMyAction.push(appt);
      }
    });

    return { asTeacher, asStudent, needMyAction };
  };

  const { asTeacher, asStudent, needMyAction } = getCategorizedAppointments();

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

  // Check if date is within course duration and teacher availability
  const isDateDisabled = (date) => {
    if (!selectedAppt || !selectedAppt.teacher.availability) return true;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Disable past dates
    if (date < today) return true;

    // Check if date is within course duration
    const course = courses[selectedAppt.courseId];
    if (course && course.endDate) {
      const courseEndDate = new Date(course.endDate);
      courseEndDate.setHours(23, 59, 59, 999); // End of the last day
      if (date > courseEndDate) return true;
    }

    // Check teacher availability
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

    // Additional validation to ensure the selected date is within course duration
    const course = courses[selectedAppt.courseId];
    if (course && course.endDate) {
      const courseEndDate = new Date(course.endDate);
      courseEndDate.setHours(23, 59, 59, 999);
      if (newDate > courseEndDate) {
        toast.error("Cannot reschedule beyond the course end date");
        return;
      }
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

  // Get badge color for status - UPDATED with ongoing
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500";
      case "confirmed":
        return "bg-green-500";
      case "ongoing":
        return "bg-blue-500";
      case "completed":
        return "bg-purple-500";
      case "canceled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  // Get border color for card - UPDATED with ongoing
  const getCardBorderColor = (status, needsMyApproval) => {
    if (needsMyApproval) return "border-yellow-400 border-2";

    switch (status) {
      case "pending":
        return "border-yellow-200";
      case "confirmed":
        return "border-green-200";
      case "ongoing":
        return "border-blue-200";
      case "completed":
        return "border-purple-200";
      case "canceled":
        return "border-red-200";
      default:
        return "border-gray-200";
    }
  };

  const renderCards = (list, context) =>
    list.length === 0 ? (
      <div className="text-center py-12">
        <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No{" "}
          {context === "as-teacher"
            ? "Teaching"
            : context === "as-student"
            ? "Learning"
            : "Pending"}{" "}
          Sessions
        </h3>
        <p className="text-gray-500">
          {context === "as-teacher" && "No teaching sessions scheduled yet."}
          {context === "as-student" && "No learning sessions scheduled yet."}
          {context === "need-action" && "No appointments need your action."}
        </p>
      </div>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {list.map((appt) => {
          const existingRating = ratings[appt._id];
          const iRequested = appt.proposedBy === userId;
          const iAmTeacher = appt.teacher._id === userId;
          const iAmStudent = appt.student._id === userId;

          // Always show the other person (the one you're exchanging with)
          const otherPerson = iAmTeacher ? appt.student : appt.teacher;
          const otherPersonRole = iAmTeacher ? "student" : "teacher";

          // Get course information - FIXED: Now uses course title instead of ID
          const course = courses[appt.courseId];
          const courseName =
            course?.title || `Course ${appt.courseId?.substring(0, 8)}...`;

          const canRate = appt.status === "completed" && iAmStudent; // Students can rate completed sessions

          const hasRated = !!existingRating;

          // Action logic
          const needsMyApproval = appt.status === "pending" && !iRequested;
          const waitingTheirApproval = appt.status === "pending" && iRequested;

          // Both users can reschedule confirmed or ongoing appointments
          const canReschedule =
            appt.status === "confirmed" || appt.status === "ongoing";

          return (
            <Card
              key={appt._id}
              className={`flex flex-col justify-between h-full p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 bg-white border ${getCardBorderColor(
                appt.status,
                needsMyApproval
              )} hover:border-blue-300`}
            >
              <div className="flex-1">
                {/* Session Header with Title and Course */}
                <CardHeader className="p-0 mb-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
                        {appt.title || "Learning Session"}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Book className="w-4 h-4" />
                        <span className="font-medium">{courseName}</span>
                        {appt.week && (
                          <Badge variant="outline" className="text-xs">
                            Week {appt.week}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Session Description */}
                  {appt.description && (
                    <div className="bg-gray-50 p-3 rounded-lg mb-3">
                      <p className="text-sm text-gray-700">
                        {appt.description}
                      </p>
                    </div>
                  )}

                  {/* User Info */}
                  <div className="flex items-center gap-3">
                    <img
                      src={`${API_BASE_URL}/user_avatar/${otherPerson.avatar}`}
                      alt={otherPerson.fullName}
                      className="w-10 h-10 rounded-full object-cover border-2 border-blue-500"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {otherPerson.fullName}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className={`text-xs ${
                            iAmTeacher
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {iAmTeacher ? (
                            <div className="flex items-center gap-1">
                              <GraduationCap className="w-3 h-3" />
                              <span>Teacher</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <BookOpen className="w-3 h-3" />
                              <span>Student</span>
                            </div>
                          )}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                {/* Session Details */}
                <CardContent className="p-0 space-y-3 text-sm sm:text-base">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-gray-600">
                      <CalendarIcon className="w-4 h-4" />
                      <span>{formatLocalDate(appt.date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{appt.time}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-medium">Status: </span>
                    <Badge
                      className={`${getStatusBadgeColor(
                        appt.status
                      )} text-white`}
                    >
                      {appt.status.toUpperCase()}
                    </Badge>
                  </div>

                  {/* FIX 1: Rating display - Show rating if reviewed, show button if not reviewed but completed */}
                  {iAmStudent && (
                    <div className="flex items-center gap-2 mt-2">
                      {existingRating ? (
                        <div className="flex items-center gap-2">
                          <StarRating
                            rating={existingRating.rating}
                            size="sm"
                          />
                          <span className="text-sm text-gray-600">
                            Your rating
                          </span>
                        </div>
                      ) : appt.status === "completed" ? (
                        <Button
                          className="w-full text-sm py-2 bg-purple-600 hover:bg-purple-700 text-white"
                          onClick={() => handleRateAppointment(appt)}
                        >
                          <Star className="w-4 h-4 mr-1" />
                          Rate Session
                        </Button>
                      ) : null}
                    </div>
                  )}
                </CardContent>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex flex-wrap gap-2">
                {/* Case 1: They requested & pending - I need to approve */}
                {needsMyApproval && (
                  <>
                    <Button
                      className="bg-green-600 hover:bg-green-700 text-white flex-1 min-w-[80px] text-sm py-2"
                      onClick={() => handleConfirm(appt._id)}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      variant="outline"
                      className="text-red-600 border-red-600 hover:bg-red-50 flex-1 min-w-[80px] text-sm py-2"
                      onClick={() => handleCancel(appt._id)}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
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
                      className="text-red-600 border-red-600 hover:bg-red-50 w-full text-sm py-2"
                      onClick={() => handleCancel(appt._id)}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Cancel Request
                    </Button>
                  </div>
                )}

                {/* Case 3: Confirmed or ongoing appointments - BOTH USERS CAN RESCHEDULE */}
                {(appt.status === "confirmed" || appt.status === "ongoing") && (
                  <>
                    <Button
                      variant="outline"
                      className="text-red-600 border-red-600 hover:bg-red-50 flex-1 min-w-[80px] text-sm py-2"
                      onClick={() => handleCancel(appt._id)}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                    <Button
                      variant="outline"
                      className="text-blue-600 border-blue-600 hover:bg-blue-50 flex-1 min-w-[80px] text-sm py-2"
                      onClick={() => handleRescheduleClick(appt)}
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Reschedule
                    </Button>
                  </>
                )}

                {/* FIX 1: Remove the old rating button from here since it's now in the rating display section */}
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
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );

  // Filter appointments for each tab - FIXED: Now properly applies all filters
  const filteredAsTeacher = getFilteredAppointments(asTeacher);
  const filteredAsStudent = getFilteredAppointments(asStudent);
  const filteredNeedMyAction = getFilteredAppointments(needMyAction);

  return (
    <>
      <div className="min-h-screen bg-gray-50/30">
        {/* Modern Header */}
        <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white">
          <div className="px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
            <div className="flex flex-col xl:flex-row gap-4 lg:gap-6 xl:gap-8">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold mb-2 sm:mb-3 leading-tight break-words">
                  Appointments
                </h1>
                <p className="text-blue-100 text-sm sm:text-base lg:text-lg xl:text-xl max-w-4xl leading-relaxed break-words">
                  Manage your teaching and learning appointments
                </p>
              </div>

              {/* Stats Card */}
              <Card className="bg-white/10 backdrop-blur-sm border-0 text-white w-full xl:w-80 mt-3 sm:mt-0 flex-shrink-0">
                <CardContent className="p-3 sm:p-4 lg:p-6">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-lg sm:text-xl lg:text-2xl font-bold">
                        {appointments.length}
                      </div>
                      <div className="text-xs sm:text-sm text-blue-100">
                        Total Sessions
                      </div>
                    </div>
                    <div>
                      <div className="text-lg sm:text-xl lg:text-2xl font-bold">
                        {needMyAction.length}
                      </div>
                      <div className="text-xs sm:text-sm text-blue-100">
                        Need Action
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <div className="p-3 sm:p-4 md:p-6">
          <Tabs
            value={activeTab}
            onValueChange={(val) => {
              setActiveTab(val);
              setCurrentPage(1);
              setPageKey((prev) => prev + 1);
            }}
            className="w-full"
          >
            <TabsList className="flex w-full max-w-full overflow-x-auto mb-6 bg-white border rounded-lg p-1">
              <TabsTrigger
                value="as-teacher"
                className="flex-1 min-w-0 text-xs sm:text-sm px-3 sm:px-6 py-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                <div className="flex items-center gap-2 justify-center">
                  <GraduationCap className="w-4 h-4" />
                  <span>As Teacher</span>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="as-student"
                className="flex-1 min-w-0 text-xs sm:text-sm px-3 sm:px-6 py-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                <div className="flex items-center gap-2 justify-center">
                  <BookOpen className="w-4 h-4" />
                  <span>As Student</span>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="need-action"
                className="flex-1 min-w-0 text-xs sm:text-sm px-3 sm:px-6 py-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                <div className="flex items-center gap-2 justify-center">
                  <ClockIcon className="w-4 h-4" />
                  <span>Need My Action</span>
                  {needMyAction.length > 0 && (
                    <Badge className="ml-1 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                      {needMyAction.length}
                    </Badge>
                  )}
                </div>
              </TabsTrigger>
            </TabsList>

            {/* Search and Filters */}
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Search by session title or course..."
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
                <Button
                  variant="outline"
                  onClick={() => {
                    setFilters({
                      status: "all",
                      requestType: "all",
                      dateRange: "all",
                      sortBy: "date-desc",
                      search: "",
                    });
                  }}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset Filters
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
                        <SelectItem value="ongoing">Ongoing</SelectItem>
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
            <TabsContent value="as-teacher">
              <div
                key={pageKey}
                className="transition-all duration-500 ease-in-out transform opacity-0 animate-fadeIn"
              >
                {renderCards(paginate(filteredAsTeacher), "as-teacher")}
              </div>
              <Pagination
                currentPage={currentPage}
                totalItems={filteredAsTeacher.length}
                itemsPerPage={itemsPerPage}
                onPageChange={(page) => {
                  setCurrentPage(page);
                  setPageKey((prev) => prev + 1);
                }}
              />
            </TabsContent>

            <TabsContent value="as-student">
              <div
                key={pageKey}
                className="transition-all duration-500 ease-in-out transform opacity-0 animate-fadeIn"
              >
                {renderCards(paginate(filteredAsStudent), "as-student")}
              </div>
              <Pagination
                currentPage={currentPage}
                totalItems={filteredAsStudent.length}
                itemsPerPage={itemsPerPage}
                onPageChange={(page) => {
                  setCurrentPage(page);
                  setPageKey((prev) => prev + 1);
                }}
              />
            </TabsContent>

            <TabsContent value="need-action">
              <div
                key={pageKey}
                className="transition-all duration-500 ease-in-out transform opacity-0 animate-fadeIn"
              >
                {renderCards(paginate(filteredNeedMyAction), "need-action")}
              </div>
              <Pagination
                currentPage={currentPage}
                totalItems={filteredNeedMyAction.length}
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
            <DialogContent className="w-full max-w-md mx-4 rounded-lg">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
                  <RotateCcw className="w-5 h-5" />
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
                  {selectedAppt && courses[selectedAppt.courseId]?.endDate && (
                    <p className="text-xs text-gray-500 mt-2">
                      Available until:{" "}
                      {formatLocalDate(courses[selectedAppt.courseId].endDate)}
                    </p>
                  )}
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
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
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
      </div>
    </>
  );
}
