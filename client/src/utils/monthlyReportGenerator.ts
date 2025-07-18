/* eslint-disable @typescript-eslint/no-explicit-any */
import { format } from "date-fns";
import jsPDF from "jspdf";
import "../styles/report-modal.css";

export interface MonthlyReportData {
  period: string;
  stats: {
    activeBookings: number;
    pendingBookings: number;
    totalBookings: number;
    revenue: number;
    formattedRevenue: string;
    roomRevenue: number;
    venueRevenue: number;
    commissionRevenue?: number;
    formattedCommissionRevenue?: string;
    totalRooms: number;
    availableRooms: number;
    occupiedRooms: number;
    maintenanceRooms: number;
    checkedInCount: number;
  };
  bookingStatusCounts: {
    reserved: number;
    checked_out: number;
    cancelled: number;
    no_show: number;
    rejected: number;
  };
  areaNames: string[];
  areaRevenueValues: number[];
  areaBookingValues: number[];
  roomNames: string[];
  roomRevenueValues: number[];
  roomBookingValues: number[];
  charts: {
    bookingStatusChart?: HTMLCanvasElement;
    roomRevenueChart?: HTMLCanvasElement;
    areaRevenueChart?: HTMLCanvasElement;
    dailyCommissionChart?: HTMLCanvasElement;
  };
  commissionStats?: any;
  dailyCommissionData?: any;
}

