import React, { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Textarea } from "./components/ui/textarea";
import { Badge } from "./components/ui/badge";
import { Progress } from "./components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "./components/ui/select";
import { Calendar } from "./components/ui/calendar";
import {
  ChevronDown,
  ChevronRight,
  Upload,
  Calendar as CalendarIcon,
  FileText,
  Image,
  Users,
  CheckCircle,
  Plus,
  Trash2,
  Download,
  Edit3,
  BookOpen,
  User,
  Users as UsersIcon,
  Clock,
  Ban,
  GraduationCap,
  Book,
  UserCheck,
  Eye,
  RotateCcw,
  ExternalLink,
} from "lucide-react";
import { useParams, useNavigate } from "react-router";
import { getToken, getUserId } from "./ManageToken";
import { API_BASE_URL } from "./Config";

export default function CoursePage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [activeTab, setActiveTab] = useState("myLearning");
  const [expandedWeeks, setExpandedWeeks] = useState(new Set());
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [weekDialogOpen, setWeekDialogOpen] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    file: null,
    week: 1,
  });
  const [weekForm, setWeekForm] = useState({
    title: "",
    description: "",
    weekNumber: 1,
  });
  const [isEditingWeek, setIsEditingWeek] = useState(false);

  // Appointment booking state
  const [openAppointmentModal, setOpenAppointmentModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newDate, setNewDate] = useState(null);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [newTime, setNewTime] = useState("");
  const [appointmentForm, setAppointmentForm] = useState({
    title: "",
    description: "",
  });

  // Load course data
  useEffect(() => {
    if (courseId) {
      fetchCourseDetails();
    } else {
      toast.error("Course ID not found");
    }
  }, [courseId]);

  const fetchCourseDetails = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
        headers: { auth: getToken() },
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to fetch course");

      setCourse(data.data.course);
      setExpandedWeeks(new Set([1]));
    } catch (err) {
      toast.error(err.message);
    }
  };

  const isCurrentUserUserA = course?.userA._id === getUserId();

  // Get the other user in the course
  const getOtherUser = () => {
    if (!course) return null;
    return isCurrentUserUserA ? course.userB : course.userA;
  };

  // Check if current user is the teacher
  const isCurrentUserTeacher = () => {
    if (!course) return false;

    if (course.exchangeType === "mutual") {
      // In mutual exchange, both are teachers for their respective parts
      return activeTab === "myTeaching";
    } else {
      // In one-way exchange, teacher is the one who did NOT check "just want to learn"
      return course.proposedBy._id !== getUserId();
    }
  };

  // Check if current user is the student
  const isCurrentUserStudent = () => {
    if (!course) return false;

    if (course.exchangeType === "mutual") {
      // In mutual exchange, both are students for their respective parts
      return activeTab === "myLearning";
    } else {
      // In one-way exchange, student is the one who checked "just want to learn"
      return course.proposedBy._id === getUserId();
    }
  };

  // Get teacher user
  const getTeacherUser = () => {
    if (!course) return null;

    if (course.exchangeType === "mutual") {
      // In mutual exchange, teacher depends on current context
      if (activeTab === "myLearning") {
        // When learning, the other user is the teacher
        return isCurrentUserUserA ? course.userB : course.userA;
      } else {
        // When teaching, current user is the teacher
        return isCurrentUserUserA ? course.userA : course.userB;
      }
    } else {
      // In one-way exchange, teacher is the one who did NOT propose

      const value =
        course.proposedBy._id === course.userA._id
          ? course.userB
          : course.userA;
      console.log(value);

      return value;
    }
  };

  // Get student user
  const getStudentUser = () => {
    if (!course) return null;

    if (course.exchangeType === "mutual") {
      // In mutual exchange, student depends on current context
      if (activeTab === "myLearning") {
        // When learning, current user is the student
        return isCurrentUserUserA ? course.userA : course.userB;
      } else {
        // When teaching, the other user is the student
        return isCurrentUserUserA ? course.userB : course.userA;
      }
    } else {
      // In one-way exchange, student is the one who proposed
      return course.proposedBy._id === course.userA._id
        ? course.userA
        : course.userB;
    }
  };

  // FIXED: Determine which weekly structure to show based on active tab
  const getCurrentWeeklyStructure = () => {
    if (!course) return [];

    let existingStructure = [];

    if (course.exchangeType === "mutual") {
      // FIXED: Corrected the logic for mutual exchange
      // - Learning tab: show userAWeeklyStructure when userB is learning (and vice versa)
      // - Teaching tab: show userAWeeklyStructure when userA is teaching (and vice versa)
      if (activeTab === "myLearning") {
        // When user is learning, they see the OTHER user's structure
        existingStructure = isCurrentUserUserA
          ? course.userBWeeklyStructure // UserA learns from UserB's structure
          : course.userAWeeklyStructure; // UserB learns from UserA's structure
      } else {
        // When user is teaching, they see their OWN structure
        existingStructure = isCurrentUserUserA
          ? course.userAWeeklyStructure // UserA teaches their own structure
          : course.userBWeeklyStructure; // UserB teaches their own structure
      }
    } else {
      // One-way exchange:
      // - Teacher sees their own structure (what they're teaching)
      // - Student sees teacher's structure (what they're learning)
      if (isCurrentUserTeacher()) {
        existingStructure = isCurrentUserUserA
          ? course.userAWeeklyStructure
          : course.userBWeeklyStructure;
      } else {
        existingStructure = isCurrentUserUserA
          ? course.userBWeeklyStructure
          : course.userAWeeklyStructure;
      }
    }

    // If the structure is empty (can happen in one-way for student), return empty array
    if (!existingStructure || existingStructure.length === 0) {
      return [];
    }

    return existingStructure;
  };

  // Get the teaching skill for current context
  const getTeachingSkill = () => {
    if (!course) return "";

    if (course.exchangeType === "mutual") {
      if (activeTab === "myLearning") {
        // When learning, show what the other user is teaching you
        return isCurrentUserUserA
          ? course.userBTeaching.skill
          : course.userATeaching.skill;
      } else {
        // When teaching, show what you are teaching
        return isCurrentUserUserA
          ? course.userATeaching.skill
          : course.userBTeaching.skill;
      }
    } else {
      // One-way exchange: always show what the teacher is teaching
      return isCurrentUserTeacher()
        ? isCurrentUserUserA
          ? course.userATeaching.skill
          : course.userBTeaching.skill
        : isCurrentUserUserA
        ? course.userBTeaching.skill
        : course.userATeaching.skill;
    }
  };

  // FIXED: Get progress for current context - CORRECTED LOGIC
  const getCurrentProgress = () => {
    if (!course) return 0;

    if (course.exchangeType === "mutual") {
      // FIXED: Corrected progress logic for mutual exchange
      if (activeTab === "myLearning") {
        // Learning progress: userA sees userA progress, userB sees userB progress
        return isCurrentUserUserA
          ? course.progress.userA // UserA's learning progress
          : course.progress.userB; // UserB's learning progress
      } else {
        // Teaching progress: userA sees userB progress (how much userB has learned from userA), userB sees userA progress
        return isCurrentUserUserA
          ? course.progress.userB // How much userB has learned from userA (userA's teaching effectiveness)
          : course.progress.userA; // How much userA has learned from userB (userB's teaching effectiveness)
      }
    } else {
      // One-way exchange: student sees their learning progress, teacher sees teaching progress
      if (isCurrentUserStudent()) {
        return isCurrentUserUserA
          ? course.progress.userA
          : course.progress.userB;
      } else {
        return isCurrentUserUserA
          ? course.progress.userB
          : course.progress.userA;
      }
    }
  };

  // Get progress label for current context
  const getProgressLabel = () => {
    if (!course) return "";

    if (course.exchangeType === "mutual") {
      return activeTab === "myLearning"
        ? "Learning Progress"
        : "Teaching Progress";
    } else {
      return isCurrentUserStudent() ? "Learning Progress" : "Teaching Progress";
    }
  };

  // Get role description for one-way exchange
  const getRoleDescription = () => {
    if (!course || course.exchangeType !== "one-way") return "";

    const teacherUser = getTeacherUser();
    const studentUser = getStudentUser();

    if (isCurrentUserTeacher()) {
      return `You are teaching ${getTeachingSkill()} to ${
        studentUser?.fullName
      }`;
    } else {
      return `You are learning ${getTeachingSkill()} from ${
        teacherUser?.fullName
      }`;
    }
  };

  // Calculate course end date based on start date and duration
  const getCourseEndDate = () => {
    if (!course?.startDate) return null;
    const startDate = new Date(course.startDate);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + course.duration * 7);
    return endDate;
  };

  // NEW: Calculate which week a date falls into
  const getWeekForDate = (date) => {
    if (!course?.startDate) return 1;

    const startDate = new Date(course.startDate);
    const appointmentDate = new Date(date);

    // Calculate difference in days
    const diffTime = appointmentDate - startDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Calculate week number (1-based)
    const weekNumber = Math.ceil(diffDays / 7);

    // Ensure week number is within course duration
    return Math.max(1, Math.min(weekNumber, course.duration));
  };

  // FIXED: Filter appointments to show only relevant ones based on current user role
  const filterAppointmentsForCurrentContext = (weekContent) => {
    if (!weekContent || !course) return weekContent;

    const currentUserId = getUserId();

    return weekContent.filter((item) => {
      if (item.type !== "appointment") return true;

      const appointmentData = getAppointmentDisplayData(item);

      // If we can't get proper appointment data, show it (fallback)
      if (
        !appointmentData ||
        !appointmentData.teacher ||
        !appointmentData.student
      ) {
        return true;
      }

      // For mutual exchange
      if (course.exchangeType === "mutual") {
        if (activeTab === "myLearning") {
          // In learning tab: show appointments where current user is student
          return (
            appointmentData.student._id === currentUserId ||
            appointmentData.student === currentUserId
          );
        } else {
          // In teaching tab: show appointments where current user is teacher
          return (
            appointmentData.teacher._id === currentUserId ||
            appointmentData.teacher === currentUserId
          );
        }
      } else {
        // For one-way exchange
        if (isCurrentUserStudent()) {
          // Student sees appointments where they are student
          return (
            appointmentData.student._id === currentUserId ||
            appointmentData.student === currentUserId
          );
        } else {
          // Teacher sees appointments where they are teacher
          return (
            appointmentData.teacher._id === currentUserId ||
            appointmentData.teacher === currentUserId
          );
        }
      }
    });
  };

  // FIXED: Format date and time properly for display
  const formatAppointmentDateTime = (dateString, timeString) => {
    try {
      // Parse the date (handling both YYYY-MM-DD and ISO string)
      let date;
      if (dateString.includes("T")) {
        date = new Date(dateString);
      } else {
        const [year, month, day] = dateString.split("-");
        date = new Date(year, month - 1, day);
      }

      // Format date as local date
      const formattedDate = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });

      // Format time (assuming HH:MM format)
      let formattedTime = timeString;
      if (timeString && timeString.includes(":")) {
        const [hours, minutes] = timeString.split(":");
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? "PM" : "AM";
        const displayHour = hour % 12 || 12;
        formattedTime = `${displayHour}:${minutes.padStart(2, "0")} ${ampm}`;
      }

      return `${formattedDate} • ${formattedTime}`;
    } catch (error) {
      console.error("Error formatting date/time:", error);
      return `${dateString} • ${timeString}`;
    }
  };

  // Appointment booking functions
  const getWeekday = (date) =>
    date.toLocaleDateString("en-US", { weekday: "long" });

  const generateTimeSlots = (start, end) => {
    const times = [];
    let [h, m] = start.split(":").map(Number);
    let [endH, endM] = end.split(":").map(Number);

    while (h < endH || (h === endH && m < endM)) {
      times.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
      m += 1;
      if (m >= 60) {
        h++;
        m -= 60;
      }
    }

    return times;
  };

  // FIXED: Enhanced date disabling logic
  const isDateDisabled = (date) => {
    if (!selectedUser || !selectedUser.availability) return true;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Disable dates before today
    if (date < today) return true;

    // Disable dates after course end date
    const courseEndDate = getCourseEndDate();
    if (courseEndDate && date > courseEndDate) return true;

    const weekday = getWeekday(date);
    const dayData = selectedUser.availability[weekday];
    return !dayData || dayData.off;
  };

  const handleDateSelect = (date) => {
    if (isDateDisabled(date)) return;
    setNewDate(date);

    const weekday = getWeekday(date);
    const dayData = selectedUser.availability[weekday];
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

    // Auto-select the week based on the chosen date
    const calculatedWeek = getWeekForDate(date);
    setSelectedWeek(calculatedWeek);
  };

  // Open appointment booking modal with correct roles
  const openAppointmentBookingModal = async () => {
    const otherUser = getOtherUser();
    if (!otherUser) return;

    try {
      const res = await fetch(
        `${API_BASE_URL}/courses/user/${otherUser._id}/availability`,
        {
          headers: { auth: getToken() },
        }
      );
      const data = await res.json();

      if (!res.ok)
        throw new Error(data.message || "Failed to fetch availability");

      setSelectedUser(data.data.user);
      setNewDate(null);
      setNewTime("");
      setAvailableTimes([]);

      // Set appointment title based on current role
      const isLearningTab = activeTab === "myLearning";
      const defaultTitle = isLearningTab
        ? `Learning Session - Week ${selectedWeek}`
        : `Teaching Session - Week ${selectedWeek}`;

      setAppointmentForm({
        title: defaultTitle,
        description: "",
      });
      setOpenAppointmentModal(true);
    } catch (err) {
      toast.error(err.message);
    }
  };

  // FIXED: Handle appointment booking with correct week assignment
  const handleBookAppointment = async () => {
    if (!newDate || !newTime || !appointmentForm.title) {
      toast.error("Select a date, time, and provide a title");
      return;
    }

    try {
      // Determine who is teacher and who is student based on current tab
      let teacherId, studentId;

      if (course.exchangeType === "mutual") {
        // In mutual exchange:
        // - Learning tab: other user is teacher, current user is student
        // - Teaching tab: current user is teacher, other user is student
        if (activeTab === "myLearning") {
          teacherId = getOtherUser()._id;
          studentId = getUserId();
        } else {
          teacherId = getUserId();
          studentId = getOtherUser()._id;
        }
      } else {
        teacherId = getTeacherUser()._id;
        studentId = getStudentUser()._id;
      }

      // Calculate the correct week based on the selected date
      const calculatedWeek = getWeekForDate(newDate);

      console.log("Booking appointment:", {
        date: newDate,
        calculatedWeek,
        courseDuration: course.duration,
      });

      // Step 1: Create the appointment (will be in "pending" status)
      const appointmentRes = await fetch(`${API_BASE_URL}/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          auth: getToken(),
        },
        body: JSON.stringify({
          teacher: teacherId,
          student: studentId,
          date: newDate.toISOString(),
          time: newTime,
          title: appointmentForm.title,
          description: appointmentForm.description,
          courseId: course._id,
          week: calculatedWeek, // Use calculated week instead of selectedWeek
        }),
      });

      const appointmentData = await appointmentRes.json();
      if (!appointmentRes.ok)
        throw new Error(
          appointmentData.message || "Failed to book appointment"
        );

      // Step 2: Add appointment to course week (but only show as pending)
      const courseRes = await fetch(
        `${API_BASE_URL}/courses/${courseId}/weeks/${calculatedWeek}/appointments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            auth: getToken(),
          },
          body: JSON.stringify({
            appointmentId: appointmentData.data.appointment._id,
            status: "pending",
          }),
        }
      );

      if (!courseRes.ok) {
        const courseData = await courseRes.json();
        throw new Error(
          courseData.message || "Failed to add appointment to course"
        );
      }

      toast.success("Appointment proposal sent! Waiting for acceptance.");
      setOpenAppointmentModal(false);
      setNewDate(null);
      setNewTime("");
      setAppointmentForm({ title: "", description: "" });
      fetchCourseDetails(); // Refresh course data
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Add this function to cancel pending appointments
  const cancelAppointment = async (appointmentId, weekNumber, contentId) => {
    try {
      // Update appointment status to cancelled
      const appointmentRes = await fetch(
        `${API_BASE_URL}/appointments/${appointmentId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            auth: getToken(),
          },
          body: JSON.stringify({
            status: "canceled",
          }),
        }
      );

      if (!appointmentRes.ok) {
        const data = await appointmentRes.json();
        throw new Error(data.message || "Failed to cancel appointment");
      }

      // Remove appointment from course content
      await deleteWeekContent(weekNumber, contentId);

      toast.success("Appointment cancelled successfully!");
    } catch (err) {
      toast.error(err.message);
    }
  };

  // NEW: Navigate to appointments page
  const navigateToAppointments = () => {
    navigate("/appointments");
  };

  const toggleWeek = (weekNumber) => {
    const newExpanded = new Set(expandedWeeks);
    if (newExpanded.has(weekNumber)) {
      newExpanded.delete(weekNumber);
    } else {
      newExpanded.add(weekNumber);
    }
    setExpandedWeeks(newExpanded);
  };

  // Enhanced file upload function with better error handling
  const handleUploadSubmit = async (e) => {
    e.preventDefault();

    if (!uploadForm.file) {
      toast.error("Please select a file");
      return;
    }

    // Check file size (10MB limit)
    if (uploadForm.file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    // FIXED: Determine correct structure type based on context
    let structureType;
    if (course.exchangeType === "mutual") {
      // FIXED: Corrected structure type logic
      if (activeTab === "myTeaching") {
        // When teaching, upload to your own structure
        structureType = isCurrentUserUserA ? "userA" : "userB";
      } else {
        // When learning, upload to the other user's structure (for them to see your submissions)
        structureType = isCurrentUserUserA ? "userB" : "userA";
      }
    } else {
      // One-way exchange
      if (isCurrentUserTeacher()) {
        structureType = isCurrentUserUserA ? "userA" : "userB";
      } else {
        structureType = isCurrentUserUserA ? "userB" : "userA";
      }
    }

    const formData = new FormData();
    formData.append("file", uploadForm.file);
    formData.append("title", uploadForm.title);
    formData.append("description", uploadForm.description);

    try {
      console.log("Uploading file:", {
        week: uploadForm.week,
        structureType,
        fileName: uploadForm.file.name,
      });

      const res = await fetch(
        `${API_BASE_URL}/courses/${courseId}/weeks/${uploadForm.week}/${structureType}/upload`,
        {
          method: "POST",
          headers: {
            auth: getToken(),
          },
          body: formData,
        }
      );

      const data = await res.json();

      if (!res.ok) {
        console.error("Upload failed:", data);
        throw new Error(data.message || "Failed to upload file");
      }

      toast.success("File uploaded successfully!");
      setUploadDialogOpen(false);
      setUploadForm({ title: "", description: "", file: null, week: 1 });
      fetchCourseDetails();
    } catch (err) {
      console.error("Upload error:", err);
      toast.error(err.message);
    }
  };

  const handleWeekSubmit = async (e) => {
    e.preventDefault();

    try {
      const structureType = isCurrentUserUserA ? "userA" : "userB";
      const res = await fetch(
        `${API_BASE_URL}/courses/${courseId}/weeks/${weekForm.weekNumber}/${structureType}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            auth: getToken(),
          },
          body: JSON.stringify({
            title: weekForm.title,
            description: weekForm.description,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update week");

      toast.success(
        isEditingWeek
          ? "Week updated successfully!"
          : "Week added successfully!"
      );
      setWeekDialogOpen(false);
      setWeekForm({ title: "", description: "", weekNumber: 1 });
      setIsEditingWeek(false);
      fetchCourseDetails();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const getFileIcon = (fileType, type) => {
    if (type === "appointment") {
      return <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />;
    }

    switch (fileType) {
      case "pdf":
        return <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />;
      case "doc":
      case "docx":
        return <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />;
      case "jpg":
      case "png":
      case "gif":
        return <Image className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />;
      default:
        return <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />;
    }
  };

  // FIXED: MARK WEEK AS COMPLETE - CORRECT LOGIC
  const markWeekComplete = async (weekNumber) => {
    try {
      let structureType;
      let progressType;

      if (course.exchangeType === "mutual") {
        if (activeTab === "myLearning") {
          // When in Learning tab: mark the OTHER user's structure as complete
          // This increases YOUR learning progress and THEIR teaching progress
          structureType = isCurrentUserUserA ? "userB" : "userA";
          progressType = "learning"; // For current user
        } else {
          // When in Teaching tab: mark YOUR OWN structure as complete
          // This increases YOUR teaching progress (when student marks it complete)
          structureType = isCurrentUserUserA ? "userA" : "userB";
          progressType = "teaching"; // For current user
        }
      } else {
        // One-way exchange
        if (isCurrentUserStudent()) {
          // Student marks teacher's structure as complete
          // Increases student's learning progress and teacher's teaching progress
          structureType = isCurrentUserUserA ? "userB" : "userA";
          progressType = "learning";
        } else {
          // Teacher marks their own structure as complete
          // Increases teacher's teaching progress (when student marks it)
          structureType = isCurrentUserUserA ? "userA" : "userB";
          progressType = "teaching";
        }
      }

      console.log("Marking week complete:", {
        courseId,
        weekNumber,
        structureType,
        progressType,
        isCurrentUserUserA,
        activeTab,
        context:
          course.exchangeType === "mutual"
            ? activeTab === "myLearning"
              ? "Learning"
              : "Teaching"
            : isCurrentUserStudent()
            ? "Learning"
            : "Teaching",
      });

      const res = await fetch(
        `${API_BASE_URL}/courses/${courseId}/weeks/${weekNumber}/${structureType}/complete`,
        {
          method: "PATCH",
          headers: {
            auth: getToken(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            progressType: progressType,
            userId: getUserId(),
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to mark week as complete");
      }

      toast.success(`Week ${weekNumber} marked as complete!`);
      fetchCourseDetails();
    } catch (err) {
      console.error("Mark week complete error:", err);
      toast.error(err.message);
    }
  };

  // FIXED: UNDO WEEK COMPLETE - CORRECT LOGIC
  const unmarkWeekComplete = async (weekNumber) => {
    try {
      let structureType;
      let progressType;

      if (course.exchangeType === "mutual") {
        if (activeTab === "myLearning") {
          structureType = isCurrentUserUserA ? "userB" : "userA";
          progressType = "learning";
        } else {
          structureType = isCurrentUserUserA ? "userA" : "userB";
          progressType = "teaching";
        }
      } else {
        if (isCurrentUserStudent()) {
          structureType = isCurrentUserUserA ? "userB" : "userA";
          progressType = "learning";
        } else {
          structureType = isCurrentUserUserA ? "userA" : "userB";
          progressType = "teaching";
        }
      }

      console.log("Unmarking week complete:", {
        courseId,
        weekNumber,
        structureType,
        progressType,
        context:
          course.exchangeType === "mutual"
            ? activeTab === "myLearning"
              ? "Learning"
              : "Teaching"
            : isCurrentUserStudent()
            ? "Learning"
            : "Teaching",
      });

      const res = await fetch(
        `${API_BASE_URL}/courses/${courseId}/weeks/${weekNumber}/${structureType}/incomplete`,
        {
          method: "PATCH",
          headers: {
            auth: getToken(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            progressType: progressType,
            userId: getUserId(),
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to unmark week as complete");
      }

      toast.success(`Week ${weekNumber} marked as incomplete!`);
      fetchCourseDetails();
    } catch (err) {
      console.error("Unmark week complete error:", err);
      toast.error(err.message);
    }
  };

  const editWeek = (week) => {
    setWeekForm({
      title: week.title,
      description: week.description,
      weekNumber: week.weekNumber,
    });
    setIsEditingWeek(true);
    setWeekDialogOpen(true);
  };

  const deleteWeekContent = async (weekNumber, contentId) => {
    try {
      const structureType = isCurrentUserUserA ? "userA" : "userB";
      const res = await fetch(
        `${API_BASE_URL}/courses/${courseId}/weeks/${weekNumber}/${structureType}/content/${contentId}`,
        {
          method: "DELETE",
          headers: { auth: getToken() },
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete content");

      toast.success("Content deleted successfully!");
      fetchCourseDetails();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Enhanced download function that forces immediate download
  const downloadFile = async (fileUrl, fileName) => {
    try {
      const fullUrl = fileUrl.startsWith("http")
        ? fileUrl
        : `${API_BASE_URL}${fileUrl}`;

      console.log("Downloading file from:", fullUrl);

      // Fetch the file as a blob
      const response = await fetch(fullUrl, {
        headers: {
          auth: getToken(),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to download file");
      }

      // Convert response to blob
      const blob = await response.blob();

      // Create a temporary URL for the blob
      const blobUrl = window.URL.createObjectURL(blob);

      // Create a temporary anchor element to trigger download
      const link = document.createElement("a");
      link.href = blobUrl;

      // Extract filename from URL or use provided filename
      const filename = fileName || fileUrl.split("/").pop() || "download";
      link.download = filename;

      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the blob URL
      window.URL.revokeObjectURL(blobUrl);

      toast.success("File download started!");
    } catch (err) {
      console.error("Download error:", err);
      toast.error("Failed to download file");

      // Fallback: open in new tab if download fails
      const fullUrl = fileUrl.startsWith("http")
        ? fileUrl
        : `${API_BASE_URL}${fileUrl}`;
      window.open(fullUrl, "_blank");
    }
  };

  // View file function - opens in new tab for preview
  const viewFile = (fileUrl) => {
    const fullUrl = fileUrl.startsWith("http")
      ? fileUrl
      : `${API_BASE_URL}${fileUrl}`;
    console.log("Viewing file:", fullUrl);
    // Open in new tab for viewing/preview
    window.open(fullUrl, "_blank", "noopener,noreferrer");
  };

  // Check if file is viewable in browser (images, PDFs)
  const isViewableFile = (fileType) => {
    const viewableTypes = ["pdf", "jpg", "jpeg", "png", "gif", "webp"];
    return viewableTypes.includes(fileType?.toLowerCase());
  };

  // FIXED: Get appointment display data - handles both old and new structure properly
  const getAppointmentDisplayData = (item) => {
    // If appointmentId is populated (new structure)
    if (item.appointmentId && typeof item.appointmentId === "object") {
      return {
        title: item.appointmentId.title,
        date: item.appointmentId.date,
        time: item.appointmentId.time,
        status: item.appointmentId.status,
        teacher: item.appointmentId.teacher,
        student: item.appointmentId.student,
        description: item.appointmentId.description,
      };
    }
    // If using old structure (fallback) or if appointmentId is not properly populated
    return {
      title: item.title || "Appointment",
      date: item.date,
      time: item.time,
      status: item.status,
      teacher: item.teacher,
      student: item.student,
      description: item.description,
    };
  };

  if (!course) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const currentWeeklyStructure = getCurrentWeeklyStructure();
  const currentTeachingSkill = getTeachingSkill();
  const currentProgress = getCurrentProgress();
  const progressLabel = getProgressLabel();
  const courseEndDate = getCourseEndDate();
  const otherUser = getOtherUser();
  const teacherUser = getTeacherUser();
  const studentUser = getStudentUser();

  // Check if course is pending
  const isCoursePending = course.status === "pending";

  // Check if current user can make appointments (both users can make appointments with each other)
  const canMakeAppointments =
    otherUser && getUserId() !== otherUser._id && !isCoursePending;

  // For one-way exchange, determine roles
  const isOneWay = course.exchangeType === "one-way";
  const isTeacher = isCurrentUserTeacher();
  const isStudent = isCurrentUserStudent();

  // Determine if user can upload files
  const canUploadFiles =
    (isOneWay && isTeacher) || (!isOneWay && activeTab === "myTeaching");

  // Check if current structure has any weeks to display
  const hasWeeklyStructure =
    currentWeeklyStructure && currentWeeklyStructure.length > 0;

  return (
    <>
      {/* FIXED: Modern Header - Made Responsive */}
      <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white">
        <div className="px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
          <div className="flex flex-col xl:flex-row gap-4 lg:gap-6 xl:gap-8">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 mb-2 sm:mb-3 flex-wrap">
                <Badge
                  variant="secondary"
                  className="bg-white/20 text-white border-0 text-xs px-2 py-1"
                >
                  {course.duration} {course.duration === 1 ? "week" : "weeks"}
                </Badge>
                <Badge
                  variant="secondary"
                  className={`
                    text-xs px-2 py-1
                    ${
                      course.status === "active"
                        ? "bg-green-500"
                        : course.status === "pending"
                        ? "bg-yellow-500"
                        : "bg-gray-500"
                    } text-white border-0
                  `}
                >
                  {course.status.charAt(0).toUpperCase() +
                    course.status.slice(1)}
                </Badge>
                <Badge
                  variant="secondary"
                  className={`text-white border-0 text-xs px-2 py-1 ${
                    isOneWay ? "bg-purple-500" : "bg-orange-500"
                  }`}
                >
                  {isOneWay ? (
                    <div className="flex items-center gap-1">
                      <UserCheck className="w-3 h-3" />
                      <span>One-Way Learning</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>Mutual Exchange</span>
                    </div>
                  )}
                </Badge>
              </div>

              <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold mb-2 sm:mb-3 leading-tight break-words">
                {course.title}
              </h1>
              <p className="text-blue-100 text-sm sm:text-base lg:text-lg xl:text-xl max-w-4xl leading-relaxed break-words">
                {course.description}
              </p>

              {/* Exchange Details - Made Responsive */}
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3 lg:gap-4 mt-3 sm:mt-4 text-xs sm:text-sm">
                {isOneWay ? (
                  // One-Way Exchange Layout
                  <>
                    <div className="flex items-center gap-1 sm:gap-2 min-w-0 bg-white/10 rounded-lg p-2 sm:p-3 flex-1 sm:flex-none">
                      <GraduationCap className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 text-green-300" />
                      <div className="min-w-0">
                        <div className="font-semibold text-green-300">
                          Teacher
                        </div>
                        <div className="truncate">{teacherUser?.fullName}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 min-w-0 bg-white/10 rounded-lg p-2 sm:p-3 flex-1 sm:flex-none">
                      <Book className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 text-blue-300" />
                      <div className="min-w-0">
                        <div className="font-semibold text-blue-300">
                          Student
                        </div>
                        <div className="truncate">{studentUser?.fullName}</div>
                      </div>
                    </div>
                  </>
                ) : (
                  // Mutual Exchange Layout
                  <>
                    <div className="flex items-center gap-1 sm:gap-2 min-w-0 bg-white/10 rounded-lg p-2 sm:p-3 flex-1 sm:flex-none">
                      <User className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="font-semibold">
                          {course.userA.fullName}
                        </div>
                        <div className="truncate text-blue-100">
                          {course.userATeaching.skill}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 min-w-0 bg-white/10 rounded-lg p-2 sm:p-3 flex-1 sm:flex-none">
                      <User className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="font-semibold">
                          {course.userB.fullName}
                        </div>
                        <div className="truncate text-blue-100">
                          {course.userBTeaching.skill}
                        </div>
                      </div>
                    </div>
                  </>
                )}
                {course.startDate && courseEndDate && (
                  <div className="flex items-center gap-1 sm:gap-2 min-w-0 bg-white/10 rounded-lg p-2 sm:p-3 flex-1 sm:flex-none">
                    <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="font-semibold">Course Dates</div>
                      <div className="truncate text-blue-100">
                        {new Date(course.startDate).toLocaleDateString()} -{" "}
                        {courseEndDate.toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* One-Way Role Indicator */}
              {isOneWay && (
                <div className="mt-3 sm:mt-4">
                  <Badge
                    variant="secondary"
                    className={`
                      text-xs px-3 py-1.5 border-0
                      ${
                        isTeacher
                          ? "bg-green-500/20 text-green-300 border border-green-500/30"
                          : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                      }
                    `}
                  >
                    <div className="flex items-center gap-1.5">
                      {isTeacher ? (
                        <>
                          <GraduationCap className="w-3 h-3" />
                          <span>You are the Teacher</span>
                        </>
                      ) : (
                        <>
                          <Book className="w-3 h-3" />
                          <span>You are the Student</span>
                        </>
                      )}
                    </div>
                  </Badge>
                </div>
              )}
            </div>

            {/* Progress Card - Made Responsive */}
            <Card className="bg-white/10 backdrop-blur-sm border-0 text-white w-full xl:w-80 mt-3 sm:mt-0 flex-shrink-0">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center justify-between mb-2 sm:mb-3 lg:mb-4">
                  <span className="font-semibold text-xs sm:text-sm lg:text-base">
                    {progressLabel}
                  </span>
                  <span className="text-lg sm:text-xl lg:text-2xl font-bold">
                    {currentProgress}%
                  </span>
                </div>
                <Progress
                  value={currentProgress}
                  className="h-1.5 sm:h-2 lg:h-3 bg-white/20"
                />
                <div className="grid grid-cols-1 gap-1.5 sm:gap-2 lg:gap-3 mt-2 sm:mt-3 lg:mt-4 text-xs">
                  <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                    <UsersIcon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="truncate text-xs sm:text-sm">
                      {course.userA.fullName} & {course.userB.fullName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                    <span className="truncate text-xs sm:text-sm">
                      {course.exchangeType === "mutual"
                        ? activeTab === "myLearning"
                          ? `Learning: ${currentTeachingSkill}`
                          : `Teaching: ${currentTeachingSkill}`
                        : isTeacher
                        ? `Teaching: ${currentTeachingSkill}`
                        : `Learning: ${currentTeachingSkill}`}
                    </span>
                  </div>
                </div>

                {/* Make Appointment Button - Show for both users when course is active */}
                {canMakeAppointments ? (
                  <Button
                    onClick={openAppointmentBookingModal}
                    className="w-full mt-3 bg-white/20 hover:bg-white/30 text-white border-white/30 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm py-2"
                    variant="outline"
                  >
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="truncate">Make Appointment</span>
                  </Button>
                ) : isCoursePending ? (
                  <div className="w-full mt-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-2 text-center">
                    <div className="flex items-center gap-1.5 justify-center text-yellow-200 text-xs">
                      <Ban className="w-3 h-3" />
                      <span>Course pending - features disabled</span>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Tab Navigation - Only show for mutual exchange */}
      {course.exchangeType === "mutual" && (
        <div className="bg-white border-b">
          <div className="max-w-7xl px-3 sm:px-4 lg:px-6">
            <div className="flex overflow-x-auto scrollbar-hide -mb-px">
              <button
                onClick={() => setActiveTab("myLearning")}
                className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap flex-shrink-0 min-w-0 ${
                  activeTab === "myLearning"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">My Learning</span>
                <Badge
                  variant="secondary"
                  className="ml-1 bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5"
                >
                  {/* Show what you're learning (other user's skill) */}
                  {isCurrentUserUserA
                    ? course.userBTeaching.skill
                    : course.userATeaching.skill}
                </Badge>
              </button>
              <button
                onClick={() => setActiveTab("myTeaching")}
                className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap flex-shrink-0 min-w-0 ${
                  activeTab === "myTeaching"
                    ? "border-green-500 text-green-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Users className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">My Teaching</span>
                <Badge
                  variant="secondary"
                  className="ml-1 bg-green-100 text-green-800 text-xs px-1.5 py-0.5"
                >
                  {/* Show what you're teaching (your own skill) */}
                  {isCurrentUserUserA
                    ? course.userATeaching.skill
                    : course.userBTeaching.skill}
                </Badge>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* One-Way Role Header */}
      {isOneWay && (
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
            <div className="flex items-center justify-center py-4">
              <div
                className={`flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-3 rounded-full ${
                  isTeacher
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-blue-50 text-blue-700 border border-blue-200"
                }`}
              >
                {isTeacher ? (
                  <>
                    <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="font-semibold text-sm sm:text-base">
                      {getRoleDescription()}
                    </span>
                  </>
                ) : (
                  <>
                    <Book className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="font-semibold text-sm sm:text-base">
                      {getRoleDescription()}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Bar - Show based on role and exchange type */}
      {canUploadFiles && !isCoursePending && (
        <div className="bg-white border-b">
          <div className="max-w-7xl px-3 sm:px-4 lg:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center py-3 sm:py-4 gap-2 sm:gap-3">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <Button
                  onClick={() => setUploadDialogOpen(true)}
                  className="flex items-center gap-1.5 sm:gap-2 bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm w-full sm:w-auto justify-center py-2 px-3 sm:px-4"
                  size="sm"
                >
                  <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Upload File</span>
                </Button>
              </div>
              <div className="text-xs sm:text-sm text-gray-600">
                {isOneWay ? (
                  <span>Add learning materials for your student</span>
                ) : (
                  <span>Add teaching materials for your exchange partner</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pending Course Warning */}
      {isCoursePending && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mx-3 sm:mx-4 lg:mx-6 mt-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Ban className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Course Pending:</strong> File upload and appointment
                features will be available once the course is active.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Course Content */}
      <div className="min-h-screen bg-gray-50/30 py-4 sm:py-6 lg:py-8">
        <div className="mx-3 sm:mx-4 lg:mx-6 space-y-3 sm:space-y-4 lg:space-y-6">
          {hasWeeklyStructure ? (
            currentWeeklyStructure.map((week) => {
              // Filter content to show only relevant appointments for current context
              const filteredContent = filterAppointmentsForCurrentContext(
                week.content
              );

              return (
                <div
                  key={week.weekNumber}
                  className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300"
                >
                  <div
                    className="p-4 sm:p-6 cursor-pointer hover:bg-gray-50/50 transition-colors"
                    onClick={() => toggleWeek(week.weekNumber)}
                  >
                    <div className="flex items-start justify-between gap-3 sm:gap-4">
                      <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                        <div
                          className={`
                            flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full mt-0.5 flex-shrink-0
                            ${
                              week.completed
                                ? "bg-green-100 text-green-600"
                                : (isOneWay && isTeacher) ||
                                  (!isOneWay && activeTab === "myTeaching")
                                ? "bg-orange-100 text-orange-600"
                                : "bg-blue-100 text-blue-600"
                            }
                          `}
                        >
                          {expandedWeeks.has(week.weekNumber) ? (
                            <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
                          ) : (
                            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2 lg:gap-3 mb-2 sm:mb-3">
                            <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 break-words leading-tight">
                              Week {week.weekNumber}: {week.title}
                            </h3>
                            <div className="flex gap-1 sm:gap-2 flex-wrap">
                              {week.completed && (
                                <Badge className="bg-green-500 text-white flex-shrink-0 text-xs px-2 py-0.5">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Completed
                                </Badge>
                              )}
                              {((isOneWay && isTeacher) ||
                                (!isOneWay && activeTab === "myTeaching")) &&
                                !week.completed && (
                                  <Badge className="bg-orange-500 text-white flex-shrink-0 text-xs px-2 py-0.5">
                                    {isOneWay ? "Teaching" : "Teaching"}
                                  </Badge>
                                )}
                              {((isOneWay && isStudent) ||
                                (!isOneWay && activeTab === "myLearning")) &&
                                !week.completed && (
                                  <Badge className="bg-blue-500 text-white flex-shrink-0 text-xs px-2 py-0.5">
                                    Learning
                                  </Badge>
                                )}
                            </div>
                          </div>
                          <p className="text-gray-600 text-sm sm:text-base leading-relaxed break-words">
                            {week.description}
                          </p>

                          {/* Week Stats */}
                          <div className="flex items-center gap-3 sm:gap-4 lg:gap-6 mt-2 text-xs sm:text-sm text-gray-500 flex-wrap">
                            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                              <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span>
                                {
                                  filteredContent.filter(
                                    (item) => item.type === "document"
                                  ).length
                                }{" "}
                                docs
                              </span>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                              <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span>
                                {
                                  filteredContent.filter(
                                    (item) => item.type === "appointment"
                                  ).length
                                }{" "}
                                Sessions
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons - UPDATED WITH CORRECT LOGIC */}
                      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        {canUploadFiles && !isCoursePending && (
                          <>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                editWeek(week);
                              }}
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-1 sm:gap-2 h-8 sm:h-9 px-2 sm:px-3"
                            >
                              <Edit3 className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span className="hidden sm:inline">Edit</span>
                            </Button>
                          </>
                        )}

                        {/* Show Complete/Undo Complete buttons based on completion status */}
                        {((isOneWay && isStudent) ||
                          (!isOneWay && activeTab === "myLearning")) &&
                          !isCoursePending && (
                            <>
                              {!week.completed ? (
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markWeekComplete(week.weekNumber);
                                  }}
                                  className="flex items-center gap-1 sm:gap-2 bg-green-600 hover:bg-green-700 text-white h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
                                  size="sm"
                                >
                                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                  <span className="hidden sm:inline">
                                    Complete
                                  </span>
                                </Button>
                              ) : (
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    unmarkWeekComplete(week.weekNumber);
                                  }}
                                  className="flex items-center gap-1 sm:gap-2 bg-gray-600 hover:bg-gray-700 text-white h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
                                  size="sm"
                                >
                                  <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
                                  <span className="hidden sm:inline">Undo</span>
                                </Button>
                              )}
                            </>
                          )}
                      </div>
                    </div>
                  </div>

                  {/* Expandable Content */}
                  <div
                    className={`
                      overflow-hidden transition-all duration-300 ease-in-out
                      ${
                        expandedWeeks.has(week.weekNumber)
                          ? "max-h-[2000px] opacity-100 border-t border-gray-200"
                          : "max-h-0 opacity-0"
                      }
                    `}
                  >
                    <div className="p-4 sm:p-6">
                      {/* Content Grid */}
                      <div className="mb-4 sm:mb-6">
                        {filteredContent.length === 0 ? (
                          <div className="text-center py-8 sm:py-12 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50/50">
                            <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                            <p className="text-gray-500 text-base sm:text-lg font-medium">
                              No content added yet for this week
                            </p>
                            <p className="text-gray-400 mt-1 sm:mt-2 text-sm sm:text-base">
                              {canUploadFiles
                                ? isCoursePending
                                  ? "Upload files will be available once course is active"
                                  : "Check back later for course materials"
                                : "Check back later for course materials"}
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                            {filteredContent.map((item) => {
                              const appointmentData =
                                item.type === "appointment"
                                  ? getAppointmentDisplayData(item)
                                  : null;

                              return (
                                <Card
                                  key={item.id}
                                  className="hover:shadow-lg transition-all duration-200 border border-gray-200"
                                >
                                  <CardContent className="p-3 sm:p-4">
                                    <div className="flex items-start gap-2 sm:gap-3">
                                      {getFileIcon(item.fileType, item.type)}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                          <h4 className="font-semibold text-gray-900 break-words text-sm sm:text-base">
                                            {item.type === "appointment"
                                              ? appointmentData?.title ||
                                                "Appointment"
                                              : item.title}
                                          </h4>
                                          {item.type === "appointment" &&
                                            appointmentData && (
                                              <Badge
                                                variant={
                                                  appointmentData.status ===
                                                  "confirmed"
                                                    ? "default"
                                                    : appointmentData.status ===
                                                      "pending"
                                                    ? "secondary"
                                                    : "destructive"
                                                }
                                                className="text-xs"
                                              >
                                                {appointmentData.status ===
                                                "confirmed"
                                                  ? "Confirmed"
                                                  : appointmentData.status ===
                                                    "pending"
                                                  ? "Pending"
                                                  : "Cancelled"}
                                              </Badge>
                                            )}
                                        </div>
                                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                                          {item.type === "appointment" &&
                                          appointmentData
                                            ? formatAppointmentDateTime(
                                                appointmentData.date,
                                                appointmentData.time
                                              )
                                            : `Uploaded ${item.uploadDate} • ${item.size}`}
                                        </p>
                                        {(item.description ||
                                          (item.type === "appointment" &&
                                            appointmentData?.description)) && (
                                          <p className="text-xs sm:text-sm text-gray-600 mt-2 line-clamp-2 break-words">
                                            {item.type === "appointment"
                                              ? appointmentData?.description
                                              : item.description}
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-between mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-gray-100">
                                      <div className="flex items-center gap-1 sm:gap-2">
                                        {item.type === "document" && (
                                          <>
                                            {/* View Button - only for viewable files */}
                                            {isViewableFile(item.fileType) && (
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-7 sm:h-8 text-xs"
                                                onClick={() =>
                                                  viewFile(item.fileUrl)
                                                }
                                              >
                                                <Eye className="w-3 h-3 mr-1" />
                                                View
                                              </Button>
                                            )}
                                            {/* Download Button - for all files */}
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="h-7 sm:h-8 text-xs"
                                              onClick={() =>
                                                downloadFile(
                                                  item.fileUrl,
                                                  item.title
                                                )
                                              }
                                            >
                                              <Download className="w-3 h-3 mr-1" />
                                              Download
                                            </Button>
                                          </>
                                        )}
                                        {item.type === "appointment" &&
                                          appointmentData && (
                                            <>
                                              {/* Manage Appointments Button */}
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-7 sm:h-8 text-xs"
                                                onClick={navigateToAppointments}
                                              >
                                                <ExternalLink className="w-3 h-3 mr-1" />
                                                Manage
                                              </Button>
                                            </>
                                          )}
                                      </div>
                                      {canUploadFiles &&
                                        !isCoursePending &&
                                        item.type === "document" && (
                                          <Button
                                            onClick={() =>
                                              deleteWeekContent(
                                                week.weekNumber,
                                                item.id
                                              )
                                            }
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 sm:h-8 sm:w-8 p-0 flex-shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                          >
                                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                          </Button>
                                        )}
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            // Show empty state when no weekly structure exists
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Weekly Structure Available
              </h3>
              <p className="text-gray-500">
                {isOneWay && isStudent
                  ? "Your teacher hasn't set up the course content yet."
                  : "Weekly structure will be available once the course is active."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Upload File Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-md w-[95vw] sm:w-full rounded-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg lg:text-xl">
              <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
              Upload File
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUploadSubmit}>
            <div className="space-y-3 sm:space-y-4 max-h-[60vh] overflow-y-auto px-1">
              {/* Week Selection Dropdown */}
              <div>
                <label className="block text-sm font-medium mb-1 sm:mb-2">
                  Select Week *
                </label>
                <Select
                  value={uploadForm.week.toString()}
                  onValueChange={(value) =>
                    setUploadForm({ ...uploadForm, week: parseInt(value) })
                  }
                >
                  <SelectTrigger className="w-full h-10 sm:h-12">
                    <SelectValue placeholder="Select a week" />
                  </SelectTrigger>
                  <SelectContent>
                    {hasWeeklyStructure ? (
                      currentWeeklyStructure.map((week) => (
                        <SelectItem
                          key={week.weekNumber}
                          value={week.weekNumber.toString()}
                        >
                          Week {week.weekNumber}: {week.title}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="1" disabled>
                        No weeks available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 sm:mb-2">
                  File Title *
                </label>
                <Input
                  value={uploadForm.title}
                  onChange={(e) =>
                    setUploadForm({ ...uploadForm, title: e.target.value })
                  }
                  placeholder="Enter file title"
                  required
                  className="text-sm sm:text-base h-10 sm:h-12"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 sm:mb-2">
                  Description
                </label>
                <Textarea
                  value={uploadForm.description}
                  onChange={(e) =>
                    setUploadForm({
                      ...uploadForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="File description"
                  rows={3}
                  className="text-sm sm:text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 sm:mb-2">
                  Select File *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 sm:p-4 lg:p-6 text-center hover:border-blue-400 transition-colors">
                  <Upload className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-gray-400 mx-auto mb-1 sm:mb-2" />
                  <p className="text-xs sm:text-sm text-gray-600">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PDF, DOC, JPG, PNG (Max 10MB)
                  </p>
                  <Input
                    type="file"
                    className="mt-2 sm:mt-3 lg:mt-4 text-xs sm:text-sm"
                    onChange={(e) =>
                      setUploadForm({ ...uploadForm, file: e.target.files[0] })
                    }
                    required
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="mt-4 sm:mt-6">
              <Button
                type="submit"
                className="w-full text-sm sm:text-base py-2 sm:py-3"
                disabled={!hasWeeklyStructure}
              >
                {hasWeeklyStructure
                  ? `Upload to Week ${uploadForm.week}`
                  : "No Weeks Available"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Week Dialog */}
      <Dialog open={weekDialogOpen} onOpenChange={setWeekDialogOpen}>
        <DialogContent className="max-w-md w-[95vw] sm:w-full mx-auto rounded-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg lg:text-xl">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
              {isEditingWeek
                ? `Edit Week ${weekForm.weekNumber}`
                : "Add New Week"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleWeekSubmit}>
            <div className="space-y-3 sm:space-y-4 max-h-[60vh] overflow-y-auto px-1">
              <div>
                <label className="block text-sm font-medium mb-1 sm:mb-2">
                  Week Title *
                </label>
                <Input
                  value={weekForm.title}
                  onChange={(e) =>
                    setWeekForm({ ...weekForm, title: e.target.value })
                  }
                  placeholder="Enter week title"
                  required
                  className="text-sm sm:text-base h-10 sm:h-12"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 sm:mb-2">
                  Description *
                </label>
                <Textarea
                  value={weekForm.description}
                  onChange={(e) =>
                    setWeekForm({
                      ...weekForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Week description and learning objectives"
                  rows={3}
                  required
                  className="text-sm sm:text-base"
                />
              </div>
            </div>
            <DialogFooter className="mt-4 sm:mt-6">
              <Button
                type="submit"
                className="w-full text-sm sm:text-base py-2 sm:py-3"
              >
                {isEditingWeek ? "Update Week" : "Add Week"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Make Appointment Modal */}
      <Dialog
        open={openAppointmentModal}
        onOpenChange={setOpenAppointmentModal}
      >
        <DialogContent className="w-[95vw] max-w-md sm:max-w-lg mx-auto rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg lg:text-xl">
              {course.exchangeType === "mutual"
                ? activeTab === "myLearning"
                  ? `Book Learning Session with ${selectedUser?.fullName}`
                  : `Book Teaching Session with ${selectedUser?.fullName}`
                : isCurrentUserTeacher()
                ? `Book Teaching Session with ${selectedUser?.fullName}`
                : `Book Learning Session with ${selectedUser?.fullName}`}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4 max-h-[60vh] overflow-y-auto px-1">
            <div>
              <label className="font-medium mb-1 sm:mb-2 block text-sm sm:text-base">
                Meeting Title *
              </label>
              <Input
                value={appointmentForm.title}
                onChange={(e) =>
                  setAppointmentForm({
                    ...appointmentForm,
                    title: e.target.value,
                  })
                }
                placeholder="Enter meeting title"
                required
                className="w-full"
              />
            </div>

            <div>
              <label className="font-medium mb-1 sm:mb-2 block text-sm sm:text-base">
                Description
              </label>
              <Textarea
                value={appointmentForm.description}
                onChange={(e) =>
                  setAppointmentForm({
                    ...appointmentForm,
                    description: e.target.value,
                  })
                }
                placeholder="Meeting agenda and objectives"
                rows={3}
                className="w-full"
              />
            </div>

            <div>
              <label className="font-medium mb-1 sm:mb-2 block text-sm sm:text-base">
                Select Date *
              </label>
              <div className="border rounded-md">
                <Calendar
                  mode="single"
                  selected={newDate}
                  onSelect={handleDateSelect}
                  className="w-full"
                  disabled={isDateDisabled}
                />
              </div>
              {courseEndDate && (
                <p className="text-xs text-gray-500 mt-2">
                  Course ends on {courseEndDate.toLocaleDateString()}.
                  Appointments can only be scheduled until this date.
                </p>
              )}
            </div>

            {newDate &&
              (availableTimes.length > 0 ? (
                <div>
                  <label className="font-medium mb-1 sm:mb-2 block text-sm sm:text-base">
                    Available Times
                  </label>
                  <Select onValueChange={setNewTime} value={newTime}>
                    <SelectTrigger className="w-full h-10 sm:h-12">
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
                  <p className="text-xs text-gray-500 mt-2">
                    This appointment will be scheduled for Week{" "}
                    {getWeekForDate(newDate)}
                  </p>
                </div>
              ) : (
                <p className="text-xs sm:text-sm text-gray-500 italic">
                  {selectedUser?.fullName} is not available on this day.
                </p>
              ))}
          </div>

          <DialogFooter className="mt-3 sm:mt-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              variant="outline"
              className="flex-1 hover:bg-gray-100 transition text-sm sm:text-base py-2 sm:py-3"
              onClick={() => setOpenAppointmentModal(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white transition text-sm sm:text-base py-2 sm:py-3"
              onClick={handleBookAppointment}
              disabled={!newTime || !newDate || !appointmentForm.title}
            >
              Make Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
