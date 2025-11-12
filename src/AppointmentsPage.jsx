import React, { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./components/ui/card";
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
  DialogDescription,
} from "./components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./components/ui/tabs";
import { Textarea } from "./components/ui/textarea";
import { Star } from "lucide-react";
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Your Review" : "Rate Your Session"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update your review for the session with"
              : "Share your experience with"}{" "}
            {appointment?.teacher?.fullName}
          </DialogDescription>
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
              className="resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors duration-200"
            />
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-3 sm:gap-2 mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            className="w-full sm:w-auto px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-400 transition-all duration-200 transform hover:scale-105"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
            className="w-full sm:w-auto px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
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

// Pagination component with Next/Prev
function Pagination({ currentPage, totalItems, itemsPerPage, onPageChange }) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (totalPages <= 1) return null;

  return (
    <div className="flex gap-2 justify-center mt-4">
      <button
        className={`px-4 py-2 rounded-lg text-white transition-all duration-300 transform hover:scale-105 ${
          currentPage === 1
            ? "bg-gray-400 cursor-not-allowed hover:scale-100"
            : "bg-black hover:bg-gray-800 hover:shadow-lg"
        }`}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Previous
      </button>

      <button className="px-4 py-2 rounded-lg bg-black text-white cursor-default shadow-lg">
        {currentPage}
      </button>

      <button
        className={`px-4 py-2 rounded-lg text-white transition-all duration-300 transform hover:scale-105 ${
          currentPage === totalPages
            ? "bg-gray-400 cursor-not-allowed hover:scale-100"
            : "bg-black hover:bg-gray-800 hover:shadow-lg"
        }`}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next
      </button>
    </div>
  );
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [ratings, setRatings] = useState({});
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [newDate, setNewDate] = useState(null);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [newTime, setNewTime] = useState("");
  const [activeTab, setActiveTab] = useState("received");

  // Rating states
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [selectedApptForRating, setSelectedApptForRating] = useState(null);
  const [existingRatingForAppt, setExistingRatingForAppt] = useState(null);

  // Pagination
  const itemsPerPage = 6;
  const [currentPage, setCurrentPage] = useState(1);
  const [pageKey, setPageKey] = useState(0);

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
      console.log(updatedAppointments);
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
      if (res.ok) setUserId(data.data.user._id);
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

      // Refresh ratings
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

    // generate full list first
    let times = generateTimeSlots(dayData.start, dayData.end);

    // if same-day selection, remove past times
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

  if (loading || userId === null)
    return <p className="text-center mt-6">Loading appointments...</p>;

  const requestedAppointments = appointments.filter(
    (a) => a.student._id === userId
  );
  const receivedAppointments = appointments.filter(
    (a) => a.teacher._id === userId
  );

  const statusOrder = { pending: 1, confirmed: 2, completed: 3, canceled: 4 };
  const requestedAppointmentsSorted = [...requestedAppointments].sort(
    (a, b) => statusOrder[a.status] - statusOrder[b.status]
  );
  const receivedAppointmentsSorted = [...receivedAppointments].sort(
    (a, b) => statusOrder[a.status] - statusOrder[b.status]
  );

  const paginate = (list) => {
    const start = (currentPage - 1) * itemsPerPage;
    return list.slice(start, start + itemsPerPage);
  };

  const renderCards = (list, isTeacherView) =>
    list.length === 0 ? (
      <p className="text-center text-gray-500 mt-8">No appointments found.</p>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {list.map((appt) => {
          const existingRating = ratings[appt._id];
          const canRate =
            !isTeacherView &&
            appt.status === "completed" &&
            appt.student._id === userId;
          const hasRated = !!existingRating;

          return (
            <Card
              key={appt._id}
              className="flex flex-col justify-between h-full p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 bg-white dark:bg-gray-800 border border-gray-200 hover:border-blue-300"
            >
              <div className="flex-1">
                <CardHeader className="flex items-center gap-4 p-0 mb-3">
                  <img
                    src={`${API_BASE_URL}/user_avatar/${
                      isTeacherView ? appt.student.avatar : appt.teacher.avatar
                    }`}
                    alt={
                      isTeacherView
                        ? appt.student.fullName
                        : appt.teacher.fullName
                    }
                    className="w-16 h-16 rounded-full object-cover border-2 border-blue-500 hover:border-blue-600 transition-colors duration-200"
                  />
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg font-semibold truncate hover:text-blue-600 transition-colors duration-200">
                      {isTeacherView
                        ? appt.student.fullName
                        : appt.teacher.fullName}
                    </CardTitle>

                    {/* Display rating if it exists */}
                    {!isTeacherView && existingRating && (
                      <div className="flex items-center gap-2 mt-1">
                        <StarRating rating={existingRating.rating} size="sm" />
                        <span className="text-xs text-gray-500">
                          You rated this session
                        </span>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-0 space-y-2">
                  <p className="hover:text-gray-700 transition-colors duration-200">
                    <strong>Date:</strong> {new Date(appt.date).toDateString()}
                  </p>
                  <p className="hover:text-gray-700 transition-colors duration-200">
                    <strong>Time:</strong> {appt.time}
                  </p>
                  <p>
                    <strong>Status:</strong>{" "}
                    <span
                      className={`font-semibold transition-colors duration-200 ${
                        appt.status === "pending"
                          ? "text-yellow-500 hover:text-yellow-600"
                          : appt.status === "confirmed"
                          ? "text-green-500 hover:text-green-600"
                          : appt.status === "completed"
                          ? "text-blue-500 hover:text-blue-600"
                          : "text-red-500 hover:text-red-600"
                      }`}
                    >
                      {appt.status.toUpperCase()}
                    </span>
                  </p>

                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-600 mb-1 hover:text-gray-700 transition-colors duration-200">
                      {isTeacherView ? "Learning Skills" : "Teaching Skills"}
                    </p>

                    {(() => {
                      const rawSkills = isTeacherView
                        ? appt.student?.learningSkills
                        : appt.teacher?.teachingSkills;

                      if (!rawSkills || rawSkills.length === 0)
                        return (
                          <span className="text-gray-400 text-sm italic">
                            Not specified
                          </span>
                        );

                      let skillsArray = [];

                      if (Array.isArray(rawSkills)) {
                        skillsArray = rawSkills.map((s) =>
                          typeof s === "object" && s.name ? s.name : String(s)
                        );
                      } else if (typeof rawSkills === "string") {
                        skillsArray = rawSkills
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean);
                      }

                      return (
                        <div className="flex flex-wrap gap-2">
                          {skillsArray.map((skill, i) => (
                            <span
                              key={i}
                              className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full hover:bg-blue-200 hover:text-blue-800 transition-all duration-200 transform hover:scale-105"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Show review if it exists */}
                  {!isTeacherView &&
                    existingRating?.review &&
                    existingRating.review !== "No review provided." && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors duration-200">
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          Your Review:
                        </p>
                        <p className="text-sm text-gray-600 italic">
                          "{existingRating.review}"
                        </p>
                      </div>
                    )}
                </CardContent>
              </div>

              {/* Buttons aligned bottom */}
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {isTeacherView && appt.status === "pending" && (
                  <>
                    <Button
                      className="bg-green-500 hover:bg-green-600 text-white flex-1 min-w-[110px] transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                      onClick={() => handleConfirm(appt._id)}
                    >
                      Confirm
                    </Button>
                    <Button
                      variant="outline"
                      className="text-red-500 border-red-500 hover:bg-red-50 hover:text-red-600 hover:border-red-600 flex-1 min-w-[110px] transform hover:scale-105 transition-all duration-200"
                      onClick={() => handleCancel(appt._id)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="outline"
                      className="text-blue-500 border-blue-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-600 flex-1 min-w-[110px] transform hover:scale-105 transition-all duration-200"
                      onClick={() => handleRescheduleClick(appt)}
                    >
                      Change Timeslot
                    </Button>
                  </>
                )}

                {(appt.status === "confirmed" ||
                  (!isTeacherView && appt.status === "pending")) && (
                  <>
                    <Button
                      variant="outline"
                      className="text-red-500 border-red-500 hover:bg-red-50 hover:text-red-600 hover:border-red-600 flex-1 min-w-[110px] transform hover:scale-105 transition-all duration-200"
                      onClick={() => handleCancel(appt._id)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="outline"
                      className="text-blue-500 border-blue-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-600 flex-1 min-w-[110px] transform hover:scale-105 transition-all duration-200"
                      onClick={() => handleRescheduleClick(appt)}
                    >
                      Change Timeslot
                    </Button>
                  </>
                )}

                {/* Rate/Edit Review Button for completed student appointments */}
                {canRate && (
                  <Button
                    className={`flex-1 min-w-[110px] transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl ${
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

  return (
    <>
      <div className="p-4 change-appt-px md:p-6">
        <h1 className="text-2xl font-semibold mb-6">My Appointments</h1>

        <Tabs
          value={activeTab}
          onValueChange={(val) => {
            setActiveTab(val);
            setCurrentPage(1); // reset pagination
            setPageKey((prev) => prev + 1); // refresh fade animation
          }}
          className="w-full"
        >
          {" "}
          <TabsList className="flex justify-center mb-6">
            <TabsTrigger
              value="received"
              className="px-6 py-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all duration-200 hover:scale-105"
            >
              Received from Students
            </TabsTrigger>
            <TabsTrigger
              value="requested"
              className="px-6 py-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all duration-200 hover:scale-105"
            >
              Requested by Me
            </TabsTrigger>
          </TabsList>
          <TabsContent value="received">
            <div
              key={pageKey}
              className="transition-all duration-500 ease-in-out transform opacity-0 animate-fadeIn"
            >
              {renderCards(paginate(receivedAppointmentsSorted), true)}
            </div>

            <Pagination
              currentPage={currentPage}
              totalItems={receivedAppointmentsSorted.length}
              itemsPerPage={itemsPerPage}
              onPageChange={(page) => {
                setCurrentPage(page);
                setPageKey((prev) => prev + 1);
              }}
            />
          </TabsContent>
          <TabsContent value="requested">
            <div
              key={pageKey}
              className="transition-all duration-500 ease-in-out transform opacity-0 animate-fadeIn"
            >
              {renderCards(paginate(requestedAppointmentsSorted), false)}
            </div>

            <Pagination
              currentPage={currentPage}
              totalItems={requestedAppointmentsSorted.length}
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
          <DialogContent className="w-full sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Change timeslot</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="font-medium mb-2 block">
                  Select New Date
                </label>
                <Calendar
                  mode="single"
                  selected={newDate}
                  onSelect={handleDateSelect}
                  className="rounded-md border shadow-sm w-full hover:border-blue-500 transition-colors duration-200"
                  disabled={isDateDisabled}
                />
              </div>

              {newDate &&
                (availableTimes.length > 0 ? (
                  <div>
                    <label className="font-medium mb-2 block">
                      Available Times
                    </label>
                    <Select onValueChange={setNewTime} value={newTime}>
                      <SelectTrigger className="w-full hover:border-blue-500 transition-colors duration-200">
                        <SelectValue placeholder="Select a time" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTimes.map((time) => (
                          <SelectItem
                            key={time}
                            value={time}
                            className="hover:bg-blue-50 cursor-pointer transition-colors duration-200"
                          >
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">
                    Teacher is not available on this day.
                  </p>
                ))}
            </div>

            <DialogFooter className="mt-4 flex flex-col sm:flex-row gap-3 sm:gap-2">
              <Button
                variant="outline"
                onClick={() => setOpenModal(false)}
                className="w-full sm:w-auto px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-400 transition-all duration-200 transform hover:scale-105"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRescheduleConfirm}
                disabled={!newTime || !newDate}
                className="w-full sm:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
              >
                Confirm Reschedule
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
