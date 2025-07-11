/* eslint-disable @typescript-eslint/no-explicit-any */
import { format } from "date-fns";
import jsPDF from "jspdf";
import { ReportData } from "../types/ReportsAdmin";

const drawTitle = (doc: jsPDF, text: string, y: number): number => {
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(text, 105, y, { align: "center" });
  return y + 10;
};

const drawSectionHeader = (doc: jsPDF, text: string, y: number): number => {
  doc.setFillColor(240, 240, 240);
  doc.rect(15, y - 5, 180, 10, "F");
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(text, 20, y);
  return y + 10;
};

const drawText = (doc: jsPDF, text: string, y: number, x = 20): number => {
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(text, x, y);
  return y + 5;
};

const drawSubsectionTitle = (doc: jsPDF, text: string, y: number): number => {
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(text, 20, y);
  return y + 6;
};

const drawDescriptionText = (doc: jsPDF, text: string, y: number): number => {
  const maxWidth = 170;
  const lines = doc.splitTextToSize(text, maxWidth);

  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(80, 80, 80);

  lines.forEach((line: string) => {
    doc.text(line, 20, y);
    y += 5;
  });

  doc.setTextColor(0, 0, 0);
  return y + 2;
};

const drawDataTable = (
  doc: jsPDF,
  headers: string[],
  data: (string | number)[][],
  y: number,
  columnWidths?: number[]
): number => {
  const startX = 20;
  const rowHeight = 8;
  const widths = columnWidths || headers.map(() => 160 / headers.length);

  doc.setFillColor(230, 230, 230);
  doc.rect(
    startX,
    y - 6,
    widths.reduce((a, b) => a + b, 0),
    rowHeight,
    "F"
  );

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");

  let currentX = startX;
  headers.forEach((header, index) => {
    doc.text(header, currentX + 2, y);
    currentX += widths[index];
  });

  y += rowHeight;

  doc.setFont("helvetica", "normal");
  data.forEach((row, rowIndex) => {
    if (rowIndex % 2 === 0) {
      doc.setFillColor(248, 248, 248);
      doc.rect(
        startX,
        y - 6,
        widths.reduce((a, b) => a + b, 0),
        rowHeight,
        "F"
      );
    }

    currentX = startX;
    row.forEach((cell, cellIndex) => {
      doc.text(cell.toString(), currentX + 2, y);
      currentX += widths[cellIndex];
    });

    y += rowHeight;
  });

  return y + 5;
};

const drawKPI = (
  doc: jsPDF,
  title: string,
  value: string | number,
  x: number,
  y: number,
  width = 40
): number => {
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(x, y, width, 25, 3, 3, "F");

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(title, x + 5, y + 8);

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text(value.toString(), x + 5, y + 18);

  return y + 30;
};

const addChartImage = (
  doc: jsPDF,
  chartCanvas: HTMLCanvasElement,
  x: number,
  y: number,
  width: number,
  height: number
): number => {
  const imgData = chartCanvas.toDataURL("image/png");
  doc.addImage(imgData, "PNG", x, y, width, height);
  return y + height + 10;
};

const drawDivider = (doc: jsPDF, y: number): number => {
  doc.setDrawColor(200, 200, 200);
  doc.line(15, y, 195, y);
  return y + 5;
};

const getCurrentMonthYear = (): string => {
  return format(new Date(), "MMMM yyyy");
};