export const generateNativePDF = (data: MonthlyReportData): jsPDF => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const styles = {
    colors: {
      primary: "#2b6cb0",
      secondary: "#4a5568",
      tertiary: "#718096",
      light: "#e2e8f0",
      background: "#f7fafc",
      white: "#ffffff",
      divider: "#cbd5e0",
    },
    fonts: {
      header: 18,
      subheader: 14,
      sectionTitle: 12,
      normal: 10,
      small: 8,
    },
    spacing: {
      margin: 15,
      headerBottom: 10,
      sectionTop: 15,
      sectionBottom: 10,
      paragraphBottom: 5,
      tableRowHeight: 7,
      kpiBoxHeight: 25,
      chartHeight: 70,
    },
  };

  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const contentWidth = pageWidth - styles.spacing.margin * 2;

  let y = styles.spacing.margin;

  doc.setFont("courier", "bold");
  doc.setFontSize(styles.fonts.header);
  doc.setTextColor(styles.colors.primary);
  doc.text("Azurea Hotel Management System", styles.spacing.margin + 15, y + 7);

  y += 15;

  doc.setFontSize(styles.fonts.subheader);
  doc.setTextColor(styles.colors.secondary);
  doc.text(
    `Monthly Performance Report - ${data.period}`,
    styles.spacing.margin,
    y
  );

  doc.setFontSize(styles.fonts.small);
  doc.setTextColor(styles.colors.tertiary);
  const generationDate = `Generated: ${format(new Date(), "PPpp")}`;
  const dateWidth =
    (doc.getStringUnitWidth(generationDate) * styles.fonts.small) /
    doc.internal.scaleFactor;
  doc.text(generationDate, pageWidth - styles.spacing.margin - dateWidth, y);

  y += styles.spacing.headerBottom;

  drawDivider(doc, y, styles);
  y += styles.spacing.sectionTop;

  y = drawSectionHeader(doc, "Executive Summary", y, styles);

  const summaryText = `This monthly performance report provides an overview of hotel operations for ${
    data.period
  }. The hotel recorded ${
    data.stats.totalBookings
  } total bookings with ${data.stats.revenue.toLocaleString()} (in peso) in revenue.`;
  y = drawParagraph(
    doc,
    summaryText,
    styles.spacing.margin,
    y,
    contentWidth,
    styles
  );

  y += styles.spacing.sectionBottom;

  y = drawSectionHeader(doc, "Key Performance Indicators", y, styles);

  const kpis = [
    { label: "Active Bookings", value: data.stats.activeBookings.toString() },
    { label: "Pending Bookings", value: data.stats.pendingBookings.toString() },
    {
      label: "Total Monthly Bookings",
      value: data.stats.totalBookings.toLocaleString(),
    },
    {
      label: "Monthly Revenue (in peso)",
      value: `${data.stats.revenue.toLocaleString()}.00`,
    },
  ];

  const columns = 2;
  const kpiSpacing = 10;
  const kpiWidth = (contentWidth - kpiSpacing * (columns - 1)) / columns;
  const kpiHeight = styles.spacing.kpiBoxHeight;

  kpis.forEach((kpi, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    const boxX = styles.spacing.margin + col * (kpiWidth + kpiSpacing);
    const boxY = y + row * (kpiHeight + kpiSpacing);
    drawKpiBox(doc, kpi.label, kpi.value, boxX, boxY, kpiWidth, styles);
  });

  const rows = Math.ceil(kpis.length / columns);
  y += rows * (kpiHeight + kpiSpacing) + styles.spacing.sectionBottom;

  drawDivider(doc, y, styles);
  y += styles.spacing.sectionTop;

  y = drawSectionHeader(doc, "Booking Status Distribution", y, styles);

  const statusData = [
    {
      label: "Reserved",
      value: data.bookingStatusCounts.reserved,
      color: "#4299e1",
    },
    {
      label: "Checked Out",
      value: data.bookingStatusCounts.checked_out,
      color: "#48bb78",
    },
    {
      label: "Cancelled",
      value: data.bookingStatusCounts.cancelled,
      color: "#f56565",
    },
    {
      label: "No Show",
      value: data.bookingStatusCounts.no_show,
      color: "#ed8936",
    },
    {
      label: "Rejected",
      value: data.bookingStatusCounts.rejected,
      color: "#9f7aea",
    },
  ];

  const barHeight = 12;
  const barSpacing = 5;
  let startY = y + 5;

  statusData.forEach((status) => {
    doc.setFillColor(status.color);
    doc.rect(styles.spacing.margin, startY, 8, barHeight, "F");

    doc.setFont("courier", "normal");
    doc.setFontSize(styles.fonts.normal);
    doc.setTextColor(styles.colors.secondary);
    doc.text(
      `${status.label}: ${status.value}`,
      styles.spacing.margin + 12,
      startY + barHeight * 0.7
    );

    startY += barHeight + barSpacing;
  });

  y = startY + 5;

  if (y > pageHeight - 50) {
    doc.addPage();
    y = styles.spacing.margin;
  }

  drawDivider(doc, y, styles);
  y += styles.spacing.sectionTop;

  y += 10;

  y = drawTableHeader(doc, "Area Revenue", y, styles);

  const areaTableY = y + 10;
  const areaColumnWidths = [
    contentWidth * 0.5,
    contentWidth * 0.25,
    contentWidth * 0.25,
  ];

  drawTableRow(
    doc,
    ["Area", "Monthly Bookings", "Revenue (in peso)"],
    styles.spacing.margin,
    areaTableY,
    areaColumnWidths,
    styles,
    true
  );

  let rowY = areaTableY + styles.spacing.tableRowHeight;
  data.areaNames.forEach((area, index) => {
    if (rowY > pageHeight - 20) {
      doc.addPage();
      rowY = styles.spacing.margin;
      drawTableRow(
        doc,
        ["Area", "Monthly Bookings", "Revenue (in peso)"],
        styles.spacing.margin,
        rowY,
        areaColumnWidths,
        styles,
        true
      );
      rowY += styles.spacing.tableRowHeight;
    }

    drawTableRow(
      doc,
      [
        area,
        (data.areaBookingValues[index] || 0).toLocaleString(),
        (data.areaRevenueValues[index] || 0).toLocaleString(),
      ],
      styles.spacing.margin,
      rowY,
      areaColumnWidths,
      styles,
      false,
      index % 2 === 0
    );

    rowY += styles.spacing.tableRowHeight;
  });

  y = rowY + 15;

  if (y > pageHeight - 100) {
    doc.addPage();
    y = styles.spacing.margin;
  }

  y = drawTableHeader(doc, "Room Revenue", y, styles);

  const roomTableY = y + 10;
  const roomColumnWidths = [
    contentWidth * 0.5,
    contentWidth * 0.25,
    contentWidth * 0.25,
  ];

  drawTableRow(
    doc,
    ["Room", "Monthly Bookings", "Revenue (in peso)"],
    styles.spacing.margin,
    roomTableY,
    roomColumnWidths,
    styles,
    true
  );

  rowY = roomTableY + styles.spacing.tableRowHeight;
  data.roomNames.forEach((room, index) => {
    if (rowY > pageHeight - 20) {
      doc.addPage();
      rowY = styles.spacing.margin;
      drawTableRow(
        doc,
        ["Room", "Monthly Bookings", "Revenue (in peso)"],
        styles.spacing.margin,
        rowY,
        roomColumnWidths,
        styles,
        true
      );
      rowY += styles.spacing.tableRowHeight;
    }

    drawTableRow(
      doc,
      [
        room,
        (data.roomBookingValues[index] || 0).toLocaleString(),
        (data.roomRevenueValues[index] || 0).toLocaleString(),
      ],
      styles.spacing.margin,
      rowY,
      roomColumnWidths,
      styles,
      false,
      index % 2 === 0
    );

    rowY += styles.spacing.tableRowHeight;
  });

  y = rowY + 15;

  if (y > pageHeight - 50) {
    doc.addPage();
    y = styles.spacing.margin;
  }

  // Commission Section
  if (data.commissionStats && data.commissionStats.total_commission > 0) {
    y = drawSectionHeader(doc, "Food Orders Commission", y, styles);

    doc.setFontSize(styles.fonts.normal);
    doc.setTextColor(styles.colors.secondary);
    const commissionText = `Food orders commission represents additional revenue stream from mobile app orders. The hotel earns a 20% commission on completed and reviewed food orders placed through the mobile application.`;

    const commissionLines = doc.splitTextToSize(
      commissionText,
      contentWidth - 20
    );
    commissionLines.forEach((line: string) => {
      doc.text(line, styles.spacing.margin, y);
      y += 5;
    });

    y += 5;

    const kpiY = y;
    const kpiWidth = (contentWidth - 10) / 2;

    drawKpiBox(
      doc,
      "Total Orders",
      (data.commissionStats.total_orders || 0).toString(),
      styles.spacing.margin,
      kpiY,
      kpiWidth,
      styles
    );

    drawKpiBox(
      doc,
      "Completed Orders",
      (data.commissionStats.completed_orders || 0).toString(),
      styles.spacing.margin + kpiWidth + 10,
      kpiY,
      kpiWidth,
      styles
    );

    // Second row
    const secondRowY = kpiY + styles.spacing.kpiBoxHeight + 10;

    drawKpiBox(
      doc,
      "Commission Earned (in peso)",
      `${(data.commissionStats.total_commission || 0).toLocaleString()}.00`,
      styles.spacing.margin,
      secondRowY,
      kpiWidth,
      styles
    );

    drawKpiBox(
      doc,
      "Avg Per Order (in peso)",
      `${(
        data.commissionStats.average_commission_per_order || 0
      ).toLocaleString()}.00`,
      styles.spacing.margin + kpiWidth + 10,
      secondRowY,
      kpiWidth,
      styles
    );

    y = secondRowY + styles.spacing.kpiBoxHeight + 15;

    // Daily Commission Chart
    if (data.charts.dailyCommissionChart) {
      if (y + styles.spacing.chartHeight > pageHeight - 20) {
        doc.addPage();
        y = styles.spacing.margin;
      }

      doc.setFontSize(styles.fonts.normal);
      doc.setTextColor(styles.colors.secondary);
      doc.text("Daily Commission Trend", styles.spacing.margin, y);
      y += 10;

      const chartCanvas = data.charts.dailyCommissionChart;
      const imgData = chartCanvas.toDataURL("image/png");
      doc.addImage(
        imgData,
        "PNG",
        styles.spacing.margin,
        y,
        contentWidth,
        styles.spacing.chartHeight
      );

      y += styles.spacing.chartHeight + 10;
    }

    // Commission insights
    const insights = `Commission revenue represents 20% of total monthly revenue. This additional revenue stream helps diversify income sources beyond traditional room and venue bookings.`;

    const insightLines = doc.splitTextToSize(insights, contentWidth - 20);
    insightLines.forEach((line: string) => {
      doc.text(line, styles.spacing.margin, y);
      y += 5;
    });

    y += 15;

    if (y > pageHeight - 50) {
      doc.addPage();
      y = styles.spacing.margin;
    }
  }

  drawDivider(doc, y, styles);
  y += styles.spacing.sectionTop;

  addFooter(doc, `Azurea Hotel - ${data.period} Report`, styles);

  return doc;
};

