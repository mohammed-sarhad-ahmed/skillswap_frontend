import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Shield,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  FileText,
  Flag,
  Eye,
  Ban,
  X,
  Upload,
  Send,
  Image as ImageIcon,
  Calendar,
  User,
  Download,
  ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";
import { getToken } from "./ManageToken";
import { API_BASE_URL } from "./Config";

export default function ReportsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [userBanned, setUserBanned] = useState(false);

  // Defense modal state
  const [defenseModalOpen, setDefenseModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [defenseText, setDefenseText] = useState("");
  const [defenseImage, setDefenseImage] = useState(null);
  const [submittingDefense, setSubmittingDefense] = useState(false);

  // View defense modal state
  const [viewDefenseModalOpen, setViewDefenseModalOpen] = useState(false);
  const [defenseData, setDefenseData] = useState(null);
  const [loadingDefense, setLoadingDefense] = useState(false);

  // Proof modal state
  const [proofModalOpen, setProofModalOpen] = useState(false);
  const [selectedProof, setSelectedProof] = useState(null);

  // Fetch reports where the current user is the reportedUser
  const fetchMyReports = async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        toast.error("Please log in to view your reports");
        navigate("/login");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/report/my-reports`, {
        headers: {
          "Content-Type": "application/json",
          auth: token,
        },
      });

      // If user is banned or unauthorized
      if (response.status === 403) {
        setUserBanned(true);
        return;
      }

      // If endpoint doesn't exist, try fetching all reports
      if (response.status === 404) {
        console.warn("my-reports endpoint not found, trying fallback...");
        await fetchAllReportsAndFilter(token);
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.status && data.status.toLowerCase() === "success") {
        const userReports = data.data || [];

        // Check if user has any accepted reports (banned)
        const hasAcceptedReports = userReports.some(
          (report) => report.status === "accepted"
        );
        if (hasAcceptedReports) {
          setUserBanned(true);
          return;
        }

        setReports(userReports);
      } else {
        throw new Error(data.message || "Failed to load reports");
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error(error.message || "Failed to load reports");
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  // Fallback: Fetch all reports and filter for current user
  const fetchAllReportsAndFilter = async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/report`, {
        headers: {
          "Content-Type": "application/json",
          auth: token,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.status && data.status.toLowerCase() === "success") {
        const currentUserId = getCurrentUserId();
        if (!currentUserId) {
          throw new Error("Unable to identify current user");
        }

        const myReports = data.data.filter(
          (report) =>
            report.reportedUser && report.reportedUser._id === currentUserId
        );

        // Check if user has any accepted reports (banned)
        const hasAcceptedReports = myReports.some(
          (report) => report.status === "accepted"
        );
        if (hasAcceptedReports) {
          setUserBanned(true);
          return;
        }

        setReports(myReports);
      } else {
        throw new Error(data.message || "Failed to load reports");
      }
    } catch (error) {
      console.error("Error in fallback fetch:", error);
      toast.error("Failed to load reports using fallback method");
      setReports([]);
    }
  };

  // Get current user ID from stored user data
  const getCurrentUserId = () => {
    try {
      const userData = localStorage.getItem("user");
      if (userData) {
        const user = JSON.parse(userData);
        return user._id || user.id || null;
      }
      return null;
    } catch (error) {
      console.error("Error parsing user data:", error);
      return null;
    }
  };

  // Fetch defense data for a specific report
  const fetchDefenseData = async (reportId) => {
    setLoadingDefense(true);
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/defense/${reportId}`, {
        headers: {
          "Content-Type": "application/json",
          auth: token,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.status && data.status.toLowerCase() === "success") {
        setDefenseData(data.data);
      } else {
        throw new Error(data.message || "Failed to load defense data");
      }
    } catch (error) {
      console.error("Error fetching defense data:", error);
      toast.error(error.message || "Failed to load defense data");
      setDefenseData(null);
    } finally {
      setLoadingDefense(false);
    }
  };

  // Filter reports based on search and status
  useEffect(() => {
    let result = reports;

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(
        (report) =>
          report.title?.toLowerCase().includes(term) ||
          report.reason?.toLowerCase().includes(term)
      );
    }

    // Apply status filter - remove "accepted" from filter options
    if (statusFilter !== "all") {
      result = result.filter((report) => report.status === statusFilter);
    }

    // Sort by newest first
    result = [...result].sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );

    setFilteredReports(result);
  }, [reports, searchTerm, statusFilter]);

  // Open defense modal
  const handleOpenDefenseModal = (report) => {
    setSelectedReport(report);
    setDefenseText("");
    setDefenseImage(null);
    setDefenseModalOpen(true);
  };

  // Close defense modal
  const handleCloseDefenseModal = () => {
    setDefenseModalOpen(false);
    setSelectedReport(null);
    setDefenseText("");
    setDefenseImage(null);
  };

  // Open view defense modal
  const handleOpenViewDefenseModal = async (report) => {
    setSelectedReport(report);
    setViewDefenseModalOpen(true);
    await fetchDefenseData(report._id || report.id);
  };

  // Close view defense modal
  const handleCloseViewDefenseModal = () => {
    setViewDefenseModalOpen(false);
    setSelectedReport(null);
    setDefenseData(null);
  };

  // Handle image selection for defense
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    setDefenseImage(file);
  };

  // Remove selected image
  const handleRemoveImage = () => {
    setDefenseImage(null);
  };

  // Submit defense
  const handleSubmitDefense = async () => {
    if (!defenseText.trim()) {
      toast.error("Please provide a defense explanation");
      return;
    }

    setSubmittingDefense(true);
    try {
      const token = getToken();
      const formData = new FormData();

      formData.append("defenseText", defenseText);
      formData.append("reportId", selectedReport._id || selectedReport.id);

      if (defenseImage) {
        formData.append("defenseImage", defenseImage);
      }

      const response = await fetch(`${API_BASE_URL}/defense/submit`, {
        method: "POST",
        headers: {
          auth: token,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.status && data.status.toLowerCase() === "success") {
        toast.success("Defense submitted successfully!");
        handleCloseDefenseModal();
        // Refresh reports to update the defense status
        fetchMyReports();
      } else {
        throw new Error(data.message || "Failed to submit defense");
      }
    } catch (error) {
      console.error("Error submitting defense:", error);
      toast.error(error.message || "Failed to submit defense");
    } finally {
      setSubmittingDefense(false);
    }
  };

  // Check if user has already submitted defense
  const hasDefense = (report) => {
    return report.defenseSubmitted === true || !!report.defense;
  };

  // Check if defense is allowed
  const canDefend = (report) => {
    return report.status === "pending" && !hasDefense(report);
  };

  // Get status badge style
  const getStatusBadge = (status) => {
    const baseClasses =
      "px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1";

    switch (status) {
      case "pending":
        return `${baseClasses} bg-yellow-100 text-yellow-800 border border-yellow-200`;
      case "rejected":
        return `${baseClasses} bg-green-100 text-green-800 border border-green-200`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 border border-gray-200`;
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "rejected":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  // Get report type display name
  const getReportTypeDisplay = (title) => {
    const typeMap = {
      spam: "Spam or Scam",
      harassment: "Harassment or Bullying",
      inappropriate: "Inappropriate Content",
      fake: "Fake Account",
      other: "Other Issue",
    };
    return typeMap[title] || title || "Report";
  };

  // View proof in modal
  const handleViewProof = (proofPath) => {
    if (!proofPath) {
      toast.error("No proof available");
      return;
    }

    try {
      // Handle both absolute and relative URLs
      let proofUrl;
      if (proofPath.startsWith("http")) {
        proofUrl = proofPath;
      } else {
        proofUrl = `${API_BASE_URL}${
          proofPath.startsWith("/") ? "" : "/"
        }${proofPath}`;
      }

      setSelectedProof(proofUrl);
      setProofModalOpen(true);
    } catch (error) {
      console.error("Error opening proof:", error);
      toast.error("Failed to load proof");
    }
  };

  // Close proof modal
  const handleCloseProofModal = () => {
    setProofModalOpen(false);
    setSelectedProof(null);
  };

  // Download image
  const handleDownloadImage = (imageUrl, filename) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = filename || `image-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open image in new tab
  const handleOpenInNewTab = (imageUrl) => {
    window.open(imageUrl, "_blank", "noopener,noreferrer");
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (defenseModalOpen || viewDefenseModalOpen || proofModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [defenseModalOpen, viewDefenseModalOpen, proofModalOpen]);

  useEffect(() => {
    fetchMyReports();
  }, []);

  // Show banned screen if user has accepted reports
  if (userBanned) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center py-8">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-8">
            <div className="p-4 bg-red-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <Ban className="h-10 w-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Account Suspended
            </h1>
            <p className="text-gray-600 mb-6">
              Your account has been suspended due to violation of our community
              guidelines. You cannot access this page or any other features of
              the platform.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-left">
              <p className="text-red-800 text-sm">
                If you believe this is a mistake, please contact our support
                team for assistance.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your reports...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-200">
                  <Shield className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    Reports Against You
                  </h1>
                  <p className="text-gray-600 mt-1 text-sm sm:text-base">
                    View and respond to reports filed against your account
                  </p>
                </div>
              </div>

              <div className="text-center sm:text-right bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-4">
                <p className="text-sm text-gray-600 font-medium">
                  Total Reports
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {reports.length}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Cards - Removed Accepted count */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-xl">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {reports.filter((r) => r.status === "pending").length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-xl">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Rejected</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {reports.filter((r) => r.status === "rejected").length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Can Defend
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {reports.filter(canDefend).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="h-5 w-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search reports by type or reason..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-lg"
                  />
                </div>
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-lg bg-white"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Reports List */}
          <div className="space-y-6">
            {filteredReports.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {reports.length === 0
                    ? "No Reports Found"
                    : "No Matching Reports"}
                </h3>
                <p className="text-gray-600 text-lg">
                  {reports.length === 0
                    ? "You don't have any reports filed against you."
                    : "Try adjusting your search or filters."}
                </p>
              </div>
            ) : (
              filteredReports.map((report) => (
                <div
                  key={report._id || report.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-300"
                >
                  {/* Card Content */}
                  <div className="mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-4">
                      <div className="flex items-start space-x-4">
                        <div className="p-3 bg-red-50 rounded-xl mt-1">
                          <Flag className="h-6 w-6 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <h3 className="text-xl font-semibold text-gray-900">
                              {getReportTypeDisplay(report.title)}
                            </h3>
                            <div className={getStatusBadge(report.status)}>
                              {getStatusIcon(report.status)}
                              <span className="capitalize">
                                {report.status}
                              </span>
                            </div>
                          </div>
                          <p className="text-gray-500 text-sm mt-2">
                            Reported by Anonymous User
                          </p>
                        </div>
                      </div>
                    </div>

                    {report.reason && (
                      <div className="bg-gray-50 rounded-xl p-4 mb-4">
                        <p className="text-gray-700 text-lg leading-relaxed">
                          {report.reason}
                        </p>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-base text-gray-500">
                      <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2">
                        <Clock className="h-4 w-4 mr-2" />
                        {report.createdAt
                          ? new Date(report.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              }
                            )
                          : "Unknown date"}
                      </div>

                      {hasDefense(report) && (
                        <div className="flex items-center bg-green-100 text-green-700 rounded-lg px-3 py-2">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Defense Submitted
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons - Centered at Bottom */}
                  <div className="border-t border-gray-200 pt-6">
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                      {canDefend(report) ? (
                        <button
                          onClick={() => handleOpenDefenseModal(report)}
                          className="w-full sm:w-auto bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 transition-all duration-300 font-semibold flex items-center justify-center shadow-sm hover:shadow-md min-w-[200px]"
                        >
                          <Shield className="h-5 w-5 mr-2" />
                          Submit Defense
                        </button>
                      ) : hasDefense(report) ? (
                        <button
                          onClick={() => handleOpenViewDefenseModal(report)}
                          className="w-full sm:w-auto bg-gray-600 text-white px-8 py-3 rounded-xl hover:bg-gray-700 transition-all duration-300 font-semibold flex items-center justify-center shadow-sm hover:shadow-md min-w-[200px]"
                        >
                          <FileText className="h-5 w-5 mr-2" />
                          View Defense
                        </button>
                      ) : (
                        <div className="text-center w-full sm:w-auto">
                          <button
                            className="w-full sm:w-auto bg-gray-400 text-white px-8 py-3 rounded-xl cursor-not-allowed font-semibold shadow-sm min-w-[200px]"
                            disabled
                          >
                            Case Resolved
                          </button>
                          <p className="text-xs text-gray-500 mt-2">
                            Report {report.status}
                          </p>
                        </div>
                      )}

                      {report.proof && (
                        <button
                          onClick={() => handleViewProof(report.proof)}
                          className="w-full sm:w-auto border-2 border-gray-300 text-gray-700 px-8 py-3 rounded-xl hover:bg-gray-50 transition-all duration-300 font-semibold flex items-center justify-center shadow-sm hover:shadow-md min-w-[200px]"
                        >
                          <Eye className="h-5 w-5 mr-2" />
                          View Proof
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Help Information */}
          {reports.length > 0 && (
            <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-8">
              <div className="flex items-start space-x-4">
                <AlertCircle className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-blue-900 text-lg mb-3">
                    About the Defense System
                  </h4>
                  <ul className="text-blue-800 text-base space-y-2">
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      <span>
                        <strong>Pending reports:</strong> You can submit a
                        defense with evidence to contest the report within 24
                        hours of being reported. After that is the evidence
                        against you is conclusive we ban you
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      <span>
                        <strong>Rejected reports:</strong> The report was
                        dismissed by moderators
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      <span>
                        <strong>Anonymous reporting:</strong> All reports are
                        anonymous to protect user privacy
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      <span>
                        <strong>Note:</strong> If a report is accepted, your
                        account will be suspended and you won't be able to
                        access this page
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Defense Submission Modal */}
      {defenseModalOpen && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Submit Defense
                  </h2>
                  <p className="text-gray-600 text-sm">
                    {getReportTypeDisplay(selectedReport.title)}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseDefenseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Report Details */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Report Details
                </h3>
                <p className="text-gray-700">{selectedReport.reason}</p>
              </div>

              {/* Defense Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Defense Explanation *
                </label>
                <textarea
                  value={defenseText}
                  onChange={(e) => setDefenseText(e.target.value)}
                  placeholder="Explain your side of the story and provide any relevant context..."
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-none"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Be clear and provide as much detail as possible to help
                  moderators understand your perspective.
                </p>
              </div>

              {/* Single Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supporting Image (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                  {defenseImage ? (
                    <div className="space-y-4">
                      <div className="relative inline-block">
                        <img
                          src={URL.createObjectURL(defenseImage)}
                          alt="Defense preview"
                          className="max-h-48 max-w-full rounded-lg mx-auto"
                        />
                        <button
                          onClick={handleRemoveImage}
                          className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-600">
                        {defenseImage.name} (
                        {(defenseImage.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                      <button
                        onClick={() =>
                          document.getElementById("defense-image").click()
                        }
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Change Image
                      </button>
                    </div>
                  ) : (
                    <>
                      <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 mb-2">
                        Upload a screenshot or image that supports your defense
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                        id="defense-image"
                      />
                      <label
                        htmlFor="defense-image"
                        className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer font-medium"
                      >
                        Choose Image
                      </label>
                      <p className="text-sm text-gray-500 mt-2">
                        Maximum 5MB • Supported: JPG, PNG, GIF
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <button
                onClick={handleCloseDefenseModal}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitDefense}
                disabled={!defenseText.trim() || submittingDefense}
                className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {submittingDefense ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Submit Defense</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Defense Modal */}
      {viewDefenseModalOpen && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Your Defense
                  </h2>
                  <p className="text-gray-600 text-sm">
                    {getReportTypeDisplay(selectedReport.title)}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseViewDefenseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {loadingDefense ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading defense data...</p>
                </div>
              ) : defenseData ? (
                <>
                  {/* Defense Details */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Your Defense Explanation
                    </h3>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {defenseData.defenseText}
                    </p>
                  </div>

                  {/* Defense Image */}
                  {defenseData.defenseImage && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">
                        Supporting Evidence
                      </h3>
                      <div className="border border-gray-200 rounded-xl p-4">
                        <img
                          src={`${API_BASE_URL}${defenseData.defenseImage}`}
                          alt="Defense evidence"
                          className="max-w-full max-h-64 rounded-lg mx-auto mb-4"
                          onError={(e) => {
                            console.error("Failed to load defense image");
                            e.target.style.display = "none";
                          }}
                        />
                        <div className="flex justify-center space-x-4">
                          <button
                            onClick={() =>
                              handleDownloadImage(
                                `${API_BASE_URL}${defenseData.defenseImage}`,
                                `defense-evidence-${Date.now()}.jpg`
                              )
                            }
                            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <Download className="h-4 w-4" />
                            <span>Download</span>
                          </button>
                          <button
                            onClick={() =>
                              handleOpenInNewTab(
                                `${API_BASE_URL}${defenseData.defenseImage}`
                              )
                            }
                            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <ExternalLink className="h-4 w-4" />
                            <span>Open in New Tab</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Defense Metadata */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Submitted: {formatDate(defenseData.submittedAt)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <User className="h-4 w-4" />
                      <span>Status: {selectedReport.status}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Defense Not Found
                  </h3>
                  <p className="text-gray-600">
                    Unable to load defense data. Please try again later.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-center p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <button
                onClick={handleCloseViewDefenseModal}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proof View Modal */}
      {proofModalOpen && selectedProof && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Eye className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Report Proof
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Evidence submitted against you
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseProofModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="flex justify-center mb-6">
                <img
                  src={selectedProof}
                  alt="Report proof"
                  className="max-w-full max-h-96 rounded-lg"
                  onError={(e) => {
                    console.error("Failed to load proof image:", selectedProof);
                    toast.error("Failed to load proof image");
                    e.target.style.display = "none";
                  }}
                />
              </div>

              <div className="flex justify-center space-x-4">
                <button
                  onClick={() =>
                    handleDownloadImage(
                      selectedProof,
                      `proof-${Date.now()}.jpg`
                    )
                  }
                  className="flex items-center space-x-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-300 font-semibold"
                >
                  <Download className="h-5 w-5" />
                  <span>Download Proof</span>
                </button>
                <button
                  onClick={() => handleOpenInNewTab(selectedProof)}
                  className="flex items-center space-x-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-300 font-semibold"
                >
                  <ExternalLink className="h-5 w-5" />
                  <span>Open in New Tab</span>
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-center p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <button
                onClick={handleCloseProofModal}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