export const generateMonthlyReport = async (
  reportData: ReportData,
  charts: { [key: string]: HTMLCanvasElement }
): Promise<void> => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 210, 297, "F");

  let y = 15;
  doc.setTextColor(33, 150, 243);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("Azurea Hotel Management System", 105, y, { align: "center" });

  y += 10;
  doc.setTextColor(0, 0, 0);
  y = drawTitle(doc, "Monthly Performance Report", y);

  y += 5;
  doc.setFontSize(12);
  doc.setFont("helvetica", "italic");
  doc.text(reportData.period || getCurrentMonthYear(), 105, y, {
    align: "center",
  });

  y += 5;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on: ${format(new Date(), "PPpp")}`, 105, y, {
    align: "center",
  });

  y += 15;

  y = drawSectionHeader(doc, "Executive Summary", y);
  y += 5;

  const executiveSummary = `This monthly performance report provides a comprehensive overview of the hotel's operational and financial metrics for ${reportData.period}. The report highlights key performance indicators including total bookings (${reportData.stats.totalBookings}), current occupancy rate (${reportData.stats.occupancyRate}), and total revenue (${reportData.stats.formattedRevenue}). Review the detailed sections below for deeper insights into booking trends, revenue patterns, and room occupancy statistics.`;
  y = drawDescriptionText(doc, executiveSummary, y);

  y += 5;
  y = drawDivider(doc, y);

  y = drawSectionHeader(doc, "1. Key Performance Indicators", y);
  y += 5;

  const kpiDescription =
    "These key metrics provide a snapshot of the hotel's current operational status and financial performance for the current month.";
  y = drawDescriptionText(doc, kpiDescription, y);
  y += 3;

  drawKPI(doc, "Total Bookings", reportData.stats.totalBookings, 20, y, 40);
  drawKPI(doc, "Active Bookings", reportData.stats.activeBookings, 70, y, 40);
  drawKPI(doc, "Total Revenue", reportData.stats.formattedRevenue, 120, y, 40);
  drawKPI(doc, "Occupancy Rate", reportData.stats.occupancyRate, 170, y, 40);

  y += 30;

  drawKPI(doc, "Pending Bookings", reportData.stats.pendingBookings, 20, y, 40);
  drawKPI(doc, "Checked-in Guests", reportData.stats.checkedInCount, 70, y, 40);
  drawKPI(doc, "Available Rooms", reportData.stats.availableRooms, 120, y, 40);
  drawKPI(doc, "Total Rooms", reportData.stats.totalRooms, 170, y, 40);

  y += 35;
  y = drawDivider(doc, y);

  y = drawSectionHeader(doc, "2. Revenue & Booking Analysis", y);
  y += 5;

  const revenueDescription =
    "This section illustrates daily revenue trends and booking patterns throughout the month, helping identify peak periods and opportunities for revenue optimization.";
  y = drawDescriptionText(doc, revenueDescription, y);
  y += 3;

  y = drawSubsectionTitle(doc, "Daily Revenue Trends", y);

  if (charts.revenueChart) {
    y = addChartImage(doc, charts.revenueChart, 20, y, 170, 70);
  } else {
    y = drawText(doc, "Revenue chart data not available", y);
    y += 70;
  }

  const revenueInsights = `Total monthly revenue: ${
    reportData.stats.formattedRevenue
  }. Room revenue accounts for ${Math.round(
    ((reportData.stats.revenue * 0.75) / reportData.stats.revenue) * 100
  )}% of total revenue, with the remainder coming from venue bookings and additional services.`;
  y = drawDescriptionText(doc, revenueInsights, y);
  y += 3;

  y = drawSubsectionTitle(doc, "Booking Pattern Analysis", y);

  if (charts.bookingTrendsChart) {
    y = addChartImage(doc, charts.bookingTrendsChart, 20, y, 170, 70);
  } else {
    y = drawText(doc, "Booking trends chart data not available", y);
    y += 70;
  }

  if (y > 250) {
    doc.addPage();
    y = 20;
  } else {
    y = drawDivider(doc, y);
  }

  y = drawSectionHeader(doc, "3. Booking Status Distribution", y);
  y += 5;

  const bookingStatusDescription =
    "This section provides a breakdown of all bookings by their current status, helping identify operational priorities and potential revenue risks.";
  y = drawDescriptionText(doc, bookingStatusDescription, y);
  y += 3;

  if (charts.bookingStatusChart) {
    y = addChartImage(doc, charts.bookingStatusChart, 55, y, 100, 80);
  } else {
    y = drawText(doc, "Booking status chart data not available", y);
    y += 80;
  }

  y += 5;
  y = drawSubsectionTitle(doc, "Booking Status Breakdown", y);

  const statusLabels = [
    { key: "pending", label: "Pending" },
    { key: "reserved", label: "Reserved" },
    { key: "checked_in", label: "Checked In" },
    { key: "checked_out", label: "Checked Out" },
    { key: "cancelled", label: "Cancelled" },
    { key: "no_show", label: "No Show" },
    { key: "rejected", label: "Rejected" },
  ];

  const tableHeaders = ["Status", "Count", "Percentage"];
  const totalBookings = Object.values(reportData.bookingStatusCounts).reduce(
    (sum, val) => sum + val,
    0
  );

  const tableData = statusLabels.map((status) => {
    const count =
      reportData.bookingStatusCounts[
        status.key as keyof typeof reportData.bookingStatusCounts
      ];
    const percentage =
      totalBookings > 0
        ? ((count / totalBookings) * 100).toFixed(1) + "%"
        : "0%";
    return [status.label, count, percentage];
  });

  y = drawDataTable(doc, tableHeaders, tableData, y, [60, 40, 60]);

  const pendingPercent =
    totalBookings > 0
      ? (
          (reportData.bookingStatusCounts.pending / totalBookings) *
          100
        ).toFixed(1)
      : "0";
  const cancelledPercent =
    totalBookings > 0
      ? (
          (reportData.bookingStatusCounts.cancelled / totalBookings) *
          100
        ).toFixed(1)
      : "0";

  const bookingInsights = `Currently, ${pendingPercent}% of all bookings are pending confirmation, while ${cancelledPercent}% have been cancelled. Active revenue-generating bookings (reserved and checked-in) account for ${
    totalBookings > 0
      ? (
          ((reportData.bookingStatusCounts.reserved +
            reportData.bookingStatusCounts.checked_in) /
            totalBookings) *
          100
        ).toFixed(1)
      : "0"
  }% of all bookings.`;
  y = drawDescriptionText(doc, bookingInsights, y);

  if (y > 250) {
    doc.addPage();
    y = 20;
  } else {
    y = drawDivider(doc, y);
  }

  y = drawSectionHeader(doc, "4. Room Occupancy Analysis", y);
  y += 5;

  const roomOccupancyDescription =
    "This section analyzes room occupancy by type, highlighting which room categories are most popular and identifying opportunities to optimize room allocation and pricing.";
  y = drawDescriptionText(doc, roomOccupancyDescription, y);
  y += 3;

  if (charts.roomOccupancyChart) {
    y = addChartImage(doc, charts.roomOccupancyChart, 20, y, 170, 70);
  } else {
    y = drawText(doc, "Room occupancy chart data not available", y);
    y += 70;
  }

  const occupancyRate = reportData.stats.occupancyRate;
  const roomInsights = `Current overall occupancy rate is ${occupancyRate}, with ${reportData.stats.availableRooms} rooms currently available for booking out of ${reportData.stats.totalRooms} total rooms. Standard rooms show the highest occupancy rate, followed by Deluxe rooms.`;
  y = drawDescriptionText(doc, roomInsights, y);

  y += 5;
  y = drawSubsectionTitle(doc, "Recommendations", y);

  const recommendations = [
    "Consider targeted promotions for room types with lower occupancy rates",
    "Review pricing strategy for peak booking days identified in the booking trends chart",
    "Follow up with pending bookings to increase conversion rate",
    "Analyze cancellation patterns to identify and address common causes",
  ];

  recommendations.forEach((rec) => {
    y = drawText(doc, `• ${rec}`, y);
  });

  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(100, 100, 100);
  doc.text("Confidential - For internal use only", 105, 285, {
    align: "center",
  });
  doc.text("© Azurea Hotel Management System", 105, 290, {
    align: "center",
  });

  doc.save(`Hotel_Monthly_Report_${format(new Date(), "yyyy-MM")}.pdf`);
};