const drawDivider = (doc: jsPDF, y: number, styles: any): void => {
  doc.setDrawColor(styles.colors.divider);
  doc.setLineWidth(0.5);
  doc.line(
    styles.spacing.margin,
    y,
    doc.internal.pageSize.width - styles.spacing.margin,
    y
  );
};

const drawSectionHeader = (
  doc: jsPDF,
  title: string,
  y: number,
  styles: any
): number => {
  doc.setFont("courier", "normal");
  doc.setFontSize(styles.fonts.subheader);
  doc.setTextColor(styles.colors.primary);
  doc.text(title, styles.spacing.margin, y);

  doc.setDrawColor(styles.colors.primary);
  doc.setLineWidth(0.3);
  doc.line(
    styles.spacing.margin,
    y + 1,
    styles.spacing.margin +
      (doc.getStringUnitWidth(title) * styles.fonts.subheader) /
        doc.internal.scaleFactor,
    y + 1
  );

  return y + 8;
};

const drawTableHeader = (
  doc: jsPDF,
  title: string,
  y: number,
  styles: any
): number => {
  doc.setFont("courier", "normal");
  doc.setFontSize(styles.fonts.sectionTitle);
  doc.setTextColor(styles.colors.secondary);
  doc.text(title, styles.spacing.margin, y);

  return y;
};

