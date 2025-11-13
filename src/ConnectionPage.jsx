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
import { Input } from "./components/ui/input";
import { Textarea } from "./components/ui/textarea";
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
import { Badge } from "./components/ui/badge";
import { Checkbox } from "./components/ui/checkbox";
import { API_BASE_URL } from "./Config";
import { getToken } from "./ManageToken";
import { useNavigate } from "react-router";
import {
  Plus,
  BookOpen,
  Target,
  CheckCircle,
  Clock,
  MessageCircle,
  Eye,
  RotateCcw,
} from "lucide-react";

export default function ConnectionsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("");
  const [connections, setConnections] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const connectionsPerPage = 8;
  const navigate = useNavigate();

  const [openCourseModal, setOpenCourseModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [courseForm, setCourseForm] = useState({
    title: "",
    description: "",
    duration: 4,
    userBTeachingSkill: "",
    userATeachingSkill: "",
    justWantToLearn: false,
  });

  // Fetch connections and their course status
  const fetchConnectionsWithCourses = async () => {
    setLoading(true);
    try {
      const [connectionsRes, coursesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/user/connections`, {
          headers: { auth: getToken() },
        }),
        fetch(`${API_BASE_URL}/courses/my-courses?status=all`, {
          headers: { auth: getToken() },
        }),
      ]);

      const connectionsData = await connectionsRes.json();
      const coursesData = await coursesRes.json();

      if (!connectionsRes.ok)
        throw new Error(
          connectionsData.message || "Failed to fetch connections"
        );
      if (!coursesRes.ok)
        throw new Error(coursesData.message || "Failed to fetch courses");

      // Validate data structure
      if (!connectionsData.data?.connections) {
        throw new Error("Invalid connections data received");
      }

      // Ensure courses data is an array
      let coursesArray = [];
      if (coursesData.data && Array.isArray(coursesData.data.courses)) {
        coursesArray = coursesData.data.courses;
      } else if (Array.isArray(coursesData.data)) {
        coursesArray = coursesData.data;
      } else if (
        coursesData.data?.courses &&
        Array.isArray(coursesData.data.courses)
      ) {
        coursesArray = coursesData.data.courses;
      }

      // Map course status to connections
      const connectionsWithCourseStatus = connectionsData.data.connections.map(
        (connection) => {
          const existingCourses = coursesArray.filter((course) => {
            const userAId = course.userA?._id || course.userA;
            const userBId = course.userB?._id || course.userB;
            const connectionId = connection._id;

            return userAId === connectionId || userBId === connectionId;
          });

          return {
            ...connection,
            existingCourses: existingCourses,
            courseStatus: getCourseStatus(existingCourses),
          };
        }
      );

      setConnections(connectionsWithCourseStatus);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnectionsWithCourses();
  }, []);

  // Improved course status detection
  const getCourseStatus = (courses) => {
    if (!courses || courses.length === 0) {
      return "none";
    }

    // Check for active courses first
    const activeCourse = courses.find((course) => course.status === "active");
    if (activeCourse) return "active";

    // Then check for pending courses
    const pendingCourse = courses.find((course) => course.status === "pending");
    if (pendingCourse) return "pending";

    // Then check for completed courses
    const completedCourse = courses.find(
      (course) => course.status === "completed"
    );
    if (completedCourse) return "completed";

    // Check for other statuses
    const rejectedCourse = courses.find(
      (course) => course.status === "rejected"
    );
    if (rejectedCourse) return "rejected";

    const cancelledCourse = courses.find(
      (course) => course.status === "cancelled"
    );
    if (cancelledCourse) return "cancelled";

    return "none";
  };

  // Get user's teaching skills for dropdown
  const getUserTeachingSkills = (user) => {
    if (!user || !user.teachingSkills || user.teachingSkills.length === 0)
      return [];
    return user.teachingSkills;
  };

  // Get user's learning skills for dropdown
  const getUserLearningSkills = (user) => {
    if (!user || !user.learningSkills || user.learningSkills.length === 0)
      return [];
    return user.learningSkills;
  };

  const filteredConnections = connections.filter((c) => {
    const matchesSearch = c.fullName
      .toLowerCase()
      .includes(search.toLowerCase());

    // Check both teaching and learning skills for category/level filters
    const allTeachingSkills = c.teachingSkills || [];
    const allLearningSkills = c.learningSkills || [];
    const allSkills = [...allTeachingSkills, ...allLearningSkills];

    const matchesCategory = category
      ? allSkills.some(
          (s) => s.category?.toLowerCase() === category.toLowerCase()
        )
      : true;
    const matchesLevel = level
      ? allSkills.some((s) => s.level?.toLowerCase() === level.toLowerCase())
      : true;
    return matchesSearch && matchesCategory && matchesLevel;
  });

  const totalPages = Math.ceil(filteredConnections.length / connectionsPerPage);
  const startIndex = (currentPage - 1) * connectionsPerPage;
  const currentConnections = filteredConnections.slice(
    startIndex,
    startIndex + connectionsPerPage
  );

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const openCreateCourseModal = (user) => {
    // Check if there's already a pending or active course
    const hasActiveCourse = user.existingCourses?.some(
      (course) => course.status === "active" || course.status === "pending"
    );

    if (hasActiveCourse) {
      const activeCourse = user.existingCourses.find(
        (course) => course.status === "active" || course.status === "pending"
      );

      if (activeCourse.status === "pending") {
        toast.error(
          `You already have a pending course proposal with ${user.fullName}`
        );
      } else {
        toast.error(`You already have an active course with ${user.fullName}`);
      }
      return;
    }

    setSelectedUser(user);

    // Get skills for both users
    const userTeachingSkills = getUserTeachingSkills(user);
    const userLearningSkills = getUserLearningSkills(user);

    // Set default values - select first available skill for each
    const defaultUserBTeachingSkill =
      userTeachingSkills.length > 0 ? userTeachingSkills[0].name : "";
    const defaultUserATeachingSkill =
      userLearningSkills.length > 0 ? userLearningSkills[0].name : "";

    setCourseForm({
      title: "",
      description: "",
      duration: 4,
      userBTeachingSkill: defaultUserBTeachingSkill,
      userATeachingSkill: defaultUserATeachingSkill,
      justWantToLearn: false,
    });
    setOpenCourseModal(true);
  };

  const handleCreateCourse = async () => {
    if (!courseForm.title.trim()) {
      toast.error("Please enter a course title");
      return;
    }

    if (!courseForm.userBTeachingSkill) {
      toast.error("Please select what the other user will teach you");
      return;
    }

    if (!courseForm.justWantToLearn && !courseForm.userATeachingSkill) {
      toast.error(
        "Please select what you will teach, or check 'I just want to learn'"
      );
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/courses/propose`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          auth: getToken(),
        },
        body: JSON.stringify({
          userBId: selectedUser._id,
          title: courseForm.title,
          description: courseForm.description,
          duration: courseForm.duration,
          userBTeachingSkill: courseForm.userBTeachingSkill,
          userATeachingSkill: courseForm.justWantToLearn
            ? ""
            : courseForm.userATeachingSkill,
          justWantToLearn: courseForm.justWantToLearn,
        }),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Failed to create course proposal");

      toast.success("Course proposal sent successfully!");
      setOpenCourseModal(false);
      setCourseForm({
        title: "",
        description: "",
        duration: 4,
        userBTeachingSkill: "",
        userATeachingSkill: "",
        justWantToLearn: false,
      });

      // Refresh data to show the new pending course
      setTimeout(() => {
        fetchConnectionsWithCourses();
      }, 1000);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleViewCourse = (user) => {
    const activeCourse = user.existingCourses?.find(
      (course) =>
        course.status === "active" ||
        course.status === "pending" ||
        course.status === "completed"
    );

    if (activeCourse) {
      navigate(`/courses/${activeCourse._id}`);
    }
  };

  const getCourseStatusBadge = (user) => {
    switch (user.courseStatus) {
      case "active":
        return (
          <Badge
            variant="default"
            className="bg-green-100 text-green-800 border-green-300 text-xs font-medium py-1 px-2"
          >
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </Badge>
        );
      case "pending":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-100 text-yellow-800 border-yellow-300 text-xs font-medium py-1 px-2"
          >
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      // UPDATED: Show "No Active Course" when status is completed
      case "completed":
        return (
          <Badge
            variant="outline"
            className="bg-gray-100 text-gray-600 border-gray-300 text-xs font-medium py-1 px-2"
          >
            <Clock className="w-3 h-3 mr-1" />
            No Active Course
          </Badge>
        );
      case "rejected":
        return (
          <Badge
            variant="outline"
            className="bg-red-100 text-red-800 border-red-300 text-xs font-medium py-1 px-2"
          >
            <Clock className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      case "cancelled":
        return (
          <Badge
            variant="outline"
            className="bg-gray-100 text-gray-800 border-gray-300 text-xs font-medium py-1 px-2"
          >
            <Clock className="w-3 h-3 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return null;
    }
  };

  const getCourseButton = (user) => {
    // Check if there are any active or pending courses
    const hasActiveOrPendingCourse = user.existingCourses?.some(
      (course) => course.status === "active" || course.status === "pending"
    );

    // If there's an active or pending course, show the appropriate button
    if (hasActiveOrPendingCourse) {
      const activeCourse = user.existingCourses.find(
        (course) => course.status === "active" || course.status === "pending"
      );

      if (activeCourse.status === "active") {
        return (
          <Button
            className="w-full px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
            onClick={() => handleViewCourse(user)}
          >
            <BookOpen className="w-4 h-4 mr-1" />
            Continue Course
          </Button>
        );
      } else if (activeCourse.status === "pending") {
        return (
          <Button
            className="w-full px-4 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
            onClick={() => handleViewCourse(user)}
          >
            <Clock className="w-4 h-4 mr-1" />
            View Proposal
          </Button>
        );
      }
    }

    // UPDATED: Removed the specific "completed" check.
    // Now, if a course is completed (or rejected/cancelled/none), it falls through here.
    // This renders the "Propose Course" button.
    // Combined with the "Visit Profile" button in the main return, you get exactly two buttons.

    return (
      <Button
        className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
        onClick={() => openCreateCourseModal(user)}
      >
        <Plus className="w-4 h-4 mr-1" />
        Propose Course
      </Button>
    );
  };

  return (
    <>
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Manage Courses with Your Connections
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto">
            Continue existing courses or start new learning journeys with your
            connections.
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="px-4 sm:px-6 md:px-3 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 w-full max-w-7xl mx-auto mt-6">
        <div className="w-full md:flex-1">
          <Input
            placeholder="Search connections by name or skill..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full h-14 rounded-xl border border-gray-300 shadow-sm px-5 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        <div className="flex flex-wrap gap-3 mt-3 md:mt-0 w-full md:w-auto">
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="h-14 flex-1 md:flex-none rounded-xl border border-gray-300 shadow-sm px-4 text-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          >
            <option value="">All Categories</option>
            <option value="Math">Math</option>
            <option value="Science">Science</option>
            <option value="Languages">Languages</option>
            <option value="Arts">Arts</option>
            <option value="Music">Music</option>
            <option value="Sports">Sports</option>
            <option value="Technology">Technology</option>
            <option value="Business">Business</option>
            <option value="Health">Health</option>
            <option value="Other">Other</option>
          </select>

          <select
            value={level}
            onChange={(e) => {
              setLevel(e.target.value);
              setCurrentPage(1);
            }}
            className="h-14 flex-1 md:flex-none rounded-xl border border-gray-300 shadow-sm px-4 text-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          >
            <option value="">All Levels</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
            <option value="Expert">Expert</option>
          </select>
        </div>
      </div>

      {/* Connections Grid */}
      <div className="flex flex-col min-h-screen p-4 md:p-6 bg-gray-50">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto w-full">
              {currentConnections.map((user) => {
                const teachingSkills = user.teachingSkills || [];
                const learningSkills = user.learningSkills || [];
                const hasTeachingSkills = teachingSkills.length > 0;
                const hasLearningSkills = learningSkills.length > 0;

                return (
                  <Card
                    key={user._id}
                    className="flex flex-col w-full min-w-[320px] rounded-2xl border border-gray-200 bg-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 min-h-[480px] relative overflow-hidden"
                  >
                    {/* Course Status Badge - Top Right */}
                    {user.courseStatus !== "none" && (
                      <div className="absolute top-4 right-4 z-10">
                        {getCourseStatusBadge(user)}
                      </div>
                    )}

                    {/* Background Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 to-purple-50/20"></div>

                    <div className="relative flex flex-col items-center space-y-4 w-full p-6 flex-1">
                      <img
                        src={`${API_BASE_URL}/user_avatar/${user.avatar}`}
                        alt={user.fullName}
                        className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                      />
                      <CardHeader className="w-full text-center p-0">
                        <CardTitle className="text-xl font-bold capitalize text-gray-900">
                          {user.fullName}
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="p-0 w-full flex-1 flex flex-col justify-center">
                        <CardDescription>
                          <div className="flex flex-col items-center w-full space-y-4">
                            {/* Teaching Skills */}
                            <div className="w-full">
                              <div className="flex items-center gap-2 text-blue-700 font-semibold w-full justify-center mb-3">
                                <BookOpen className="w-5 h-5" />
                                <span className="text-base">Teaching</span>
                              </div>
                              {hasTeachingSkills ? (
                                <div className="flex flex-wrap gap-2 justify-center">
                                  {teachingSkills
                                    .slice(0, 3)
                                    .map((skill, idx) => (
                                      <span
                                        key={`teach-${idx}`}
                                        className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full text-sm font-medium border border-blue-200 break-words max-w-full shadow-sm"
                                      >
                                        {skill.name} ({skill.level})
                                      </span>
                                    ))}
                                  {teachingSkills.length > 3 && (
                                    <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">
                                      +{teachingSkills.length - 3} more
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <p className="text-gray-500 italic text-sm bg-gray-100 px-4 py-2 rounded-lg border border-gray-200 text-center">
                                  No teaching skills listed
                                </p>
                              )}
                            </div>

                            {/* Learning Skills */}
                            <div className="w-full">
                              <div className="flex items-center gap-2 text-green-700 font-semibold w-full justify-center mb-3">
                                <Target className="w-5 h-5" />
                                <span className="text-base">Learning</span>
                              </div>
                              {hasLearningSkills ? (
                                <div className="flex flex-wrap gap-2 justify-center">
                                  {learningSkills
                                    .slice(0, 3)
                                    .map((skill, idx) => (
                                      <span
                                        key={`learn-${idx}`}
                                        className="bg-green-100 text-green-800 px-3 py-1.5 rounded-full text-sm font-medium border border-green-200 break-words max-w-full shadow-sm"
                                      >
                                        {skill.name} ({skill.level})
                                      </span>
                                    ))}
                                  {learningSkills.length > 3 && (
                                    <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">
                                      +{learningSkills.length - 3} more
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <p className="text-gray-500 italic text-sm bg-gray-100 px-4 py-2 rounded-lg border border-gray-200 text-center">
                                  No learning goals set
                                </p>
                              )}
                            </div>
                          </div>
                        </CardDescription>
                      </CardContent>
                    </div>

                    <div className="relative p-6 pt-0 flex flex-col gap-3 justify-center w-full">
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          className="flex-1 px-4 py-2.5 border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700 text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md rounded-lg"
                          onClick={() => navigate(`/profile-info/${user._id}`)}
                        >
                          Visit Profile
                        </Button>

                        {/* Course button - layout handled in getCourseButton */}
                        <div className="flex-1">{getCourseButton(user)}</div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-wrap justify-center mt-8 gap-2">
                <Button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  variant="outline"
                  className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105"
                >
                  Prev
                </Button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <Button
                    key={i}
                    variant={currentPage === i + 1 ? "default" : "outline"}
                    onClick={() => goToPage(i + 1)}
                    className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105"
                  >
                    {i + 1}
                  </Button>
                ))}
                <Button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Course Modal */}
      <Dialog open={openCourseModal} onOpenChange={setOpenCourseModal}>
        <DialogContent className="w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <BookOpen className="w-6 h-6 text-blue-600" />
              Create Course Proposal
            </DialogTitle>
            <DialogDescription>
              Propose a structured learning course with {selectedUser?.fullName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Course Basics */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                Course Basics
              </h3>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Course Title *
                </label>
                <Input
                  value={courseForm.title}
                  onChange={(e) =>
                    setCourseForm({ ...courseForm, title: e.target.value })
                  }
                  placeholder="e.g., Python Fundamentals, Advanced Calculus, Spanish Conversation"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Description
                </label>
                <Textarea
                  value={courseForm.description}
                  onChange={(e) =>
                    setCourseForm({
                      ...courseForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Describe what this course will cover and what students will achieve..."
                  rows={3}
                  className="w-full resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Duration (Weeks) *
                </label>
                <Select
                  value={courseForm.duration.toString()}
                  onValueChange={(value) =>
                    setCourseForm({
                      ...courseForm,
                      duration: parseInt(value),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Week</SelectItem>
                    <SelectItem value="2">2 Weeks</SelectItem>
                    <SelectItem value="3">3 Weeks</SelectItem>
                    <SelectItem value="4">4 Weeks</SelectItem>
                    <SelectItem value="5">5 Weeks</SelectItem>
                    <SelectItem value="6">6 Weeks</SelectItem>
                    <SelectItem value="7">7 Weeks</SelectItem>
                    <SelectItem value="8">8 Weeks</SelectItem>
                    <SelectItem value="9">9 Weeks</SelectItem>
                    <SelectItem value="10">10 Weeks</SelectItem>
                    <SelectItem value="11">11 Weeks</SelectItem>
                    <SelectItem value="12">12 Weeks</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Skills Selection */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-green-600" />
                Skills Exchange
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {selectedUser?.fullName} will teach you: *
                  </label>
                  <Select
                    value={courseForm.userBTeachingSkill}
                    onValueChange={(value) =>
                      setCourseForm({
                        ...courseForm,
                        userBTeachingSkill: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select skill" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedUser &&
                      getUserTeachingSkills(selectedUser).length > 0 ? (
                        getUserTeachingSkills(selectedUser).map((skill) => (
                          <SelectItem key={skill.name} value={skill.name}>
                            {skill.name} ({skill.level})
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled>
                          No teaching skills available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    You will teach {selectedUser?.fullName}:
                  </label>
                  <Select
                    value={courseForm.userATeachingSkill}
                    onValueChange={(value) =>
                      setCourseForm({
                        ...courseForm,
                        userATeachingSkill: value,
                      })
                    }
                    disabled={courseForm.justWantToLearn}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          courseForm.justWantToLearn
                            ? "N/A (One-way learning)"
                            : "Select skill"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedUser &&
                      getUserLearningSkills(selectedUser).length > 0 ? (
                        getUserLearningSkills(selectedUser).map((skill) => (
                          <SelectItem key={skill.name} value={skill.name}>
                            {skill.name} ({skill.level})
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled>
                          No suitable skills available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="justLearn"
                  checked={courseForm.justWantToLearn}
                  onCheckedChange={(checked) =>
                    setCourseForm({
                      ...courseForm,
                      justWantToLearn: checked,
                      userATeachingSkill: checked
                        ? ""
                        : courseForm.userATeachingSkill,
                    })
                  }
                />
                <label
                  htmlFor="justLearn"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I just want to learn (One-way course)
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpenCourseModal(false)}
              className="mr-2"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCourse}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Send Proposal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