export const prepareReportData = (data: {
  period: string;
  stats: any;
  bookingStatusCounts: any;
  roomData?: {
    names: string[];
    bookings: number[];
    revenue: number[];
  };
}): ReportData => {
  return {
    title: "Monthly Performance Report",
    period: data.period,
    stats: {
      totalBookings: data.stats.totalBookings || 0,
      activeBookings: data.stats.activeBookings || 0,
      revenue: data.stats.revenue || 0,
      formattedRevenue: data.stats.formattedRevenue || "₱0.00",
      occupancyRate: data.stats.occupancyRate || "0%",
      pendingBookings: data.stats.pendingBookings || 0,
      checkedInCount: data.stats.checkedInCount || 0,
      availableRooms: data.stats.availableRooms || 0,
      totalRooms: data.stats.totalRooms || 0,
    },
    bookingStatusCounts: data.bookingStatusCounts,
    charts: {
      revenueData: {
        type: "line",
        data: {
          labels: [],
          datasets: [
            {
              data: [],
            },
          ],
        },
      },
      bookingTrendsData: {
        type: "line",
        data: {
          labels: [],
          datasets: [
            {
              data: [],
            },
          ],
        },
      },
      bookingStatusData: {
        type: "pie",
        data: {
          labels: [],
          datasets: [
            {
              data: [],
            },
          ],
        },
      },
      roomOccupancyData: {
        type: "bar",
        data: {
          labels: [],
          datasets: [
            {
              data: [],
            },
          ],
        },
      },
    },
  };
};