const drawParagraph = (
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  width: number,
  styles: any
): number => {
  doc.setFont("courier", "normal");
  doc.setFontSize(styles.fonts.normal);
  doc.setTextColor(styles.colors.secondary);

  const lines = doc.splitTextToSize(text, width);
  doc.text(lines, x, y);

  return (
    y +
    lines.length * styles.fonts.normal * 0.3527 +
    styles.spacing.paragraphBottom
  );
};

const drawKpiBox = (
  doc: jsPDF,
  title: string,
  value: string,
  x: number,
  y: number,
  width: number,
  styles: any
): void => {
  doc.setFillColor(styles.colors.background);
  doc.roundedRect(x, y, width, styles.spacing.kpiBoxHeight, 2, 2, "F");
  doc.setDrawColor(styles.colors.light);
  doc.roundedRect(x, y, width, styles.spacing.kpiBoxHeight, 2, 2, "S");

  doc.setFont("courier", "bold");
  doc.setFontSize(styles.fonts.normal);
  doc.setTextColor(styles.colors.tertiary);
  doc.text(title, x + 3, y + 6);

  doc.setFont("courier", "bold");

  const valueFontSize = styles.fonts.header;
  doc.setFontSize(valueFontSize);
  doc.setTextColor(styles.colors.primary);
  const textWidth =
    (doc.getStringUnitWidth(value) * valueFontSize) / doc.internal.scaleFactor;
  const centerX = x + width / 2;

  const textHeight = valueFontSize * 0.3527;
  const centerY = y + styles.spacing.kpiBoxHeight / 2 + textHeight / 2 - 1;
  doc.text(value, centerX - textWidth / 2, centerY);
};

const drawTableRow = (
  doc: jsPDF,
  columns: string[],
  x: number,
  y: number,
  columnWidths: number[],
  styles: any,
  isHeader: boolean = false,
  alternateRow: boolean = false
): void => {
  if (isHeader) {
    doc.setFillColor(styles.colors.light);
    doc.rect(
      x,
      y - 5,
      columnWidths.reduce((a, b) => a + b, 0),
      styles.spacing.tableRowHeight,
      "F"
    );
  } else if (alternateRow) {
    doc.setFillColor(styles.colors.background);
    doc.rect(
      x,
      y - 5,
      columnWidths.reduce((a, b) => a + b, 0),
      styles.spacing.tableRowHeight,
      "F"
    );
  }

  if (isHeader) {
    doc.setFont("courier", "normal");
  } else {
    doc.setFont("courier", "normal");
  }

  doc.setFontSize(styles.fonts.normal);
  doc.setTextColor(styles.colors.secondary);

  let currentX = x;
  columns.forEach((text, index) => {
    const cellX =
      index >= 1
        ? currentX +
          columnWidths[index] -
          (doc.getStringUnitWidth(text) * styles.fonts.normal) /
            doc.internal.scaleFactor -
          3
        : currentX + 3;
    doc.text(text, cellX, y);
    currentX += columnWidths[index];
  });
};

