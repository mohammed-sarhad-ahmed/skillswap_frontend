// components/AdminDashboard.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  BarChart3,
  Users,
  BookOpen,
  Calendar,
  TrendingUp,
  Shield,
  LogOut,
  Menu,
  X,
  Star,
  FileText,
  Flag,
  Search,
  Eye,
  Ban,
  CheckCircle,
  User,
  RefreshCw,
  MessageCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Mail,
  Book,
  Target,
  Activity,
  ShieldAlert,
  MessageSquare,
  Image,
} from "lucide-react";
import toast from "react-hot-toast";
import { API_BASE_URL } from "./Config";

// Chart components
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart,
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];
const RATING_COLORS = ["#ff4d4f", "#ffa940", "#ffec3d", "#73d13d", "#52c41a"];
const STATUS_COLORS = {
  active: "#10b981",
  pending: "#f59e0b",
  completed: "#3b82f6",
  canceled: "#ef4444",
};

// Default empty data structure
const defaultStats = {
  // User stats
  totalUsers: 0,
  activeUsers: 0,
  newUsersThisMonth: 0,
  userGrowthPercentage: 0,

  // Course stats
  activeCourses: 0,
  pendingProposals: 0,
  totalCourseEnrollments: 0,
  courseGrowthPercentage: 0,

  // Appointment stats
  appointmentsToday: 0,
  totalAppointments: 0,
  completedAppointments: 0,

  // Rating stats
  averageRating: "0.0",
  totalRatings: 0,
  ratingDistribution: [],

  // Chart data
  userGrowthData: [],
  weeklyActivity: [],
};

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(defaultStats);
  const [activeTab, setActiveTab] = useState("overview");
  const navigate = useNavigate();

  // Get admin token from localStorage
  const getAdminToken = () => {
    return localStorage.getItem("admin_token");
  };

  // Fetch real data from backend
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = getAdminToken();
      if (!token) {
        toast.error("Admin authentication required");
        navigate("/admin-login");
        return;
      }

      // Fetch all data for overview
      const [
        usersResponse,
        coursesResponse,
        appointmentsResponse,
        ratingsResponse,
      ] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/users`, {
          headers: { "Content-Type": "application/json", adminAuth: token },
        }),
        fetch(`${API_BASE_URL}/admin/courses`, {
          headers: { "Content-Type": "application/json", adminAuth: token },
        }),
        fetch(`${API_BASE_URL}/admin/appointment`, {
          headers: { "Content-Type": "application/json", adminAuth: token },
        }),
        fetch(`${API_BASE_URL}/admin/rating`, {
          headers: { "Content-Type": "application/json", adminAuth: token },
        }),
      ]);

      const [usersData, coursesData, appointmentsData, ratingsData] =
        await Promise.all([
          usersResponse.json(),
          coursesResponse.json(),
          appointmentsResponse.json(),
          ratingsResponse.json(),
        ]);

      // Process all data for overview
      const processedStats = processOverviewData(
        usersData.data || [],
        coursesData.data || [],
        appointmentsData.data || [],
        ratingsData.data || []
      );

      setStats(processedStats);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  // Process all data for overview
  const processOverviewData = (users, courses, appointments, ratings) => {
    // User stats
    const totalUsers = users.length;
    const activeUsers = users.filter(
      (user) => !user.banned && user.isEmailVerified
    ).length;

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // Calculate new users this month and previous month for growth percentage
    const newUsersThisMonth = users.filter((user) => {
      const userDate = new Date(user.createdAt);
      return (
        userDate.getMonth() === currentMonth &&
        userDate.getFullYear() === currentYear
      );
    }).length;

    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousMonthYear =
      currentMonth === 0 ? currentYear - 1 : currentYear;
    const newUsersPreviousMonth = users.filter((user) => {
      const userDate = new Date(user.createdAt);
      return (
        userDate.getMonth() === previousMonth &&
        userDate.getFullYear() === previousMonthYear
      );
    }).length;

    const userGrowthPercentage =
      newUsersPreviousMonth > 0
        ? (
            ((newUsersThisMonth - newUsersPreviousMonth) /
              newUsersPreviousMonth) *
            100
          ).toFixed(1)
        : newUsersThisMonth > 0
        ? 100
        : 0;

    // Course stats
    const activeCourses = courses.filter(
      (course) => course.status === "active"
    ).length;
    const pendingProposals = courses.filter(
      (course) => course.status === "pending"
    ).length;
    const totalCourseEnrollments = courses.length;

    // Calculate course growth percentage
    const activeCoursesPreviousMonth = 0;
    const courseGrowthPercentage =
      activeCoursesPreviousMonth > 0
        ? (
            ((activeCourses - activeCoursesPreviousMonth) /
              activeCoursesPreviousMonth) *
            100
          ).toFixed(1)
        : activeCourses > 0
        ? 100
        : 0;

    // Appointment stats
    const today = new Date().toISOString().split("T")[0];
    const appointmentsToday = appointments.filter(
      (apt) => apt.date && apt.date.startsWith(today)
    ).length;
    const totalAppointments = appointments.length;
    const completedAppointments = appointments.filter(
      (apt) => apt.status === "completed"
    ).length;

    // Rating stats
    const totalRatings = ratings.length;
    const averageRating =
      totalRatings > 0
        ? (
            ratings.reduce((sum, rating) => sum + rating.rating, 0) /
            totalRatings
          ).toFixed(1)
        : "0.0";

    // Generate chart data
    const userGrowthData = generateUserGrowthData(users);
    const weeklyActivity = generateWeeklyActivity(appointments);
    const ratingDistribution = generateRatingDistribution(ratings);

    return {
      totalUsers,
      activeUsers,
      newUsersThisMonth,
      userGrowthPercentage,
      activeCourses,
      pendingProposals,
      totalCourseEnrollments,
      courseGrowthPercentage,
      appointmentsToday,
      totalAppointments,
      completedAppointments,
      averageRating,
      totalRatings,
      userGrowthData,
      weeklyActivity,
      ratingDistribution,
    };
  };

  // Generate user growth data (last 6 months)
  const generateUserGrowthData = (users) => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.push({
        month: date.toLocaleDateString("en-US", { month: "short" }),
        users: 0,
        cumulative: 0,
      });
    }

    let cumulative = 0;
    months.forEach((month) => {
      const monthUsers = users.filter((user) => {
        const userDate = new Date(user.createdAt);
        return (
          userDate.toLocaleDateString("en-US", { month: "short" }) ===
          month.month
        );
      }).length;
      cumulative += monthUsers;
      month.users = monthUsers;
      month.cumulative = cumulative;
    });

    return months;
  };

  // Generate weekly activity data - using real appointment data
  const generateWeeklyActivity = (appointments) => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    return days.map((day) => {
      const dayAppointments = appointments.filter((apt) => {
        if (!apt.date) return false;
        const aptDate = new Date(apt.date);
        return (
          aptDate.toLocaleDateString("en-US", { weekday: "short" }) === day
        );
      });

      return {
        day,
        appointments: dayAppointments.length,
        completed: dayAppointments.filter((apt) => apt.status === "completed")
          .length,
      };
    });
  };

  // Generate rating distribution
  const generateRatingDistribution = (ratings) => {
    const distribution = [1, 2, 3, 4, 5].map((stars) => ({
      stars,
      count: ratings.filter((r) => r.rating === stars).length,
    }));
    return distribution;
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    toast.success("Logged out successfully");
    navigate("/admin-login", { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 transition duration-200 ease-in-out lg:static lg:inset-0`}
      >
        <div className="flex items-center justify-between h-16 px-4 bg-gray-800">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-blue-500" />
            <span className="ml-2 text-white font-bold text-lg">
              Admin Panel
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="mt-8 px-4 space-y-2">
          {[
            { icon: BarChart3, label: "Overview", id: "overview" },
            { icon: Users, label: "Users", id: "users" },
            { icon: BookOpen, label: "Courses", id: "courses" },
            { icon: Calendar, label: "Appointments", id: "appointments" },
            { icon: Star, label: "Ratings", id: "ratings" },
            { icon: Flag, label: "Reports", id: "reports" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === item.id
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-500 hover:text-gray-700 mr-4"
              >
                <Menu size={24} />
              </button>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}{" "}
                Dashboard
              </h1>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={fetchDashboardData}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw size={16} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 text-xs sm:text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut size={14} className="sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6">
          {activeTab === "overview" && <OverviewTab stats={stats} />}
          {activeTab === "users" && <UsersTab />}
          {activeTab === "courses" && <CoursesTab />}
          {activeTab === "appointments" && <AppointmentsTab stats={stats} />}
          {activeTab === "ratings" && <RatingsTab />}
          {activeTab === "reports" && <ReportsTab />}
        </main>
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({ icon: Icon, title, value, growth, color = "blue" }) {
  const colorClasses = {
    blue: { bg: "bg-blue-100", text: "text-blue-600", icon: "text-blue-600" },
    green: {
      bg: "bg-green-100",
      text: "text-green-600",
      icon: "text-green-600",
    },
    orange: {
      bg: "bg-orange-100",
      text: "text-orange-600",
      icon: "text-orange-600",
    },
    purple: {
      bg: "bg-purple-100",
      text: "text-purple-600",
      icon: "text-purple-600",
    },
    yellow: {
      bg: "bg-yellow-100",
      text: "text-yellow-600",
      icon: "text-yellow-600",
    },
  };

  const colorConfig = colorClasses[color] || colorClasses.blue;
  const { bg, text, icon } = colorConfig;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs sm:text-sm font-medium text-gray-600">
            {title}
          </p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{value}</p>
          {growth && (
            <div className="flex items-center mt-2">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-1" />
              <span className="text-xs sm:text-sm text-green-600">
                {growth}
              </span>
            </div>
          )}
        </div>
        <div className={`p-2 sm:p-3 ${bg} rounded-lg`}>
          <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${icon}`} />
        </div>
      </div>
    </div>
  );
}

// Chart Card Component
function ChartCard({ title, children, className = "" }) {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 ${className}`}
    >
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
        {title}
      </h3>
      {children}
    </div>
  );
}

