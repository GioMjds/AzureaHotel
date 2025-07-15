/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import { ArcElement, BarElement, CategoryScale, Chart, Legend, LinearScale, Tooltip } from "chart.js";
import { format, getDay, isAfter, isSameDay, parse, startOfWeek } from "date-fns";
import { enUS } from "date-fns/locale";
import { motion } from "framer-motion";
import { useRef, useState } from "react";
import { Calendar, Views, dateFnsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Bar, Doughnut, Pie } from "react-chartjs-2";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import StatCard from "../../components/admin/StatCard";
import DashboardSkeleton from "../../motions/skeletons/AdminDashboardSkeleton";
import {
  fetchAreaBookings,
  fetchAreaRevenue,
  fetchBookingStatusCounts,
  fetchCommissionDailyData,
  fetchCommissionStats,
  fetchDailyBookings,
  fetchDailyCancellations,
  fetchDailyNoShowsRejected,
  fetchDailyRevenue,
  fetchMonthlyRevenue,
  fetchRoomBookings,
  fetchRoomRevenue,
  fetchStats,
  fetchTopCommissionRooms
} from "../../services/Admin";
import "../../styles/report-modal.css";
import { formatCurrency, formatMonthYear, getDaysInMonth } from "../../utils/formatters";
import { generateNativePDF, prepareMonthlyReportData } from "../../utils/monthlyReportGenerator";
import Error from "../_ErrorBoundary";

