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
} from "recharts";
import { PieChart as RePieChart, Pie, Cell } from "recharts";
import { LineChart as ReLineChart, Line } from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

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

  // Raw data for tables
  recentUsers: [],
  recentCourses: [],
  recentAppointments: [],
  recentRatings: [],
};

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(defaultStats);
  const [activeTab, setActiveTab] = useState("overview");
  const navigate = useNavigate();

  useEffect(() => {
    // Simulate API call delay
    setLoading(true);
    setTimeout(() => {
      setStats(generateMockData());
      setLoading(false);
    }, 1000);
  }, []);

  // Mock data generator based on your backend routes
  const generateMockData = () => {
    // User data based on /user/ route
    const mockUsers = Array.from({ length: 150 }, (_, i) => ({
      id: i + 1,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      role: i % 3 === 0 ? "teacher" : "student",
      credits: Math.floor(Math.random() * 100),
      createdAt: new Date(
        Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
      ).toISOString(),
      skills: i % 3 === 0 ? ["teaching"] : ["learning"],
    }));

    // Course data based on /courses/ routes
    const mockCourses = Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      title: `Course ${i + 1}`,
      category: ["Programming", "Design", "Business", "Language", "Music"][
        i % 5
      ],
      status: i % 10 === 0 ? "pending" : "active",
      teacher: `Teacher ${Math.floor(i / 5) + 1}`,
      weeks: Math.floor(Math.random() * 12) + 1,
      students: Math.floor(Math.random() * 50),
      createdAt: new Date(
        Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000
      ).toISOString(),
    }));

    // Appointment data based on /appointments/ route
    const mockAppointments = Array.from({ length: 200 }, (_, i) => ({
      id: i + 1,
      student: `Student ${(i % 50) + 1}`,
      teacher: `Teacher ${(i % 15) + 1}`,
      date: new Date(
        Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000
      ).toISOString(),
      status: ["scheduled", "completed", "cancelled"][i % 3],
      duration: [30, 45, 60][i % 3],
      course: `Course ${(i % 50) + 1}`,
    }));

    // Rating data based on /ratings/ routes
    const mockRatings = Array.from({ length: 300 }, (_, i) => ({
      id: i + 1,
      rating: Math.floor(Math.random() * 5) + 1,
      reviewer: `User ${(i % 100) + 1}`,
      teacher: `Teacher ${(i % 15) + 1}`,
      course: `Course ${(i % 50) + 1}`,
      comment: `Great experience with this course!`,
      createdAt: new Date(
        Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000
      ).toISOString(),
    }));

    // Generate user growth data
    const userGrowthData = [
      { month: "Jan", users: 400, teachers: 120 },
      { month: "Feb", users: 600, teachers: 180 },
      { month: "Mar", users: 800, teachers: 240 },
      { month: "Apr", users: 1200, teachers: 360 },
      { month: "May", users: 1600, teachers: 480 },
      { month: "Jun", users: 2000, teachers: 600 },
    ];

    // Generate course category data
    const courseCategoryData = [
      { name: "Programming", value: 35 },
      { name: "Design", value: 25 },
      { name: "Business", value: 20 },
      { name: "Language", value: 15 },
      { name: "Other", value: 5 },
    ];

    // Generate appointment stats
    const appointmentStats = [
      { day: "Mon", completed: 40, scheduled: 60, cancelled: 5 },
      { day: "Tue", completed: 45, scheduled: 65, cancelled: 3 },
      { day: "Wed", completed: 50, scheduled: 70, cancelled: 7 },
      { day: "Thu", completed: 55, scheduled: 75, cancelled: 4 },
      { day: "Fri", completed: 60, scheduled: 80, cancelled: 6 },
      { day: "Sat", completed: 30, scheduled: 40, cancelled: 2 },
      { day: "Sun", completed: 20, scheduled: 30, cancelled: 1 },
    ];

    // Generate weekly activity
    const weeklyActivity = [
      { day: "Mon", appointments: 25, registrations: 8 },
      { day: "Tue", appointments: 30, registrations: 12 },
      { day: "Wed", appointments: 35, registrations: 15 },
      { day: "Thu", appointments: 40, registrations: 18 },
      { day: "Fri", appointments: 45, registrations: 20 },
      { day: "Sat", appointments: 20, registrations: 5 },
      { day: "Sun", appointments: 15, registrations: 3 },
    ];

    // Generate rating distribution
    const ratingDistribution = [
      { rating: "1 star", count: 12 },
      { rating: "2 star", count: 23 },
      { rating: "3 star", count: 45 },
      { rating: "4 star", count: 156 },
      { rating: "5 star", count: 656 },
    ];

    return {
      // User stats
      totalUsers: mockUsers.length,
      totalTeachers: mockUsers.filter((u) => u.role === "teacher").length,
      totalStudents: mockUsers.filter((u) => u.role === "student").length,
      newUsersThisMonth: Math.floor(Math.random() * 50) + 20,

      // Course stats
      activeCourses: mockCourses.filter((c) => c.status === "active").length,
      pendingProposals: mockCourses.filter((c) => c.status === "pending")
        .length,
      totalCourseEnrollments: mockCourses.reduce(
        (sum, course) => sum + course.students,
        0
      ),

      // Appointment stats
      appointmentsToday: mockAppointments.filter(
        (a) => new Date(a.date).toDateString() === new Date().toDateString()
      ).length,
      totalAppointments: mockAppointments.length,
      completedAppointments: mockAppointments.filter(
        (a) => a.status === "completed"
      ).length,

      // Rating stats
      averageRating: (
        mockRatings.reduce((sum, r) => sum + r.rating, 0) / mockRatings.length
      ).toFixed(1),
      totalRatings: mockRatings.length,
      ratingDistribution,

      // Chart data
      userGrowthData,
      courseCategoryData,
      appointmentStats,
      weeklyActivity,

      // Raw data for tables
      recentUsers: mockUsers.slice(0, 10),
      recentCourses: mockCourses.slice(0, 10),
      recentAppointments: mockAppointments.slice(0, 10),
      recentRatings: mockRatings.slice(0, 10),
    };
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    toast.success("Logged out successfully");
    navigate("/admin/login", { replace: true });
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
        {/* Header - Made Responsive */}
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
                onClick={() => {
                  setLoading(true);
                  setTimeout(() => {
                    setStats(generateMockData());
                    setLoading(false);
                    toast.success("Data refreshed!");
                  }, 800);
                }}
                className="px-2 sm:px-3 py-2 text-xs sm:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
              >
                Refresh Data
              </button>
              <span className="text-xs sm:text-sm text-gray-700 hidden sm:inline">
                Welcome, Admin
              </span>
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
          {activeTab === "ratings" && <RatingsTab stats={stats} />}
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

  // Safe color access with fallback to blue
  const colorConfig = colorClasses[color] || colorClasses.blue;
  const { bg, text, icon } = colorConfig;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs sm:text-sm font-medium text-gray-600">
            {title}
          </p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
            {value}
          </p>
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