const addFooter = (doc: jsPDF, text: string, styles: any): void => {
  const pageCount = doc.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;

    doc.setDrawColor(styles.colors.light);
    doc.setLineWidth(0.5);
    doc.line(
      styles.spacing.margin,
      pageHeight - 10,
      pageWidth - styles.spacing.margin,
      pageHeight - 10
    );

    doc.setFont("courier", "normal");
    doc.setFontSize(styles.fonts.small);
    doc.setTextColor(styles.colors.tertiary);
    doc.text(text, styles.spacing.margin, pageHeight - 5);

    const pageText = `Page ${i} of ${pageCount}`;
    const pageTextWidth =
      (doc.getStringUnitWidth(pageText) * styles.fonts.small) /
      doc.internal.scaleFactor;
    doc.text(
      pageText,
      pageWidth - styles.spacing.margin - pageTextWidth,
      pageHeight - 5
    );
  }
};

export const generateReportPreviewHTML = (data: MonthlyReportData): string => {
  const occupancyRate =
    ((data.stats.occupiedRooms / data.stats.totalRooms) * 100).toFixed(1) + "%";
  let bookingStatusChartHTML =
    "<div>Booking status chart data not available</p></div>";

  try {
    if (data.charts.bookingStatusChart) {
      try {
        bookingStatusChartHTML = `<img src="${data.charts.bookingStatusChart.toDataURL()}" style="max-width: 100%; max-height: 300px; margin: 0 auto;" />`;
      } catch (err) {
        console.error(`Failed to convert booking status chart: ${err}`);
        throw err;
      }
    }
  } catch (error) {
    console.error(`Error processing charts: ${error}`);
    throw error;
  }

  const html = `
    <div class="report-root">
      <header class="report-header">
        <h1 class="report-title">Azurea Hotel Management System</h1>
        <h2 class="report-period">Monthly Performance Report - ${
          data.period
        }</h2>
        <h3 class="report-period">Generated on: ${format(
          new Date(),
          "PPpp"
        )}</h3>
      </header>
      
      <section class="report-section">
        <h1 class="report-section-title">Executive Summary</h1>
        <p class="report-description">
          This monthly performance report provides a comprehensive overview of the hotel's operational and financial metrics for ${
            data.period
          }. 
          The report highlights key performance indicators including total bookings (${
            data.stats.totalBookings
          }), 
          current occupancy rate (${occupancyRate}), and total revenue (${
    data.stats.formattedRevenue
  }). 
        </p>
      </section>
      
      <div class="report-divider"></div>
      
      <section class="report-section">
        <h1 class="report-section-title">Key Performance Indicators</h1>
        <p class="report-description">
          These key metrics provide a snapshot of the hotel's current operational status and financial performance for the current month.
        </p>
        
        <div class="report-grid">
          <div class="report-kpi">
            <h1 class="report-kpi-title">Total Bookings</h1>
            <h4 class="report-kpi-value">${data.stats.totalBookings}</h4>
          </div>
          <div class="report-kpi">
            <h1 class="report-kpi-title">Total Revenue</h1>
            <h4 class="report-kpi-value">${data.stats.formattedRevenue}</h4>
          </div>
        </div>
        
        <div class="report-grid">
          <div class="report-kpi">
            <h1 class="report-kpi-title">Available Rooms</h1>
            <h4 class="report-kpi-value">${data.stats.availableRooms}</h4>
          </div>
          <div class="report-kpi">
            <h1 class="report-kpi-title">Total Rooms</h1>
            <h4 class="report-kpi-value">${data.stats.totalRooms}</h4>
          </div>
        </div>
      </section>
      
      <div class="report-divider"></div>
      
      <section class="report-section">
        <h3 class="report-section-title">Booking Status Distribution</h3>
        <div id="booking-status-chart" class="print-chart-container">
          ${bookingStatusChartHTML}
        </div>
      </section>
      
      <div class="report-divider"></div>
      
      <section class="report-section">        
        <div class="report-grid">
          <div class="report-table-container">
            <h4 class="report-section-title">Area Revenue</h4>
            <table class="report-table">
              <thead>
                <tr>
                  <th>Area</th>
                  <th>Bookings</th>
                  <th>Revenue (peso)</th>
                </tr>
              </thead>
              <tbody>
                ${data.areaNames
                  .map(
                    (area, index) => `
                  <tr>
                    <td>${area}</td>
                    <td>${data.areaBookingValues[index] || 0}</td>
                    <td>${(
                      data.areaRevenueValues[index] || 0
                    ).toLocaleString()} (peso)</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
          
          <div class="report-table-container">
            <h4 class="report-section-title">Room Revenue</h4>
            <table class="report-table">
              <thead>
                <tr>
                  <th>Room</th>
                  <th>Bookings</th>
                  <th>Revenue (peso)</th>
                </tr>
              </thead>
              <tbody>
                ${data.roomNames
                  .map(
                    (room, index) => `
                  <tr>
                    <td>${room}</td>
                    <td>${data.roomBookingValues[index] || 0}</td>
                    <td>${(
                      data.roomRevenueValues[index] || 0
                    ).toLocaleString()} (peso)</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      
      <div class="report-divider"></div>
      
      <section class="report-section">
        <h1 class="report-description">
          This report summarizes the hotel's performance for ${
            data.period
          }. The total revenue for this period was ${data.stats.revenue.toLocaleString()} (in peso),
          with room bookings contributing ${(
            data.stats.roomRevenue || 0
          ).toLocaleString()} (in peso) and venue bookings contributing ${(
    data.stats.venueRevenue || 0
  ).toLocaleString()} (in peso).
          There were a total of ${data.stats.totalBookings} bookings, with ${
    data.stats.activeBookings
  } currently active and ${data.stats.pendingBookings} pending.
        </p>
      </section>
    </div>
  `;

  return html;
};

export const prepareMonthlyReportData = (
  dashboardData: any
): MonthlyReportData => {
  return {
    period: dashboardData.formattedMonthYear,
    stats: {
      activeBookings: dashboardData.stats.activeBookings,
      pendingBookings: dashboardData.stats.pendingBookings,
      totalBookings: dashboardData.stats.totalBookings,
      revenue: dashboardData.stats.revenue,
      formattedRevenue: dashboardData.stats.formattedRevenue,
      roomRevenue: dashboardData.stats.roomRevenue,
      venueRevenue: dashboardData.stats.venueRevenue,
      commissionRevenue: dashboardData.stats.commissionRevenue,
      formattedCommissionRevenue:
        dashboardData.stats.formattedCommissionRevenue,
      totalRooms: dashboardData.stats.totalRooms,
      availableRooms: dashboardData.stats.availableRooms,
      occupiedRooms: dashboardData.stats.occupiedRooms,
      maintenanceRooms: dashboardData.stats.maintenanceRooms,
      checkedInCount: dashboardData.stats.checkedInCount,
    },
    bookingStatusCounts: dashboardData.bookingStatusCounts,
    areaNames: dashboardData.areaNames,
    areaRevenueValues: dashboardData.areaRevenueValues,
    areaBookingValues: dashboardData.areaBookingValues,
    roomNames: dashboardData.roomNames,
    roomRevenueValues: dashboardData.roomRevenueValues,
    roomBookingValues: dashboardData.roomBookingValues,
    commissionStats: dashboardData.commissionStats,
    dailyCommissionData: dashboardData.dailyCommissionData,
    charts: {
      bookingStatusChart: null,
      roomRevenueChart: null,
      areaRevenueChart: null,
      dailyCommissionChart: null,
    },
  };
};
