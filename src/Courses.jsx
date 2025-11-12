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

    // Monthly course creation data
    const monthlyData = courses.reduce((acc, course) => {
      const date = new Date(course.createdAt);
      const monthYear = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      if (!acc[monthYear]) {
        acc[monthYear] = 0;
      }
      acc[monthYear]++;
      return acc;
    }, {});

    const monthlyChartData = Object.entries(monthlyData)
      .map(([month, count]) => ({
        month: new Date(month).toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        courses: count,
      }))
      .slice(-6); // Last 6 months

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
      monthlyChartData,
      exchangeTypeData,
      averageDuration,
      completionRate:
        totalCourses > 0
          ? Math.round((completedCourses / totalCourses) * 100)
          : 0,
    };
  };

  const analytics = getAnalyticsData();

  // Custom label renderer for pie charts with better text visibility
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    name,
    value,
  }) => {
    // Don't show labels for very small segments to avoid clutter
    if (percent < 0.03) return null;

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.7;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
        stroke="rgba(0,0,0,0.5)"
        strokeWidth={2}
        strokeLinejoin="round"
        paintOrder="stroke"
      >
        {`${name}: ${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Alternative label for smaller screens - simpler version
  const renderSimpleLabel = ({ percent, name }) => {
    if (percent < 0.03) return null;
    return `${name}: ${(percent * 100).toFixed(0)}%`;
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Courses</p>
              <p className="text-3xl font-bold mt-2">
                {analytics.totalCourses}
              </p>
            </div>
            <BookOpen className="w-8 h-8 text-blue-200" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium">
                Active Courses
              </p>
              <p className="text-3xl font-bold mt-2">
                {analytics.activeCourses}
              </p>
            </div>
            <Activity className="w-8 h-8 text-emerald-200" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">
                Completion Rate
              </p>
              <p className="text-3xl font-bold mt-2">
                {analytics.completionRate}%
              </p>
            </div>
            <Award className="w-8 h-8 text-purple-200" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-cyan-100 text-sm font-medium">Avg Duration</p>
              <p className="text-3xl font-bold mt-2">
                {analytics.averageDuration}w
              </p>
            </div>
            <Clock4 className="w-8 h-8 text-cyan-200" />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Charts Component - UPDATED with visible text and percentages
  const AnalyticsCharts = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Status Distribution Pie Chart - UPDATED */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <PieChart className="w-5 h-5 text-blue-600" />
            Course Status Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 sm:h-64 md:h-80">
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
              <RechartsPieChart>
                <Pie
                  data={analytics.statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={renderCustomizedLabel}
                  outerRadius={100}
                  innerRadius={30}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={1}
                >
                  {analytics.statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [value, name]}
                  wrapperStyle={{ outline: "none" }}
                  contentStyle={{ borderRadius: "8px" }}
                  labelFormatter={(name) => `Status: ${name}`}
                />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  wrapperStyle={{
                    paddingTop: "10px",
                    fontSize: "12px",
                  }}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
          {/* Additional summary below chart */}
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            {analytics.statusData.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-gray-50 rounded"
              >
                <div className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-medium">{item.name}:</span>
                </div>
                <span className="font-bold">
                  {item.value} (
                  {((item.value / analytics.totalCourses) * 100).toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Course Creation - UPDATED */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Courses Created (Last 6 Months)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 sm:h-64 md:h-80">
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
              <BarChart
                data={analytics.monthlyChartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="month"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                  fontSize={12}
                  tick={{ fill: "#374151" }}
                />
                <YAxis fontSize={12} tick={{ fill: "#374151" }} />
                <Tooltip
                  wrapperStyle={{ outline: "none" }}
                  contentStyle={{ borderRadius: "8px" }}
                  formatter={(value) => [`${value} courses`, "Count"]}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar
                  dataKey="courses"
                  fill="#3b82f6"
                  name="Courses Created"
                  radius={[4, 4, 0, 0]}
                  label={{
                    position: "top",
                    fill: "#1f2937",
                    fontSize: 12,
                    fontWeight: "bold",
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Exchange Type Distribution - UPDATED */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TargetIcon className="w-5 h-5 text-purple-600" />
            Exchange Type Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 sm:h-64 md:h-80">
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
              <RechartsPieChart>
                <Pie
                  data={analytics.exchangeTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={renderCustomizedLabel}
                  outerRadius={100}
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
                  wrapperStyle={{ outline: "none" }}
                  contentStyle={{ borderRadius: "8px" }}
                  labelFormatter={(name) => `Type: ${name}`}
                />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  wrapperStyle={{
                    paddingTop: "10px",
                    fontSize: "12px",
                  }}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
          {/* Additional summary below chart */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            {analytics.exchangeTypeData.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center">
                  <div
                    className="w-4 h-4 rounded-full mr-3"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-semibold text-sm">{item.name}:</span>
                </div>
                <span className="font-bold text-lg">
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
      <Toaster position="top-right" />

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Course Management
                </h1>
                <p className="mt-2 text-gray-600">
                  Manage your learning exchanges and collaborations
                </p>
              </div>
              <Button
                onClick={() => setShowAnalytics(!showAnalytics)}
                variant={showAnalytics ? "default" : "outline"}
                className="bg-blue-600 hover:bg-blue-700 text-white"
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <AnalyticsCards />
          <AnalyticsCharts />
        </div>
      )}

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
