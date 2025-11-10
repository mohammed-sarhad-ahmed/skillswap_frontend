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
import {
  ChevronDown,
  ChevronRight,
  Upload,
  Calendar,
  FileText,
  Image,
  BookOpen,
  Users,
  Clock,
  CheckCircle,
  Plus,
  Trash2,
  Download,
  MessageCircle,
} from "lucide-react";

// Fake data for the course
const generateFakeCourseData = () => {
  return {
    _id: "course_123",
    title: "Python Programming Fundamentals",
    description:
      "Learn the basics of Python programming from scratch with hands-on projects and real-world examples",
    duration: 8,
    status: "active",
    progress: 45,
    startDate: "2024-01-15",
    endDate: "2024-03-15",
    users: {
      userA: {
        _id: "user_1",
        fullName: "John Doe",
        avatar: "avatar1.jpg",
        teachingSkill: "Web Development",
      },
      userB: {
        _id: "user_2",
        fullName: "Sarah Wilson",
        avatar: "avatar2.jpg",
        teachingSkill: "Data Science",
      },
    },
    weeks: [
      {
        weekNumber: 1,
        title: "Introduction to Python",
        description:
          "Get started with Python basics, setup development environment, and write your first program",
        completed: true,
        content: [
          {
            id: "content_1",
            type: "document",
            title: "Python Basics PDF Guide",
            fileType: "pdf",
            uploadDate: "2024-01-15",
            uploadedBy: "user_1",
            size: "2.4 MB",
          },
          {
            id: "content_2",
            type: "appointment",
            title: "Course Kickoff Meeting",
            date: "2024-01-16",
            time: "14:00",
            duration: 60,
            participants: ["user_1", "user_2"],
            description: "Let's discuss course goals and expectations",
          },
        ],
      },
      {
        weekNumber: 2,
        title: "Data Types and Variables",
        description:
          "Master Python data types, variables, and basic operations",
        completed: false,
        content: [
          {
            id: "content_3",
            type: "document",
            title: "Data Types Cheatsheet",
            fileType: "pdf",
            uploadDate: "2024-01-22",
            uploadedBy: "user_2",
            size: "1.8 MB",
          },
        ],
      },
      {
        weekNumber: 3,
        title: "Control Structures",
        description: "Learn if statements, loops, and program flow control",
        completed: false,
        content: [],
      },
    ],
  };
};