Chart.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const AdminDashboard = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>("month");
  const [showCommissionSection, setShowCommissionSection] = useState(false);

  const bookingStatusChartRef = useRef<HTMLDivElement>(null);
  const areaRevenueChartRef = useRef<HTMLDivElement>(null);
  const roomRevenueChartRef = useRef<HTMLDivElement>(null);
  const commissionChartRef = useRef<HTMLDivElement>(null);

  const CustomToolbar = (): null => null;

  const today = new Date();
  const selectedMonth = selectedDate.getMonth() + 1;
  const selectedYear = selectedDate.getFullYear();
  const formattedMonthYear = formatMonthYear(selectedMonth - 1, selectedYear);

  const { data, isLoading, error } = useQuery({
    queryKey: ["stats", selectedMonth, selectedYear],
    queryFn: () => fetchStats(selectedMonth, selectedYear),
  });

  const { data: dailyRevenueData } = useQuery({
    queryKey: ['dailyRevenue', selectedMonth, selectedYear],
    queryFn: () => fetchDailyRevenue(selectedMonth, selectedYear),
    select: (data) => data.data || [],
  });

  const { data: bookingStatusData } = useQuery({
    queryKey: ["bookingStatusCounts", selectedMonth, selectedYear],
    queryFn: () => fetchBookingStatusCounts(selectedMonth, selectedYear),
  });

  const { data: dailyBookingsResponse, isLoading: bookingsDataLoading } = useQuery({
    queryKey: ["dailyBookings", selectedMonth, selectedYear],
    queryFn: () => fetchDailyBookings(selectedMonth, selectedYear),
  });

  const { data: dailyCancellationsResponse, isLoading: cancellationsDataLoading } = useQuery({
    queryKey: ["dailyCancellations", selectedMonth, selectedYear],
    queryFn: () => fetchDailyCancellations(selectedMonth, selectedYear),
  });

  const { data: dailyNoShowsRejectedResponse, isLoading: noShowsRejectedDataLoading } = useQuery({
    queryKey: ["dailyNoShowsRejected", selectedMonth, selectedYear],
    queryFn: () => fetchDailyNoShowsRejected(selectedMonth, selectedYear),
  });

  const { data: areaRevenueResponse } = useQuery({
    queryKey: ["areaRevenue", selectedMonth, selectedYear],
    queryFn: () => fetchAreaRevenue(selectedMonth, selectedYear),
    select: (data) => ({
      area_names: data.area_names || [],
      revenue_data: data.revenue_data || [],
    })
  });

  const { data: roomRevenueResponse } = useQuery({
    queryKey: ["roomRevenue", selectedMonth, selectedYear],
    queryFn: () => fetchRoomRevenue(selectedMonth, selectedYear),
  });

  const { data: areaBookingsResponse } = useQuery({
    queryKey: ["areaBookings", selectedMonth, selectedYear],
    queryFn: () => fetchAreaBookings(selectedMonth, selectedYear),
  });

  const { data: roomBookingsResponse } = useQuery({
    queryKey: ["roomBookings", selectedMonth, selectedYear],
    queryFn: () => fetchRoomBookings(selectedMonth, selectedYear),
  });

  const { data: monthlyRevenueData } = useQuery({
    queryKey: ["monthlyRevenue", selectedMonth, selectedYear],
    queryFn: () => fetchMonthlyRevenue(selectedMonth, selectedYear),
    staleTime: 10 * 60 * 1000,
  });

  // Commission tracking queries
  const { data: commissionStats } = useQuery({
    queryKey: ['commissionStats', 'month'],
    queryFn: () => fetchCommissionStats('month'),
  });

  const { data: commissionDailyData } = useQuery({
    queryKey: ['commissionDailyData', selectedMonth, selectedYear],
    queryFn: () => fetchCommissionDailyData(selectedMonth, selectedYear),
  });

  const { data: topCommissionRooms } = useQuery({
    queryKey: ['topCommissionRooms', 'month'],
    queryFn: () => fetchTopCommissionRooms(5, 'month'),
  });

  const calendarEventsQuery = useQuery({
    queryKey: ['calendarEvents', selectedMonth, selectedYear, dailyRevenueData, dailyBookingsResponse, dailyCancellationsResponse, dailyNoShowsRejectedResponse],
    queryFn: async () => {
      const daysInMonthArray = getDaysInMonth(selectedMonth, selectedYear, true);
      const events: any[] = [];

      const dailyRevenueValues = dailyRevenueData || [];
      const dailyBookingsData = dailyBookingsResponse?.data || [];
      const dailyCancellations = dailyCancellationsResponse?.data || [];
      const dailyNoShows = dailyNoShowsRejectedResponse?.no_shows || [];
      const dailyRejected = dailyNoShowsRejectedResponse?.rejected || [];

      daysInMonthArray.forEach((day, index) => {
        const dayNumber = parseInt(day.toString(), 10);
        if (isNaN(dayNumber)) return;

        const currentDate = new Date(selectedYear, selectedMonth - 1, dayNumber);

        events.push({
          id: `revenue-${index}`,
          title: `Revenue: ${formatCurrency(dailyRevenueValues[index] || 0)}`,
          start: currentDate,
          end: currentDate,
          allDay: true,
          resource: {
            type: 'revenue',
            value: dailyRevenueValues[index] || 0,
            bookings: dailyBookingsData[index] || 0,
            cancellations: dailyCancellations[index] || 0,
            noShows: dailyNoShows[index] || 0,
            rejected: dailyRejected[index] || 0
          }
        })
      });

      return events;
    },
    enabled: !!(
      !isLoading &&
      !bookingsDataLoading &&
      !cancellationsDataLoading &&
      !noShowsRejectedDataLoading &&
      dailyRevenueData
    )
  });

  const stats = {
    activeBookings: data?.active_bookings || 0,
    pendingBookings: data?.pending_bookings || 0,
    unpaidBookings: data?.unpaid_bookings || 0,
    checkedInCount: data?.checked_in_count || 0,
    availableRooms: data?.available_rooms || 0,
    totalRooms: data?.total_rooms || 0,
    occupiedRooms: data?.occupied_rooms || 0,
    maintenanceRooms: data?.maintenance_rooms || 0,
    upcomingReservations: data?.upcoming_reservations || 0,
    totalBookings: data?.total_bookings || 0,
    revenue: monthlyRevenueData?.revenue || data?.revenue || 0,
    roomRevenue: data?.room_revenue || 0,
    venueRevenue: data?.venue_revenue || 0,
    formattedRevenue: data?.formatted_revenue,
    formattedRoomRevenue: data?.formatted_room_revenue,
    formattedVenueRevenue: data?.formatted_venue_revenue,
    revenueMonth: selectedMonth,
    revenueYear: selectedYear,
  };

  const bookingStatusCounts = {
    reserved: bookingStatusData?.reserved || 0,
    checked_out: bookingStatusData?.checked_out || 0,
    cancelled: bookingStatusData?.cancelled || 0,
    no_show: bookingStatusData?.no_show || 0,
    rejected: bookingStatusData?.rejected || 0,
  };

  const roomNames = roomRevenueResponse?.room_names || [];
  const roomRevenueValues = roomRevenueResponse?.revenue_data || [];
  const roomBookingValues = roomBookingsResponse?.booking_counts || [];

  const areaNames = areaRevenueResponse?.area_names || [];
  const areaRevenueValues = areaRevenueResponse?.revenue_data || [];
  const areaBookingValues = areaBookingsResponse?.booking_counts || [];

  const handleViewChange = (newView: string) => {
    setView(newView as 'month' | 'week' | 'day');
  };

  const handleNavigate = (date: Date) => {
    if (isAfter(date, today) && !isSameDay(date, today)) {
      return;
    }
    setSelectedDate(date);
  };

  const handleDateChange = (date: Date) => {
    if (isAfter(date, today) && !isSameDay(date, today)) {
      return;
    }
    setSelectedDate(date);
  };

  const handleGenerateReport = () => {
    const reportData = prepareMonthlyReportData({
      formattedMonthYear,
      stats,
      bookingStatusCounts,
      areaNames,
      areaRevenueValues,
      areaBookingValues,
      roomNames,
      roomRevenueValues,
      roomBookingValues,
    });

    const getCanvasFromRef = (ref: React.RefObject<HTMLDivElement>) => {
      if (!ref.current) return null;
      return ref.current.querySelector('canvas');
    };

    // Capture chart canvases
    const bookingStatusCanvas = getCanvasFromRef(bookingStatusChartRef);
    const areaRevenueCanvas = getCanvasFromRef(areaRevenueChartRef);
    const roomRevenueCanvas = getCanvasFromRef(roomRevenueChartRef);

    // Attach canvas elements to report data (if needed for HTML preview)
    if (bookingStatusCanvas) reportData.charts.bookingStatusChart = bookingStatusCanvas;
    if (areaRevenueCanvas) reportData.charts.areaRevenueChart = areaRevenueCanvas;
    if (roomRevenueCanvas) reportData.charts.roomRevenueChart = roomRevenueCanvas;

    // Generate PDF
    const pdfDoc = generateNativePDF(reportData);

    // Open PDF in new tab for printing
    const pdfBlob = pdfDoc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
  };


  const EventComponent = ({ event }: { event: any }) => {
    const resource = event.resource;

    return (
      <div className="flex flex-col p-1 text-xs overflow-hidden h-full">
        <div className="font-semibold">{event.title}</div>
        {resource.type === 'revenue' && (
          <>
            <div>Bookings: {resource.bookings}</div>
            <div>Cancellations: {resource.cancellations}</div>
            {(resource.noShows > 0 || resource.rejected > 0) && (
              <div>No Shows: {resource.noShows} | Rejected: {resource.rejected}</div>
            )}
          </>
        )}
      </div>
    );
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  };

  if (isLoading) return <DashboardSkeleton />;
  if (error || calendarEventsQuery.error) return <Error />;

  return (
    <div className="p-3 container mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-2">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>

        <div className="flex items-center space-x-4">
          {/* Date Picker for selecting specific dates */}
          <div className="flex items-center bg-white rounded-lg shadow-sm">
            <DatePicker
              selected={selectedDate}
              onChange={handleDateChange}
              maxDate={today}
              dateFormat="MMMM yyyy"
              showMonthYearPicker
              className="px-4 py-2 rounded-lg border-0 focus:outline-none text-center"
            />
          </div>

          <button
            onClick={handleGenerateReport}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center cursor-pointer transition-colors duration-300"
            title="Generate a monthly report using HTML/CSS"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Generate Monthly Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatCard
          title="Active Bookings"
          value={stats.activeBookings}
          borderColor="border-green-500"
        />
        <StatCard
          title="Pending Bookings"
          value={stats.pendingBookings}
          borderColor="border-yellow-500"
        />
        <StatCard
          title="Total Monthly Bookings"
          value={stats.totalBookings}
          borderColor="border-blue-500"
        />
        <StatCard
          title="Monthly Revenue"
          value={stats.formattedRevenue}
          borderColor="border-orange-500"
          tooltip={`Revenue from checked-in and checked-out bookings for ${formattedMonthYear}`}
        />
      </div>

      {/* Commission Tracking Section */}
      <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-800">Commission</h2>
          <button
            onClick={() => setShowCommissionSection(!showCommissionSection)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showCommissionSection ? 'Hide Details' : 'Show Details'}
          </button>
        </div>

        {/* Commission Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-r from-green-400 to-green-600 text-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium opacity-90">Total Orders</h3>
            <p className="text-2xl font-bold">{commissionStats?.total_orders || 0}</p>
          </div>
          <div className="bg-gradient-to-r from-blue-400 to-blue-600 text-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium opacity-90">Commission Earned</h3>
            <p className="text-2xl font-bold">{formatCurrency(commissionStats?.total_commission || 0)}</p>
          </div>
          <div className="bg-gradient-to-r from-purple-400 to-purple-600 text-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium opacity-90">Total Sales</h3>
            <p className="text-2xl font-bold">{formatCurrency(commissionStats?.total_sales || 0)}</p>
          </div>
          <div className="bg-gradient-to-r from-orange-400 to-orange-600 text-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium opacity-90">Avg Commission</h3>
            <p className="text-2xl font-bold">{formatCurrency(commissionStats?.average_commission_per_order || 0)}</p>
          </div>
        </div>

        {showCommissionSection && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* Commission Daily Chart */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 text-gray-700">Commission Earned per Day</h3>
              <div className="h-64" ref={commissionChartRef}>
                {commissionDailyData?.days?.length > 0 ? (
                  <Bar
                    data={{
                      labels: commissionDailyData.days.map((day: number) => `Day ${day}`),
                      datasets: [
                        {
                          label: 'Commission Earned',
                          data: commissionDailyData.commission_data || [],
                          backgroundColor: 'rgba(54, 162, 235, 0.6)',
                          borderColor: 'rgba(54, 162, 235, 1)',
                          borderWidth: 1,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top',
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: function (value) {
                              return formatCurrency(Number(value));
                            }
                          }
                        }
                      }
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No commission data available
                  </div>
                )}
              </div>
            </div>

            {/* Top Commission Locations */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 text-gray-700">Top Commission Locations</h3>
              <div className="h-64">
                {topCommissionRooms?.top_rooms?.length > 0 ? (
                  <Pie
                    data={{
                      labels: topCommissionRooms.top_rooms.slice(0, 5).map((item: any) =>
                        `${item.location_type}: ${item.room_number}`
                      ),
                      datasets: [
                        {
                          data: topCommissionRooms.top_rooms.slice(0, 5).map((item: any) => item.total_commission),
                          backgroundColor: [
                            'rgba(255, 99, 132, 0.8)',
                            'rgba(54, 162, 235, 0.8)',
                            'rgba(255, 205, 86, 0.8)',
                            'rgba(75, 192, 192, 0.8)',
                            'rgba(153, 102, 255, 0.8)',
                          ],
                          borderColor: [
                            'rgba(255, 99, 132, 1)',
                            'rgba(54, 162, 235, 1)',
                            'rgba(255, 205, 86, 1)',
                            'rgba(75, 192, 192, 1)',
                            'rgba(153, 102, 255, 1)',
                          ],
                          borderWidth: 2,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'right',
                          labels: {
                            boxWidth: 12,
                            padding: 8,
                            font: {
                              size: 10,
                            },
                          },
                        },
                        tooltip: {
                          callbacks: {
                            label: (context) => {
                              const value = context.raw || 0;
                              return `${context.label}: ${formatCurrency(Number(value))}`;
                            },
                          },
                        },
                      },
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No commission data available
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <div className="bg-white shadow-lg rounded-lg p-4 mb-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">
          {view === 'month' ? 'Monthly' : view === 'week' ? 'Weekly' : 'Daily'} Calendar - {formattedMonthYear}
        </h2>

        <div className="h-[700px]">
          <Calendar
            localizer={localizer}
            events={calendarEventsQuery.data || []}
            startAccessor="start"
            endAccessor="end"
            view={view}
            onView={handleViewChange}
            onNavigate={handleNavigate}
            date={selectedDate}
            components={{
              event: EventComponent,
              toolbar: CustomToolbar,
            }}
            views={[Views.MONTH]}
            popup
            eventPropGetter={(event) => {
              const { type } = event.resource || {};
              let backgroundColor = '#4CAF50';

              if (type === 'revenue' && event.resource.value === 0) {
                backgroundColor = '#E0E0E0';
              }

              return {
                style: {
                  backgroundColor,
                  borderRadius: '4px',
                  color: '#fff',
                  border: 'none',
                }
              };
            }}
            max={new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Revenue by Room Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white shadow-lg rounded-lg p-4 hover:shadow-xl transition-shadow"
          ref={areaRevenueChartRef}
        >
          <h3 className="text-xl font-semibold mb-4 text-center">
            Area Revenue - {formattedMonthYear}
          </h3>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-3"
          >
            {areaNames.map((room: string, index: number) => {
              const revenue = areaRevenueValues[index] || 0;

              return (
                <motion.div
                  key={`room-${index}`}
                  variants={itemVariants}
                  className="flex items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-lg text-gray-700">{room}</p>
                    <p className="text-sm text-gray-500">
                      {areaBookingValues[index] || 0} bookings
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-lg text-blue-600">
                      {formatCurrency(revenue)}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>

        {/* Revenue by Room Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white shadow-lg rounded-lg p-4 hover:shadow-xl transition-shadow"
          ref={roomRevenueChartRef}
        >
          <h3 className="text-xl font-semibold mb-4 text-center">
            Room Revenue - {formattedMonthYear}
          </h3>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-3"
          >
            {roomNames.map((room: string, index: number) => {
              const revenue = roomRevenueValues[index] || 0;

              return (
                <motion.div
                  key={`room-${index}`}
                  variants={itemVariants}
                  className="flex items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-lg text-gray-700">{room}</p>
                    <p className="text-sm text-gray-500">
                      {roomBookingValues[index] || 0} bookings
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-lg text-blue-600">
                      {formatCurrency(revenue)}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      </div>

      {/* Booking Status Distribution Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-white shadow-lg rounded-lg p-4 hover:shadow-xl transition-shadow"
        ref={bookingStatusChartRef}
      >
        <h3 className="text-xl font-semibold mb-4 text-center">
          Booking Status Distribution - {formattedMonthYear}
        </h3>
        <div className="h-80 relative">
          <Doughnut
            data={{
              labels: [
                'Reserved',
                'Checked Out',
                'Cancelled',
                'No Show',
                'Rejected',
              ],
              datasets: [
                {
                  data: [
                    bookingStatusCounts.reserved,
                    bookingStatusCounts.checked_out,
                    bookingStatusCounts.cancelled,
                    bookingStatusCounts.no_show,
                    bookingStatusCounts.rejected,
                  ],
                  backgroundColor: [
                    '#FFC107',
                    '#2196F3',
                    '#4CAF50',
                    '#9E9E9E',
                    '#F44336',
                    '#9C27B0',
                    '#FF5722',
                  ],
                  borderWidth: 2,
                },
              ],
            }}
            options={{
              plugins: {
                legend: {
                  position: 'right',
                  labels: {
                    boxWidth: 15,
                    padding: 15,
                  },
                },
                tooltip: {
                  callbacks: {
                    label: (context) => {
                      const label = context.label || '';
                      const value = context.raw || 0;
                      const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                      const percentage = ((Number(value) * 100) / Number(total)).toFixed(1);
                      return `${label}: ${value} (${percentage}%)`;
                    },
                  },
                },
              },
              maintainAspectRatio: false,
            }}
          />
        </div>
      </motion.div>
    </div>
  );
};

export default AdminDashboard;