// Improved Custom Label Component for Pie Chart
const CustomPieLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  name,
}) => {
  if (percent === 0 || percent < 0.03) return null;

  const RADIAN = Math.PI / 180;
  const radius = outerRadius * 1.15;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="#374151"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fontSize={12}
      fontWeight="600"
      className="drop-shadow-sm"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// Improved Custom Tooltip for Pie Chart
const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-gray-900 text-white p-3 border border-gray-700 rounded-lg shadow-lg">
        <p className="font-semibold text-sm">{data.name}</p>
        <p className="text-sm text-gray-200">
          {data.value} items ({(data.percent * 100).toFixed(1)}%)
        </p>
      </div>
    );
  }
  return null;
};

// Custom Tooltip for Rating Chart
const CustomRatingTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-gray-900 text-white p-3 border border-gray-700 rounded-lg shadow-lg">
        <p className="font-semibold text-sm">
          {data.stars} Star{data.stars !== 1 ? "s" : ""}
        </p>
        <p className="text-sm text-gray-200">
          {data.count} ratings ({data.percentage}%)
        </p>
      </div>
    );
  }
  return null;
};

// Overview Tab with Real Data
function OverviewTab({ stats }) {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <StatCard
          icon={Users}
          title="Total Users"
          value={stats.totalUsers || 0}
          growth={
            stats.userGrowthPercentage > 0
              ? `+${stats.userGrowthPercentage}% this month`
              : `${stats.userGrowthPercentage}% this month`
          }
          color="blue"
        />
        <StatCard
          icon={BookOpen}
          title="Active Courses"
          value={stats.activeCourses || 0}
          growth={
            stats.courseGrowthPercentage > 0
              ? `+${stats.courseGrowthPercentage}% this month`
              : `${stats.courseGrowthPercentage}% this month`
          }
          color="green"
        />
        <StatCard
          icon={Calendar}
          title="Today's Appointments"
          value={stats.appointmentsToday || 0}
          color="orange"
        />
        <StatCard
          icon={Star}
          title="Average Rating"
          value={stats.averageRating || "0.0"}
          color="purple"
        />
      </div>

      {/* Second Row Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <StatCard
          icon={TrendingUp}
          title="New Users"
          value={stats.newUsersThisMonth || 0}
          color="green"
        />
        <StatCard
          icon={Clock}
          title="Pending Proposals"
          value={stats.pendingProposals || 0}
          color="yellow"
        />
        <StatCard
          title="Completed Sessions"
          value={stats.completedAppointments || 0}
          icon={CheckCircle}
          color="blue"
        />
        <StatCard
          icon={Activity}
          title="Active Users"
          value={stats.activeUsers || 0}
          color="purple"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* User Growth Chart */}
        <ChartCard title="User Growth (Last 6 Months)">
          <div className="h-80 min-h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={stats.userGrowthData || []}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#374151" }}
                  axisLine={{ stroke: "#d1d5db" }}
                />
                <YAxis
                  tick={{ fill: "#374151" }}
                  axisLine={{ stroke: "#d1d5db" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "none",
                    borderRadius: "8px",
                    color: "white",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="cumulative"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.3}
                  name="Total Users"
                />
                <Bar
                  dataKey="users"
                  fill="#82ca9d"
                  name="New Users"
                  radius={[4, 4, 0, 0]}
                />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Weekly Activity */}
        <ChartCard title="Weekly Activity">
          <div className="h-80 min-h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.weeklyActivity || []}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="day"
                  tick={{ fill: "#374151" }}
                  axisLine={{ stroke: "#d1d5db" }}
                />
                <YAxis
                  tick={{ fill: "#374151" }}
                  axisLine={{ stroke: "#d1d5db" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "none",
                    borderRadius: "8px",
                    color: "white",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="appointments"
                  fill="#8884d8"
                  name="Total Appointments"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="completed"
                  fill="#82ca9d"
                  name="Completed"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Active Learning Sessions
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.activeCourses || 0}
              </p>
            </div>
            <Activity className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.totalAppointments > 0
                  ? Math.round(
                      (stats.completedAppointments / stats.totalAppointments) *
                        100
                    )
                  : 0}
                %
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Avg. Session Rating
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.averageRating || "0.0"}/5.0
              </p>
            </div>
            <Star className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Users Tab with Real Data Integration