export default function CoursePage() {
  const [course, setCourse] = useState(null);
  const [expandedWeeks, setExpandedWeeks] = useState(new Set([1, 2]));
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    file: null,
    week: 1,
  });
  const [appointmentForm, setAppointmentForm] = useState({
    title: "",
    description: "",
    date: "",
    time: "14:00",
    duration: 60,
    week: 1,
  });

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setCourse(generateFakeCourseData());
    }, 500);
  }, []);

  const toggleWeek = (weekNumber) => {
    const newExpanded = new Set(expandedWeeks);
    if (newExpanded.has(weekNumber)) {
      newExpanded.delete(weekNumber);
    } else {
      newExpanded.add(weekNumber);
    }
    setExpandedWeeks(newExpanded);
  };

  const handleUploadSubmit = (e) => {
    e.preventDefault();

    // Create fake uploaded file
    const newContent = {
      id: `content_${Date.now()}`,
      type: "document",
      title: uploadForm.title,
      fileType: "pdf",
      uploadDate: new Date().toISOString().split("T")[0],
      uploadedBy: "user_1",
      size: "1.5 MB",
    };

    const updatedWeeks = course.weeks.map((week) => {
      if (week.weekNumber === uploadForm.week) {
        return {
          ...week,
          content: [...week.content, newContent],
        };
      }
      return week;
    });

    setCourse({
      ...course,
      weeks: updatedWeeks,
    });

    toast.success("File uploaded successfully!");
    setUploadDialogOpen(false);
    setUploadForm({ title: "", description: "", file: null, week: 1 });
  };

  const handleAppointmentSubmit = (e) => {
    e.preventDefault();

    const newAppointment = {
      id: `appointment_${Date.now()}`,
      type: "appointment",
      title: appointmentForm.title,
      date: appointmentForm.date,
      time: appointmentForm.time,
      duration: appointmentForm.duration,
      participants: ["user_1", "user_2"],
      description: appointmentForm.description,
    };

    const updatedWeeks = course.weeks.map((week) => {
      if (week.weekNumber === appointmentForm.week) {
        return {
          ...week,
          content: [...week.content, newAppointment],
        };
      }
      return week;
    });

    setCourse({
      ...course,
      weeks: updatedWeeks,
    });

    toast.success("Appointment scheduled successfully!");
    setAppointmentDialogOpen(false);
    setAppointmentForm({
      title: "",
      description: "",
      date: "",
      time: "14:00",
      duration: 60,
      week: 1,
    });
  };

  const getFileIcon = (fileType, type) => {
    if (type === "appointment") {
      return <Calendar className="w-6 h-6 text-blue-500" />;
    }

    switch (fileType) {
      case "pdf":
        return <FileText className="w-6 h-6 text-red-500" />;
      case "doc":
      case "docx":
        return <FileText className="w-6 h-6 text-blue-600" />;
      case "jpg":
      case "png":
      case "gif":
        return <Image className="w-6 h-6 text-green-500" />;
      default:
        return <FileText className="w-6 h-6 text-gray-500" />;
    }
  };

  const markWeekComplete = (weekNumber) => {
    const updatedWeeks = course.weeks.map((week) => {
      if (week.weekNumber === weekNumber) {
        return { ...week, completed: true };
      }
      return week;
    });

    const completedWeeks = updatedWeeks.filter((w) => w.completed).length;
    const newProgress = Math.round(
      (completedWeeks / course.weeks.length) * 100
    );

    setCourse({
      ...course,
      weeks: updatedWeeks,
      progress: newProgress,
    });

    toast.success(`Week ${weekNumber} marked as complete!`);
  };

  if (!course) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" />

      {/* Modern Header */}
      <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Badge
                  variant="secondary"
                  className="bg-white/20 text-white border-0"
                >
                  {course.duration} weeks
                </Badge>
                <Badge
                  variant="secondary"
                  className={`
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
              </div>

              <h1 className="text-3xl lg:text-4xl font-bold mb-3 leading-tight">
                {course.title}
              </h1>
              <p className="text-blue-100 text-lg lg:text-xl max-w-4xl leading-relaxed">
                {course.description}
              </p>
            </div>

            {/* Progress Card */}
            <Card className="bg-white/10 backdrop-blur-sm border-0 text-white lg:min-w-80">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-semibold">Course Progress</span>
                  <span className="text-2xl font-bold">{course.progress}%</span>
                </div>
                <Progress value={course.progress} className="h-3 bg-white/20" />
                <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>
                      {course.users.userA.fullName} &{" "}
                      {course.users.userB.fullName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {course.startDate} to {course.endDate}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between py-4 gap-4">
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setUploadDialogOpen(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Upload className="w-4 h-4" />
                Upload File
              </Button>
              <Button
                onClick={() => setAppointmentDialogOpen(true)}
                variant="outline"
                className="flex items-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <Calendar className="w-4 h-4" />
                Schedule Meeting
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Chat
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Course Content - Fixed layout with consistent spacing */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {course.weeks.map((week) => (
            <div key={week.weekNumber} className="min-h-[120px]">
              <Card
                className={`
                border-l-4 transition-all duration-300
                ${
                  week.completed
                    ? "border-l-green-500 bg-green-50/50"
                    : "border-l-blue-500 bg-white"
                }
                ${expandedWeeks.has(week.weekNumber) ? "mb-6" : ""}
              `}
              >
                <CardHeader
                  className="p-6 cursor-pointer hover:bg-gray-50/50 transition-colors"
                  onClick={() => toggleWeek(week.weekNumber)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div
                        className={`
                        flex items-center justify-center w-10 h-10 rounded-full mt-1 flex-shrink-0
                        ${
                          week.completed
                            ? "bg-green-100 text-green-600"
                            : "bg-blue-100 text-blue-600"
                        }
                      `}
                      >
                        {expandedWeeks.has(week.weekNumber) ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <CardTitle className="text-xl font-bold text-gray-900 break-words">
                            Week {week.weekNumber}: {week.title}
                          </CardTitle>
                          {week.completed && (
                            <Badge className="bg-green-500 text-white flex-shrink-0">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Completed
                            </Badge>
                          )}
                        </div>
                        <p className="text-gray-600 text-lg leading-relaxed break-words">
                          {week.description}
                        </p>

                        {/* Week Stats */}
                        <div className="flex items-center gap-6 mt-3 text-sm text-gray-500 flex-wrap">
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <FileText className="w-4 h-4" />
                            <span>
                              {
                                week.content.filter(
                                  (item) => item.type === "document"
                                ).length
                              }{" "}
                              documents
                            </span>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {
                                week.content.filter(
                                  (item) => item.type === "appointment"
                                ).length
                              }{" "}
                              meetings
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Fixed: Always render actual button with consistent styling */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          markWeekComplete(week.weekNumber);
                        }}
                        className={`
                          whitespace-nowrap transition-all duration-200
                          ${
                            week.completed
                              ? "bg-green-100 text-green-700 hover:bg-green-200 border-green-200"
                              : "bg-green-600 hover:bg-green-700 text-white"
                          }
                        `}
                        size="sm"
                        variant={week.completed ? "outline" : "default"}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {week.completed ? "Completed" : "Mark Complete"}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* Fixed: Smooth content expansion with max-height transition */}
                <div
                  className={`
                    overflow-hidden transition-all duration-300 ease-in-out
                    ${
                      expandedWeeks.has(week.weekNumber)
                        ? "max-h-[2000px] opacity-100"
                        : "max-h-0 opacity-0"
                    }
                  `}
                >
                  <CardContent className="px-6 pb-6 border-t">
                    {/* Fixed: Pre-render content grid with consistent layout */}
                    <div className="mt-6">
                      {week.content.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500 text-lg">
                            No content added yet for this week
                          </p>
                          <p className="text-gray-400 mt-2">
                            Upload files or schedule meetings to get started
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                          {week.content.map((item) => (
                            <Card
                              key={item.id}
                              className="hover:shadow-md transition-all duration-200 border"
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                  {getFileIcon(item.fileType, item.type)}
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-gray-900 break-words">
                                      {item.title}
                                    </h4>
                                    <p className="text-sm text-gray-500 mt-1">
                                      {item.type === "appointment"
                                        ? `${item.date} • ${item.time} • ${item.duration}min`
                                        : `Uploaded ${item.uploadDate} • ${item.size}`}
                                    </p>
                                    {item.description && (
                                      <p className="text-sm text-gray-600 mt-2 line-clamp-2 break-words">
                                        {item.description}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center justify-between mt-4 pt-3 border-t">
                                  <div className="flex items-center gap-2">
                                    {item.type === "document" && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 whitespace-nowrap"
                                      >
                                        <Download className="w-3 h-3 mr-1" />
                                        Download
                                      </Button>
                                    )}
                                    {item.type === "appointment" && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 whitespace-nowrap"
                                      >
                                        <Calendar className="w-3 h-3 mr-1" />
                                        Join
                                      </Button>
                                    )}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 flex-shrink-0"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Fixed: Consistent button positioning */}
                    <div className="flex gap-3 mt-6 pt-6 border-t flex-wrap">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedWeek(week.weekNumber);
                          setUploadForm((prev) => ({
                            ...prev,
                            week: week.weekNumber,
                          }));
                          setUploadDialogOpen(true);
                        }}
                        className="flex items-center gap-2 whitespace-nowrap"
                      >
                        <Plus className="w-4 h-4" />
                        Add File
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedWeek(week.weekNumber);
                          setAppointmentForm((prev) => ({
                            ...prev,
                            week: week.weekNumber,
                          }));
                          setAppointmentDialogOpen(true);
                        }}
                        className="flex items-center gap-2 whitespace-nowrap"
                      >
                        <Plus className="w-4 h-4" />
                        Schedule Meeting
                      </Button>
                    </div>
                  </CardContent>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Upload File Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload File to Week {selectedWeek}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUploadSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  File Title *
                </label>
                <Input
                  value={uploadForm.title}
                  onChange={(e) =>
                    setUploadForm({ ...uploadForm, title: e.target.value })
                  }
                  placeholder="Enter file title"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
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
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Select File *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PDF, DOC, JPG, PNG (Max 10MB)
                  </p>
                  <Input
                    type="file"
                    className="mt-4"
                    onChange={(e) =>
                      setUploadForm({ ...uploadForm, file: e.target.files[0] })
                    }
                    required
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="submit" className="w-full">
                Upload File
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Schedule Appointment Dialog */}
      <Dialog
        open={appointmentDialogOpen}
        onOpenChange={setAppointmentDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Schedule Meeting for Week {selectedWeek}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAppointmentSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
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
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
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
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Date *
                  </label>
                  <Input
                    type="date"
                    value={appointmentForm.date}
                    onChange={(e) =>
                      setAppointmentForm({
                        ...appointmentForm,
                        date: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Time *
                  </label>
                  <Input
                    type="time"
                    value={appointmentForm.time}
                    onChange={(e) =>
                      setAppointmentForm({
                        ...appointmentForm,
                        time: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Duration
                </label>
                <Select
                  value={appointmentForm.duration.toString()}
                  onValueChange={(value) =>
                    setAppointmentForm({
                      ...appointmentForm,
                      duration: parseInt(value),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                    <SelectItem value="90">90 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="submit" className="w-full">
                Schedule Meeting
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
