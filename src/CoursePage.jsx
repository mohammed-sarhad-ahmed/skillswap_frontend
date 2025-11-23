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
  DialogDescription,
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
  FileCheck,
  Award,
  Send,
  FileUp,
  ClipboardCheck,
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

  // Dialog states
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [weekDialogOpen, setWeekDialogOpen] = useState(false);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false);
  const [submissionsDialogOpen, setSubmissionsDialogOpen] = useState(false);
  const [openAppointmentModal, setOpenAppointmentModal] = useState(false);

  // Form states
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newDate, setNewDate] = useState(null);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [newTime, setNewTime] = useState("");

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

  const [assignmentForm, setAssignmentForm] = useState({
    title: "",
    description: "",
    instructions: "",
    dueDate: "",
    maxPoints: 100,
  });

  const [submitForm, setSubmitForm] = useState({
    files: [],
  });

  const [gradeForm, setGradeForm] = useState({
    points: "",
    feedback: "",
  });

  const [appointmentForm, setAppointmentForm] = useState({
    title: "",
    description: "",
  });

  const [isEditingWeek, setIsEditingWeek] = useState(false);

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

  // Helper functions
  const isCurrentUserUserA = course?.userA?._id === getUserId();

  const getOtherUser = () => {
    if (!course) return null;
    return isCurrentUserUserA ? course.userB : course.userA;
  };

  const isCurrentUserTeacher = () => {
    if (!course) return false;
    if (course.exchangeType === "mutual") {
      return activeTab === "myTeaching";
    } else {
      return course.proposedBy?._id !== getUserId();
    }
  };

  const isCurrentUserStudent = () => {
    if (!course) return false;
    if (course.exchangeType === "mutual") {
      return activeTab === "myLearning";
    } else {
      return course.proposedBy?._id === getUserId();
    }
  };

  const getTeacherUser = () => {
    if (!course) return null;
    if (course.exchangeType === "mutual") {
      if (activeTab === "myLearning") {
        return isCurrentUserUserA ? course.userB : course.userA;
      } else {
        return isCurrentUserUserA ? course.userA : course.userB;
      }
    } else {
      return course.proposedBy?._id === course.userA?._id
        ? course.userB
        : course.userA;
    }
  };

  const getStudentUser = () => {
    if (!course) return null;
    if (course.exchangeType === "mutual") {
      if (activeTab === "myLearning") {
        return isCurrentUserUserA ? course.userA : course.userB;
      } else {
        return isCurrentUserUserA ? course.userB : course.userA;
      }
    } else {
      return course.proposedBy?._id === course.userA?._id
        ? course.userA
        : course.userB;
    }
  };

  const getCurrentWeeklyStructure = () => {
    if (!course) return [];
    let existingStructure = [];

    if (course.exchangeType === "mutual") {
      if (activeTab === "myLearning") {
        existingStructure = isCurrentUserUserA
          ? course.userBWeeklyStructure || []
          : course.userAWeeklyStructure || [];
      } else {
        existingStructure = isCurrentUserUserA
          ? course.userAWeeklyStructure || []
          : course.userBWeeklyStructure || [];
      }
    } else {
      if (isCurrentUserTeacher()) {
        existingStructure = isCurrentUserUserA
          ? course.userAWeeklyStructure || []
          : course.userBWeeklyStructure || [];
      } else {
        existingStructure = isCurrentUserUserA
          ? course.userBWeeklyStructure || []
          : course.userAWeeklyStructure || [];
      }
    }

    return existingStructure;
  };

  const getTeachingSkill = () => {
    if (!course) return "";
    if (course.exchangeType === "mutual") {
      if (activeTab === "myLearning") {
        return isCurrentUserUserA
          ? course.userBTeaching?.skill || ""
          : course.userATeaching?.skill || "";
      } else {
        return isCurrentUserUserA
          ? course.userATeaching?.skill || ""
          : course.userBTeaching?.skill || "";
      }
    } else {
      return isCurrentUserTeacher()
        ? isCurrentUserUserA
          ? course.userATeaching?.skill || ""
          : course.userBTeaching?.skill || ""
        : isCurrentUserUserA
        ? course.userBTeaching?.skill || ""
        : course.userATeaching?.skill || "";
    }
  };

  const getCurrentProgress = () => {
    if (!course) return 0;
    if (course.exchangeType === "mutual") {
      if (activeTab === "myLearning") {
        return isCurrentUserUserA
          ? course.progress?.userA || 0
          : course.progress?.userB || 0;
      } else {
        return isCurrentUserUserA
          ? course.progress?.userB || 0
          : course.progress?.userA || 0;
      }
    } else {
      if (isCurrentUserStudent()) {
        return isCurrentUserUserA
          ? course.progress?.userA || 0
          : course.progress?.userB || 0;
      } else {
        return isCurrentUserUserA
          ? course.progress?.userB || 0
          : course.progress?.userA || 0;
      }
    }
  };

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

  const getRoleDescription = () => {
    if (!course || course.exchangeType !== "one-way") return "";
    const teacherUser = getTeacherUser();
    const studentUser = getStudentUser();
    if (isCurrentUserTeacher()) {
      return `You are teaching ${getTeachingSkill()} to ${
        studentUser?.fullName || "your student"
      }`;
    } else {
      return `You are learning ${getTeachingSkill()} from ${
        teacherUser?.fullName || "your teacher"
      }`;
    }
  };

  const getCourseEndDate = () => {
    if (!course?.startDate) return null;
    const startDate = new Date(course.startDate);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + (course.duration || 0) * 7);
    return endDate;
  };

  const getWeekForDate = (date) => {
    if (!course?.startDate) return 1;
    const startDate = new Date(course.startDate);
    const appointmentDate = new Date(date);
    const diffTime = appointmentDate - startDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const weekNumber = Math.ceil(diffDays / 7);
    return Math.max(1, Math.min(weekNumber, course.duration || 1));
  };

  const filterAppointmentsForCurrentContext = (weekContent) => {
    if (!weekContent || !course) return weekContent;
    const currentUserId = getUserId();
    return weekContent.filter((item) => {
      if (item.type !== "appointment") return true;
      const appointmentData = getAppointmentDisplayData(item);
      if (
        !appointmentData ||
        !appointmentData.teacher ||
        !appointmentData.student
      ) {
        return true;
      }
      if (course.exchangeType === "mutual") {
        if (activeTab === "myLearning") {
          return (
            appointmentData.student._id === currentUserId ||
            appointmentData.student === currentUserId
          );
        } else {
          return (
            appointmentData.teacher._id === currentUserId ||
            appointmentData.teacher === currentUserId
          );
        }
      } else {
        if (isCurrentUserStudent()) {
          return (
            appointmentData.student._id === currentUserId ||
            appointmentData.student === currentUserId
          );
        } else {
          return (
            appointmentData.teacher._id === currentUserId ||
            appointmentData.teacher === currentUserId
          );
        }
      }
    });
  };

  const formatAppointmentDateTime = (dateString, timeString) => {
    try {
      let date;
      if (dateString.includes("T")) {
        date = new Date(dateString);
      } else {
        const [year, month, day] = dateString.split("-");
        date = new Date(year, month - 1, day);
      }
      const formattedDate = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
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
      return `${dateString} • ${timeString}`;
    }
  };

  // Assignment Functions
  const openCreateAssignment = () => {
    // Calculate course end date for max due date
    const courseEndDate = getCourseEndDate();
    const maxDueDate = courseEndDate
      ? courseEndDate.toISOString().split("T")[0]
      : "";

    // Calculate default due date (1 week from now or course end date, whichever is sooner)
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
    const defaultDueDate =
      courseEndDate && oneWeekFromNow > courseEndDate
        ? courseEndDate.toISOString().split("T")[0]
        : oneWeekFromNow.toISOString().split("T")[0];

    setAssignmentForm({
      title: "",
      description: "",
      instructions: "",
      dueDate: defaultDueDate,
      maxPoints: 100,
    });
    setAssignmentDialogOpen(true);
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!assignmentForm.title) {
      toast.error("Assignment title is required");
      return;
    }

    // Validate due date is not after course end date
    const courseEndDate = getCourseEndDate();
    if (assignmentForm.dueDate && courseEndDate) {
      const dueDate = new Date(assignmentForm.dueDate);
      if (dueDate > courseEndDate) {
        toast.error("Due date cannot be after the course end date");
        return;
      }
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/courses/${courseId}/assignments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            auth: getToken(),
          },
          body: JSON.stringify(assignmentForm),
        }
      );

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Failed to create assignment");

      toast.success(
        `Assignment created successfully! It will appear in Week ${data.data.week}`
      );
      setAssignmentDialogOpen(false);
      fetchCourseDetails();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const openSubmitAssignment = (assignment, weekNumber) => {
    setSelectedAssignment(assignment);
    setSelectedWeek(weekNumber);
    setSubmitForm({ files: [] });
    setSubmitDialogOpen(true);
  };

  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    if (submitForm.files.length === 0) {
      toast.error("Please select at least one file");
      return;
    }

    try {
      let structureType;
      if (course.exchangeType === "mutual") {
        structureType =
          activeTab === "myLearning"
            ? isCurrentUserUserA
              ? "userB"
              : "userA"
            : isCurrentUserUserA
            ? "userA"
            : "userB";
      } else {
        structureType = isCurrentUserStudent()
          ? isCurrentUserUserA
            ? "userB"
            : "userA"
          : isCurrentUserUserA
          ? "userA"
          : "userB";
      }

      const formData = new FormData();
      submitForm.files.forEach((file) => {
        formData.append("files", file);
      });

      const res = await fetch(
        `${API_BASE_URL}/courses/${courseId}/weeks/${selectedWeek}/${structureType}/assignments/${selectedAssignment?.id}/submit`,
        {
          method: "POST",
          headers: { auth: getToken() },
          body: formData,
        }
      );

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Failed to submit assignment");

      toast.success("Assignment submitted successfully!");
      setSubmitDialogOpen(false);
      fetchCourseDetails();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const openGradeAssignment = (submission, assignment, weekNumber) => {
    setSelectedSubmission(submission);
    setSelectedAssignment(assignment);
    setSelectedWeek(weekNumber);
    setGradeForm({
      points: submission.grade?.points || "",
      feedback: submission.grade?.feedback || "",
    });
    setGradeDialogOpen(true);
  };

  const handleGradeAssignment = async (e) => {
    e.preventDefault();
    if (!gradeForm.points) {
      toast.error("Points are required");
      return;
    }

    try {
      let structureType;
      if (course.exchangeType === "mutual") {
        structureType = isCurrentUserUserA ? "userA" : "userB";
      } else {
        structureType = isCurrentUserUserA ? "userA" : "userB";
      }

      const res = await fetch(
        `${API_BASE_URL}/courses/${courseId}/weeks/${selectedWeek}/${structureType}/assignments/${selectedAssignment?.id}/grade/${selectedSubmission?.studentId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            auth: getToken(),
          },
          body: JSON.stringify(gradeForm),
        }
      );

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Failed to grade assignment");

      toast.success("Assignment graded successfully!");
      setGradeDialogOpen(false);
      fetchCourseDetails();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const openSubmissionsDialog = (assignment, weekNumber) => {
    setSelectedAssignment(assignment);
    setSelectedWeek(weekNumber);
    setSubmissionsDialogOpen(true);
  };

  const deleteAssignment = async (assignmentId, weekNumber) => {
    try {
      let structureType;
      if (course.exchangeType === "mutual") {
        structureType = isCurrentUserUserA ? "userA" : "userB";
      } else {
        structureType = isCurrentUserUserA ? "userA" : "userB";
      }

      const res = await fetch(
        `${API_BASE_URL}/courses/${courseId}/weeks/${weekNumber}/${structureType}/assignments/${assignmentId}`,
        {
          method: "DELETE",
          headers: { auth: getToken() },
        }
      );

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Failed to delete assignment");

      toast.success("Assignment deleted successfully!");
      fetchCourseDetails();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const hasUserSubmitted = (assignment) => {
    if (!assignment?.assignment?.submissions) return false;
    const userId = getUserId();
    return assignment.assignment.submissions.some(
      (sub) => sub.studentId === userId || sub.studentId?._id === userId
    );
  };

  const getUserSubmission = (assignment) => {
    if (!assignment?.assignment?.submissions) return null;
    const userId = getUserId();
    return assignment.assignment.submissions.find(
      (sub) => sub.studentId === userId || sub.studentId?._id === userId
    );
  };

  // File handling functions
  const getFileIcon = (fileType, type) => {
    if (type === "appointment") {
      return <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />;
    }
    if (type === "assignment") {
      return <FileCheck className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />;
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

  const downloadFile = async (fileUrl, fileName) => {
    try {
      const fullUrl = fileUrl.startsWith("http")
        ? fileUrl
        : `${API_BASE_URL}${fileUrl}`;
      const response = await fetch(fullUrl, { headers: { auth: getToken() } });
      if (!response.ok) throw new Error("Failed to download file");
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      const filename = fileName || fileUrl.split("/").pop() || "download";
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success("File download started!");
    } catch (err) {
      const fullUrl = fileUrl.startsWith("http")
        ? fileUrl
        : `${API_BASE_URL}${fileUrl}`;
      window.open(fullUrl, "_blank");
    }
  };

  const viewFile = (fileUrl) => {
    const fullUrl = fileUrl.startsWith("http")
      ? fileUrl
      : `${API_BASE_URL}${fileUrl}`;
    window.open(fullUrl, "_blank", "noopener,noreferrer");
  };

  const isViewableFile = (fileType) => {
    const viewableTypes = ["pdf", "jpg", "jpeg", "png", "gif", "webp"];
    return viewableTypes.includes(fileType?.toLowerCase());
  };

  const getAppointmentDisplayData = (item) => {
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

  // Appointment functions
  const getWeekday = (date) =>
    date.toLocaleDateString("en-US", { weekday: "long" });

  const generateTimeSlots = (start, end) => {
    if (!start || !end) return [];
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

  const isDateDisabled = (date) => {
    if (!selectedUser || !selectedUser.availability) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return true;
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
    const calculatedWeek = getWeekForDate(date);
    setSelectedWeek(calculatedWeek);
  };

  const openAppointmentBookingModal = async () => {
    const otherUser = getOtherUser();
    if (!otherUser) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/courses/user/${otherUser._id}/availability`,
        { headers: { auth: getToken() } }
      );
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Failed to fetch availability");
      setSelectedUser(data.data.user);
      setNewDate(null);
      setNewTime("");
      setAvailableTimes([]);
      const isLearningTab = activeTab === "myLearning";
      const defaultTitle = isLearningTab
        ? `Learning Session - Week ${selectedWeek}`
        : `Teaching Session - Week ${selectedWeek}`;
      setAppointmentForm({ title: defaultTitle, description: "" });
      setOpenAppointmentModal(true);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleBookAppointment = async () => {
    if (!newDate || !newTime || !appointmentForm.title) {
      toast.error("Select a date, time, and provide a title");
      return;
    }
    try {
      let teacherId, studentId;
      if (course.exchangeType === "mutual") {
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
      const calculatedWeek = getWeekForDate(newDate);
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
          week: calculatedWeek,
        }),
      });
      const appointmentData = await appointmentRes.json();
      if (!appointmentRes.ok)
        throw new Error(
          appointmentData.message || "Failed to book appointment"
        );
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
      fetchCourseDetails();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Week management functions
  const toggleWeek = (weekNumber) => {
    const newExpanded = new Set(expandedWeeks);
    if (newExpanded.has(weekNumber)) {
      newExpanded.delete(weekNumber);
    } else {
      newExpanded.add(weekNumber);
    }
    setExpandedWeeks(newExpanded);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadForm.file) {
      toast.error("Please select a file");
      return;
    }
    if (uploadForm.file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }
    let structureType;
    if (course.exchangeType === "mutual") {
      if (activeTab === "myTeaching") {
        structureType = isCurrentUserUserA ? "userA" : "userB";
      } else {
        structureType = isCurrentUserUserA ? "userB" : "userA";
      }
    } else {
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
      const res = await fetch(
        `${API_BASE_URL}/courses/${courseId}/weeks/${uploadForm.week}/${structureType}/upload`,
        { method: "POST", headers: { auth: getToken() }, body: formData }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to upload file");
      toast.success("File uploaded successfully!");
      setUploadDialogOpen(false);
      setUploadForm({ title: "", description: "", file: null, week: 1 });
      fetchCourseDetails();
    } catch (err) {
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

  const markWeekComplete = async (weekNumber) => {
    try {
      let structureType;
      if (course.exchangeType === "mutual") {
        if (activeTab === "myLearning") {
          structureType = isCurrentUserUserA ? "userB" : "userA";
        } else {
          structureType = isCurrentUserUserA ? "userA" : "userB";
        }
      } else {
        if (isCurrentUserStudent()) {
          structureType = isCurrentUserUserA ? "userB" : "userA";
        } else {
          structureType = isCurrentUserUserA ? "userA" : "userB";
        }
      }
      const res = await fetch(
        `${API_BASE_URL}/courses/${courseId}/weeks/${weekNumber}/${structureType}/complete`,
        {
          method: "PATCH",
          headers: { auth: getToken(), "Content-Type": "application/json" },
          body: JSON.stringify({ userId: getUserId() }),
        }
      );
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Failed to mark week as complete");
      toast.success(`Week ${weekNumber} marked as complete!`);
      fetchCourseDetails();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const unmarkWeekComplete = async (weekNumber) => {
    try {
      let structureType;
      if (course.exchangeType === "mutual") {
        if (activeTab === "myLearning") {
          structureType = isCurrentUserUserA ? "userB" : "userA";
        } else {
          structureType = isCurrentUserUserA ? "userA" : "userB";
        }
      } else {
        if (isCurrentUserStudent()) {
          structureType = isCurrentUserUserA ? "userB" : "userA";
        } else {
          structureType = isCurrentUserUserA ? "userA" : "userB";
        }
      }
      const res = await fetch(
        `${API_BASE_URL}/courses/${courseId}/weeks/${weekNumber}/${structureType}/incomplete`,
        {
          method: "PATCH",
          headers: { auth: getToken(), "Content-Type": "application/json" },
          body: JSON.stringify({ userId: getUserId() }),
        }
      );
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Failed to unmark week as complete");
      toast.success(`Week ${weekNumber} marked as incomplete!`);
      fetchCourseDetails();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const editWeek = (week) => {
    setWeekForm({
      title: week.title || "",
      description: week.description || "",
      weekNumber: week.weekNumber || 1,
    });
    setIsEditingWeek(true);
    setWeekDialogOpen(true);
  };

  const deleteWeekContent = async (weekNumber, contentId) => {
    try {
      const structureType = isCurrentUserUserA ? "userA" : "userB";
      const res = await fetch(
        `${API_BASE_URL}/courses/${courseId}/weeks/${weekNumber}/${structureType}/content/${contentId}`,
        { method: "DELETE", headers: { auth: getToken() } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete content");
      toast.success("Content deleted successfully!");
      fetchCourseDetails();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const navigateToAppointments = () => {
    navigate("/appointments");
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
  const isCoursePending = course.status === "pending";
  const canMakeAppointments =
    otherUser && getUserId() !== otherUser._id && !isCoursePending;
  const isOneWay = course.exchangeType === "one-way";
  const isTeacher = isCurrentUserTeacher();
  const isStudent = isCurrentUserStudent();
  const canUploadFiles =
    (isOneWay && isTeacher) || (!isOneWay && activeTab === "myTeaching");
  const canCreateAssignments =
    (course.exchangeType === "mutual" && activeTab === "myTeaching") ||
    (course.exchangeType === "one-way" && isTeacher);
  const hasWeeklyStructure =
    currentWeeklyStructure && currentWeeklyStructure.length > 0;

  return (
    <>
      {/* Header Section */}
      <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white">
        <div className="px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
          <div className="flex flex-col xl:flex-row gap-4 lg:gap-6 xl:gap-8">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 mb-2 sm:mb-3 flex-wrap">
                <Badge
                  variant="secondary"
                  className="bg-white/20 text-white border-0 text-xs px-2 py-1"
                >
                  {course.duration || 0}{" "}
                  {course.duration === 1 ? "week" : "weeks"}
                </Badge>
                <Badge
                  variant="secondary"
                  className={`text-xs px-2 py-1 ${
                    course.status === "active"
                      ? "bg-green-500"
                      : course.status === "pending"
                      ? "bg-yellow-500"
                      : "bg-gray-500"
                  } text-white border-0`}
                >
                  {course.status
                    ? course.status.charAt(0).toUpperCase() +
                      course.status.slice(1)
                    : "Unknown"}
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
                {course.title || "Untitled Course"}
              </h1>
              <p className="text-blue-100 text-sm sm:text-base lg:text-lg xl:text-xl max-w-4xl leading-relaxed break-words">
                {course.description || "No description provided"}
              </p>

              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3 lg:gap-4 mt-3 sm:mt-4 text-xs sm:text-sm">
                {isOneWay ? (
                  <>
                    <div className="flex items-center gap-1 sm:gap-2 min-w-0 bg-white/10 rounded-lg p-2 sm:p-3 flex-1 sm:flex-none">
                      <GraduationCap className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 text-green-300" />
                      <div className="min-w-0">
                        <div className="font-semibold text-green-300">
                          Teacher
                        </div>
                        <div className="truncate">
                          {teacherUser?.fullName || "Unknown"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 min-w-0 bg-white/10 rounded-lg p-2 sm:p-3 flex-1 sm:flex-none">
                      <Book className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 text-blue-300" />
                      <div className="min-w-0">
                        <div className="font-semibold text-blue-300">
                          Student
                        </div>
                        <div className="truncate">
                          {studentUser?.fullName || "Unknown"}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-1 sm:gap-2 min-w-0 bg-white/10 rounded-lg p-2 sm:p-3 flex-1 sm:flex-none">
                      <User className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="font-semibold">
                          {course.userA?.fullName || "User A"}
                        </div>
                        <div className="truncate text-blue-100">
                          {course.userATeaching?.skill || "No skill"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 min-w-0 bg-white/10 rounded-lg p-2 sm:p-3 flex-1 sm:flex-none">
                      <User className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="font-semibold">
                          {course.userB?.fullName || "User B"}
                        </div>
                        <div className="truncate text-blue-100">
                          {course.userBTeaching?.skill || "No skill"}
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

              {isOneWay && (
                <div className="mt-3 sm:mt-4">
                  <Badge
                    variant="secondary"
                    className={`text-xs px-3 py-1.5 border-0 ${
                      isTeacher
                        ? "bg-green-500/20 text-green-300 border border-green-500/30"
                        : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                    }`}
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
                      {course.userA?.fullName || "User A"} &{" "}
                      {course.userB?.fullName || "User B"}
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

      {/* Tab Navigation */}
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
                  {isCurrentUserUserA
                    ? course.userBTeaching?.skill || ""
                    : course.userATeaching?.skill || ""}
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
                  {isCurrentUserUserA
                    ? course.userATeaching?.skill || ""
                    : course.userBTeaching?.skill || ""}
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

      {/* Action Bar */}
      {(canUploadFiles || canCreateAssignments) && !isCoursePending && (
        <div className="bg-white border-b">
          <div className="max-w-7xl px-3 sm:px-4 lg:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center py-3 sm:py-4 gap-2 sm:gap-3">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                {canUploadFiles && (
                  <Button
                    onClick={() => setUploadDialogOpen(true)}
                    className="flex items-center gap-1.5 sm:gap-2 bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm w-full sm:w-auto justify-center py-2 px-3 sm:px-4"
                    size="sm"
                  >
                    <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>Upload File</span>
                  </Button>
                )}
                {canCreateAssignments && (
                  <Button
                    onClick={openCreateAssignment}
                    className="flex items-center gap-1.5 sm:gap-2 bg-purple-600 hover:bg-purple-700 text-xs sm:text-sm w-full sm:w-auto justify-center py-2 px-3 sm:px-4"
                    size="sm"
                  >
                    <FileCheck className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>Create Assignment</span>
                  </Button>
                )}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">
                {isOneWay ? (
                  <span>
                    Add learning materials and assignments for your student
                  </span>
                ) : (
                  <span>
                    Add teaching materials and assignments for your exchange
                    partner
                  </span>
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
                <strong>Course Pending:</strong> File upload, assignment, and
                appointment features will be available once the course is
                active.
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
              const filteredContent = filterAppointmentsForCurrentContext(
                week.content || []
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
                          className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full mt-0.5 flex-shrink-0 ${
                            week.completed
                              ? "bg-green-100 text-green-600"
                              : (isOneWay && isTeacher) ||
                                (!isOneWay && activeTab === "myTeaching")
                              ? "bg-orange-100 text-orange-600"
                              : "bg-blue-100 text-blue-600"
                          }`}
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
                              Week {week.weekNumber}:{" "}
                              {week.title || "Untitled Week"}
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
                            {week.description || "No description provided"}
                          </p>

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
                            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                              <FileCheck className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span>
                                {
                                  filteredContent.filter(
                                    (item) => item.type === "assignment"
                                  ).length
                                }{" "}
                                Assignments
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        {canUploadFiles && !isCoursePending && (
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
                        )}

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

                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      expandedWeeks.has(week.weekNumber)
                        ? "max-h-[2000px] opacity-100 border-t border-gray-200"
                        : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="p-4 sm:p-6">
                      <div className="mb-4 sm:mb-6">
                        {filteredContent.length === 0 ? (
                          <div className="text-center py-8 sm:py-12 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50/50">
                            <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                            <p className="text-gray-500 text-base sm:text-lg font-medium">
                              No content added yet for this week
                            </p>
                            <p className="text-gray-400 mt-1 sm:mt-2 text-sm sm:text-base">
                              {canUploadFiles || canCreateAssignments
                                ? isCoursePending
                                  ? "Content creation will be available once course is active"
                                  : "Add files, assignments, or appointments to get started"
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
                              const userSubmission =
                                item.type === "assignment"
                                  ? getUserSubmission(item)
                                  : null;

                              return (
                                <Card
                                  key={item.id}
                                  className={`hover:shadow-lg transition-all duration-200 border ${
                                    item.type === "assignment"
                                      ? "border-purple-200 bg-purple-50/30"
                                      : "border-gray-200"
                                  }`}
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
                                              : item.type === "assignment"
                                              ? item.assignment?.title ||
                                                "Assignment"
                                              : item.title || "Document"}
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
                                          {item.type === "assignment" && (
                                            <Badge
                                              variant="outline"
                                              className="text-xs bg-purple-100 text-purple-800"
                                            >
                                              Assignment
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
                                            : item.type === "assignment"
                                            ? `Due: ${
                                                item.assignment?.dueDate
                                                  ? new Date(
                                                      item.assignment.dueDate
                                                    ).toLocaleDateString()
                                                  : "No due date"
                                              } • ${
                                                item.assignment?.maxPoints || 0
                                              } points`
                                            : `Uploaded ${item.uploadDate} • ${item.size}`}
                                        </p>
                                        {(item.description ||
                                          (item.type === "appointment" &&
                                            appointmentData?.description) ||
                                          (item.type === "assignment" &&
                                            item.assignment?.description)) && (
                                          <p className="text-xs sm:text-sm text-gray-600 mt-2 line-clamp-2 break-words">
                                            {item.type === "appointment"
                                              ? appointmentData?.description
                                              : item.type === "assignment"
                                              ? item.assignment?.description
                                              : item.description}
                                          </p>
                                        )}

                                        {item.type === "assignment" &&
                                          userSubmission && (
                                            <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                                              <div className="flex items-center justify-between text-xs">
                                                <span className="text-blue-700 font-medium">
                                                  Submitted
                                                </span>
                                                {userSubmission.grade ? (
                                                  <Badge className="bg-green-500 text-white">
                                                    <Award className="w-3 h-3 mr-1" />
                                                    {
                                                      userSubmission.grade
                                                        .points
                                                    }
                                                    /
                                                    {
                                                      userSubmission.grade
                                                        .maxPoints
                                                    }
                                                  </Badge>
                                                ) : (
                                                  <Badge
                                                    variant="secondary"
                                                    className="bg-yellow-500 text-white"
                                                  >
                                                    Pending Grade
                                                  </Badge>
                                                )}
                                              </div>
                                              {userSubmission.grade
                                                ?.feedback && (
                                                <p className="text-xs text-blue-600 mt-1">
                                                  {
                                                    userSubmission.grade
                                                      .feedback
                                                  }
                                                </p>
                                              )}
                                            </div>
                                          )}
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-between mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-gray-100">
                                      <div className="flex items-center gap-1 sm:gap-2">
                                        {item.type === "document" && (
                                          <>
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
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="h-7 sm:h-8 text-xs"
                                              onClick={navigateToAppointments}
                                            >
                                              <ExternalLink className="w-3 h-3 mr-1" />
                                              Manage
                                            </Button>
                                          )}
                                        {item.type === "assignment" && (
                                          <>
                                            {((course.exchangeType ===
                                              "mutual" &&
                                              activeTab === "myLearning") ||
                                              (course.exchangeType ===
                                                "one-way" &&
                                                isStudent)) && (
                                              <>
                                                {!userSubmission ? (
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 sm:h-8 text-xs bg-green-600 text-white hover:bg-green-700"
                                                    onClick={() =>
                                                      openSubmitAssignment(
                                                        item,
                                                        week.weekNumber
                                                      )
                                                    }
                                                  >
                                                    <Send className="w-3 h-3 mr-1" />
                                                    Submit
                                                  </Button>
                                                ) : (
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 sm:h-8 text-xs"
                                                    onClick={() =>
                                                      openSubmitAssignment(
                                                        item,
                                                        week.weekNumber
                                                      )
                                                    }
                                                  >
                                                    <FileUp className="w-3 h-3 mr-1" />
                                                    Resubmit
                                                  </Button>
                                                )}
                                              </>
                                            )}
                                            {((course.exchangeType ===
                                              "mutual" &&
                                              activeTab === "myTeaching") ||
                                              (course.exchangeType ===
                                                "one-way" &&
                                                isTeacher)) && (
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-7 sm:h-8 text-xs"
                                                onClick={() =>
                                                  openSubmissionsDialog(
                                                    item,
                                                    week.weekNumber
                                                  )
                                                }
                                              >
                                                <ClipboardCheck className="w-3 h-3 mr-1" />
                                                Submissions (
                                                {item.assignment?.submissions
                                                  ?.length || 0}
                                                )
                                              </Button>
                                            )}
                                          </>
                                        )}
                                      </div>
                                      {(canUploadFiles ||
                                        canCreateAssignments) &&
                                        !isCoursePending && (
                                          <Button
                                            onClick={() => {
                                              if (item.type === "assignment") {
                                                deleteAssignment(
                                                  item.id,
                                                  week.weekNumber
                                                );
                                              } else {
                                                deleteWeekContent(
                                                  week.weekNumber,
                                                  item.id
                                                );
                                              }
                                            }}
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
                          Week {week.weekNumber}:{" "}
                          {week.title || "Untitled Week"}
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

      {/* Create Assignment Dialog */}
      <Dialog
        open={assignmentDialogOpen}
        onOpenChange={setAssignmentDialogOpen}
      >
        <DialogContent className="max-w-2xl w-[95vw] sm:w-full rounded-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg lg:text-xl">
              <FileCheck className="w-4 h-4 sm:w-5 sm:h-5" />
              Create Assignment
            </DialogTitle>
            <DialogDescription>
              Create a new assignment that will be automatically assigned to the
              appropriate week based on the due date.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateAssignment}>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Assignment Title *
                </label>
                <Input
                  value={assignmentForm.title}
                  onChange={(e) =>
                    setAssignmentForm({
                      ...assignmentForm,
                      title: e.target.value,
                    })
                  }
                  placeholder="Enter assignment title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Description
                </label>
                <Textarea
                  value={assignmentForm.description}
                  onChange={(e) =>
                    setAssignmentForm({
                      ...assignmentForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Assignment description and objectives"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Instructions
                </label>
                <Textarea
                  value={assignmentForm.instructions}
                  onChange={(e) =>
                    setAssignmentForm({
                      ...assignmentForm,
                      instructions: e.target.value,
                    })
                  }
                  placeholder="Detailed instructions for students"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Due Date *
                  </label>
                  <Input
                    type="date"
                    value={assignmentForm.dueDate}
                    onChange={(e) =>
                      setAssignmentForm({
                        ...assignmentForm,
                        dueDate: e.target.value,
                      })
                    }
                    min={new Date().toISOString().split("T")[0]}
                    max={
                      courseEndDate
                        ? courseEndDate.toISOString().split("T")[0]
                        : ""
                    }
                    required
                  />
                  {courseEndDate && (
                    <p className="text-xs text-gray-500 mt-1">
                      Course ends on {courseEndDate.toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Maximum Points
                  </label>
                  <Input
                    type="number"
                    value={assignmentForm.maxPoints}
                    onChange={(e) =>
                      setAssignmentForm({
                        ...assignmentForm,
                        maxPoints: parseInt(e.target.value) || 100,
                      })
                    }
                    min="1"
                    max="1000"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">
                  Assignment Information
                </h4>
                <p className="text-blue-800 text-sm">
                  This assignment will be automatically assigned to the
                  appropriate week based on the due date you select.
                  {assignmentForm.dueDate && course?.startDate && (
                    <span className="block mt-1">
                      It will appear in{" "}
                      <strong>
                        Week {getWeekForDate(assignmentForm.dueDate)}
                      </strong>{" "}
                      of the course.
                    </span>
                  )}
                </p>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button
                type="submit"
                className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700"
              >
                Create Assignment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Submit Assignment Dialog */}
      <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <DialogContent className="max-w-2xl w-[95vw] sm:w-full rounded-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg lg:text-xl">
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              Submit Assignment
            </DialogTitle>
            <DialogDescription>
              {selectedAssignment?.assignment
                ? `Submit your work for: ${selectedAssignment.assignment.title}`
                : "Submit Assignment"}
            </DialogDescription>
          </DialogHeader>

          {selectedAssignment?.assignment ? (
            <form onSubmit={handleSubmitAssignment}>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1">
                {selectedAssignment.assignment.instructions && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">
                      Instructions:
                    </h4>
                    <p className="text-blue-800 text-sm">
                      {selectedAssignment.assignment.instructions}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Upload Files *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      You can upload multiple files (Max 10MB each)
                    </p>
                    <Input
                      type="file"
                      multiple
                      className="mt-4"
                      onChange={(e) =>
                        setSubmitForm({
                          ...submitForm,
                          files: Array.from(e.target.files),
                        })
                      }
                      required
                    />
                  </div>
                  {submitForm.files.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-sm font-medium">Selected files:</p>
                      {submitForm.files.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-gray-50 p-2 rounded"
                        >
                          <span className="text-sm truncate">{file.name}</span>
                          <span className="text-xs text-gray-500">
                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button
                  type="submit"
                  className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
                  disabled={submitForm.files.length === 0}
                >
                  Submit Assignment
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading assignment details...</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Grade Assignment Dialog */}
      <Dialog open={gradeDialogOpen} onOpenChange={setGradeDialogOpen}>
        <DialogContent className="max-w-2xl w-[95vw] sm:w-full rounded-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg lg:text-xl">
              <Award className="w-4 h-4 sm:w-5 sm:h-5" />
              Grade Assignment
            </DialogTitle>
            <DialogDescription>
              {selectedAssignment?.assignment
                ? `Grade submission for: ${selectedAssignment.assignment.title}`
                : "Grade Assignment"}
            </DialogDescription>
          </DialogHeader>

          {selectedAssignment?.assignment && selectedSubmission ? (
            <form onSubmit={handleGradeAssignment}>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1">
                {selectedSubmission.files &&
                  selectedSubmission.files.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Submitted Files
                      </label>
                      <div className="space-y-2">
                        {selectedSubmission.files.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-gray-50 p-3 rounded border"
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-gray-500" />
                              <span className="text-sm">{file.fileName}</span>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                downloadFile(file.fileUrl, file.fileName)
                              }
                            >
                              <Download className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Points *
                    </label>
                    <Input
                      type="number"
                      value={gradeForm.points}
                      onChange={(e) =>
                        setGradeForm({ ...gradeForm, points: e.target.value })
                      }
                      min="0"
                      max={selectedAssignment.assignment.maxPoints || 100}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Out of {selectedAssignment.assignment.maxPoints || 100}{" "}
                      points
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Percentage
                    </label>
                    <Input
                      type="text"
                      value={
                        gradeForm.points &&
                        selectedAssignment.assignment.maxPoints
                          ? `${(
                              (gradeForm.points /
                                selectedAssignment.assignment.maxPoints) *
                              100
                            ).toFixed(1)}%`
                          : "0%"
                      }
                      disabled
                      className="bg-gray-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Feedback
                  </label>
                  <Textarea
                    value={gradeForm.feedback}
                    onChange={(e) =>
                      setGradeForm({ ...gradeForm, feedback: e.target.value })
                    }
                    placeholder="Provide feedback to the student..."
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button
                  type="submit"
                  className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
                >
                  Submit Grade
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading submission details...</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Submissions Dialog */}
      <Dialog
        open={submissionsDialogOpen}
        onOpenChange={setSubmissionsDialogOpen}
      >
        <DialogContent className="max-w-4xl w-[95vw] sm:w-full rounded-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg lg:text-xl">
              <ClipboardCheck className="w-4 h-4 sm:w-5 sm:h-5" />
              Assignment Submissions
            </DialogTitle>
            <DialogDescription>
              {selectedAssignment?.assignment
                ? `${selectedAssignment.assignment.title} - ${
                    selectedAssignment.assignment.submissions?.length || 0
                  } submission(s)`
                : "Assignment Submissions"}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            {!selectedAssignment?.assignment ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading assignment details...</p>
              </div>
            ) : selectedAssignment.assignment.submissions?.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No submissions yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedAssignment.assignment.submissions.map(
                  (submission, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">
                              {submission.studentId?.fullName || "Student"}
                            </h4>
                            <Badge
                              variant={
                                submission.status === "graded"
                                  ? "default"
                                  : submission.status === "late"
                                  ? "destructive"
                                  : "secondary"
                              }
                              className="text-xs"
                            >
                              {submission.status === "graded"
                                ? "Graded"
                                : submission.status === "late"
                                ? "Late"
                                : "Submitted"}
                            </Badge>
                            {submission.grade && (
                              <Badge className="bg-green-500 text-white text-xs">
                                {submission.grade.points}/
                                {submission.grade.maxPoints}
                              </Badge>
                            )}
                          </div>

                          <p className="text-sm text-gray-500 mb-2">
                            Submitted on{" "}
                            {new Date(
                              submission.submittedAt
                            ).toLocaleDateString()}{" "}
                            at{" "}
                            {new Date(
                              submission.submittedAt
                            ).toLocaleTimeString()}
                          </p>

                          {submission.files && submission.files.length > 0 && (
                            <div className="mb-3">
                              <p className="text-sm font-medium mb-1">Files:</p>
                              <div className="space-y-1">
                                {submission.files.map((file, fileIndex) => (
                                  <div
                                    key={fileIndex}
                                    className="flex items-center gap-2 text-sm"
                                  >
                                    <FileText className="w-4 h-4 text-gray-500" />
                                    <span>{file.fileName}</span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 px-2"
                                      onClick={() =>
                                        downloadFile(
                                          file.fileUrl,
                                          file.fileName
                                        )
                                      }
                                    >
                                      <Download className="w-3 h-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {submission.grade && (
                            <div className="bg-green-50 border border-green-200 rounded p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <Award className="w-4 h-4 text-green-600" />
                                <span className="font-medium text-green-800">
                                  Graded
                                </span>
                              </div>
                              {submission.grade.feedback && (
                                <p className="text-sm text-green-700 mt-1">
                                  {submission.grade.feedback}
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 ml-4">
                          {!submission.grade ? (
                            <Button
                              size="sm"
                              onClick={() =>
                                openGradeAssignment(
                                  submission,
                                  selectedAssignment,
                                  selectedWeek
                                )
                              }
                            >
                              <Award className="w-4 h-4 mr-1" />
                              Grade
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                openGradeAssignment(
                                  submission,
                                  selectedAssignment,
                                  selectedWeek
                                )
                              }
                            >
                              <Edit3 className="w-4 h-4 mr-1" />
                              Regrade
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  )
                )}
              </div>
            )}
          </div>
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
                    setWeekForm({ ...weekForm, description: e.target.value })
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
                  ? `Book Learning Session with ${
                      selectedUser?.fullName || "the other user"
                    }`
                  : `Book Teaching Session with ${
                      selectedUser?.fullName || "the other user"
                    }`
                : isCurrentUserTeacher()
                ? `Book Teaching Session with ${
                    selectedUser?.fullName || "your student"
                  }`
                : `Book Learning Session with ${
                    selectedUser?.fullName || "your teacher"
                  }`}
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
                  {selectedUser?.fullName || "The user"} is not available on
                  this day.
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