function UsersTab() {
  const [usersData, setUsersData] = useState({
    users: [],
    loading: true,
    totalUsers: 0,
    activeUsers: 0,
    newUsersThisMonth: 0,
    userGrowth: [],
  });

  // Get admin token
  const getAdminToken = () => {
    return localStorage.getItem("admin_token");
  };

  // Fetch users data
  const fetchUsersData = async () => {
    setUsersData((prev) => ({ ...prev, loading: true }));
    try {
      const token = getAdminToken();
      if (!token) {
        toast.error("Admin authentication required");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: {
          "Content-Type": "application/json",
          adminAuth: token,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();

      if (data.status && data.status.toLowerCase() === "success") {
        const users = data.data || [];
        processUsersData(users);
      } else {
        throw new Error(data.message || "Failed to fetch users");
      }
    } catch (error) {
      console.error("Error fetching users data:", error);
      toast.error("Failed to load users data");
      setUsersData({
        users: [],
        loading: false,
        totalUsers: 0,
        activeUsers: 0,
        newUsersThisMonth: 0,
        userGrowth: [],
      });
    }
  };

  // Process users data for display
  const processUsersData = (users) => {
    const totalUsers = users.length;
    const activeUsers = users.filter(
      (user) => !user.banned && user.isEmailVerified
    ).length;

    // Calculate new users this month
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const newUsersThisMonth = users.filter((user) => {
      const userDate = new Date(user.createdAt);
      return (
        userDate.getMonth() === currentMonth &&
        userDate.getFullYear() === currentYear
      );
    }).length;

    // Calculate user growth (last 6 months)
    const userGrowth = calculateUserGrowth(users);

    setUsersData({
      users,
      loading: false,
      totalUsers,
      activeUsers,
      newUsersThisMonth,
      userGrowth,
    });
  };

  // Calculate user growth over last 6 months
  const calculateUserGrowth = (users) => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.push({
        month: date.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        users: 0,
      });
    }

    users.forEach((user) => {
      const userDate = new Date(user.createdAt);
      const monthKey = userDate.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
      const monthData = months.find((m) => m.month === monthKey);
      if (monthData) {
        monthData.users++;
      }
    });

    return months;
  };

  useEffect(() => {
    fetchUsersData();
  }, []);

  const getStatusBadge = (user) => {
    if (user.banned) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
          Banned
        </span>
      );
    }
    if (user.isEmailVerified) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
          Verified
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
        Unverified
      </span>
    );
  };

  if (usersData.loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          <StatCard icon={Users} title="Total Users" value={0} color="blue" />
          <StatCard
            icon={CheckCircle}
            title="Active Users"
            value={0}
            color="green"
          />
          <StatCard
            icon={TrendingUp}
            title="New This Month"
            value={0}
            color="orange"
          />
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading users data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        <StatCard
          icon={Users}
          title="Total Users"
          value={usersData.totalUsers}
          color="blue"
        />
        <StatCard
          icon={CheckCircle}
          title="Active Users"
          value={usersData.activeUsers}
          color="green"
        />
        <StatCard
          icon={TrendingUp}
          title="New This Month"
          value={usersData.newUsersThisMonth}
          color="orange"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* User Growth Chart */}
        <ChartCard title="User Growth (Last 6 Months)">
          <div className="h-80 min-h-[320px] w-full">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={300}
              minHeight={300}
            >
              <LineChart
                data={usersData.userGrowth}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#374151" }}
                  axisLine={{ stroke: "#d1d5db" }}
                />
                <YAxis
                  tick={{ fill: "#374151" }}
                  axisLine={{ stroke: "#d1d5db" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "none",
                    borderRadius: "8px",
                    color: "white",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="#8884d8"
                  strokeWidth={2}
                  name="New Users"
                  dot={{ fill: "#8884d8", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: "#8884d8" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* User Status Distribution */}
        <ChartCard title="User Status Distribution">
          <div className="h-80 min-h-[320px] w-full">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={300}
              minHeight={300}
            >
              <PieChart>
                <Pie
                  data={[
                    { name: "Active", value: usersData.activeUsers },
                    {
                      name: "Inactive",
                      value: usersData.totalUsers - usersData.activeUsers,
                    },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={CustomPieLabel}
                  outerRadius={100}
                  innerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={2}
                >
                  <Cell fill="#0088FE" />
                  <Cell fill="#FF8042" />
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Users List */}
        <ChartCard title="Recent Users" className="lg:col-span-2">
          <div className="max-h-96 overflow-y-auto">
            {usersData.users.length > 0 ? (
              <div className="space-y-3">
                {usersData.users.slice(0, 10).map((user) => (
                  <div
                    key={user._id}
                    className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">
                            {user.fullName || "Unnamed User"}
                          </span>
                          {getStatusBadge(user)}
                        </div>
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <Star className="h-4 w-4 text-yellow-400" />
                          <span>{user.averageRating || "N/A"}</span>
                          <span>({user.ratingCount || 0})</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 flex items-center">
                        <Mail className="h-3 w-3 mr-1" />
                        {user.email || "No email"}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {user.teachingSkills &&
                          user.teachingSkills.length > 0 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                              <BookOpen className="h-3 w-3 mr-1" />
                              Teaches: {user.teachingSkills.length}
                            </span>
                          )}
                        {user.learningSkills &&
                          user.learningSkills.length > 0 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                              <Book className="h-3 w-3 mr-1" />
                              Learns: {user.learningSkills.length}
                            </span>
                          )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Joined: {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No users found</p>
              </div>
            )}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

// Courses Tab with Real Data Integration
function CoursesTab() {
  const [coursesData, setCoursesData] = useState({
    courses: [],
    loading: true,
    activeCourses: 0,
    pendingProposals: 0,
    totalCourses: 0,
    completedCourses: 0,
    courseStats: [],
    // New data for additional chart
    courseTrends: [],
  });

  // Get admin token
  const getAdminToken = () => {
    return localStorage.getItem("admin_token");
  };

  // Fetch courses data
  const fetchCoursesData = async () => {
    setCoursesData((prev) => ({ ...prev, loading: true }));
    try {
      const token = getAdminToken();
      if (!token) {
        toast.error("Admin authentication required");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/admin/courses`, {
        headers: {
          "Content-Type": "application/json",
          adminAuth: token,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch courses");
      }

      const data = await response.json();

      if (data.status && data.status.toLowerCase() === "success") {
        const courses = data.data || [];
        processCoursesData(courses);
      } else {
        throw new Error(data.message || "Failed to fetch courses");
      }
    } catch (error) {
      console.error("Error fetching courses data:", error);
      toast.error("Failed to load courses data");
      setCoursesData({
        courses: [],
        loading: false,
        activeCourses: 0,
        pendingProposals: 0,
        totalCourses: 0,
        completedCourses: 0,
        courseStats: [],
        courseTrends: [],
      });
    }
  };

  // Process courses data for display
  const processCoursesData = (courses) => {
    const totalCourses = courses.length;
    const activeCourses = courses.filter(
      (course) => course.status === "active"
    ).length;
    const pendingProposals = courses.filter(
      (course) => course.status === "pending"
    ).length;
    const completedCourses = courses.filter(
      (course) => course.status === "completed"
    ).length;

    // Calculate course statistics by status
    const courseStats = [
      { name: "Active", value: activeCourses, color: STATUS_COLORS.active },
      {
        name: "Pending",
        value: pendingProposals,
        color: STATUS_COLORS.pending,
      },
      {
        name: "Completed",
        value: completedCourses,
        color: STATUS_COLORS.completed,
      },
      {
        name: "Canceled",
        value:
          totalCourses - activeCourses - pendingProposals - completedCourses,
        color: STATUS_COLORS.canceled,
      },
    ];

    // Generate course trends data (last 6 months)
    const courseTrends = generateCourseTrends(courses);

    setCoursesData({
      courses,
      loading: false,
      activeCourses,
      pendingProposals,
      totalCourses,
      completedCourses,
      courseStats,
      courseTrends,
    });
  };

  // Generate course trends data for the last 6 months
  const generateCourseTrends = (courses) => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.push({
        month: date.toLocaleDateString("en-US", { month: "short" }),
        active: 0,
        completed: 0,
        pending: 0,
        total: 0,
      });
    }

    courses.forEach((course) => {
      const courseDate = new Date(course.createdAt || course.proposedAt);
      const monthKey = courseDate.toLocaleDateString("en-US", {
        month: "short",
      });

      const monthData = months.find((m) => m.month === monthKey);
      if (monthData) {
        monthData.total++;
        if (course.status === "active") monthData.active++;
        if (course.status === "completed") monthData.completed++;
        if (course.status === "pending") monthData.pending++;
      }
    });

    return months;
  };

  // Helper function to get user display name
  const getUserDisplayName = (user) => {
    if (!user) return "Unknown User";
    return user.fullName || user.username || user.email || "Unnamed User";
  };

  useEffect(() => {
    fetchCoursesData();
  }, []);

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: "green", icon: CheckCircle2 },
      pending: { color: "yellow", icon: Clock },
      completed: { color: "blue", icon: CheckCircle },
      canceled: { color: "red", icon: XCircle },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const IconComponent = config.icon;

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${config.color}-100 text-${config.color}-800 border border-${config.color}-200`}
      >
        <IconComponent className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (coursesData.loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <StatCard
            icon={BookOpen}
            title="Total Courses"
            value={0}
            color="blue"
          />
          <StatCard
            icon={CheckCircle2}
            title="Active Courses"
            value={0}
            color="green"
          />
          <StatCard
            icon={Clock}
            title="Pending Proposals"
            value={0}
            color="orange"
          />
          <StatCard icon={Target} title="Completed" value={0} color="purple" />
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading courses data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <StatCard
          icon={BookOpen}
          title="Total Courses"
          value={coursesData.totalCourses}
          color="blue"
        />
        <StatCard
          icon={CheckCircle2}
          title="Active Courses"
          value={coursesData.activeCourses}
          color="green"
        />
        <StatCard
          icon={Clock}
          title="Pending Proposals"
          value={coursesData.pendingProposals}
          color="orange"
        />
        <StatCard
          icon={Target}
          title="Completed"
          value={coursesData.completedCourses}
          color="purple"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Course Status Distribution */}
        <ChartCard title="Course Status Distribution">
          <div className="h-80 min-h-[320px] w-full">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={300}
              minHeight={300}
            >
              <PieChart>
                <Pie
                  data={coursesData.courseStats.filter(
                    (stat) => stat.value > 0
                  )}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={CustomPieLabel}
                  outerRadius={100}
                  innerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={2}
                >
                  {coursesData.courseStats
                    .filter((stat) => stat.value > 0)
                    .map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Course Trends Over Time */}
        <ChartCard title="Course Trends (Last 6 Months)">
          <div className="h-80 min-h-[320px] w-full">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={300}
              minHeight={300}
            >
              <LineChart
                data={coursesData.courseTrends}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#374151" }}
                  axisLine={{ stroke: "#d1d5db" }}
                />
                <YAxis
                  tick={{ fill: "#374151" }}
                  axisLine={{ stroke: "#d1d5db" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "none",
                    borderRadius: "8px",
                    color: "white",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#8884d8"
                  strokeWidth={2}
                  name="Total Courses"
                  dot={{ fill: "#8884d8", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: "#8884d8" }}
                />
                <Line
                  type="monotone"
                  dataKey="active"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Active Courses"
                  dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: "#10b981" }}
                />
                <Line
                  type="monotone"
                  dataKey="completed"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Completed Courses"
                  dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: "#3b82f6" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Courses List */}
      <ChartCard title="Recent Courses">
        <div className="max-h-96 overflow-y-auto">
          {coursesData.courses.length > 0 ? (
            <div className="space-y-3">
              {coursesData.courses.slice(0, 10).map((course) => (
                <div
                  key={course._id}
                  className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">
                          {course.title || "Untitled Course"}
                        </span>
                        {getStatusBadge(course.status)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {course.duration || "N/A"} weeks
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {course.description || "No description available"}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        <User className="h-3 w-3 mr-1" />
                        User A: {getUserDisplayName(course.userA)}
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                        <User className="h-3 w-3 mr-1" />
                        User B: {getUserDisplayName(course.userB)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Started:{" "}
                      {course.startDate
                        ? new Date(course.startDate).toLocaleDateString()
                        : "Not started"}{" "}
                      • Proposed:{" "}
                      {new Date(
                        course.proposedAt || course.createdAt
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No courses found</p>
              <p className="text-gray-400 text-sm mt-1">
                Courses will appear here when users create learning exchanges
              </p>
            </div>
          )}
        </div>
      </ChartCard>
    </div>
  );
}

// Appointments Tab with FIXED chart
function AppointmentsTab({ stats }) {
  const [appointmentData, setAppointmentData] = useState({
    weeklyDistribution: [],
    statusDistribution: [],
    dailyAppointments: [],
    appointmentTrends: [], // Fixed data for better chart
    loading: true,
  });

  // Get admin token
  const getAdminToken = () => {
    return localStorage.getItem("admin_token");
  };

  // Fetch appointment data for charts
  const fetchAppointmentData = async () => {
    try {
      const token = getAdminToken();
      if (!token) {
        toast.error("Admin authentication required");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/admin/appointment`, {
        headers: {
          "Content-Type": "application/json",
          adminAuth: token,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch appointments");
      }

      const data = await response.json();

      if (data.status && data.status.toLowerCase() === "success") {
        const appointments = data.data || [];
        processAppointmentData(appointments);
      } else {
        throw new Error(data.message || "Failed to fetch appointments");
      }
    } catch (error) {
      console.error("Error fetching appointment data:", error);
      toast.error("Failed to load appointment data");
      setAppointmentData({
        weeklyDistribution: [],
        statusDistribution: [],
        dailyAppointments: [],
        appointmentTrends: [],
        loading: false,
      });
    }
  };

  // Process appointment data for charts
  const processAppointmentData = (appointments) => {
    // Weekly distribution
    const weeklyData = generateWeeklyDistribution(appointments);

    // Status distribution
    const statusData = generateStatusDistribution(appointments);

    // Daily appointments (last 7 days)
    const dailyData = generateDailyAppointments(appointments);

    // Appointment trends - FIXED to show meaningful data
    const trendsData = generateAppointmentTrends(appointments);

    setAppointmentData({
      weeklyDistribution: weeklyData,
      statusDistribution: statusData,
      dailyAppointments: dailyData,
      appointmentTrends: trendsData,
      loading: false,
    });
  };

  // Generate weekly distribution data
  const generateWeeklyDistribution = (appointments) => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const weeklyCount = days.map((day) => ({ day, appointments: 0 }));

    appointments.forEach((appointment) => {
      if (appointment.date) {
        const date = new Date(appointment.date);
        const dayIndex = (date.getDay() + 6) % 7;
        weeklyCount[dayIndex].appointments++;
      }
    });

    return weeklyCount;
  };

  // Generate status distribution data
  const generateStatusDistribution = (appointments) => {
    const statusCount = {
      pending: 0,
      confirmed: 0,
      ongoing: 0,
      completed: 0,
      canceled: 0,
    };

    appointments.forEach((appointment) => {
      if (statusCount.hasOwnProperty(appointment.status)) {
        statusCount[appointment.status]++;
      }
    });

    const total = Object.values(statusCount).reduce(
      (sum, count) => sum + count,
      0
    );

    return Object.entries(statusCount).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      percent: total > 0 ? value / total : 0,
    }));
  };

  // Generate daily appointments data
  const generateDailyAppointments = (appointments) => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      last7Days.push(date.toISOString().split("T")[0]);
    }

    return last7Days.map((date) => {
      const count = appointments.filter(
        (appt) => appt.date && appt.date.startsWith(date)
      ).length;

      return {
        date: new Date(date).toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        }),
        appointments: count,
      };
    });
  };

  // FIXED: Generate appointment trends data that makes sense
  const generateAppointmentTrends = (appointments) => {
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      last6Months.push({
        month: date.toLocaleDateString("en-US", { month: "short" }),
        total: 0,
        completed: 0,
        canceled: 0,
        pending: 0,
      });
    }

    appointments.forEach((appointment) => {
      const appointmentDate = new Date(
        appointment.date || appointment.createdAt
      );
      const monthKey = appointmentDate.toLocaleDateString("en-US", {
        month: "short",
      });

      const monthData = last6Months.find((m) => m.month === monthKey);
      if (monthData) {
        monthData.total++;
        if (appointment.status === "completed") monthData.completed++;
        if (appointment.status === "canceled") monthData.canceled++;
        if (appointment.status === "pending") monthData.pending++;
      }
    });

    return last6Months;
  };

  useEffect(() => {
    fetchAppointmentData();
  }, []);

  if (appointmentData.loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          <StatCard
            icon={Calendar}
            title="Today's Appointments"
            value={stats.appointmentsToday || 0}
            color="orange"
          />
          <StatCard
            icon={Calendar}
            title="Total Appointments"
            value={stats.totalAppointments || 0}
            color="blue"
          />
          <StatCard
            icon={Calendar}
            title="Completed"
            value={stats.completedAppointments || 0}
            color="green"
          />
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading appointment data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        <StatCard
          icon={Calendar}
          title="Today's Appointments"
          value={stats.appointmentsToday || 0}
          color="orange"
        />
        <StatCard
          icon={Calendar}
          title="Total Appointments"
          value={stats.totalAppointments || 0}
          color="blue"
        />
        <StatCard
          icon={Calendar}
          title="Completed"
          value={stats.completedAppointments || 0}
          color="green"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Weekly Appointment Distribution */}
        <ChartCard title="Weekly Appointment Distribution">
          <div className="h-80 min-h-[320px] w-full">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={300}
              minHeight={300}
            >
              <BarChart
                data={appointmentData.weeklyDistribution}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="day"
                  tick={{ fill: "#374151" }}
                  axisLine={{ stroke: "#d1d5db" }}
                />
                <YAxis
                  tick={{ fill: "#374151" }}
                  axisLine={{ stroke: "#d1d5db" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "none",
                    borderRadius: "8px",
                    color: "white",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="appointments"
                  fill="#8884d8"
                  name="Appointments"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Appointment Status Distribution */}
        <ChartCard title="Appointment Status Distribution">
          <div className="h-80 min-h-[320px] w-full">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={300}
              minHeight={300}
            >
              <PieChart>
                <Pie
                  data={appointmentData.statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={CustomPieLabel}
                  outerRadius={100}
                  innerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={2}
                >
                  {appointmentData.statusDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend
                  layout="vertical"
                  verticalAlign="middle"
                  align="right"
                  wrapperStyle={{
                    paddingLeft: "20px",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* FIXED: Appointment Volume Over Time */}
        <ChartCard
          title="Appointment Volume (Last 6 Months)"
          className="lg:col-span-2"
        >
          <div className="h-80 min-h-[320px] w-full">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={300}
              minHeight={300}
            >
              <ComposedChart
                data={appointmentData.appointmentTrends}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#374151" }}
                  axisLine={{ stroke: "#d1d5db" }}
                />
                <YAxis
                  tick={{ fill: "#374151" }}
                  axisLine={{ stroke: "#d1d5db" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "none",
                    borderRadius: "8px",
                    color: "white",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="total"
                  fill="#8884d8"
                  name="Total Appointments"
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  type="monotone"
                  dataKey="completed"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Completed"
                  dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: "#10b981" }}
                />
                <Line
                  type="monotone"
                  dataKey="canceled"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="Canceled"
                  strokeDasharray="3 3"
                  dot={{ fill: "#ef4444", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: "#ef4444" }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

// Ratings Tab with NEW additional chart
function RatingsTab() {
  const [ratingsData, setRatingsData] = useState({
    ratings: [],
    loading: true,
    averageRating: "0.0",
    totalRatings: 0,
    ratingDistribution: [],
    recentRatings: 0,
    ratingTrends: [], // NEW: Data for additional chart
  });

  // Get admin token
  const getAdminToken = () => {
    return localStorage.getItem("admin_token");
  };

  // Fetch ratings data
  const fetchRatingsData = async () => {
    setRatingsData((prev) => ({ ...prev, loading: true }));
    try {
      const token = getAdminToken();
      if (!token) {
        toast.error("Admin authentication required");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/admin/rating`, {
        headers: {
          "Content-Type": "application/json",
          adminAuth: token,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch ratings");
      }

      const data = await response.json();

      if (data.status && data.status.toLowerCase() === "success") {
        const ratings = data.data || [];
        processRatingsData(ratings);
      } else {
        throw new Error(data.message || "Failed to fetch ratings");
      }
    } catch (error) {
      console.error("Error fetching ratings data:", error);
      toast.error("Failed to load ratings data");
      setRatingsData({
        ratings: [],
        loading: false,
        averageRating: "0.0",
        totalRatings: 0,
        ratingDistribution: [],
        recentRatings: 0,
        ratingTrends: [],
      });
    }
  };

  // Helper function to get user display name
  const getUserDisplayName = (user) => {
    if (!user) return "Unknown User";
    return user.fullName || user.username || user.email || "Unnamed User";
  };

  // Process ratings data for display
  const processRatingsData = (ratings) => {
    const totalRatings = ratings.length;

    // Calculate average rating
    const averageRating =
      totalRatings > 0
        ? (
            ratings.reduce((sum, rating) => sum + rating.rating, 0) /
            totalRatings
          ).toFixed(1)
        : "0.0";

    // Calculate rating distribution
    const ratingDistribution = [1, 2, 3, 4, 5].map((stars) => ({
      stars,
      count: ratings.filter((r) => r.rating === stars).length,
      percentage:
        totalRatings > 0
          ? (
              (ratings.filter((r) => r.rating === stars).length /
                totalRatings) *
              100
            ).toFixed(1)
          : "0.0",
    }));

    // Calculate recent ratings (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentRatings = ratings.filter(
      (rating) => new Date(rating.createdAt) >= thirtyDaysAgo
    ).length;

    // NEW: Generate rating trends data
    const ratingTrends = generateRatingTrends(ratings);

    setRatingsData({
      ratings,
      loading: false,
      averageRating,
      totalRatings,
      ratingDistribution,
      recentRatings,
      ratingTrends,
    });
  };

  // NEW: Generate rating trends data for the last 6 months
  const generateRatingTrends = (ratings) => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.push({
        month: date.toLocaleDateString("en-US", { month: "short" }),
        totalRatings: 0,
        averageRating: 0,
        ratings1: 0,
        ratings2: 0,
        ratings3: 0,
        ratings4: 0,
        ratings5: 0,
      });
    }

    ratings.forEach((rating) => {
      const ratingDate = new Date(rating.createdAt);
      const monthKey = ratingDate.toLocaleDateString("en-US", {
        month: "short",
      });

      const monthData = months.find((m) => m.month === monthKey);
      if (monthData) {
        monthData.totalRatings++;
        monthData[`ratings${rating.rating}`]++;
      }
    });

    // Calculate average rating for each month
    months.forEach((month) => {
      if (month.totalRatings > 0) {
        const totalScore =
          month.ratings1 * 1 +
          month.ratings2 * 2 +
          month.ratings3 * 3 +
          month.ratings4 * 4 +
          month.ratings5 * 5;
        month.averageRating = totalScore / month.totalRatings;
      }
    });

    return months;
  };

  useEffect(() => {
    fetchRatingsData();
  }, []);

  if (ratingsData.loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          <StatCard
            icon={Star}
            title="Average Rating"
            value={"0.0"}
            color="purple"
          />
          <StatCard
            icon={Star}
            title="Total Ratings"
            value={0}
            color="yellow"
          />
          <StatCard
            icon={TrendingUp}
            title="Recent Ratings"
            value={0}
            color="green"
          />
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading ratings data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        <StatCard
          icon={Star}
          title="Average Rating"
          value={ratingsData.averageRating}
          color="purple"
        />
        <StatCard
          icon={Star}
          title="Total Ratings"
          value={ratingsData.totalRatings}
          color="yellow"
        />
        <StatCard
          icon={TrendingUp}
          title="Recent Ratings (30d)"
          value={ratingsData.recentRatings}
          color="green"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Rating Distribution Chart */}
        <ChartCard title="Rating Distribution">
          <div className="h-80 min-h-[320px] w-full">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={300}
              minHeight={300}
            >
              <BarChart
                data={ratingsData.ratingDistribution}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="stars"
                  tick={{ fill: "#374151" }}
                  axisLine={{ stroke: "#d1d5db" }}
                />
                <YAxis
                  tick={{ fill: "#374151" }}
                  axisLine={{ stroke: "#d1d5db" }}
                />
                <Tooltip content={<CustomRatingTooltip />} />
                <Legend />
                <Bar
                  dataKey="count"
                  name="Number of Ratings"
                  radius={[4, 4, 0, 0]}
                >
                  {ratingsData.ratingDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={RATING_COLORS[index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* NEW: Rating Trends Over Time */}
        <ChartCard title="Rating Trends (Last 6 Months)">
          <div className="h-80 min-h-[320px] w-full">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={300}
              minHeight={300}
            >
              <ComposedChart
                data={ratingsData.ratingTrends}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#374151" }}
                  axisLine={{ stroke: "#d1d5db" }}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fill: "#374151" }}
                  axisLine={{ stroke: "#d1d5db" }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: "#374151" }}
                  axisLine={{ stroke: "#d1d5db" }}
                  domain={[0, 5]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "none",
                    borderRadius: "8px",
                    color: "white",
                  }}
                />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="totalRatings"
                  fill="#8884d8"
                  name="Total Ratings"
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="averageRating"
                  stroke="#ff7300"
                  strokeWidth={2}
                  name="Average Rating"
                  dot={{ fill: "#ff7300", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: "#ff7300" }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Recent Ratings List */}
        <ChartCard title="Recent Ratings" className="lg:col-span-2">
          <div className="max-h-96 overflow-y-auto">
            {ratingsData.ratings.length > 0 ? (
              <div className="space-y-3">
                {ratingsData.ratings.slice(0, 10).map((rating) => (
                  <div
                    key={rating._id}
                    className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <Star className="h-5 w-5 text-purple-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">
                            {getUserDisplayName(rating.student)}
                          </span>
                          <span className="text-gray-400">→</span>
                          <span className="text-sm font-medium text-gray-900">
                            {getUserDisplayName(rating.teacher)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= rating.rating
                                  ? "text-yellow-400 fill-current"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {rating.review &&
                        rating.review !== "No review provided."
                          ? rating.review
                          : "No review provided"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(rating.createdAt).toLocaleDateString()} •
                        Session: {rating.session?.title || "N/A"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No ratings found</p>
                <p className="text-gray-400 text-sm mt-1">
                  Ratings will appear here when users rate their sessions
                </p>
              </div>
            )}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

// Reports Tab Component with Defense Feature - FIXED SYNTAX
function ReportsTab() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedReport, setSelectedReport] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [defenseModal, setDefenseModal] = useState(false);
  const [selectedDefense, setSelectedDefense] = useState(null);

  // Get admin token
  const getAdminToken = () => {
    return localStorage.getItem("admin_token");
  };

  // Fetch reports from backend
  const fetchReports = async () => {
    setLoading(true);
    try {
      const token = getAdminToken();
      if (!token) {
        toast.error("Admin authentication required");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/report/admin`, {
        headers: {
          "Content-Type": "application/json",
          adminAuth: token,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch reports: ${response.status}`);
      }

      const data = await response.json();

      if (data.status && data.status.toLowerCase() === "success") {
        setReports(data.data || []);
      } else {
        throw new Error(data.message || "Failed to fetch reports");
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error(error.message || "Failed to load reports");
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch defense for a report
  const fetchDefense = async (reportId) => {
    try {
      const token = getAdminToken();
      if (!token) {
        toast.error("Admin authentication required");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/report/admin/${reportId}/defense`,
        {
          headers: {
            "Content-Type": "application/json",
            adminAuth: token,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to fetch defense: ${response.status}`);
      }

      const data = await response.json();
      if (data.status && data.status.toLowerCase() === "success") {
        return data.data;
      }
      return null;
    } catch (error) {
      console.error("Error fetching defense:", error);
      return null;
    }
  };

  // Helper function to get user display name
  const getUserDisplayName = (user) => {
    if (!user) return "Unknown User";
    return user.fullName || user.username || user.email || "Unnamed User";
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      getUserDisplayName(report.reportedBy)
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      getUserDisplayName(report.reportedUser)
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      report.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reason?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || report.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setShowModal(true);
  };

  const handleViewDefense = async (report) => {
    try {
      const defense = await fetchDefense(report._id);
      setSelectedDefense({
        report,
        defense,
      });
      setDefenseModal(true);
    } catch (error) {
      console.error("Error loading defense:", error);
      toast.error("Failed to load defense");
    }
  };

  const handleAcceptReport = async (reportId) => {
    try {
      const token = getAdminToken();
      if (!token) {
        toast.error("Admin authentication required");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/report/admin/${reportId}/accept`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            adminAuth: token,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to accept report: ${response.status}`);
      }

      const data = await response.json();

      if (data.status && data.status.toLowerCase() === "success") {
        toast.success("Report accepted and user banned");
        fetchReports();
        setShowModal(false);
      } else {
        throw new Error(data.message || "Failed to accept report");
      }
    } catch (error) {
      console.error("Error accepting report:", error);
      toast.error(error.message || "Failed to accept report");
    }
  };

  const handleRejectReport = async (reportId) => {
    try {
      const token = getAdminToken();
      if (!token) {
        toast.error("Admin authentication required");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/report/admin/${reportId}/reject`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            adminAuth: token,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to reject report: ${response.status}`);
      }

      const data = await response.json();

      if (data.status && data.status.toLowerCase() === "success") {
        toast.success("Report rejected");
        fetchReports();
        setShowModal(false);
      } else {
        throw new Error(data.message || "Failed to reject report");
      }
    } catch (error) {
      console.error("Error rejecting report:", error);
      toast.error(error.message || "Failed to reject report");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "accepted":
        return "bg-green-100 text-green-800 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTitleDisplay = (title) => {
    const titleMap = {
      spam: "Spam or Scam",
      harassment: "Harassment or Bullying",
      inappropriate: "Inappropriate Content",
      fake: "Fake Account",
      other: "Other",
    };
    return titleMap[title] || title;
  };

  // Fix for proof image URL - remove double slash
  const getProofUrl = (proofPath) => {
    if (!proofPath) return null;
    const cleanPath = proofPath.startsWith("/")
      ? proofPath.slice(1)
      : proofPath;
    return `${API_BASE_URL}/${cleanPath}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            Reports Management
          </h2>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Review and manage user reports with defense system
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">
            {reports.length}
          </div>
          <div className="text-sm text-gray-600">Total Reports</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Reports
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search by user, type, or reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs sm:text-sm font-medium text-gray-600">
                Pending
              </p>
              <p className="text-lg sm:text-xl font-bold text-gray-900">
                {reports.filter((r) => r.status === "pending").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs sm:text-sm font-medium text-gray-600">
                Accepted
              </p>
              <p className="text-lg sm:text-xl font-bold text-gray-900">
                {reports.filter((r) => r.status === "accepted").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <Ban className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs sm:text-sm font-medium text-gray-600">
                Rejected
              </p>
              <p className="text-lg sm:text-xl font-bold text-gray-900">
                {reports.filter((r) => r.status === "rejected").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Flag className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs sm:text-sm font-medium text-gray-600">
                Total
              </p>
              <p className="text-lg sm:text-xl font-bold text-gray-900">
                {reports.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Report Details
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                  Users
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReports.map((report) => (
                <tr
                  key={report._id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-4">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Flag className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {getTitleDisplay(report.title)}
                        </p>
                        <p className="text-sm text-gray-500 truncate max-w-xs">
                          {report.reason}
                        </p>
                        {report.proof && (
                          <span className="text-xs text-gray-500 mt-1">
                            Has proof
                          </span>
                        )}
                        {/* Mobile user info */}
                        <div className="sm:hidden mt-2">
                          <div className="flex items-center text-xs text-gray-500">
                            <User className="h-3 w-3 mr-1" />
                            {getUserDisplayName(report.reportedBy)} →{" "}
                            {getUserDisplayName(report.reportedUser)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 hidden sm:table-cell">
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <User className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="font-medium text-gray-900">
                          {getUserDisplayName(report.reportedBy)}
                        </span>
                        <span className="text-gray-500 ml-1">(reporter)</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <User className="h-4 w-4 text-red-400 mr-2" />
                        <span className="font-medium text-gray-900">
                          {getUserDisplayName(report.reportedUser)}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        report.status
                      )}`}
                    >
                      {report.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500 hidden md:table-cell">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <button
                        onClick={() => handleViewReport(report)}
                        className="inline-flex items-center justify-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </button>

                      <button
                        onClick={() => handleViewDefense(report)}
                        className="inline-flex items-center justify-center px-3 py-1.5 border border-blue-300 text-sm font-medium rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                      >
                        <ShieldAlert className="h-4 w-4 mr-1" />
                        Defense
                      </button>

                      {report.status === "pending" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAcceptReport(report._id)}
                            className="inline-flex items-center justify-center px-3 py-1.5 border border-green-300 text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 transition-colors"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Accept
                          </button>

                          <button
                            onClick={() => handleRejectReport(report._id)}
                            className="inline-flex items-center justify-center px-3 py-1.5 border border-red-300 text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 transition-colors"
                          >
                            <Ban className="h-4 w-4 mr-1" />
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredReports.length === 0 && (
          <div className="text-center py-12">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {reports.length === 0
                ? "No reports found"
                : "No reports matching your criteria"}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {reports.length === 0
                ? "Reports will appear here when users submit them"
                : "Try adjusting your search or filters"}
            </p>
          </div>
        )}
      </div>

      {/* Report Detail Modal */}
      {showModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Flag className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                      {getTitleDisplay(selectedReport.title)}
                    </h2>
                    <p className="text-sm text-gray-500">
                      Report ID: {selectedReport._id}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-6">
              {/* User Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Reporter
                  </h3>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">Name:</span>{" "}
                      {getUserDisplayName(selectedReport.reportedBy)}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Email:</span>{" "}
                      {selectedReport.reportedBy?.email || "Unknown"}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">User ID:</span>{" "}
                      {selectedReport.reportedBy?._id || "Unknown"}
                    </p>
                  </div>
                </div>

                <div className="bg-red-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Reported User
                  </h3>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">Name:</span>{" "}
                      {getUserDisplayName(selectedReport.reportedUser)}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Email:</span>{" "}
                      {selectedReport.reportedUser?.email || "Unknown"}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">User ID:</span>{" "}
                      {selectedReport.reportedUser?._id || "Unknown"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Report Details */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Report Reason
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-900">
                    {selectedReport.reason}
                  </p>
                </div>
              </div>

              {/* Proof Section */}
              {selectedReport.proof && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Proof
                  </h3>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="h-64 bg-gray-100 flex items-center justify-center">
                      <img
                        src={getProofUrl(selectedReport.proof)}
                        alt="Report proof"
                        className="h-full w-full object-contain"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "flex";
                        }}
                      />
                      <div className="hidden h-full w-full items-center justify-center bg-gray-100">
                        <FileText className="h-12 w-12 text-gray-400" />
                        <span className="ml-2 text-gray-500">Proof Image</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Status and Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Report Status
                  </h3>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">Status:</span>
                      <span
                        className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          selectedReport.status
                        )}`}
                      >
                        {selectedReport.status}
                      </span>
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Created:</span>{" "}
                      {new Date(selectedReport.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Actions
                  </h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => handleViewDefense(selectedReport)}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center"
                    >
                      <ShieldAlert className="h-4 w-4 mr-2" />
                      View Defense
                    </button>

                    {selectedReport.status === "pending" ? (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => handleAcceptReport(selectedReport._id)}
                          className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Accept & Ban User
                        </button>
                        <button
                          onClick={() => handleRejectReport(selectedReport._id)}
                          className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center"
                        >
                          <Ban className="h-4 w-4 mr-2" />
                          Reject Report
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">
                          This report has been {selectedReport.status}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Defense Detail Modal */}
      {defenseModal && selectedDefense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <ShieldAlert className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                      User Defense
                    </h2>
                    <p className="text-sm text-gray-500">
                      Defense for report:{" "}
                      {getTitleDisplay(selectedDefense.report.title)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setDefenseModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-6">
              {/* Defense Information */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Defense Submitted By
                </h3>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Name:</span>{" "}
                    {getUserDisplayName(selectedDefense.report.reportedUser)}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Email:</span>{" "}
                    {selectedDefense.report.reportedUser?.email || "Unknown"}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">User ID:</span>{" "}
                    {selectedDefense.report.reportedUser?._id || "Unknown"}
                  </p>
                </div>
              </div>

              {/* Defense Text */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Defense Statement
                </h3>
                <div className="bg-white border border-blue-200 rounded-lg p-4">
                  {selectedDefense.defense ? (
                    <>
                      <p className="text-sm text-gray-900 mb-4">
                        {selectedDefense.defense.defenseText ||
                          "No defense text provided."}
                      </p>
                      {selectedDefense.defense.submittedAt && (
                        <p className="text-xs text-gray-500">
                          Submitted:{" "}
                          {new Date(
                            selectedDefense.defense.submittedAt
                          ).toLocaleString()}
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">No defense submitted yet</p>
                      <p className="text-gray-400 text-sm mt-1">
                        The reported user has not submitted a defense statement
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Defense Proof Images */}
              {selectedDefense.defense &&
                selectedDefense.defense.defenseImages &&
                selectedDefense.defense.defenseImages.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                      Defense Proof Images
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedDefense.defense.defenseImages.map(
                        (imagePath, index) => (
                          <div
                            key={index}
                            className="border border-gray-200 rounded-lg overflow-hidden"
                          >
                            <div className="h-48 bg-gray-100 flex items-center justify-center">
                              <img
                                src={getProofUrl(imagePath)}
                                alt={`Defense proof ${index + 1}`}
                                className="h-full w-full object-contain"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                  e.target.nextSibling.style.display = "flex";
                                }}
                              />
                              <div className="hidden h-full w-full items-center justify-center bg-gray-100">
                                <Image className="h-8 w-8 text-gray-400" />
                                <span className="ml-2 text-gray-500">
                                  Image {index + 1}
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* Original Report Reference */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Original Report Reference
                </h3>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Report Type:</span>{" "}
                    {getTitleDisplay(selectedDefense.report.title)}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Reason:</span>{" "}
                    {selectedDefense.report.reason}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Status:</span>{" "}
                    <span
                      className={`ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        selectedDefense.report.status
                      )}`}
                    >
                      {selectedDefense.report.status}
                    </span>
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setDefenseModal(false);
                    setShowModal(true);
                  }}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  View Full Report
                </button>
                {selectedDefense.report.status === "pending" && (
                  <>
                    <button
                      onClick={() =>
                        handleAcceptReport(selectedDefense.report._id)
                      }
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      Accept Report
                    </button>
                    <button
                      onClick={() =>
                        handleRejectReport(selectedDefense.report._id)
                      }
                      className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                      Reject Report
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
