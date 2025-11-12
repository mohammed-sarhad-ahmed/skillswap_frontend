import React, { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Badge } from "./components/ui/badge";
import { API_BASE_URL } from "./Config";
import { getToken, getUserId } from "./ManageToken"; // Add getUserId function
import { useNavigate } from "react-router";
import {
  BookOpen,
  CheckCircle,
  Clock,
  X,
  Search,
  ChevronDown,
  ChevronUp,
  Eye,
  Calendar,
  User,
  Users,
  FileText,
  BarChart3,
  Target,
  MessageCircle,
  Zap,
  ArrowLeft,
  CheckSquare,
  XCircle,
  PlayCircle,
  PauseCircle,
  Filter,
} from "lucide-react";

export default function CourseManagementPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [sortConfig] = useState({
    key: "createdAt",
    direction: "desc",
  });
  const navigate = useNavigate();

  // Get current user ID on component mount
  useEffect(() => {
    const userId = getUserId(); // You need to implement this function
    setCurrentUserId(userId);
  }, []);

  // Fetch courses
  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/courses/my-courses?status=all`, {
        headers: { auth: getToken() },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch courses");

      let coursesArray = [];
      if (data.data && Array.isArray(data.data.courses)) {
        coursesArray = data.data.courses;
      } else if (Array.isArray(data.data)) {
        coursesArray = data.data;
      } else if (data.data?.courses && Array.isArray(data.data.courses)) {
        coursesArray = data.data.courses;
      }

      setCourses(coursesArray);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Check if current user is the proposer of the course
  const isCurrentUserProposer = (course) => {
    return course.proposedBy === currentUserId;
  };

  // Check if current user can accept/reject this course
  const canAcceptOrReject = (course) => {
    return course.status === "pending" && !isCurrentUserProposer(course);
  };

  // Sort courses
  const sortedCourses = [...courses].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === "asc" ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === "asc" ? 1 : -1;
    }
    return 0;
  });

  // Filter courses
  const filteredCourses = sortedCourses.filter((course) => {
    const matchesSearch =
      course.title?.toLowerCase().includes(search.toLowerCase()) ||
      course.description?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || course.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Get status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        color: "bg-amber-50 text-amber-800 border-amber-200",
        icon: Clock,
        label: "Pending",
      },
      active: {
        color: "bg-emerald-50 text-emerald-800 border-emerald-200",
        icon: CheckCircle,
        label: "Active",
      },
      completed: {
        color: "bg-blue-50 text-blue-800 border-blue-200",
        icon: CheckCircle,
        label: "Completed",
      },
      rejected: {
        color: "bg-red-50 text-red-800 border-red-200",
        icon: X,
        label: "Rejected",
      },
      cancelled: {
        color: "bg-gray-50 text-gray-800 border-gray-200",
        icon: X,
        label: "Cancelled",
      },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const IconComponent = config.icon;

    return (
      <Badge
        variant="outline"
        className={`${config.color} text-xs font-semibold py-1 px-2 rounded-full border`}
      >
        <IconComponent className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  // Get exchange type display
  const getExchangeTypeDisplay = (course) => {
    if (course.justWantToLearn) {
      return {
        label: "One-Way",
        color: "text-purple-600 bg-purple-50 border-purple-200",
        icon: Target,
      };
    }
    return {
      label: "Exchange",
      color: "text-cyan-600 bg-cyan-50 border-cyan-200",
      icon: Zap,
    };
  };

  // Handle course actions
  const handleCourseAction = async (courseId, action) => {
    try {
      const res = await fetch(`${API_BASE_URL}/courses/${courseId}/${action}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          auth: getToken(),
        },
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || `Failed to ${action} course`);

      toast.success(`Course ${action}ed successfully!`);
      fetchCourses();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Navigate to course page
  const viewCourse = (courseId) => {
    navigate(`/courses/${courseId}`);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Get participant initials
  const getInitials = (name) => {
    return name
      ? name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
      : "?";
  };

  // Responsive Table Row Component
  const TableRow = ({ course }) => {
    const exchangeType = getExchangeTypeDisplay(course);
    const ExchangeIcon = exchangeType.icon;
    const userCanAcceptOrReject = canAcceptOrReject(course);
    const userIsProposer = isCurrentUserProposer(course);

    return (
      <>
        {/* Desktop Table Row */}
        <tr className="hidden md:table-row hover:bg-gray-50/50 transition-all duration-200">
          <td className="px-4 py-4 lg:px-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                  <h3 className="text-base font-semibold text-gray-900 truncate">
                    {course.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`${exchangeType.color} border rounded-full text-xs font-semibold py-1 px-2`}
                    >
                      <ExchangeIcon className="w-3 h-3 mr-1" />
                      {exchangeType.label}
                    </Badge>
                    {userIsProposer && (
                      <Badge
                        variant="outline"
                        className="bg-purple-50 text-purple-700 border-purple-200 text-xs font-semibold py-1 px-2 rounded-full"
                      >
                        <User className="w-3 h-3 mr-1" />
                        Proposed by you
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                  {course.description || "No description provided."}
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(course.createdAt)}
                  </div>
                </div>
              </div>
            </div>
          </td>
          <td className="px-4 py-4 lg:px-6">
            <div className="flex items-center space-x-3">
              <div className="flex -space-x-2">
                <div
                  className={`w-8 h-8 rounded-full border-2 border-white shadow flex items-center justify-center text-white text-xs font-bold ${
                    userIsProposer
                      ? "bg-gradient-to-br from-purple-500 to-purple-600"
                      : "bg-gradient-to-br from-blue-500 to-blue-600"
                  }`}
                >
                  {getInitials(course.userA?.fullName)}
                </div>
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full border-2 border-white shadow flex items-center justify-center text-white text-xs font-bold">
                  {getInitials(course.userB?.fullName)}
                </div>
              </div>
              <div className="min-w-0 hidden sm:block">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {course.userA?.fullName}
                  {userIsProposer && " (You)"}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {course.userB?.fullName}
                </p>
              </div>
            </div>
          </td>
          <td className="px-4 py-4 lg:px-6">{getStatusBadge(course.status)}</td>
          <td className="px-4 py-4 lg:px-6">
            <div className="flex items-center text-sm font-semibold text-gray-900">
              <Calendar className="w-4 h-4 mr-2 text-blue-500" />
              {course.duration}w
            </div>
          </td>
          <td className="px-4 py-4 lg:px-6">
            <div className="flex flex-col space-y-2">
              <Button
                onClick={() => viewCourse(course._id)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <Eye className="w-4 h-4 mr-1" />
                View
              </Button>

              {/* Only show accept/reject buttons if user can accept/reject */}
              {userCanAcceptOrReject && (
                <div className="flex space-x-1">
                  <Button
                    onClick={() => handleCourseAction(course._id, "accept")}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white px-2 py-1 rounded text-xs transition-all duration-200"
                  >
                    <CheckSquare className="w-3 h-3 mr-1" />
                    Accept
                  </Button>
                  <Button
                    onClick={() => handleCourseAction(course._id, "reject")}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs transition-all duration-200"
                  >
                    <XCircle className="w-3 h-3 mr-1" />
                    Reject
                  </Button>
                </div>
              )}

              {/* Show waiting message if user is proposer and course is pending */}
              {course.status === "pending" && userIsProposer && (
                <div className="text-xs text-gray-500 text-center py-1">
                  Waiting for response
                </div>
              )}
            </div>
          </td>
        </tr>

        {/* Mobile Card View */}
        <div className="md:hidden bg-white rounded-lg border border-gray-200 p-4 mb-3 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start space-x-3 flex-1">
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-gray-900 mb-1">
                  {course.title}
                </h3>
                <div className="flex flex-wrap gap-2 mb-2">
                  {getStatusBadge(course.status)}
                  <Badge
                    variant="outline"
                    className={`${exchangeType.color} border rounded-full text-xs font-semibold py-1 px-2`}
                  >
                    <ExchangeIcon className="w-3 h-3 mr-1" />
                    {exchangeType.label}
                  </Badge>
                  {userIsProposer && (
                    <Badge
                      variant="outline"
                      className="bg-purple-50 text-purple-700 border-purple-200 text-xs font-semibold py-1 px-2 rounded-full"
                    >
                      <User className="w-3 h-3 mr-1" />
                      Proposed by you
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {course.description || "No description provided."}
          </p>

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="flex -space-x-2">
                <div
                  className={`w-8 h-8 rounded-full border-2 border-white shadow flex items-center justify-center text-white text-xs font-bold ${
                    userIsProposer
                      ? "bg-gradient-to-br from-purple-500 to-purple-600"
                      : "bg-gradient-to-br from-blue-500 to-blue-600"
                  }`}
                >
                  {getInitials(course.userA?.fullName)}
                </div>
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full border-2 border-white shadow flex items-center justify-center text-white text-xs font-bold">
                  {getInitials(course.userB?.fullName)}
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <div className="font-medium">
                  {course.userA?.fullName}
                  {userIsProposer && " (You)"}
                </div>
                <div className="text-xs">{course.userB?.fullName}</div>
              </div>
            </div>
            <div className="flex items-center text-sm font-semibold text-gray-900">
              <Calendar className="w-4 h-4 mr-1 text-blue-500" />
              {course.duration}w
            </div>
          </div>

          <div className="flex space-x-2">
            <Button
              onClick={() => viewCourse(course._id)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm"
            >
              <Eye className="w-4 h-4 mr-1" />
              View Course
            </Button>

            {/* Only show accept/reject buttons if user can accept/reject */}
            {userCanAcceptOrReject && (
              <>
                <Button
                  onClick={() => handleCourseAction(course._id, "accept")}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-lg"
                >
                  <CheckSquare className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => handleCourseAction(course._id, "reject")}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg"
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </>
            )}

            {/* Show waiting message if user is proposer and course is pending */}
            {course.status === "pending" && userIsProposer && (
              <div className="flex-1 text-xs text-gray-500 text-center flex items-center justify-center">
                Waiting for response
              </div>
            )}
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Course Management
            </h1>
            <p className="mt-2 text-gray-600">
              Manage your learning exchanges and collaborations
            </p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              <Input
                placeholder="Search courses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 w-full border border-gray-300 bg-white rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex gap-3">
            <div className="relative flex-1 sm:flex-none">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2.5 sm:py-3 border border-gray-300 bg-white rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 appearance-none w-full sm:w-40"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Courses Table */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No courses found
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              {search || statusFilter !== "all"
                ? "No courses match your current filters."
                : "You don't have any courses yet."}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 lg:px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Course Details
                    </th>
                    <th className="px-4 py-3 lg:px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Participants
                    </th>
                    <th className="px-4 py-3 lg:px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 lg:px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-4 py-3 lg:px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCourses.map((course) => (
                    <TableRow key={course._id} course={course} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden p-4 space-y-3">
              {filteredCourses.map((course) => (
                <TableRow key={course._id} course={course} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
