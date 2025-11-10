import React, { useState, useEffect } from "react";
import {
  Star,
  Edit2,
  Trash2,
  MessageCircle,
  Send,
  User,
  Search,
  Filter,
  ChevronDown,
  Calendar,
  ThumbsUp,
  X,
  BarChart3,
  PieChart,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Textarea } from "./components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./components/ui/dialog";
import { API_BASE_URL } from "./Config";
import { getToken } from "./ManageToken";
import toast from "react-hot-toast";

// Chart.js components
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function ReviewsManagement() {
  const [activeTab, setActiveTab] = useState("given");
  const [givenReviews, setGivenReviews] = useState([]);
  const [receivedReviews, setReceivedReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingReview, setEditingReview] = useState(null);
  const [editForm, setEditForm] = useState({ rating: 0, review: "" });
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [editingReply, setEditingReply] = useState(null);
  const [editReplyText, setEditReplyText] = useState("");
  const [showCharts, setShowCharts] = useState(false);
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    type: null, // 'review' or 'reply'
    id: null,
    data: null,
  });

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState(0);
  const [dateFilter, setDateFilter] = useState("all");
  const [hasReplyFilter, setHasReplyFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check mobile screen size
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Fetch reviews given by the current user
  const fetchGivenReviews = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/ratings/my-ratings`, {
        headers: { auth: getToken() },
      });
      const data = await res.json();

      if (data.status.toLowerCase() === "success") {
        setGivenReviews(data.data.ratings || data.data || []);
      }
    } catch (error) {
      console.error("Could not fetch given reviews");
      toast.error("Failed to load your reviews");
    }
  };

  // Fetch reviews received by the current user
  const fetchReceivedReviews = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/ratings/received`, {
        headers: { auth: getToken() },
      });
      const data = await res.json();

      if (data.status.toLowerCase() === "success") {
        setReceivedReviews(data.data || []);
      }
    } catch (error) {
      console.error("Could not fetch received reviews");
      toast.error("Failed to load received reviews");
    }
  };

  // Load all reviews
  useEffect(() => {
    const loadReviews = async () => {
      setLoading(true);
      await Promise.all([fetchGivenReviews(), fetchReceivedReviews()]);
      setLoading(false);
    };
    loadReviews();
  }, []);

  // Calculate chart data
  const calculateRatingDistribution = (reviews) => {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((review) => {
      distribution[review.rating]++;
    });
    return distribution;
  };

  // Bar chart options
  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: "Rating Distribution",
        font: {
          size: 14,
          weight: "bold",
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom",
      },
      title: {
        display: true,
        text: "Rating Breakdown",
        font: {
          size: 14,
          weight: "bold",
        },
      },
    },
  };

  // Chart data functions
  const getBarChartData = (distribution) => ({
    labels: ["1★", "2★", "3★", "4★", "5★"],
    datasets: [
      {
        data: Object.values(distribution),
        backgroundColor: [
          "#ef4444",
          "#f97316",
          "#eab308",
          "#84cc16",
          "#22c55e",
        ],
        borderColor: ["#dc2626", "#ea580c", "#ca8a04", "#65a30d", "#16a34a"],
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  });

  const getDoughnutChartData = (distribution) => ({
    labels: ["1 Star", "2 Stars", "3 Stars", "4 Stars", "5 Stars"],
    datasets: [
      {
        data: Object.values(distribution),
        backgroundColor: [
          "#ef4444",
          "#f97316",
          "#eab308",
          "#84cc16",
          "#22c55e",
        ],
        borderColor: ["#dc2626", "#ea580c", "#ca8a04", "#65a30d", "#16a34a"],
        borderWidth: 2,
      },
    ],
  });

  // Filter functions
  const filterReviews = (reviews) => {
    return reviews.filter((review) => {
      const person = activeTab === "given" ? review.teacher : review.student;
      const personName = person?.fullName?.toLowerCase() || "";
      const reviewText = review.review?.toLowerCase() || "";

      // Search filter
      const matchesSearch =
        searchTerm === "" ||
        personName.includes(searchTerm.toLowerCase()) ||
        reviewText.includes(searchTerm.toLowerCase());

      // Rating filter
      const matchesRating =
        ratingFilter === 0 || review.rating === ratingFilter;

      // Date filter
      const matchesDate = filterByDate(review.createdAt, dateFilter);

      // Reply filter (for received reviews)
      const matchesReply =
        hasReplyFilter === "all" ||
        (hasReplyFilter === "replied" && review.reply) ||
        (hasReplyFilter === "not_replied" && !review.reply);

      return matchesSearch && matchesRating && matchesDate && matchesReply;
    });
  };

  const filterByDate = (dateString, filter) => {
    const date = new Date(dateString);
    const now = new Date();
    const daysDiff = (now - date) / (1000 * 60 * 60 * 24);

    switch (filter) {
      case "today":
        return daysDiff < 1;
      case "week":
        return daysDiff < 7;
      case "month":
        return daysDiff < 30;
      case "year":
        return daysDiff < 365;
      default:
        return true;
    }
  };

  // Handle editing a review
  const handleEditReview = async (reviewId) => {
    if (!editForm.rating || editForm.rating < 1) {
      toast.error("Please select a rating");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/ratings/${reviewId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          auth: getToken(),
        },
        body: JSON.stringify({
          rating: editForm.rating,
          review: editForm.review,
        }),
      });

      const data = await res.json();

      if (data.status.toLowerCase() === "success") {
        toast.success("Review updated successfully");
        setEditingReview(null);
        setEditForm({ rating: 0, review: "" });
        fetchGivenReviews();
      } else {
        toast.error(data.message || "Failed to update review");
      }
    } catch (error) {
      toast.error("Failed to update review");
    }
  };

  // Handle deleting a review
  const handleDeleteReview = async (reviewId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/ratings/${reviewId}`, {
        method: "DELETE",
        headers: { auth: getToken() },
      });

      const data = await res.json();

      if (data.status.toLowerCase() === "success") {
        toast.success("Review deleted successfully");
        setDeleteModal({ open: false, type: null, id: null, data: null });
        fetchGivenReviews();
      } else {
        toast.error(data.message || "Failed to delete review");
      }
    } catch (error) {
      toast.error("Failed to delete review");
    }
  };

  // Handle adding a reply
  const handleAddReply = async (reviewId) => {
    if (!replyText.trim()) {
      toast.error("Please enter a reply");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/ratings/${reviewId}/reply`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          auth: getToken(),
        },
        body: JSON.stringify({ reply: replyText }),
      });

      const data = await res.json();

      if (data.status.toLowerCase() === "success") {
        toast.success("Reply added successfully");
        setReplyingTo(null);
        setReplyText("");
        fetchReceivedReviews();
      } else {
        toast.error(data.message || "Failed to add reply");
      }
    } catch (error) {
      toast.error("Failed to add reply");
    }
  };

  // Handle editing a reply
  const handleEditReply = async (reviewId) => {
    if (!editReplyText.trim()) {
      toast.error("Please enter a reply");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/ratings/${reviewId}/reply`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          auth: getToken(),
        },
        body: JSON.stringify({ reply: editReplyText }),
      });

      const data = await res.json();

      if (data.status.toLowerCase() === "success") {
        toast.success("Reply updated successfully");
        setEditingReply(null);
        setEditReplyText("");
        fetchReceivedReviews();
      } else {
        toast.error(data.message || "Failed to update reply");
      }
    } catch (error) {
      toast.error("Failed to update reply");
    }
  };

  // Handle deleting a reply
  const handleDeleteReply = async (reviewId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/ratings/${reviewId}/reply`, {
        method: "DELETE",
        headers: {
          auth: getToken(),
        },
      });

      const data = await res.json();

      if (data.status.toLowerCase() === "success") {
        toast.success("Response deleted successfully");
        setDeleteModal({ open: false, type: null, id: null, data: null });
        fetchReceivedReviews();
      } else {
        toast.error(data.message || "Failed to delete response");
      }
    } catch (error) {
      toast.error("Failed to delete response");
    }
  };

  // Open delete confirmation modal
  const openDeleteModal = (type, id, data = null) => {
    setDeleteModal({
      open: true,
      type,
      id,
      data,
    });
  };

  // Handle delete confirmation
  const handleConfirmDelete = () => {
    const { type, id } = deleteModal;

    if (type === "review") {
      handleDeleteReview(id);
    } else if (type === "reply") {
      handleDeleteReply(id);
    }
  };

  // Star rating component with properly filled stars
  const StarRating = ({
    rating,
    onRatingChange,
    editable = false,
    size = "text-base",
    showNumber = false,
  }) => {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              disabled={!editable}
              onClick={() => editable && onRatingChange(star)}
              className={`${size} transition-all duration-200 ${
                star <= rating ? "text-yellow-500" : "text-gray-300"
              } ${
                editable ? "cursor-pointer hover:scale-110" : "cursor-default"
              }`}
            >
              {/* Use filled star when selected */}
              {star <= rating ? (
                <Star className="w-5 h-5 fill-yellow-500" />
              ) : (
                <Star className="w-5 h-5" />
              )}
            </button>
          ))}
        </div>
        {showNumber && (
          <span className="text-sm font-medium text-gray-600">{rating}.0</span>
        )}
      </div>
    );
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get filtered reviews
  const filteredGivenReviews = filterReviews(givenReviews);
  const filteredReceivedReviews = filterReviews(receivedReviews);

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setRatingFilter(0);
    setDateFilter("all");
    setHasReplyFilter("all");
  };

  // Calculate chart data
  const givenDistribution = calculateRatingDistribution(givenReviews);
  const receivedDistribution = calculateRatingDistribution(receivedReviews);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-4 md:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3 md:mb-4">
            My Reviews
          </h1>
          <p className="text-gray-600 text-sm md:text-lg">
            Manage your reviews and responses
          </p>
        </div>

        {/* Delete Confirmation Modal */}
        <Dialog
          open={deleteModal.open}
          onOpenChange={(open) =>
            !open &&
            setDeleteModal({ open: false, type: null, id: null, data: null })
          }
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                Confirm Deletion
              </DialogTitle>
              <DialogDescription>
                {deleteModal.type === "review" ? (
                  <>
                    Are you sure you want to delete this review? This action
                    cannot be undone and the review will be permanently removed.
                    {deleteModal.data && (
                      <div className="mt-3 p-3 bg-red-50 rounded-md border border-red-200">
                        <p className="text-sm font-medium text-red-800">
                          Review:
                        </p>
                        <p className="text-sm text-red-700 mt-1">
                          {deleteModal.data.review || "No review text"}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <StarRating rating={deleteModal.data.rating} />
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    Are you sure you want to delete your response? This action
                    cannot be undone and the response will be permanently
                    removed.
                    {deleteModal.data && (
                      <div className="mt-3 p-3 bg-red-50 rounded-md border border-red-200">
                        <p className="text-sm font-medium text-red-800">
                          Response:
                        </p>
                        <p className="text-sm text-red-700 mt-1">
                          {deleteModal.data.reply}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6">
              <Button
                variant="outline"
                onClick={() =>
                  setDeleteModal({
                    open: false,
                    type: null,
                    id: null,
                    data: null,
                  })
                }
                className="w-full sm:w-auto px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-400 transition-all duration-200"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                className="w-full sm:w-auto px-6 py-2 bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Chart Toggle */}
        <div className="flex justify-center mb-6">
          <Button
            onClick={() => setShowCharts(!showCharts)}
            variant="outline"
            className="flex items-center gap-2 bg-white/80 backdrop-blur-sm"
          >
            {showCharts ? (
              <X className="w-4 h-4" />
            ) : (
              <BarChart3 className="w-4 h-4" />
            )}
            {showCharts ? "Hide Charts" : "Show Analytics"}
          </Button>
        </div>

        {/* Charts Section */}
        {showCharts && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 md:mb-8">
            {/* Given Reviews Charts */}
            <Card className="bg-white/80 backdrop-blur-sm border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-blue-600">
                  <TrendingUp className="w-5 h-5" />
                  Reviews Given Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="h-64">
                  <Bar
                    data={getBarChartData(givenDistribution)}
                    options={barChartOptions}
                  />
                </div>
                <div className="h-64">
                  <Doughnut
                    data={getDoughnutChartData(givenDistribution)}
                    options={doughnutOptions}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Received Reviews Charts */}
            <Card className="bg-white/80 backdrop-blur-sm border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <PieChart className="w-5 h-5" />
                  Reviews Received Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="h-64">
                  <Bar
                    data={getBarChartData(receivedDistribution)}
                    options={barChartOptions}
                  />
                </div>
                <div className="h-64">
                  <Doughnut
                    data={getDoughnutChartData(receivedDistribution)}
                    options={doughnutOptions}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 mb-6 md:mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-blue-200">
            <CardContent className="p-3 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-600">
                    Given
                  </p>
                  <p className="text-lg md:text-2xl font-bold text-gray-900">
                    {givenReviews.length}
                  </p>
                  <p className="text-xs text-gray-500">
                    Avg:{" "}
                    {givenReviews.length > 0
                      ? (
                          givenReviews.reduce(
                            (acc, review) => acc + review.rating,
                            0
                          ) / givenReviews.length
                        ).toFixed(1)
                      : "0.0"}
                  </p>
                </div>
                <div className="p-2 md:p-3 bg-blue-100 rounded-full">
                  <ThumbsUp className="w-4 h-4 md:w-6 md:h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-green-200">
            <CardContent className="p-3 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-600">
                    Received
                  </p>
                  <p className="text-lg md:text-2xl font-bold text-gray-900">
                    {receivedReviews.length}
                  </p>
                  <p className="text-xs text-gray-500">
                    Avg:{" "}
                    {receivedReviews.length > 0
                      ? (
                          receivedReviews.reduce(
                            (acc, review) => acc + review.rating,
                            0
                          ) / receivedReviews.length
                        ).toFixed(1)
                      : "0.0"}
                  </p>
                </div>
                <div className="p-2 md:p-3 bg-green-100 rounded-full">
                  <User className="w-4 h-4 md:w-6 md:h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-purple-200 col-span-2 md:col-span-1">
            <CardContent className="p-3 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-600">
                    Response Rate
                  </p>
                  <p className="text-lg md:text-2xl font-bold text-gray-900">
                    {receivedReviews.length > 0
                      ? `${Math.round(
                          (receivedReviews.filter((r) => r.reply).length /
                            receivedReviews.length) *
                            100
                        )}%`
                      : "0%"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {receivedReviews.filter((r) => r.reply).length} of{" "}
                    {receivedReviews.length} replied
                  </p>
                </div>
                <div className="p-2 md:p-3 bg-purple-100 rounded-full">
                  <MessageCircle className="w-4 h-4 md:w-6 md:h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card className="bg-white/80 backdrop-blur-sm border-gray-200 shadow-lg md:shadow-xl">
          {/* Tabs - Mobile optimized */}
          <div className="border-b border-gray-200">
            <div className="flex flex-col md:flex-row">
              <button
                onClick={() => setActiveTab("given")}
                className={`flex-1 py-4 px-4 md:py-6 md:px-8 text-base md:text-lg font-semibold transition-all duration-300 ${
                  activeTab === "given"
                    ? "text-blue-600 border-b-2 md:border-b-2 border-blue-600 bg-blue-50/50"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50/50"
                }`}
              >
                <div className="flex items-center justify-center gap-2 md:gap-3">
                  <ThumbsUp className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="truncate">Reviews Given</span>
                  <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs md:text-sm font-medium">
                    {givenReviews.length}
                  </span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab("received")}
                className={`flex-1 py-4 px-4 md:py-6 md:px-8 text-base md:text-lg font-semibold transition-all duration-300 ${
                  activeTab === "received"
                    ? "text-green-600 border-b-2 md:border-b-2 border-green-600 bg-green-50/50"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50/50"
                }`}
              >
                <div className="flex items-center justify-center gap-2 md:gap-3">
                  <User className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="truncate">Reviews Received</span>
                  <span className="bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs md:text-sm font-medium">
                    {receivedReviews.length}
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Search and Filters - Mobile optimized */}
          <div className="p-4 md:p-6 border-b border-gray-200 bg-gray-50/50">
            <div className="flex flex-col gap-3 md:gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
                <Input
                  type="text"
                  placeholder={`Search ${
                    activeTab === "given" ? "teachers" : "students"
                  }...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full text-sm md:text-base"
                />
              </div>

              {/* Filter Controls */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 flex-1 md:flex-none"
                  size={isMobile ? "sm" : "default"}
                >
                  <Filter className="w-4 h-4" />
                  Filters
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      showFilters ? "rotate-180" : ""
                    }`}
                  />
                </Button>

                {(searchTerm ||
                  ratingFilter !== 0 ||
                  dateFilter !== "all" ||
                  hasReplyFilter !== "all") && (
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    size={isMobile ? "sm" : "default"}
                    className="flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    {isMobile ? "" : "Clear"}
                  </Button>
                )}
              </div>

              {/* Active filters summary - Mobile */}
              {isMobile &&
                (searchTerm ||
                  ratingFilter !== 0 ||
                  dateFilter !== "all" ||
                  hasReplyFilter !== "all") && (
                  <div className="text-xs text-gray-600 bg-white px-3 py-2 rounded border">
                    Showing{" "}
                    {activeTab === "given"
                      ? filteredGivenReviews.length
                      : filteredReceivedReviews.length}{" "}
                    of{" "}
                    {activeTab === "given"
                      ? givenReviews.length
                      : receivedReviews.length}{" "}
                    reviews
                  </div>
                )}

              {/* Expanded Filters */}
              {showFilters && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 p-3 md:p-4 bg-white rounded-lg border">
                  {/* Rating Filter */}
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                      Rating
                    </label>
                    <select
                      value={ratingFilter}
                      onChange={(e) => setRatingFilter(Number(e.target.value))}
                      className="w-full rounded-md border border-gray-300 px-2 md:px-3 py-1 md:py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={0}>All Ratings</option>
                      <option value={5}>5 Stars</option>
                      <option value={4}>4 Stars</option>
                      <option value={3}>3 Stars</option>
                      <option value={2}>2 Stars</option>
                      <option value={1}>1 Star</option>
                    </select>
                  </div>

                  {/* Date Filter */}
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                      <Calendar className="w-3 h-3 md:w-4 md:h-4 inline mr-1" />
                      Date
                    </label>
                    <select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-2 md:px-3 py-1 md:py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Time</option>
                      <option value="today">Today</option>
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                      <option value="year">This Year</option>
                    </select>
                  </div>

                  {/* Reply Filter (only for received reviews) */}
                  {activeTab === "received" && (
                    <div>
                      <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                        <MessageCircle className="w-3 h-3 md:w-4 md:h-4 inline mr-1" />
                        Response
                      </label>
                      <select
                        value={hasReplyFilter}
                        onChange={(e) => setHasReplyFilter(e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-2 md:px-3 py-1 md:py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">All Reviews</option>
                        <option value="replied">With Response</option>
                        <option value="not_replied">Without Response</option>
                      </select>
                    </div>
                  )}

                  {/* Active Filters Summary - Desktop */}
                  {!isMobile && (
                    <div className="flex items-end">
                      <div className="text-xs md:text-sm text-gray-600">
                        Showing{" "}
                        {activeTab === "given"
                          ? filteredGivenReviews.length
                          : filteredReceivedReviews.length}{" "}
                        of{" "}
                        {activeTab === "given"
                          ? givenReviews.length
                          : receivedReviews.length}{" "}
                        reviews
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-4 md:p-6">
            {activeTab === "given" && (
              <div className="space-y-4 md:space-y-6">
                {filteredGivenReviews.length === 0 ? (
                  <div className="text-center py-8 md:py-16">
                    <User className="w-12 h-12 md:w-20 md:h-20 text-gray-300 mx-auto mb-3 md:mb-4" />
                    <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
                      {givenReviews.length === 0
                        ? "No Reviews Given"
                        : "No Matching Reviews"}
                    </h3>
                    <p className="text-gray-500 text-sm md:text-base max-w-md mx-auto px-4">
                      {givenReviews.length === 0
                        ? "You haven't submitted any reviews yet. Your reviews will appear here once you rate a session."
                        : "Try adjusting your filters to see more results."}
                    </p>
                  </div>
                ) : (
                  filteredGivenReviews.map((review) => (
                    <Card
                      key={review._id}
                      className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500"
                    >
                      <CardContent className="p-4 md:p-6">
                        {editingReview === review._id ? (
                          // Edit Mode - Mobile optimized
                          <div className="space-y-4 md:space-y-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 md:gap-4">
                                <img
                                  src={`${API_BASE_URL}/user_avatar/${
                                    review.teacher?.avatar ||
                                    "default-avatar.jpg"
                                  }`}
                                  alt={review.teacher?.fullName}
                                  className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover border-2 border-blue-200"
                                />
                                <div>
                                  <h4 className="font-bold text-gray-900 text-base md:text-lg">
                                    {review.teacher?.fullName}
                                  </h4>
                                  <p className="text-xs md:text-sm text-gray-500">
                                    {formatDate(review.createdAt)}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-3 md:space-y-4">
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 md:mb-3">
                                  Your Rating
                                </label>
                                <StarRating
                                  rating={editForm.rating}
                                  onRatingChange={(rating) =>
                                    setEditForm({ ...editForm, rating })
                                  }
                                  editable={true}
                                  showNumber={true}
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 md:mb-3">
                                  Your Review
                                </label>
                                <Textarea
                                  value={editForm.review}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      review: e.target.value,
                                    })
                                  }
                                  placeholder="Share your experience..."
                                  rows={3}
                                  className="text-base"
                                />
                              </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2 pt-3 md:pt-4 border-t border-gray-200">
                              <Button
                                onClick={() => handleEditReview(review._id)}
                                className="bg-blue-600 hover:bg-blue-700 px-4 md:px-6"
                                size={isMobile ? "sm" : "default"}
                              >
                                Save Changes
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setEditingReview(null);
                                  setEditForm({ rating: 0, review: "" });
                                }}
                                size={isMobile ? "sm" : "default"}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          // View Mode - Mobile optimized
                          <div className="space-y-4 md:space-y-6">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                                <img
                                  src={`${API_BASE_URL}/user_avatar/${
                                    review.teacher?.avatar ||
                                    "default-avatar.jpg"
                                  }`}
                                  alt={review.teacher?.fullName}
                                  className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover border-2 border-blue-200 flex-shrink-0"
                                />
                                <div className="min-w-0 flex-1">
                                  <h4 className="font-bold text-gray-900 text-base md:text-lg truncate">
                                    {review.teacher?.fullName}
                                  </h4>
                                  <p className="text-xs md:text-sm text-gray-500">
                                    {formatDate(review.createdAt)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-1 md:gap-2 flex-shrink-0">
                                <Button
                                  variant="outline"
                                  size={isMobile ? "sm" : "default"}
                                  onClick={() => {
                                    setEditingReview(review._id);
                                    setEditForm({
                                      rating: review.rating,
                                      review: review.review || "",
                                    });
                                  }}
                                  className="flex items-center gap-1"
                                >
                                  <Edit2 className="w-3 h-3 md:w-4 md:h-4" />
                                  {isMobile ? "" : "Edit"}
                                </Button>
                                <Button
                                  variant="outline"
                                  size={isMobile ? "sm" : "default"}
                                  onClick={() =>
                                    openDeleteModal("review", review._id, {
                                      review: review.review,
                                      rating: review.rating,
                                    })
                                  }
                                  className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                >
                                  <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                                  {isMobile ? "" : "Delete"}
                                </Button>
                              </div>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 md:gap-4">
                              <StarRating
                                rating={review.rating}
                                showNumber={true}
                              />
                              <span className="text-xs md:text-sm text-gray-500">
                                Rated on {formatDate(review.createdAt)}
                              </span>
                            </div>

                            {review.review &&
                              review.review !== "No review provided." && (
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 md:p-6 rounded-xl border border-blue-100">
                                  <p className="text-gray-800 text-sm md:text-lg leading-relaxed">
                                    {review.review}
                                  </p>
                                </div>
                              )}

                            {review.reply && (
                              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 md:p-6 rounded-xl border border-green-200">
                                <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                                  <MessageCircle className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                                  <span className="font-semibold text-green-900 text-sm md:text-base">
                                    Response from {review.teacher?.fullName}
                                  </span>
                                </div>
                                <p className="text-green-800 text-sm md:text-lg leading-relaxed">
                                  {review.reply}
                                </p>
                                {review.repliedAt && (
                                  <p className="text-xs md:text-sm text-green-600 mt-2 md:mt-3">
                                    Replied on {formatDate(review.repliedAt)}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}

            {activeTab === "received" && (
              <div className="space-y-4 md:space-y-6">
                {filteredReceivedReviews.length === 0 ? (
                  <div className="text-center py-8 md:py-16">
                    <User className="w-12 h-12 md:w-20 md:h-20 text-gray-300 mx-auto mb-3 md:mb-4" />
                    <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
                      {receivedReviews.length === 0
                        ? "No Reviews Received"
                        : "No Matching Reviews"}
                    </h3>
                    <p className="text-gray-500 text-sm md:text-base max-w-md mx-auto px-4">
                      {receivedReviews.length === 0
                        ? "You haven't received any reviews yet. Reviews from your students will appear here."
                        : "Try adjusting your filters to see more results."}
                    </p>
                  </div>
                ) : (
                  filteredReceivedReviews.map((review) => (
                    <Card
                      key={review._id}
                      className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500"
                    >
                      <CardContent className="p-4 md:p-6">
                        <div className="space-y-4 md:space-y-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                              <img
                                src={`${API_BASE_URL}/user_avatar/${
                                  review.student?.avatar || "default-avatar.jpg"
                                }`}
                                alt={review.student?.fullName}
                                className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover border-2 border-green-200 flex-shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <h4 className="font-bold text-gray-900 text-base md:text-lg truncate">
                                  {review.student?.fullName}
                                </h4>
                                <p className="text-xs md:text-sm text-gray-500">
                                  {formatDate(review.createdAt)}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 md:gap-4">
                            <StarRating
                              rating={review.rating}
                              showNumber={true}
                            />
                            <span className="text-xs md:text-sm text-gray-500">
                              Reviewed on {formatDate(review.createdAt)}
                            </span>
                          </div>

                          {review.review &&
                            review.review !== "No review provided." && (
                              <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 md:p-6 rounded-xl border border-gray-200">
                                <p className="text-gray-800 text-sm md:text-lg leading-relaxed">
                                  {review.review}
                                </p>
                              </div>
                            )}

                          {review.reply ? (
                            editingReply === review._id ? (
                              // Edit Reply Mode
                              <div className="space-y-3 md:space-y-4 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 md:p-6 rounded-xl border border-blue-200">
                                <label className="block text-base md:text-lg font-semibold text-gray-700">
                                  Edit Your Response
                                </label>
                                <Textarea
                                  value={editReplyText}
                                  onChange={(e) =>
                                    setEditReplyText(e.target.value)
                                  }
                                  placeholder="Edit your response..."
                                  rows={3}
                                  className="text-base border-blue-300"
                                />
                                <div className="flex flex-col sm:flex-row gap-2">
                                  <Button
                                    onClick={() => handleEditReply(review._id)}
                                    className="bg-green-600 hover:bg-green-700 px-4 md:px-6"
                                    size={isMobile ? "sm" : "default"}
                                  >
                                    <Send className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                                    Update Response
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setEditingReply(null);
                                      setEditReplyText("");
                                    }}
                                    size={isMobile ? "sm" : "default"}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              // View Reply Mode
                              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 md:p-6 rounded-xl border border-green-200">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 md:mb-4">
                                  <div className="flex items-center gap-2 md:gap-3">
                                    <MessageCircle className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                                    <span className="font-semibold text-green-900 text-sm md:text-base">
                                      Your Response
                                    </span>
                                  </div>
                                  <div className="flex gap-1 md:gap-2">
                                    <Button
                                      variant="outline"
                                      size={isMobile ? "sm" : "default"}
                                      onClick={() => {
                                        setEditingReply(review._id);
                                        setEditReplyText(review.reply);
                                      }}
                                      className="flex items-center gap-1 md:gap-2 border-green-300 text-green-700 hover:bg-green-50"
                                    >
                                      <Edit2 className="w-3 h-3 md:w-4 md:h-4" />
                                      {isMobile ? "Edit" : "Edit Response"}
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size={isMobile ? "sm" : "default"}
                                      onClick={() =>
                                        openDeleteModal("reply", review._id, {
                                          reply: review.reply,
                                        })
                                      }
                                      className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                    >
                                      <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                                      {isMobile ? "" : "Delete"}
                                    </Button>
                                  </div>
                                </div>
                                <p className="text-green-800 text-sm md:text-lg leading-relaxed">
                                  {review.reply}
                                </p>
                                {review.repliedAt && (
                                  <p className="text-xs md:text-sm text-green-600 mt-2 md:mt-3">
                                    Replied on {formatDate(review.repliedAt)}
                                  </p>
                                )}
                              </div>
                            )
                          ) : replyingTo === review._id ? (
                            // Add Reply Mode
                            <div className="space-y-3 md:space-y-4 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 md:p-6 rounded-xl border border-blue-200">
                              <label className="block text-base md:text-lg font-semibold text-gray-700">
                                Your Response
                              </label>
                              <Textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Write a thoughtful response to this review..."
                                rows={3}
                                className="text-base border-blue-300"
                              />
                              <div className="flex flex-col sm:flex-row gap-2">
                                <Button
                                  onClick={() => handleAddReply(review._id)}
                                  className="bg-green-600 hover:bg-green-700 px-4 md:px-6"
                                  size={isMobile ? "sm" : "default"}
                                >
                                  <Send className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                                  Send Response
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setReplyingTo(null);
                                    setReplyText("");
                                  }}
                                  size={isMobile ? "sm" : "default"}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            // No Reply - Add Button
                            <Button
                              onClick={() => setReplyingTo(review._id)}
                              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-2 md:py-3 text-sm md:text-lg"
                            >
                              <MessageCircle className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" />
                              Add Response
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
