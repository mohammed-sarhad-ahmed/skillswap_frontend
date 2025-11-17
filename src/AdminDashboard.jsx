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
} from "lucide-react";
import toast from "react-hot-toast";

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
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];
const RATING_COLORS = ["#ff4d4f", "#ffa940", "#ffec3d", "#73d13d", "#52c41a"];

// API Base URL - adjust according to your config
import { API_BASE_URL } from "./Config";

// Default empty data structure
const defaultStats = {
  // User stats
  totalUsers: 0,
  totalTeachers: 0,
  totalStudents: 0,
  newUsersThisMonth: 0,

  // Course stats
  activeCourses: 0,
  pendingProposals: 0,
  totalCourseEnrollments: 0,

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
  courseCategoryData: [],
  appointmentStats: [],
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

      // TODO: Add your actual API endpoints here
      // For now, we'll use empty data since mock data is removed
      setStats(defaultStats);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
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
        {/* Header - Updated with Refresh Button */}
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
          {activeTab === "users" && <UsersTab stats={stats} />}
          {activeTab === "courses" && <CoursesTab stats={stats} />}
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
  // Position labels outside the pie segments for better visibility
  const radius = outerRadius * 1.15;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="#374151" // Dark gray color for better contrast
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
          {data.value} appointments ({(data.percent * 100).toFixed(1)}%)
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

// Tab Components with real data
function OverviewTab({ stats }) {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <StatCard
          icon={Users}
          title="Total Users"
          value={stats.totalUsers || 0}
          color="blue"
        />
        <StatCard
          icon={BookOpen}
          title="Active Courses"
          value={stats.activeCourses || 0}
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

      {/* Charts Grid - Will be populated with real data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <ChartCard title="User Growth">
          <div className="h-64 sm:h-72 lg:h-80 flex items-center justify-center">
            <p className="text-gray-500 text-center">
              User growth data will be displayed here
              <br />
              <span className="text-sm">(Connect to backend API)</span>
            </p>
          </div>
        </ChartCard>

        <ChartCard title="Course Categories">
          <div className="h-64 sm:h-72 lg:h-80 flex items-center justify-center">
            <p className="text-gray-500 text-center">
              Course categories data will be displayed here
              <br />
              <span className="text-sm">(Connect to backend API)</span>
            </p>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

function UsersTab({ stats }) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        <StatCard
          icon={Users}
          title="Total Users"
          value={stats.totalUsers || 0}
          color="blue"
        />
        <StatCard
          icon={BookOpen}
          title="Teachers"
          value={stats.totalTeachers || 0}
          color="green"
        />
        <StatCard
          icon={Users}
          title="Students"
          value={stats.totalStudents || 0}
          color="purple"
        />
      </div>

      <ChartCard title="User Growth Over Time">
        <div className="h-80 sm:h-96 flex items-center justify-center">
          <p className="text-gray-500 text-center">
            User growth chart will be displayed here
            <br />
            <span className="text-sm">(Connect to backend API)</span>
          </p>
        </div>
      </ChartCard>
    </div>
  );
}

function CoursesTab({ stats }) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        <StatCard
          icon={BookOpen}
          title="Active Courses"
          value={stats.activeCourses || 0}
          color="green"
        />
        <StatCard
          icon={FileText}
          title="Pending Proposals"
          value={stats.pendingProposals || 0}
          color="orange"
        />
        <StatCard
          icon={Users}
          title="Total Enrollments"
          value={stats.totalCourseEnrollments || 0}
          color="blue"
        />
      </div>

      <ChartCard title="Course Categories Distribution">
        <div className="h-80 sm:h-96 flex items-center justify-center">
          <p className="text-gray-500 text-center">
            Course categories distribution will be displayed here
            <br />
            <span className="text-sm">(Connect to backend API)</span>
          </p>
        </div>
      </ChartCard>
    </div>
  );
}

// Appointments Tab with Fixed Charts
function AppointmentsTab({ stats }) {
  const [appointmentData, setAppointmentData] = useState({
    weeklyDistribution: [],
    statusDistribution: [],
    dailyAppointments: [],
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

      // Fetch all appointments
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
      // Set default data for demo with better distribution
      setAppointmentData({
        weeklyDistribution: [
          { day: "Mon", appointments: 12 },
          { day: "Tue", appointments: 19 },
          { day: "Wed", appointments: 8 },
          { day: "Thu", appointments: 15 },
          { day: "Fri", appointments: 11 },
          { day: "Sat", appointments: 5 },
          { day: "Sun", appointments: 3 },
        ],
        statusDistribution: [
          { name: "Pending", value: 15, percent: 0.16 },
          { name: "Confirmed", value: 25, percent: 0.26 },
          { name: "Ongoing", value: 8, percent: 0.08 },
          { name: "Completed", value: 42, percent: 0.44 },
          { name: "Canceled", value: 5, percent: 0.05 },
        ],
        dailyAppointments: [
          { date: "Mon, Dec 9", appointments: 8 },
          { date: "Tue, Dec 10", appointments: 12 },
          { date: "Wed, Dec 11", appointments: 6 },
          { date: "Thu, Dec 12", appointments: 14 },
          { date: "Fri, Dec 13", appointments: 9 },
          { date: "Sat, Dec 14", appointments: 4 },
          { date: "Sun, Dec 15", appointments: 2 },
        ],
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

    setAppointmentData({
      weeklyDistribution: weeklyData,
      statusDistribution: statusData,
      dailyAppointments: dailyData,
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
        const dayIndex = (date.getDay() + 6) % 7; // Convert to Mon-Sun (0-6)
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

  useEffect(() => {
    fetchAppointmentData();
  }, []);

  // Calculate appointment stats from the data
  const calculateAppointmentStats = () => {
    const today = new Date().toISOString().split("T")[0];
    const todayAppointments =
      appointmentData.dailyAppointments.find((day) => {
        const todayFormatted = new Date().toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        });
        return day.date === todayFormatted;
      })?.appointments || 0;

    const totalAppointments = appointmentData.statusDistribution.reduce(
      (sum, status) => sum + status.value,
      0
    );

    const completedAppointments =
      appointmentData.statusDistribution.find(
        (status) => status.name === "Completed"
      )?.value || 0;

    return {
      today: todayAppointments,
      total: totalAppointments,
      completed: completedAppointments,
    };
  };

  const appointmentStats = calculateAppointmentStats();

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
      {/* Stats Grid - Using calculated stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        <StatCard
          icon={Calendar}
          title="Today's Appointments"
          value={appointmentStats.today}
          color="orange"
        />
        <StatCard
          icon={Calendar}
          title="Total Appointments"
          value={appointmentStats.total}
          color="blue"
        />
        <StatCard
          icon={Calendar}
          title="Completed"
          value={appointmentStats.completed}
          color="green"
        />
      </div>

      {/* Charts Grid - FIXED: Improved charts with better styling */}
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

        {/* Appointment Status Distribution - FIXED: Better pie chart with improved labels */}
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
                  formatter={(value, entry, index) => {
                    const statusName =
                      appointmentData.statusDistribution[index]?.name || value;
                    return statusName.length > 10
                      ? `${statusName.substring(0, 10)}...`
                      : statusName;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Daily Appointments Trend */}
        <ChartCard title="Daily Appointments Trend (Last 7 Days)">
          <div className="h-80 min-h-[320px] w-full">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={300}
              minHeight={300}
            >
              <LineChart
                data={appointmentData.dailyAppointments}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  angle={-45}
                  textAnchor="end"
                  height={60}
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
                  dataKey="appointments"
                  stroke="#ff8042"
                  strokeWidth={2}
                  name="Appointments"
                  dot={{ fill: "#ff8042", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: "#ff8042" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Appointment Completion Rate */}
        <ChartCard title="Appointment Metrics">
          <div className="h-80 min-h-[320px] flex items-center justify-center">
            <div className="grid grid-cols-2 gap-4 text-center w-full max-w-md">
              <div className="bg-blue-50 rounded-lg p-4 sm:p-6 border border-blue-200">
                <div className="text-xl sm:text-2xl font-bold text-blue-600">
                  {appointmentData.statusDistribution.find(
                    (s) => s.name === "Completed"
                  )?.value || 0}
                </div>
                <div className="text-sm text-blue-600 mt-1 font-medium">
                  Completed
                </div>
                <div className="text-xs text-blue-500 mt-1">
                  {(
                    (appointmentData.statusDistribution.find(
                      (s) => s.name === "Completed"
                    )?.percent || 0) * 100
                  ).toFixed(1)}
                  %
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 sm:p-6 border border-green-200">
                <div className="text-xl sm:text-2xl font-bold text-green-600">
                  {appointmentData.statusDistribution.find(
                    (s) => s.name === "Confirmed"
                  )?.value || 0}
                </div>
                <div className="text-sm text-green-600 mt-1 font-medium">
                  Confirmed
                </div>
                <div className="text-xs text-green-500 mt-1">
                  {(
                    (appointmentData.statusDistribution.find(
                      (s) => s.name === "Confirmed"
                    )?.percent || 0) * 100
                  ).toFixed(1)}
                  %
                </div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4 sm:p-6 border border-yellow-200">
                <div className="text-xl sm:text-2xl font-bold text-yellow-600">
                  {appointmentData.statusDistribution.find(
                    (s) => s.name === "Pending"
                  )?.value || 0}
                </div>
                <div className="text-sm text-yellow-600 mt-1 font-medium">
                  Pending
                </div>
                <div className="text-xs text-yellow-500 mt-1">
                  {(
                    (appointmentData.statusDistribution.find(
                      (s) => s.name === "Pending"
                    )?.percent || 0) * 100
                  ).toFixed(1)}
                  %
                </div>
              </div>
              <div className="bg-red-50 rounded-lg p-4 sm:p-6 border border-red-200">
                <div className="text-xl sm:text-2xl font-bold text-red-600">
                  {appointmentData.statusDistribution.find(
                    (s) => s.name === "Canceled"
                  )?.value || 0}
                </div>
                <div className="text-sm text-red-600 mt-1 font-medium">
                  Canceled
                </div>
                <div className="text-xs text-red-500 mt-1">
                  {(
                    (appointmentData.statusDistribution.find(
                      (s) => s.name === "Canceled"
                    )?.percent || 0) * 100
                  ).toFixed(1)}
                  %
                </div>
              </div>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-center">
        <button
          onClick={fetchAppointmentData}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <RefreshCw size={16} />
          <span>Refresh Appointment Data</span>
        </button>
      </div>
    </div>
  );
}

// Ratings Tab with Real Data Integration
function RatingsTab() {
  const [ratingsData, setRatingsData] = useState({
    ratings: [],
    loading: true,
    averageRating: "0.0",
    totalRatings: 0,
    ratingDistribution: [],
    recentRatings: 0,
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

      // Fetch all ratings from your existing route
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
      // Set empty data on error
      setRatingsData({
        ratings: [],
        loading: false,
        averageRating: "0.0",
        totalRatings: 0,
        ratingDistribution: [],
        recentRatings: 0,
      });
    }
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

    setRatingsData({
      ratings,
      loading: false,
      averageRating,
      totalRatings,
      ratingDistribution,
      recentRatings,
    });
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
                  label={{
                    value: "Stars",
                    position: "insideBottom",
                    offset: -5,
                  }}
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

        {/* Rating Percentage Chart */}
        <ChartCard title="Rating Percentage Breakdown">
          <div className="h-80 min-h-[320px] w-full">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={300}
              minHeight={300}
            >
              <PieChart>
                <Pie
                  data={ratingsData.ratingDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={CustomPieLabel}
                  outerRadius={100}
                  innerRadius={60}
                  dataKey="count"
                  paddingAngle={2}
                >
                  {ratingsData.ratingDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={RATING_COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomRatingTooltip />} />
                <Legend
                  layout="vertical"
                  verticalAlign="middle"
                  align="right"
                  wrapperStyle={{
                    paddingLeft: "20px",
                    fontSize: "12px",
                  }}
                  formatter={(value, entry, index) => {
                    const stars =
                      ratingsData.ratingDistribution[index]?.stars || 0;
                    return `${stars} Star${stars !== 1 ? "s" : ""}`;
                  }}
                />
              </PieChart>
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
                            {rating.student?.fullName || "Unknown Student"}
                          </span>
                          <span className="text-gray-400">→</span>
                          <span className="text-sm font-medium text-gray-900">
                            {rating.teacher?.fullName || "Unknown Teacher"}
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

      {/* Refresh Button */}
      <div className="flex justify-center">
        <button
          onClick={fetchRatingsData}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <RefreshCw size={16} />
          <span>Refresh Ratings Data</span>
        </button>
      </div>
    </div>
  );
}

// Reports Tab Component with Real Backend Integration
function ReportsTab() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedReport, setSelectedReport] = useState(null);
  const [showModal, setShowModal] = useState(false);

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

      console.log("Fetching reports from:", `${API_BASE_URL}/report/admin`);

      const response = await fetch(`${API_BASE_URL}/report/admin`, {
        headers: {
          "Content-Type": "application/json",
          adminAuth: token,
        },
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(`Failed to fetch reports: ${response.status}`);
      }

      const data = await response.json();
      console.log("Reports data:", data);

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

  useEffect(() => {
    fetchReports();
  }, []);

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.reportedBy?.fullName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      report.reportedUser?.fullName
        ?.toLowerCase()
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

  const handleAcceptReport = async (reportId) => {
    try {
      const token = getAdminToken();
      if (!token) {
        toast.error("Admin authentication required");
        return;
      }

      console.log("Accepting report:", reportId);

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

      console.log("Accept response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(`Failed to accept report: ${response.status}`);
      }

      const data = await response.json();
      console.log("Accept response data:", data);

      if (data.status && data.status.toLowerCase() === "success") {
        toast.success("Report accepted and user banned");
        fetchReports(); // Refresh the list
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

      console.log("Rejecting report:", reportId);

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

      console.log("Reject response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(`Failed to reject report: ${response.status}`);
      }

      const data = await response.json();
      console.log("Reject response data:", data);

      if (data.status && data.status.toLowerCase() === "success") {
        toast.success("Report rejected");
        fetchReports(); // Refresh the list
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
    // Remove leading slash if present to avoid double slash
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
            Review and manage user reports
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

          {/* Refresh Button */}
          <div className="flex items-end">
            <button
              onClick={fetchReports}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw size={16} />
              <span>Refresh</span>
            </button>
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
                            {report.reportedBy?.fullName} →{" "}
                            {report.reportedUser?.fullName}
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
                          {report.reportedBy?.fullName || "Unknown"}
                        </span>
                        <span className="text-gray-500 ml-1">(reporter)</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <User className="h-4 w-4 text-red-400 mr-2" />
                        <span className="font-medium text-gray-900">
                          {report.reportedUser?.fullName || "Unknown"}
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
                      {selectedReport.reportedBy?.fullName || "Unknown"}
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
                      {selectedReport.reportedUser?.fullName || "Unknown"}
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
    </div>
  );
}
