import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Shield,
  ArrowLeft,
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  User,
  Flag,
  Clock,
  Image as ImageIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import { getToken } from "./ManageToken";

export default function DefensePage() {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [report, setReport] = useState(null);
  const [defense, setDefense] = useState(null);
  const [formData, setFormData] = useState({
    defenseText: "",
    defenseImage: null,
  });
  const [imagePreview, setImagePreview] = useState(null);

  // Fetch report details
  const fetchReportDetails = async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        toast.error("Please log in to view this page");
        navigate("/login");
        return;
      }

      const response = await fetch(`/reports/${reportId}`, {
        headers: {
          auth: token,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch report details");
      }

      const data = await response.json();

      if (data.status === "success") {
        setReport(data.data);

        // Check if defense already exists
        await fetchExistingDefense();
      } else {
        throw new Error(data.message || "Failed to load report");
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      toast.error(error.message || "Failed to load report details");
    } finally {
      setLoading(false);
    }
  };

  // Fetch existing defense
  const fetchExistingDefense = async () => {
    try {
      const token = getToken();
      const response = await fetch(`/defense/report/${reportId}`, {
        headers: {
          auth: token,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === "success") {
          setDefense(data.data);
        }
      }
    } catch (error) {
      console.error("Error fetching defense:", error);
    }
  };

  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be smaller than 5MB");
        return;
      }

      setFormData((prev) => ({ ...prev, defenseImage: file }));

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  // Remove selected image
  const removeImage = () => {
    setFormData((prev) => ({ ...prev, defenseImage: null }));
    setImagePreview(null);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.defenseText.trim()) {
      toast.error("Please provide your defense explanation");
      return;
    }

    if (formData.defenseText.length > 2000) {
      toast.error("Defense text cannot exceed 2000 characters");
      return;
    }

    setSubmitting(true);
    try {
      const token = getToken();
      const submitData = new FormData();
      submitData.append("reportId", reportId);
      submitData.append("defenseText", formData.defenseText);
      if (formData.defenseImage) {
        submitData.append("defenseImage", formData.defenseImage);
      }

      const response = await fetch("/defense/submit", {
        method: "POST",
        headers: {
          auth: token,
        },
        body: submitData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit defense");
      }

      if (data.status === "success") {
        toast.success("Defense submitted successfully!");
        setDefense(data.data.defense);
        setFormData({ defenseText: "", defenseImage: null });
        setImagePreview(null);
      } else {
        throw new Error(data.message || "Submission failed");
      }
    } catch (error) {
      console.error("Error submitting defense:", error);
      toast.error(error.message || "Failed to submit defense");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (reportId) {
      fetchReportDetails();
    }
  }, [reportId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading report details...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Report Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            The report you're looking for doesn't exist.
          </p>
          <button
            onClick={() => navigate("/reports")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Reports
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </button>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Submit Your Defense
                </h1>
                <p className="text-gray-600 mt-1">
                  Respond to the report against you with your side of the story
                </p>
              </div>
            </div>

            <div
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                report.status === "pending"
                  ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                  : report.status === "accepted"
                  ? "bg-red-100 text-red-800 border border-red-200"
                  : "bg-green-100 text-green-800 border border-green-200"
              }`}
            >
              {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Report Details */}
          <div className="lg:col-span-1 space-y-6">
            {/* Report Summary */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Flag className="h-5 w-5 mr-2 text-red-500" />
                Report Details
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Report Type
                  </label>
                  <p className="text-sm text-gray-900 font-medium capitalize mt-1">
                    {report.title?.replace("_", " ") || report.title}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Reason
                  </label>
                  <p className="text-sm text-gray-900 mt-1">{report.reason}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Reported By
                  </label>
                  <div className="flex items-center mt-1">
                    <User className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">
                      {report.reportedBy?.fullName || "Unknown User"}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Date Reported
                  </label>
                  <div className="flex items-center mt-1">
                    <Clock className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Defense Status */}
            {defense && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                  Defense Submitted
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Submitted</span>
                    <span className="text-sm text-gray-900">
                      {new Date(defense.submittedAt).toLocaleDateString()}
                    </span>
                  </div>

                  {defense.defenseImage && (
                    <div className="mt-4">
                      <label className="text-sm font-medium text-gray-500 mb-2 block">
                        Your Evidence
                      </label>
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <img
                          src={`${process.env.REACT_APP_API_URL}${defense.defenseImage}`}
                          alt="Defense evidence"
                          className="w-full h-32 object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Defense Form */}
          <div className="lg:col-span-2">
            {defense ? (
              // Already submitted defense
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Defense Submitted
                </h2>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Your defense has been successfully submitted and is under
                  review by our admin team. You will be notified once a decision
                  has been made.
                </p>

                <div className="bg-gray-50 rounded-lg p-6 text-left max-w-2xl mx-auto">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Your Defense
                  </h4>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {defense.defenseText}
                  </p>

                  {defense.defenseImage && (
                    <div className="mt-4">
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Evidence Provided
                      </h4>
                      <div className="border border-gray-200 rounded-lg overflow-hidden max-w-xs">
                        <img
                          src={`${process.env.REACT_APP_API_URL}${defense.defenseImage}`}
                          alt="Defense evidence"
                          className="w-full h-auto"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : report.status !== "pending" ? (
              // Report already resolved
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
                <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Report Already Resolved
                </h2>
                <p className="text-gray-600 mb-6">
                  This report has already been {report.status}. Defense
                  submissions are only allowed for pending reports.
                </p>
                <button
                  onClick={() => navigate("/reports")}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Back to Reports
                </button>
              </div>
            ) : (
              // Defense submission form
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Submit Your Defense
                </h2>
                <p className="text-gray-600 mb-6">
                  Please provide your side of the story and any evidence to
                  support your case.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Defense Text */}
                  <div>
                    <label
                      htmlFor="defenseText"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Your Explanation *
                    </label>
                    <textarea
                      id="defenseText"
                      value={formData.defenseText}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          defenseText: e.target.value,
                        }))
                      }
                      placeholder="Explain your side of the story. Be as detailed as possible..."
                      rows={8}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none transition-colors"
                      required
                    />
                    <div className="flex justify-between text-sm text-gray-500 mt-1">
                      <span>Required field</span>
                      <span>{formData.defenseText.length}/2000</span>
                    </div>
                  </div>

                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Supporting Evidence (Optional)
                    </label>

                    {imagePreview ? (
                      <div className="space-y-3">
                        <div className="border-2 border-dashed border-green-200 rounded-lg bg-green-50 p-4">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-48 object-contain rounded"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={removeImage}
                          className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Remove Image
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="h-8 w-8 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-500">
                            <span className="font-semibold">
                              Click to upload
                            </span>{" "}
                            or drag and drop
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            PNG, JPG, GIF up to 5MB
                          </p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleImageChange}
                        />
                      </label>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => navigate(-1)}
                      className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={submitting || !formData.defenseText.trim()}
                      className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center"
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4 mr-2" />
                          Submit Defense
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
