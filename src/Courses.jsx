import React, { useState, useEffect, useRef } from "react";
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
  Download,
  File,
  Image,
  UserCircle,
  ExternalLink,
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
  const [certificateData, setCertificateData] = useState(null);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [generatingCertificate, setGeneratingCertificate] = useState(false);
  const navigate = useNavigate();
  const certificateRef = useRef(null);

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

  // Generate Certificate Data with proper handling for one-way vs mutual exchange
  const generateCertificateData = (course) => {
    const currentUser = isCurrentUserProposer(course)
      ? course.userA
      : course.userB;
    const otherUser = isCurrentUserProposer(course)
      ? course.userB
      : course.userA;

    const completionDate = course.completedAt
      ? new Date(course.completedAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

    const certificateId = `CERT-${course._id
      .slice(-8)
      .toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

    // Different descriptions for one-way vs mutual exchange
    let description = "";
    if (course.justWantToLearn) {
      description = `This certificate acknowledges successful completion of a one-way learning course. The participant demonstrated dedication to learning and achieved course objectives through self-directed study.`;
    } else {
      description = `This certificate acknowledges successful completion of a mutual exchange course. The participant actively engaged in knowledge sharing and collaborative learning with a peer.`;
    }

    return {
      studentName: currentUser?.fullName || "Student",
      courseTitle: course.title || "Course",
      completionDate: completionDate,
      certificateId: certificateId,
      issuedDate: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      issuerName: otherUser?.fullName || "Instructor",
      courseDuration: `${course.duration || 0} weeks`,
      description: description,
      exchangeType: course.justWantToLearn
        ? "One-Way Learning"
        : "Mutual Exchange",
      validatedBy: otherUser?.fullName || "Course Instructor",
      isOneWay: course.justWantToLearn,
      otherUser: otherUser,
      otherUserId: otherUser?._id,
    };
  };

  // Handle View Certificate
  const handleViewCertificate = (course) => {
    if (course.status === "completed") {
      const data = generateCertificateData(course);
      setCertificateData(data);
      setShowCertificateModal(true);
    }
  };

  // Handle Visit Profile
  const handleVisitProfile = (userId) => {
    if (userId) {
      navigate(`/profile-info/${userId}`);
    } else {
      toast.error("Profile not available");
    }
  };

  // Create beautiful PDF certificate - EXACTLY MATCHING YOUR HTML DESIGN
  const handleDownloadCertificate = async () => {
    if (!certificateData) return;

    setGeneratingCertificate(true);
    try {
      // Dynamically import jsPDF
      const { jsPDF } = await import("jspdf");

      // Optional: Import html2canvas for better quality (if installed)
      let html2canvas;
      try {
        html2canvas = (await import("html2canvas")).default;
      } catch (e) {
        console.log("html2canvas not available, using jsPDF only");
      }

      // Create PDF in landscape A4 format
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;
      const contentHeight = pageHeight - margin * 2;
      const centerX = pageWidth / 2;
      let currentY = margin + 5;

      // === BACKGROUND GRADIENT ===
      // Create gradient background
      pdf.setFillColor(248, 250, 252); // Light blue-gray background
      pdf.rect(0, 0, pageWidth, pageHeight, "F");

      // === DECORATIVE BORDERS ===
      // Outer decorative corners - Blue
      pdf.setDrawColor(59, 130, 246); // Blue-500
      pdf.setLineWidth(1.5);

      // Top-left corner
      pdf.line(margin, margin + 10, margin, margin);
      pdf.line(margin, margin, margin + 10, margin);

      // Top-right corner
      pdf.line(pageWidth - margin - 10, margin, pageWidth - margin, margin);
      pdf.line(pageWidth - margin, margin, pageWidth - margin, margin + 10);

      // Bottom-left corner
      pdf.line(margin, pageHeight - margin - 10, margin, pageHeight - margin);
      pdf.line(margin, pageHeight - margin, margin + 10, pageHeight - margin);

      // Bottom-right corner
      pdf.line(
        pageWidth - margin - 10,
        pageHeight - margin,
        pageWidth - margin,
        pageHeight - margin
      );
      pdf.line(
        pageWidth - margin,
        pageHeight - margin,
        pageWidth - margin,
        pageHeight - margin - 10
      );

      // === HEADER SECTION ===
      // Decorative circle with icon
      const sealRadius = 10;
      const sealX = centerX;
      const sealY = currentY + sealRadius + 5;

      // Outer glow effect
      pdf.setFillColor(59, 130, 246, 0.1);
      pdf.circle(sealX, sealY, sealRadius + 2, "F");

      // Main circle
      pdf.setFillColor(59, 130, 246);
      pdf.circle(sealX, sealY, sealRadius, "F");

      // Inner circle
      pdf.setFillColor(139, 92, 246); // Purple
      pdf.circle(sealX, sealY, sealRadius * 0.6, "F");

      // Checkmark
      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.text("✓", sealX, sealY + 1.5, { align: "center" });

      currentY += sealRadius * 2 + 15;

      // Main Title with gradient effect
      pdf.setTextColor(30, 58, 138); // Dark blue
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(28);
      pdf.text("Certificate of Completion", centerX, currentY, {
        align: "center",
      });

      currentY += 12;

      // Title underline
      pdf.setDrawColor(59, 130, 246);
      pdf.setLineWidth(1);
      pdf.line(centerX - 70, currentY, centerX + 70, currentY);

      currentY += 20;

      // Subtitle
      pdf.setTextColor(75, 85, 99); // Gray-600
      pdf.setFont("helvetica", "italic");
      pdf.setFontSize(14);
      pdf.text("This certifies that", centerX, currentY, { align: "center" });

      currentY += 25;

      // === STUDENT NAME ===
      // Name background effect
      pdf.setFillColor(59, 130, 246, 0.05);
      pdf.roundedRect(centerX - 100, currentY - 10, 200, 40, 10, 10, "F");

      // Student name with gradient effect
      pdf.setTextColor(59, 130, 246); // Blue-500
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(36);

      const studentName = certificateData.studentName;
      const nameWidth = pdf.getTextWidth(studentName);
      const maxNameWidth = contentWidth - 60;

      // Check if name needs to be split
      if (nameWidth > maxNameWidth) {
        // Split name
        const words = studentName.split(" ");
        let line1 = "";
        let line2 = "";

        for (const word of words) {
          const testLine = (line1 + word + " ").trim();
          if (pdf.getTextWidth(testLine) > maxNameWidth) {
            line2 = words.slice(words.indexOf(word)).join(" ");
            break;
          }
          line1 = testLine;
        }

        if (line2) {
          pdf.text(line1, centerX, currentY, { align: "center" });
          currentY += 22;
          pdf.text(line2, centerX, currentY, { align: "center" });
        } else {
          pdf.text(studentName, centerX, currentY, { align: "center" });
        }
      } else {
        pdf.text(studentName, centerX, currentY, { align: "center" });
      }

      currentY += 15;

      // Name underline (gradient simulation)
      pdf.setDrawColor(59, 130, 246);
      pdf.setLineWidth(0.8);
      const lineLength = Math.min(120, nameWidth + 40);
      pdf.line(
        centerX - lineLength / 2,
        currentY,
        centerX + lineLength / 2,
        currentY
      );

      currentY += 25;

      // === COURSE COMPLETION TEXT ===
      pdf.setTextColor(55, 65, 81); // Gray-700
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(12);

      const completionText = `has successfully completed the ${
        certificateData.isOneWay ? "one-way learning" : "mutual exchange"
      } course`;
      pdf.text(completionText, centerX, currentY, { align: "center" });

      currentY += 20;

      // === COURSE TITLE BOX ===
      const courseTitle = `"${certificateData.courseTitle}"`;
      const titleBoxHeight = 18;
      const titleBoxWidth = Math.min(180, pdf.getTextWidth(courseTitle) + 50);

      // Box background (gradient effect)
      pdf.setFillColor(239, 246, 255); // Light blue
      pdf.roundedRect(
        centerX - titleBoxWidth / 2,
        currentY - 5,
        titleBoxWidth,
        titleBoxHeight,
        8,
        8,
        "F"
      );

      // Box border
      pdf.setDrawColor(186, 230, 253); // Light blue border
      pdf.setLineWidth(0.5);
      pdf.roundedRect(
        centerX - titleBoxWidth / 2,
        currentY - 5,
        titleBoxWidth,
        titleBoxHeight,
        8,
        8
      );

      // Course title text
      pdf.setTextColor(31, 41, 55); // Gray-900
      pdf.setFont("helvetica", "bold");

      let titleFontSize = 20;
      pdf.setFontSize(titleFontSize);
      let titleTextWidth = pdf.getTextWidth(courseTitle);

      // Adjust font size if needed
      while (titleTextWidth > titleBoxWidth - 30 && titleFontSize > 12) {
        titleFontSize -= 1;
        pdf.setFontSize(titleFontSize);
        titleTextWidth = pdf.getTextWidth(courseTitle);
      }

      pdf.text(courseTitle, centerX, currentY + titleBoxHeight / 2 - 3, {
        align: "center",
      });

      currentY += titleBoxHeight + 20;

      // === DESCRIPTION ===
      pdf.setTextColor(75, 85, 99); // Gray-600
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);

      const description = certificateData.description;
      const descriptionLines = pdf.splitTextToSize(
        description,
        contentWidth - 80
      );

      // Description background
      pdf.setFillColor(249, 250, 251); // Light gray background
      pdf.roundedRect(
        centerX - (contentWidth - 80) / 2,
        currentY - 5,
        contentWidth - 80,
        descriptionLines.length * 5 + 15,
        8,
        8,
        "F"
      );

      // Left border accent
      pdf.setDrawColor(59, 130, 246); // Blue-500
      pdf.setLineWidth(2);
      pdf.line(
        centerX - (contentWidth - 80) / 2,
        currentY - 5,
        centerX - (contentWidth - 80) / 2,
        currentY + descriptionLines.length * 5 + 10
      );

      pdf.text(descriptionLines, centerX, currentY, {
        align: "center",
        lineHeightFactor: 1.4,
      });

      currentY += descriptionLines.length * 5 + 25;

      // === INFO CARDS ===
      const cardWidth = 55;
      const cardHeight = 40;
      const cardGap = 8;
      const cardsStartY = currentY;

      // Duration Card (Blue)
      pdf.setFillColor(239, 246, 255); // Blue-50
      pdf.roundedRect(
        centerX - cardWidth - cardGap - cardWidth / 2,
        cardsStartY,
        cardWidth,
        cardHeight,
        10,
        10,
        "F"
      );

      pdf.setDrawColor(191, 219, 254); // Blue-200
      pdf.setLineWidth(0.3);
      pdf.roundedRect(
        centerX - cardWidth - cardGap - cardWidth / 2,
        cardsStartY,
        cardWidth,
        cardHeight,
        10,
        10
      );

      // Icon
      pdf.setFillColor(59, 130, 246); // Blue-500
      pdf.circle(
        centerX - cardWidth - cardGap - cardWidth / 2 + 12,
        cardsStartY + 12,
        3,
        "F"
      );

      pdf.setTextColor(30, 64, 175); // Blue-800
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.text("Duration", centerX - cardWidth - cardGap, cardsStartY + 22, {
        align: "center",
      });

      pdf.setTextColor(29, 78, 216); // Blue-700
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.text(
        certificateData.courseDuration,
        centerX - cardWidth - cardGap,
        cardsStartY + 32,
        { align: "center" }
      );

      // Type Card (Purple)
      pdf.setFillColor(245, 243, 255); // Purple-50
      pdf.roundedRect(
        centerX - cardWidth / 2,
        cardsStartY,
        cardWidth,
        cardHeight,
        10,
        10,
        "F"
      );

      pdf.setDrawColor(221, 214, 254); // Purple-200
      pdf.setLineWidth(0.3);
      pdf.roundedRect(
        centerX - cardWidth / 2,
        cardsStartY,
        cardWidth,
        cardHeight,
        10,
        10
      );

      // Icon
      pdf.setFillColor(139, 92, 246); // Purple-500
      pdf.circle(centerX - cardWidth / 2 + 12, cardsStartY + 12, 3, "F");

      pdf.setTextColor(76, 29, 149); // Purple-900
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.text("Type", centerX, cardsStartY + 22, { align: "center" });

      pdf.setTextColor(124, 58, 237); // Purple-600
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);

      const typeText = certificateData.exchangeType;
      let typeFontSize = 11;
      pdf.setFontSize(typeFontSize);
      let typeTextWidth = pdf.getTextWidth(typeText);

      while (typeTextWidth > cardWidth - 15 && typeFontSize > 8) {
        typeFontSize -= 1;
        pdf.setFontSize(typeFontSize);
        typeTextWidth = pdf.getTextWidth(typeText);
      }

      pdf.text(typeText, centerX, cardsStartY + 32, { align: "center" });

      // Completion Card (Green)
      pdf.setFillColor(240, 253, 244); // Green-50
      pdf.roundedRect(
        centerX + cardWidth + cardGap - cardWidth / 2,
        cardsStartY,
        cardWidth,
        cardHeight,
        10,
        10,
        "F"
      );

      pdf.setDrawColor(187, 247, 208); // Green-200
      pdf.setLineWidth(0.3);
      pdf.roundedRect(
        centerX + cardWidth + cardGap - cardWidth / 2,
        cardsStartY,
        cardWidth,
        cardHeight,
        10,
        10
      );

      // Icon
      pdf.setFillColor(34, 197, 94); // Green-500
      pdf.circle(
        centerX + cardWidth + cardGap - cardWidth / 2 + 12,
        cardsStartY + 12,
        3,
        "F"
      );

      pdf.setTextColor(21, 128, 61); // Green-800
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.text("Completed", centerX + cardWidth + cardGap, cardsStartY + 22, {
        align: "center",
      });

      pdf.setTextColor(22, 163, 74); // Green-600
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);

      const dateText = certificateData.completionDate;
      let dateFontSize = 9;
      pdf.setFontSize(dateFontSize);
      let dateTextWidth = pdf.getTextWidth(dateText);

      while (dateTextWidth > cardWidth - 10 && dateFontSize > 7) {
        dateFontSize -= 1;
        pdf.setFontSize(dateFontSize);
        dateTextWidth = pdf.getTextWidth(dateText);
      }

      pdf.text(dateText, centerX + cardWidth + cardGap, cardsStartY + 32, {
        align: "center",
      });

      currentY += cardHeight + 25;

      // === VERIFICATION SECTION ===
      pdf.setFillColor(219, 234, 254, 0.3); // Blue-100 with transparency
      pdf.roundedRect(centerX - 75, currentY, 150, 22, 12, 12, "F");

      pdf.setDrawColor(96, 165, 250); // Blue-400
      pdf.setLineWidth(0.5);
      pdf.roundedRect(centerX - 75, currentY, 150, 22, 12, 12);

      // Verification icon
      pdf.setFillColor(37, 99, 235); // Blue-700
      pdf.circle(centerX - 60, currentY + 11, 4, "F");

      pdf.setTextColor(30, 64, 175); // Blue-800
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.text("✓ Verified & Validated", centerX, currentY + 8, {
        align: "center",
      });

      pdf.setTextColor(75, 85, 99); // Gray-600
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.text(`by ${certificateData.validatedBy}`, centerX, currentY + 15, {
        align: "center",
      });

      currentY += 35;

      // === FOOTER ===
      const footerY = currentY;

      // Issued By (Left)
      pdf.setTextColor(107, 114, 128); // Gray-500
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.text("Issued by", margin + 25, footerY, { align: "left" });

      pdf.setTextColor(31, 41, 55); // Gray-900
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.text(certificateData.issuerName, margin + 25, footerY + 8, {
        align: "left",
      });

      pdf.setTextColor(107, 114, 128); // Gray-500
      pdf.setFont("helvetica", "italic");
      pdf.setFontSize(9);
      pdf.text("Course Instructor", margin + 25, footerY + 15, {
        align: "left",
      });

      // Certificate ID (Center)
      const idBoxWidth = 110;
      const idBoxHeight = 32;

      pdf.setFillColor(30, 64, 175); // Blue-800
      pdf.roundedRect(
        centerX - idBoxWidth / 2,
        footerY - 5,
        idBoxWidth,
        idBoxHeight,
        10,
        10,
        "F"
      );

      pdf.setDrawColor(59, 130, 246); // Blue-500
      pdf.setLineWidth(0.5);
      pdf.roundedRect(
        centerX - idBoxWidth / 2,
        footerY - 5,
        idBoxWidth,
        idBoxHeight,
        10,
        10
      );

      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.text("Certificate ID", centerX, footerY + 2, { align: "center" });

      pdf.setFont("courier", "bold");
      pdf.setFontSize(11);

      const certId = certificateData.certificateId;
      let idFontSize = 11;
      pdf.setFontSize(idFontSize);
      let idTextWidth = pdf.getTextWidth(certId);

      while (idTextWidth > idBoxWidth - 15 && idFontSize > 7) {
        idFontSize -= 1;
        pdf.setFontSize(idFontSize);
        idTextWidth = pdf.getTextWidth(certId);
      }

      pdf.text(certId, centerX, footerY + 10, { align: "center" });

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.text(`Issued: ${certificateData.issuedDate}`, centerX, footerY + 18, {
        align: "center",
      });

      // Official Seal (Right)
      const sealRightX = pageWidth - margin - 40;
      const sealRightY = footerY + 10;

      pdf.setFillColor(59, 130, 246, 0.1);
      pdf.circle(sealRightX, sealRightY, 12, "F");

      pdf.setFillColor(59, 130, 246);
      pdf.circle(sealRightX, sealRightY, 10, "F");

      pdf.setFillColor(139, 92, 246); // Purple
      pdf.circle(sealRightX, sealRightY, 6, "F");

      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.text("✓", sealRightX, sealRightY + 1.5, {
        align: "center",
      });

      pdf.setTextColor(107, 114, 128);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.text("Official Seal", sealRightX, sealRightY + 16, {
        align: "center",
      });

      // === WATERMARK ===
      pdf.setTextColor(59, 130, 246, 0.05);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(70);
      pdf.text("ACHIEVEMENT", centerX, pageHeight / 2, {
        align: "center",
        angle: 45,
      });

      // Save PDF
      const fileName = `Certificate_${certificateData.studentName.replace(
        /\s+/g,
        "_"
      )}_${certificateData.certificateId}.pdf`;
      pdf.save(fileName);

      toast.success("Certificate downloaded successfully!");
    } catch (error) {
      console.error("Error generating certificate:", error);
      toast.error("Failed to generate certificate. Please try again.");
    } finally {
      setGeneratingCertificate(false);
    }
  };

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

  // Beautiful Certificate Modal Component
  const CertificateModal = () => {
    if (!showCertificateModal || !certificateData) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-2 bg-black/70 backdrop-blur-sm">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col m-1 sm:m-2 border border-gray-200">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 md:p-6 border-b bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <Award className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold font-serif">
                  Course Certificate
                </h3>
                <p className="text-blue-100 text-sm opacity-90">
                  Your achievement certificate is ready
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowCertificateModal(false)}
              variant="ghost"
              className="text-white hover:bg-white/20 p-2 rounded-full"
              size="sm"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Certificate Preview - Beautiful Design */}
          <div className="flex-1 overflow-auto p-4 sm:p-5 md:p-6 bg-gradient-to-br from-gray-50 to-blue-50">
            <div className="max-w-4xl mx-auto">
              {/* Certificate Container with elegant border */}
              <div className="relative bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
                {/* Decorative border corners */}
                <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-blue-500 rounded-tl-xl"></div>
                <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-purple-500 rounded-tr-xl"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-indigo-500 rounded-bl-xl"></div>
                <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-blue-500 rounded-br-xl"></div>

                {/* Main Content */}
                <div className="p-6 sm:p-8 md:p-10">
                  {/* Header with decorative elements */}
                  <div className="text-center mb-8">
                    <div className="inline-block mb-4">
                      <div className="relative">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg mx-auto">
                          <Award className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            ✓
                          </span>
                        </div>
                      </div>
                    </div>

                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 font-serif bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Certificate of Completion
                    </h1>
                    <div className="h-1 w-32 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
                    <p className="text-gray-600 italic mt-4 text-lg">
                      This certifies that
                    </p>
                  </div>

                  {/* Student Name - Centerpiece */}
                  <div className="text-center my-8 py-6 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50 to-transparent opacity-50"></div>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold relative font-serif bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent animate-gradient">
                      {certificateData.studentName}
                    </h2>
                    <div className="h-0.5 w-64 bg-gradient-to-r from-blue-400 to-purple-400 mx-auto mt-4 rounded-full"></div>
                  </div>

                  {/* Course Details */}
                  <div className="text-center mb-10">
                    <p className="text-gray-700 text-lg mb-6 leading-relaxed">
                      has successfully completed the{" "}
                      <span className="font-semibold text-blue-600">
                        {certificateData.isOneWay
                          ? "one-way learning"
                          : "mutual exchange"}
                      </span>{" "}
                      course
                    </p>

                    {/* Course Title in elegant box */}
                    <div className="inline-block bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-100 shadow-sm mb-6 max-w-2xl">
                      <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 font-serif">
                        "{certificateData.courseTitle}"
                      </h3>
                    </div>

                    {/* Description */}
                    <div className="max-w-3xl mx-auto">
                      <p className="text-gray-600 text-base leading-relaxed bg-gray-50 p-4 sm:p-6 rounded-lg border-l-4 border-blue-500 italic">
                        {certificateData.description}
                      </p>
                    </div>
                  </div>

                  {/* Info Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-10">
                    {/* Duration Card */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl border border-blue-200 shadow-sm">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="bg-blue-500 p-2 rounded-lg">
                          <Calendar className="w-5 h-5 text-white" />
                        </div>
                        <h4 className="text-gray-700 font-semibold">
                          Duration
                        </h4>
                      </div>
                      <p className="text-2xl font-bold text-blue-700">
                        {certificateData.courseDuration}
                      </p>
                      <p className="text-gray-500 text-sm mt-1">
                        Course length
                      </p>
                    </div>

                    {/* Type Card */}
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-xl border border-purple-200 shadow-sm">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="bg-purple-500 p-2 rounded-lg">
                          <Target className="w-5 h-5 text-white" />
                        </div>
                        <h4 className="text-gray-700 font-semibold">Type</h4>
                      </div>
                      <p className="text-2xl font-bold text-purple-700">
                        {certificateData.exchangeType}
                      </p>
                      <p className="text-gray-500 text-sm mt-1">
                        Learning format
                      </p>
                    </div>

                    {/* Completed Card */}
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-xl border border-green-200 shadow-sm">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="bg-green-500 p-2 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                        <h4 className="text-gray-700 font-semibold">
                          Completed
                        </h4>
                      </div>
                      <p className="text-xl font-bold text-green-700">
                        {certificateData.completionDate}
                      </p>
                      <p className="text-gray-500 text-sm mt-1">
                        Completion date
                      </p>
                    </div>
                  </div>

                  {/* Verification Section */}
                  <div className="mb-10">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 sm:p-6 rounded-xl border border-blue-200 shadow-sm">
                      <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="bg-blue-600 p-2 rounded-full">
                          <CheckCircle className="w-6 h-6 text-white" />
                        </div>
                        <h4 className="text-xl font-bold text-gray-900">
                          Verified & Validated
                        </h4>
                      </div>
                      <p className="text-center text-gray-700 text-lg font-medium mb-2">
                        <span className="text-blue-600 font-bold">
                          Verified by:
                        </span>{" "}
                        <span className="font-semibold">
                          {certificateData.validatedBy}
                        </span>
                      </p>
                      <p className="text-center text-gray-600 text-sm">
                        This certificate has been digitally verified and
                        validated by the course instructor.
                      </p>
                    </div>
                  </div>

                  {/* Footer with issuer info */}
                  <div className="border-t border-gray-200 pt-8">
                    <div className="flex flex-col lg:flex-row justify-between items-center gap-8">
                      {/* Issued By */}
                      <div className="text-center lg:text-left">
                        <p className="text-gray-500 text-sm mb-2 uppercase tracking-wider">
                          Issued by
                        </p>
                        <p className="text-xl font-bold text-gray-900 mb-1">
                          {certificateData.issuerName}
                        </p>
                        <p className="text-gray-600">Course Instructor</p>
                      </div>

                      {/* Certificate ID - Highlighted */}
                      <div className="text-center">
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-xl shadow-lg text-white">
                          <p className="text-sm opacity-90 mb-2">
                            Certificate ID
                          </p>
                          <p className="font-mono font-bold text-lg tracking-wider break-all">
                            {certificateData.certificateId}
                          </p>
                          <p className="text-sm opacity-90 mt-2">
                            Issued: {certificateData.issuedDate}
                          </p>
                        </div>
                      </div>

                      {/* Official Seal */}
                      <div className="text-center lg:text-right">
                        <div className="inline-block">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                              <Award className="w-8 h-8 text-blue-600" />
                            </div>
                          </div>
                          <p className="text-gray-500 text-sm mt-2 uppercase tracking-wider">
                            Official Seal
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="border-t p-4 sm:p-5 bg-white flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => setShowCertificateModal(false)}
              variant="outline"
              className="flex-1 py-3 h-auto text-base border-gray-300 hover:bg-gray-50"
            >
              Close Preview
            </Button>
            <Button
              onClick={handleDownloadCertificate}
              disabled={generatingCertificate}
              className="flex-1 py-3 h-auto text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {generatingCertificate ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span className="text-sm">Generating PDF Certificate...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Download className="w-5 h-5" />
                  <span className="text-sm">Download Certificate (PDF)</span>
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
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

  // Charts Component
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
        </CardContent>
      </Card>

      {/* Course Duration Distribution */}
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
    const isCompleted = course.status === "completed";
    const otherUser = userIsProposer ? course.userB : course.userA;
    const otherUserId = otherUser?._id;

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
            <div className="flex flex-col space-y-2 min-w-[140px]">
              <Button
                onClick={() => viewCourse(course._id)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap"
              >
                <Eye className="w-4 h-4 mr-1" />
                View Course
              </Button>

              {/* Visit Profile Button */}
              {otherUserId && (
                <Button
                  onClick={() => handleVisitProfile(otherUserId)}
                  className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white px-3 py-2 rounded-lg text-sm transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap"
                >
                  <UserCircle className="w-4 h-4 mr-1" />
                  Visit Profile
                </Button>
              )}

              {/* Certificate Button - Only for completed courses */}
              {isCompleted && (
                <Button
                  onClick={() => handleViewCertificate(course)}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-3 py-2 rounded-lg text-sm transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap"
                >
                  <Award className="w-4 h-4 mr-1" />
                  View Certificate
                </Button>
              )}

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

          <div className="flex flex-col space-y-2">
            <div className="flex space-x-2">
              <Button
                onClick={() => viewCourse(course._id)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm whitespace-nowrap"
              >
                <Eye className="w-4 h-4 mr-1" />
                View Course
              </Button>

              {/* Visit Profile Button for Mobile */}
              {otherUserId && (
                <Button
                  onClick={() => handleVisitProfile(otherUserId)}
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white py-2 rounded-lg text-sm whitespace-nowrap"
                >
                  <UserCircle className="w-4 h-4 mr-1" />
                  Profile
                </Button>
              )}
            </div>

            {/* Certificate Button for Mobile - Only for completed courses */}
            {isCompleted && (
              <Button
                onClick={() => handleViewCertificate(course)}
                className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white py-2 rounded-lg text-sm whitespace-nowrap"
              >
                <Award className="w-4 h-4 mr-1" />
                Certificate
              </Button>
            )}

            {/* Only show accept/reject buttons if user can accept/reject */}
            {userCanAcceptOrReject && (
              <div className="flex space-x-2">
                <Button
                  onClick={() => handleCourseAction(course._id, "accept")}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg text-sm"
                >
                  <CheckSquare className="w-4 h-4 mr-1" />
                  Accept
                </Button>
                <Button
                  onClick={() => handleCourseAction(course._id, "reject")}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Reject
                </Button>
              </div>
            )}

            {/* Show waiting message if user is proposer and course is pending */}
            {course.status === "pending" && userIsProposer && (
              <div className="text-xs text-gray-500 text-center py-2 border-t">
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
      {/* Certificate Modal */}
      <CertificateModal />

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
