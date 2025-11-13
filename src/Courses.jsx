import React, { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Badge } from "./components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { API_BASE_URL } from "./Config";
import { getToken, getUserId } from "./ManageToken";
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
  TrendingUp,
  Award,
  Clock4,
  Bookmark,
  PieChart,
  Activity,
  Target as TargetIcon,
  Calendar as CalendarIcon,
} from "lucide-react";

// Import Recharts for charts
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

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
  const [showAnalytics, setShowAnalytics] = useState(false);
  const navigate = useNavigate();

  // Get current user ID on component mount
  useEffect(() => {
    const userId = getUserId();
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

  // Analytics Data Calculations
  const getAnalyticsData = () => {
    const totalCourses = courses.length;
    const activeCourses = courses.filter((c) => c.status === "active").length;
    const completedCourses = courses.filter(
      (c) => c.status === "completed"
    ).length;
    const pendingCourses = courses.filter((c) => c.status === "pending").length;
    const otherCourses = courses.filter(
      (c) => !["active", "completed", "pending"].includes(c.status)
    ).length;

    // Status distribution for pie chart
    const statusData = [
      { name: "Active", value: activeCourses, color: "#10b981" },
      { name: "Completed", value: completedCourses, color: "#3b82f6" },
      { name: "Pending", value: pendingCourses, color: "#f59e0b" },
      { name: "Other", value: otherCourses, color: "#6b7280" },
    ];

    // Course Duration Distribution (1-12 weeks only)
    const durationRanges = [
      { range: "1-3 weeks", min: 1, max: 3, color: "#10b981" },
      { range: "4-6 weeks", min: 4, max: 6, color: "#3b82f6" },
      { range: "7-9 weeks", min: 7, max: 9, color: "#f59e0b" },
      { range: "10-12 weeks", min: 10, max: 12, color: "#ef4444" },
    ];

    const durationData = durationRanges.map((range) => {
      const count = courses.filter((course) => {
        const duration = course.duration || 0;
        return duration >= range.min && duration <= range.max;
      }).length;
      return {
        range: range.range,
        count: count,
        color: range.color,
      };
    });

    // Exchange type distribution
    const exchangeTypeData = [
      {
        name: "Mutual Exchange",
        value: courses.filter((c) => !c.justWantToLearn).length,
        color: "#8b5cf6",
      },
      {
        name: "One-Way Learning",
        value: courses.filter((c) => c.justWantToLearn).length,
        color: "#06b6d4",
      },
    ];

    // Duration statistics
    const averageDuration =
      courses.length > 0
        ? Math.round(
            courses.reduce((sum, c) => sum + (c.duration || 0), 0) /
              courses.length
          )
        : 0;

    return {
      totalCourses,
      activeCourses,
      completedCourses,
      pendingCourses,
      statusData,
      durationData,
      exchangeTypeData,
      averageDuration,
      completionRate:
        totalCourses > 0
          ? Math.round((completedCourses / totalCourses) * 100)
          : 0,
    };
  };

  const analytics = getAnalyticsData();

  // Custom label renderer for pie charts with responsive text
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    name,
  }) => {
    if (percent < 0.05) return null;

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize={10}
        fontWeight="bold"
        stroke="rgba(0,0,0,0.5)"
        strokeWidth={2}
        strokeLinejoin="round"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

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

  // Analytics Cards Component
  const AnalyticsCards = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
      <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-xs md:text-sm font-medium">
                Total Courses
              </p>
              <p className="text-2xl md:text-3xl font-bold mt-1 md:mt-2">
                {analytics.totalCourses}
              </p>
            </div>
            <BookOpen className="w-6 h-6 md:w-8 md:h-8 text-blue-200" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-xs md:text-sm font-medium">
                Active Courses
              </p>
              <p className="text-2xl md:text-3xl font-bold mt-1 md:mt-2">
                {analytics.activeCourses}
              </p>
            </div>
            <Activity className="w-6 h-6 md:w-8 md:h-8 text-emerald-200" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-xs md:text-sm font-medium">
                Completion Rate
              </p>
              <p className="text-2xl md:text-3xl font-bold mt-1 md:mt-2">
                {analytics.completionRate}%
              </p>
            </div>
            <Award className="w-6 h-6 md:w-8 md:h-8 text-purple-200" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-cyan-100 text-xs md:text-sm font-medium">
                Avg Duration
              </p>
              <p className="text-2xl md:text-3xl font-bold mt-1 md:mt-2">
                {analytics.averageDuration}w
              </p>
            </div>
            <Clock4 className="w-6 h-6 md:w-8 md:h-8 text-cyan-200" />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Charts Component - UPDATED with 1-12 week duration ranges
  const AnalyticsCharts = () => (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
      {/* Status Distribution Pie Chart */}
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <PieChart className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
            Course Status
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-64 sm:h-72 md:h-80">
            <ResponsiveContainer width="100%" height="100%" debounce={1}>
              <RechartsPieChart>
                <Pie
                  data={analytics.statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={80}
                  innerRadius={40}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={2}
                >
                  {analytics.statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [value, name]}
                  wrapperStyle={{ outline: "none", fontSize: "12px" }}
                  contentStyle={{
                    borderRadius: "8px",
                    fontSize: "12px",
                    padding: "8px",
                  }}
                />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  wrapperStyle={{
                    paddingTop: "10px",
                    fontSize: "11px",
                    display: "flex",
                    justifyContent: "center",
                    flexWrap: "wrap",
                    gap: "8px",
                  }}
                  iconSize={8}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
          {/* Summary for mobile */}
          <div className="mt-3 md:mt-4 grid grid-cols-2 gap-2 text-xs">
            {analytics.statusData.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-gray-50 rounded"
              >
                <div className="flex items-center">
                  <div
                    className="w-2 h-2 md:w-3 md:h-3 rounded-full mr-2"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-medium truncate">{item.name}</span>
                </div>
                <span className="font-bold text-xs ml-1">
                  {item.value} (
                  {((item.value / analytics.totalCourses) * 100).toFixed(0)}%)
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Course Duration Distribution - UPDATED for 1-12 weeks */}
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Clock4 className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
            Course Duration
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-64 sm:h-72 md:h-80">
            <ResponsiveContainer width="100%" height="100%" debounce={1}>
              <BarChart
                data={analytics.durationData}
                margin={{ top: 20, right: 10, left: 0, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="range"
                  fontSize={10}
                  tick={{ fill: "#374151" }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis fontSize={10} tick={{ fill: "#374151" }} />
                <Tooltip
                  wrapperStyle={{ outline: "none", fontSize: "12px" }}
                  contentStyle={{
                    borderRadius: "8px",
                    fontSize: "12px",
                    padding: "8px",
                  }}
                  formatter={(value) => [`${value} courses`, "Count"]}
                  labelFormatter={(label) => `Duration: ${label}`}
                />
                <Bar dataKey="count" name="Courses" radius={[2, 2, 0, 0]}>
                  {analytics.durationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Summary for mobile */}
          <div className="mt-3 md:mt-4 grid grid-cols-2 gap-2 text-xs">
            {analytics.durationData.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-gray-50 rounded"
              >
                <div className="flex items-center">
                  <div
                    className="w-2 h-2 md:w-3 md:h-3 rounded-full mr-2"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-medium truncate">{item.range}</span>
                </div>
                <span className="font-bold text-xs ml-1">
                  {item.count} (
                  {((item.count / analytics.totalCourses) * 100).toFixed(0)}%)
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Exchange Type Distribution */}
      <Card className="w-full xl:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <TargetIcon className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
            Exchange Types
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-64 sm:h-72 md:h-80">
            <ResponsiveContainer width="100%" height="100%" debounce={1}>
              <RechartsPieChart>
                <Pie
                  data={analytics.exchangeTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={80}
                  innerRadius={40}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={2}
                >
                  {analytics.exchangeTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [value, name]}
                  wrapperStyle={{ outline: "none", fontSize: "12px" }}
                  contentStyle={{
                    borderRadius: "8px",
                    fontSize: "12px",
                    padding: "8px",
                  }}
                />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  wrapperStyle={{
                    paddingTop: "10px",
                    fontSize: "11px",
                    display: "flex",
                    justifyContent: "center",
                    flexWrap: "wrap",
                    gap: "8px",
                  }}
                  iconSize={8}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
          {/* Summary for mobile */}
          <div className="mt-3 md:mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {analytics.exchangeTypeData.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center">
                  <div
                    className="w-3 h-3 md:w-4 md:h-4 rounded-full mr-3"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-semibold text-sm">{item.name}</span>
                </div>
                <span className="font-bold text-sm md:text-lg">
                  {item.value} (
                  {((item.value / analytics.totalCourses) * 100).toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

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
                  <h3 className="text-base font-semibold text-gray-900 break-words max-w-full">
                    {course.title}
                  </h3>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge
                      variant="outline"
                      className={`${exchangeType.color} border rounded-full text-xs font-semibold py-1 px-2 whitespace-nowrap`}
                    >
                      <ExchangeIcon className="w-3 h-3 mr-1" />
                      {exchangeType.label}
                    </Badge>
                    {userIsProposer && (
                      <Badge
                        variant="outline"
                        className="bg-purple-50 text-purple-700 border-purple-200 text-xs font-semibold py-1 px-2 rounded-full whitespace-nowrap"
                      >
                        <User className="w-3 h-3 mr-1" />
                        Proposed by you
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600 break-words leading-relaxed max-w-full">
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
                <p className="text-sm font-medium text-gray-900 break-words">
                  {course.userA?.fullName}
                  {userIsProposer && " (You)"}
                </p>
                <p className="text-sm text-gray-500 break-words">
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
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap"
              >
                <Eye className="w-4 h-4 mr-1" />
                View
              </Button>

              {/* Only show accept/reject buttons if user can accept/reject */}
              {userCanAcceptOrReject && (
                <div className="flex space-x-1">
                  <Button
                    onClick={() => handleCourseAction(course._id, "accept")}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white px-2 py-1 rounded text-xs transition-all duration-200 whitespace-nowrap"
                  >
                    <CheckSquare className="w-3 h-3 mr-1" />
                    Accept
                  </Button>
                  <Button
                    onClick={() => handleCourseAction(course._id, "reject")}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs transition-all duration-200 whitespace-nowrap"
                  >
                    <XCircle className="w-3 h-3 mr-1" />
                    Reject
                  </Button>
                </div>
              )}

              {/* Show waiting message if user is proposer and course is pending */}
              {course.status === "pending" && userIsProposer && (
                <div className="text-xs text-gray-500 text-center py-1 whitespace-nowrap">
                  Waiting for response
                </div>
              )}
            </div>
          </td>
        </tr>

        {/* Mobile Card View */}
        <div className="md:hidden bg-white rounded-lg border border-gray-200 p-4 mb-3 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start space-x-3 flex-1 min-w-0">
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-gray-900 mb-1 break-words">
                  {course.title}
                </h3>
                <div className="flex flex-wrap gap-2 mb-2">
                  {getStatusBadge(course.status)}
                  <Badge
                    variant="outline"
                    className={`${exchangeType.color} border rounded-full text-xs font-semibold py-1 px-2 whitespace-nowrap`}
                  >
                    <ExchangeIcon className="w-3 h-3 mr-1" />
                    {exchangeType.label}
                  </Badge>
                  {userIsProposer && (
                    <Badge
                      variant="outline"
                      className="bg-purple-50 text-purple-700 border-purple-200 text-xs font-semibold py-1 px-2 rounded-full whitespace-nowrap"
                    >
                      <User className="w-3 h-3 mr-1" />
                      Proposed by you
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-3 break-words">
            {course.description || "No description provided."}
          </p>

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="flex -space-x-2 flex-shrink-0">
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
              <div className="text-sm text-gray-600 min-w-0">
                <div className="font-medium break-words">
                  {course.userA?.fullName}
                  {userIsProposer && " (You)"}
                </div>
                <div className="text-xs break-words">
                  {course.userB?.fullName}
                </div>
              </div>
            </div>
            <div className="flex items-center text-sm font-semibold text-gray-900 flex-shrink-0 ml-2">
              <Calendar className="w-4 h-4 mr-1 text-blue-500" />
              {course.duration}w
            </div>
          </div>

          <div className="flex space-x-2">
            <Button
              onClick={() => viewCourse(course._id)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm whitespace-nowrap"
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
              <div className="flex-1 text-xs text-gray-500 text-center flex items-center justify-center whitespace-nowrap">
                Waiting for response
              </div>
            )}
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 overflow-x-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="py-4 md:py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4">
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 break-words">
                  Course Management
                </h1>
                <p className="mt-1 md:mt-2 text-sm md:text-base text-gray-600 break-words">
                  Manage your learning exchanges and collaborations
                </p>
              </div>
              <Button
                onClick={() => setShowAnalytics(!showAnalytics)}
                variant={showAnalytics ? "default" : "outline"}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm md:text-base whitespace-nowrap flex-shrink-0"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                {showAnalytics ? "Hide Analytics" : "Show Analytics"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Section */}
      {showAnalytics && (
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 md:py-6">
          <AnalyticsCards />
          <AnalyticsCharts />
        </div>
      )}

      {/* Filters and Search */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 md:py-6">
        <div className="flex flex-col sm:flex-row gap-3 mb-4 md:mb-6">
          {/* Search */}
          <div className="flex-1 min-w-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search courses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2.5 w-full border border-gray-300 bg-white rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm md:text-base"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex gap-3">
            <div className="relative flex-1 sm:flex-none min-w-[140px]">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2.5 border border-gray-300 bg-white rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 appearance-none w-full text-sm md:text-base"
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
          <div className="flex justify-center items-center py-16 md:py-20">
            <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-12 md:py-16 bg-white rounded-xl border border-gray-200">
            <BookOpen className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-3 md:mb-4" />
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2 break-words">
              No courses found
            </h3>
            <p className="text-gray-500 max-w-md mx-auto text-sm md:text-base break-words">
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
            <div className="md:hidden p-3 space-y-3">
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