// Tab Components with safe data access
function OverviewTab({ stats }) {
  // Ensure arrays exist before mapping
  const userGrowthData = stats.userGrowthData || [];
  const courseCategoryData = stats.courseCategoryData || [];
  const weeklyActivity = stats.weeklyActivity || [];
  const appointmentStats = stats.appointmentStats || [];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <StatCard
          icon={Users}
          title="Total Users"
          value={stats.totalUsers || 0}
          growth="+12.5%"
          color="blue"
        />
        <StatCard
          icon={BookOpen}
          title="Active Courses"
          value={stats.activeCourses || 0}
          growth="+8.3%"
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
          growth="+0.2"
          color="purple"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <ChartCard title="User Growth">
          <div className="h-64 sm:h-72 lg:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="users" fill="#3B82F6" name="Total Users" />
                <Bar dataKey="teachers" fill="#10B981" name="Teachers" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Course Categories">
          <div className="h-64 sm:h-72 lg:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={courseCategoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {courseCategoryData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <ChartCard title="Weekly Activity">
          <div className="h-64 sm:h-72 lg:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ReLineChart data={weeklyActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="appointments"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  name="Appointments"
                />
                <Line
                  type="monotone"
                  dataKey="registrations"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  name="Registrations"
                />
              </ReLineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Appointment Status">
          <div className="h-64 sm:h-72 lg:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={appointmentStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" fill="#10B981" name="Completed" />
                <Bar dataKey="scheduled" fill="#3B82F6" name="Scheduled" />
                <Bar dataKey="cancelled" fill="#EF4444" name="Cancelled" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

function UsersTab({ stats }) {
  const userGrowthData = stats.userGrowthData || [];

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
        <div className="h-80 sm:h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={userGrowthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="users" fill="#3B82F6" name="Total Users" />
              <Bar dataKey="teachers" fill="#10B981" name="Teachers" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
}

function CoursesTab({ stats }) {
  const courseCategoryData = stats.courseCategoryData || [];

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
        <div className="h-80 sm:h-96">
          <ResponsiveContainer width="100%" height="100%">
            <RePieChart>
              <Pie
                data={courseCategoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {courseCategoryData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </RePieChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
}

function AppointmentsTab({ stats }) {
  const appointmentStats = stats.appointmentStats || [];

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

      <ChartCard title="Weekly Appointment Distribution">
        <div className="h-80 sm:h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={appointmentStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="completed" fill="#10B981" name="Completed" />
              <Bar dataKey="scheduled" fill="#3B82F6" name="Scheduled" />
              <Bar dataKey="cancelled" fill="#EF4444" name="Cancelled" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
}

function RatingsTab({ stats }) {
  const ratingDistribution = stats.ratingDistribution || [];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
        <StatCard
          icon={Star}
          title="Average Rating"
          value={stats.averageRating || "0.0"}
          color="purple"
        />
        <StatCard
          icon={Star}
          title="Total Ratings"
          value={stats.totalRatings || 0}
          color="yellow"
        />
      </div>

      <ChartCard title="Rating Distribution">
        <div className="h-80 sm:h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ratingDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="rating" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#F59E0B" name="Number of Ratings" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
}

// Reports Tab Component
function ReportsTab() {
  const [reports, setReports] = useState(generateMockReports());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedReport, setSelectedReport] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Mock reports data
  function generateMockReports() {
    const reportTypes = [
      "Harassment",
      "Spam",
      "Inappropriate Content",
      "False Information",
      "Academic Dishonesty",
      "Other",
    ];
    const statuses = ["pending", "reviewed", "resolved"];
    const severities = ["low", "medium", "high", "critical"];

    return Array.from({ length: 25 }, (_, i) => ({
      id: `RPT-${1000 + i}`,
      reporter: {
        id: i + 1,
        name: `User${i + 1}`,
        email: `user${i + 1}@example.com`,
      },
      reportedUser: {
        id: i + 100,
        name: `ReportedUser${i + 1}`,
        email: `reported${i + 1}@example.com`,
        role: i % 3 === 0 ? "teacher" : "student",
      },
      type: reportTypes[i % reportTypes.length],
      description: `This user has been ${
        [
          "sending inappropriate messages",
          "posting spam content",
          "sharing false information",
          "violating community guidelines",
          "engaging in academic dishonesty",
        ][i % 5]
      }. This behavior needs to be addressed immediately.`,
      proof: [
        `https://example.com/proof/${i + 1}-1.jpg`,
        `https://example.com/proof/${i + 1}-2.jpg`,
        `https://example.com/proof/${i + 1}-3.jpg`,
      ].slice(0, (i % 3) + 1),
      status: statuses[i % statuses.length],
      severity: severities[i % severities.length],
      createdAt: new Date(
        Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
      ).toISOString(),
      reviewedBy: i > 10 ? `Admin${(i % 3) + 1}` : null,
      reviewedAt:
        i > 10
          ? new Date(
              Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000
            ).toISOString()
          : null,
      notes:
        i > 15
          ? `This case has been reviewed and ${
              i % 2 === 0 ? "requires immediate action" : "can be monitored"
            }.`
          : null,
    }));
  }

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.reporter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reportedUser.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      report.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || report.status === statusFilter;
    const matchesType = typeFilter === "all" || report.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setShowModal(true);
  };

  const handleBanUser = async (report) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setReports((prev) =>
        prev.map((r) =>
          r.id === report.id
            ? {
                ...r,
                status: "resolved",
                notes: `User banned on ${new Date().toLocaleDateString()}`,
              }
            : r
        )
      );

      toast.success(`User ${report.reportedUser.name} has been banned`);
      setShowModal(false);
    } catch (error) {
      toast.error("Failed to ban user");
    }
  };

  const handleRejectReport = async (report) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setReports((prev) =>
        prev.map((r) =>
          r.id === report.id
            ? {
                ...r,
                status: "resolved",
                notes: `Report rejected on ${new Date().toLocaleDateString()} - Insufficient evidence`,
              }
            : r
        )
      );

      toast.success("Report has been rejected");
      setShowModal(false);
    } catch (error) {
      toast.error("Failed to reject report");
    }
  };

  const handleMarkReviewed = async (report) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setReports((prev) =>
        prev.map((r) =>
          r.id === report.id
            ? {
                ...r,
                status: "reviewed",
                reviewedBy: "Current Admin",
                reviewedAt: new Date().toISOString(),
                notes: "Marked as reviewed - pending action",
              }
            : r
        )
      );

      toast.success("Report marked as reviewed");
      setShowModal(false);
    } catch (error) {
      toast.error("Failed to update report");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "reviewed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "resolved":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "low":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "critical":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "Harassment":
        return <Shield className="h-4 w-4" />;
      case "Spam":
        return <Flag className="h-4 w-4" />;
      case "Inappropriate Content":
        return <FileText className="h-4 w-4" />;
      case "False Information":
        return <X className="h-4 w-4" />;
      case "Academic Dishonesty":
        return <BookOpen className="h-4 w-4" />;
      default:
        return <Flag className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header - Made Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            Reports Management
          </h2>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Review and manage user reports and violations
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">
            {reports.length}
          </div>
          <div className="text-sm text-gray-600">Total Reports</div>
        </div>
      </div>

      {/* Filters and Search - Made Responsive */}
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
                placeholder="Search by user, type, or description..."
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
              <option value="reviewed">Reviewed</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="all">All Types</option>
              <option value="Harassment">Harassment</option>
              <option value="Spam">Spam</option>
              <option value="Inappropriate Content">
                Inappropriate Content
              </option>
              <option value="False Information">False Information</option>
              <option value="Academic Dishonesty">Academic Dishonesty</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards - Made Responsive */}
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
            <div className="p-2 bg-blue-100 rounded-lg">
              <Eye className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs sm:text-sm font-medium text-gray-600">
                Reviewed
              </p>
              <p className="text-lg sm:text-xl font-bold text-gray-900">
                {reports.filter((r) => r.status === "reviewed").length}
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
                Resolved
              </p>
              <p className="text-lg sm:text-xl font-bold text-gray-900">
                {reports.filter((r) => r.status === "resolved").length}
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
                Critical
              </p>
              <p className="text-lg sm:text-xl font-bold text-gray-900">
                {reports.filter((r) => r.severity === "critical").length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Reports Table - Made Responsive */}
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
                  key={report.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-4">
                    <div className="flex items-start space-x-3">
                      <div
                        className={`p-2 rounded-lg ${
                          report.severity === "critical"
                            ? "bg-red-100 text-red-600"
                            : report.severity === "high"
                            ? "bg-orange-100 text-orange-600"
                            : report.severity === "medium"
                            ? "bg-yellow-100 text-yellow-600"
                            : "bg-green-100 text-green-600"
                        }`}
                      >
                        {getTypeIcon(report.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {report.type}
                        </p>
                        <p className="text-sm text-gray-500 truncate max-w-xs">
                          {report.description}
                        </p>
                        <div className="flex items-center mt-1 flex-wrap gap-1">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(
                              report.severity
                            )}`}
                          >
                            {report.severity}
                          </span>
                          <span className="text-xs text-gray-500">
                            {report.proof.length} proof
                          </span>
                        </div>
                        {/* Mobile user info */}
                        <div className="sm:hidden mt-2">
                          <div className="flex items-center text-xs text-gray-500">
                            <User className="h-3 w-3 mr-1" />
                            {report.reporter.name} → {report.reportedUser.name}
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
                          {report.reporter.name}
                        </span>
                        <span className="text-gray-500 ml-1">(reporter)</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <User className="h-4 w-4 text-red-400 mr-2" />
                        <span className="font-medium text-gray-900">
                          {report.reportedUser.name}
                        </span>
                        <span className="text-gray-500 ml-1">
                          ({report.reportedUser.role})
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

                      {report.status !== "resolved" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleBanUser(report)}
                            className="inline-flex items-center justify-center px-3 py-1.5 border border-red-300 text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 transition-colors"
                          >
                            <Ban className="h-4 w-4 mr-1" />
                            Ban
                          </button>

                          <button
                            onClick={() => handleRejectReport(report)}
                            className="inline-flex items-center justify-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                          >
                            <X className="h-4 w-4 mr-1" />
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
              No reports found matching your criteria
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Try adjusting your search or filters
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
                  <div
                    className={`p-2 rounded-lg ${
                      selectedReport.severity === "critical"
                        ? "bg-red-100 text-red-600"
                        : selectedReport.severity === "high"
                        ? "bg-orange-100 text-orange-600"
                        : selectedReport.severity === "medium"
                        ? "bg-yellow-100 text-yellow-600"
                        : "bg-green-100 text-green-600"
                    }`}
                  >
                    {getTypeIcon(selectedReport.type)}
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                      {selectedReport.type}
                    </h2>
                    <p className="text-sm text-gray-500">
                      Report ID: {selectedReport.id}
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
                      {selectedReport.reporter.name}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Email:</span>{" "}
                      {selectedReport.reporter.email}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">User ID:</span>{" "}
                      {selectedReport.reporter.id}
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
                      {selectedReport.reportedUser.name}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Email:</span>{" "}
                      {selectedReport.reportedUser.email}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Role:</span>{" "}
                      {selectedReport.reportedUser.role}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">User ID:</span>{" "}
                      {selectedReport.reportedUser.id}
                    </p>
                  </div>
                </div>
              </div>

              {/* Report Details */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Report Description
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-900">
                    {selectedReport.description}
                  </p>
                </div>
              </div>

              {/* Proof Section */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Proof of Violation ({selectedReport.proof.length} files)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedReport.proof.map((proofUrl, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg overflow-hidden"
                    >
                      <div className="h-32 bg-gray-100 flex items-center justify-center">
                        <img
                          src={proofUrl}
                          alt={`Proof ${index + 1}`}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "flex";
                          }}
                        />
                        <div className="hidden h-full w-full items-center justify-center bg-gray-100">
                          <FileText className="h-8 w-8 text-gray-400" />
                        </div>
                      </div>
                      <div className="p-3 bg-white">
                        <p className="text-xs text-gray-600 text-center">
                          Proof {index + 1}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

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
                      <span className="font-medium">Severity:</span>
                      <span
                        className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(
                          selectedReport.severity
                        )}`}
                      >
                        {selectedReport.severity}
                      </span>
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Created:</span>{" "}
                      {new Date(selectedReport.createdAt).toLocaleString()}
                    </p>
                    {selectedReport.reviewedBy && (
                      <p className="text-sm">
                        <span className="font-medium">Reviewed by:</span>{" "}
                        {selectedReport.reviewedBy}
                      </p>
                    )}
                    {selectedReport.reviewedAt && (
                      <p className="text-sm">
                        <span className="font-medium">Reviewed at:</span>{" "}
                        {new Date(selectedReport.reviewedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Actions
                  </h3>
                  <div className="space-y-3">
                    {selectedReport.notes && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-sm text-yellow-800">
                          {selectedReport.notes}
                        </p>
                      </div>
                    )}

                    {selectedReport.status === "resolved" ? (
                      <div className="text-center py-4">
                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">
                          This report has been resolved
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => handleBanUser(selectedReport)}
                          className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center"
                        >
                          <Ban className="h-4 w-4 mr-2" />
                          Ban User
                        </button>
                        <button
                          onClick={() => handleRejectReport(selectedReport)}
                          className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors font-medium flex items-center justify-center"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Reject Report
                        </button>
                        {selectedReport.status === "pending" && (
                          <button
                            onClick={() => handleMarkReviewed(selectedReport)}
                            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark Reviewed
                          </button>
                        )}
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