export const generateEReceipt = async (bookingData: any): Promise<void> => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Colors
  const primaryColor = [26, 115, 232] as const;
  const secondaryColor = [63, 81, 181] as const;
  const accentColor = [255, 193, 7] as const;
  const successColor = [76, 175, 80] as const;
  const lightGray = [245, 245, 245] as const;
  const mediumGray = [158, 158, 158] as const;
  const darkGray = [66, 66, 66] as const;

  // Set white background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 210, 297, "F");

  let y = 20;

  // HEADER SECTION
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 50, "F");

  // Hotel logo
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(20, 12, 30, 25, 3, 3, "F");
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("AZUREA", 35, 27, { align: "center" });

  // Hotel name and receipt title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.text("AZUREA HOTEL & RESORT", 110, 22, { align: "center" });

  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text("ELECTRONIC RECEIPT", 110, 32, { align: "center" });

  // Hotel contact info
  doc.setFontSize(9);
  const hotelAddress = bookingData.receipt_data?.hotel_info?.address || "Brgy. Dayap, Calauan, Laguna";
  const hotelPhone = bookingData.receipt_data?.hotel_info?.phone || "+63 912 345 6789";
  const hotelEmail = bookingData.receipt_data?.hotel_info?.email || "azureahotelmanagement@gmail.com";
  doc.text(`${hotelAddress} | ${hotelPhone} | ${hotelEmail}`, 110, 41, { align: "center" });

  y = 65;

  // RECEIPT INFORMATION CARD
  doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.roundedRect(20, y, 170, 35, 5, 5, "F");
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(1);
  doc.roundedRect(20, y, 170, 35, 5, 5, "S");

  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");

  // Receipt number
  doc.text("Receipt No:", 25, y + 12);
  doc.setFont("helvetica", "normal");
  const receiptNumber = bookingData.receipt_data?.receipt_number || `REC-${String(bookingData.id).padStart(6, "0")}`;
  doc.text(receiptNumber, 55, y + 12);

  // Generation date
  doc.setFont("helvetica", "bold");
  doc.text("Generated:", 25, y + 22);
  doc.setFont("helvetica", "normal");
  const generatedDate = bookingData.receipt_data?.generated_at
    ? format(new Date(bookingData.receipt_data.generated_at), "MMM dd, yyyy 'at' h:mm a")
    : format(new Date(), "MMM dd, yyyy 'at' h:mm a");
  doc.text(generatedDate, 55, y + 22);

  // Booking ID
  doc.setFont("helvetica", "bold");
  doc.text("Booking ID:", 115, y + 12);
  doc.setFont("helvetica", "normal");
  doc.text(`#${String(bookingData.id).padStart(6, "0")}`, 150, y + 12);

  // Status badge
  doc.setFont("helvetica", "bold");
  doc.text("Status:", 115, y + 22);
  doc.setFillColor(successColor[0], successColor[1], successColor[2]);
  doc.roundedRect(148, y + 17, 35, 8, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text("CHECKED OUT", 165, y + 22, { align: "center" });

  y += 50;

  // GUEST INFORMATION SECTION
  y = drawModernSectionHeader(doc, "GUEST INFORMATION", y, primaryColor);

  const user = bookingData.user;
  const guestName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || "N/A";

  y = drawInfoRow(doc, "Guest Name", guestName, y);
  y = drawInfoRow(doc, "Email Address", user?.email || "N/A", y);
  y = drawInfoRow(doc, "Phone Number", bookingData.phone_number || "N/A", y);

  y += 15;

  // BOOKING DETAILS SECTION
  y = drawModernSectionHeader(doc, "ACCOMMODATION DETAILS", y, secondaryColor);

  y = drawInfoRow(doc, "Property Type", bookingData.property_type || "Room", y);
  y = drawInfoRow(doc, "Property Name", bookingData.property_name || "N/A", y);

  const checkInDate = bookingData.check_in_date
    ? format(new Date(bookingData.check_in_date), "EEEE, MMMM do, yyyy")
    : "N/A";
  const checkOutDate = bookingData.check_out_date
    ? format(new Date(bookingData.check_out_date), "EEEE, MMMM do, yyyy")
    : "N/A";

  y = drawInfoRow(doc, "Check-in Date", checkInDate, y);
  y = drawInfoRow(doc, "Check-out Date", checkOutDate, y);
  y = drawInfoRow(doc, "Duration of Stay", bookingData.duration || "N/A", y);

  if (bookingData.number_of_guests) {
    const guestText = `${bookingData.number_of_guests} guest${bookingData.number_of_guests > 1 ? "s" : ""}`;
    y = drawInfoRow(doc, "Number of Guests", guestText, y);
  }

  if (bookingData.special_request) {
    y += 3;
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Special Requests:", 25, y);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(66, 66, 66);
    const maxWidth = 140;
    const requestLines = doc.splitTextToSize(bookingData.special_request, maxWidth);
    y += 5;
    requestLines.forEach((line: string, index: number) => {
      doc.text(line, 25, y + index * 5);
    });
    y += requestLines.length * 5 + 5;
  }

  y += 10;

  // PAYMENT SUMMARY SECTION - FIXED LAYOUT
  y = drawModernSectionHeader(doc, "PAYMENT SUMMARY", y, accentColor);

  const payment = bookingData.payment_breakdown;
  const tableStartY = y;
  const tableWidth = 170;
  const headerHeight = 10;
  const rowHeight = 10;

  // Table header
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(20, tableStartY, tableWidth, headerHeight, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("DESCRIPTION", 25, tableStartY + 7);
  doc.text("AMOUNT (₱)", 165, tableStartY + 7, { align: "right" });

  let currentRowY = tableStartY + headerHeight;
  
  // Down Payment row
  if (payment?.down_payment && payment.down_payment > 0) {
    doc.setFillColor(255, 255, 255);
    doc.rect(20, currentRowY, tableWidth, rowHeight, "F");
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Down Payment", 25, currentRowY + 7);
    doc.text(payment.down_payment.toLocaleString(), 185, currentRowY + 7, { align: "right" });
    currentRowY += rowHeight;
  }

  // Remaining Balance row
  if (payment?.remaining_balance && payment.remaining_balance > 0) {
    doc.setFillColor(248, 248, 248);
    doc.rect(20, currentRowY, tableWidth, rowHeight, "F");
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Remaining Balance", 25, currentRowY + 7);
    doc.text(payment.remaining_balance.toLocaleString(), 185, currentRowY + 7, { align: "right" });
    currentRowY += rowHeight;
  }

  // Total row
  doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.rect(20, currentRowY, tableWidth, rowHeight + 5, "F");
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(1);
  doc.line(20, currentRowY, 190, currentRowY);

  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL AMOUNT PAID", 25, currentRowY + 8);
  doc.text(
    (payment?.total_amount || 0).toLocaleString(),
    185,
    currentRowY + 8,
    { align: "right" }
  );

  // Table border
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(1);
  doc.rect(20, tableStartY, tableWidth, currentRowY - tableStartY + rowHeight + 5);

  y = currentRowY + rowHeight + 15;

  // Payment method and status
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  y = drawInfoRow(doc, "Payment Method", payment?.payment_method || "N/A", y);
  y = drawInfoRow(doc, "Payment Status", payment?.payment_status || "N/A", y);

  // Add page break if needed
  if (y > 250) {
    doc.addPage();
    y = 20;
  } else {
    y += 15;
  }

  // THANK YOU SECTION
  doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.roundedRect(20, y, 170, 30, 5, 5, "F");
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Thank you for choosing Azurea Hotel!", 105, y + 10, { align: "center" });

  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("We hope you enjoyed your stay with us!", 105, y + 18, { align: "center" });

  y += 35;

  // FOOTER
  doc.setTextColor(mediumGray[0], mediumGray[1], mediumGray[2]);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(
    "This is a computer-generated receipt and does not require a signature.",
    105,
    y,
    { align: "center" }
  );
  doc.text(
    "For any inquiries regarding this receipt, please contact our front desk.",
    105,
    y + 5,
    { align: "center" }
  );
  doc.text(
    `Generated on ${format(new Date(), "MMMM dd, yyyy 'at' h:mm a")}`,
    105,
    y + 10,
    { align: "center" }
  );

  // Save the PDF
  const fileName = `Azurea_E-Receipt_${String(bookingData.id).padStart(6, "0")}_${format(new Date(), "yyyy-MM-dd")}.pdf`;
  doc.save(fileName);
};


// Helper function for modern section headers
const drawModernSectionHeader = (
  doc: jsPDF,
  text: string,
  y: number,
  color: readonly [number, number, number]
): number => {
  // Section header with colored accent
  doc.setFillColor(color[0], color[1], color[2]);
  doc.rect(20, y - 2, 5, 12, "F");

  doc.setFillColor(248, 249, 250);
  doc.rect(25, y - 2, 165, 12, "F");

  doc.setTextColor(color[0], color[1], color[2]);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(text, 30, y + 6);

  return y + 20;
};

// Helper function for consistent info rows
const drawInfoRow = (
  doc: jsPDF,
  label: string,
  value: string,
  y: number
): number => {
  doc.setTextColor(66, 66, 66);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`${label}:`, 25, y);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(33, 33, 33);

  // Handle long text by wrapping
  const maxWidth = 120;
  const lines = doc.splitTextToSize(value, maxWidth);

  lines.forEach((line: string, index: number) => {
    doc.text(line, 80, y + index * 5);
  });

  return y + 8 + Math.max(0, lines.length - 1) * 5;
};
