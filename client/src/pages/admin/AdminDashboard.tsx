import { useQuery } from "@tanstack/react-query";
import { ArcElement, BarElement, CategoryScale, Chart, Legend, LinearScale, LineElement, PointElement, Tooltip } from "chart.js";
import { format, getDay, isAfter, isSameDay, parse, startOfWeek } from "date-fns";
import { enUS } from "date-fns/locale";
import { motion } from "framer-motion";
import { useMemo, useRef, useState } from "react";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Doughnut, Line } from "react-chartjs-2";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import StatCard from "../../components/admin/StatCard";
import DashboardSkeleton, { FoodOrdersCommissionSkeleton } from "../../motions/skeletons/AdminDashboardSkeleton";
import {
  calculateCommissionFromMobileOrders,
  calculateDailyCommissionData,
  fetchAreaBookings,
  fetchAreaRevenue,
  fetchBookingStatusCounts,
  fetchDailyBookings,
  fetchDailyCancellations,
  fetchDailyNoShowsRejected,
  fetchDailyRevenue,
  fetchMobileOrders,
  fetchRoomBookings,
  fetchRoomRevenue,
  fetchStats,
} from "../../services/Admin";
import "../../styles/report-modal.css";
import { CalendarEvent, EventComponentProps, ViewType } from "../../types/DashboardTypes";
import { formatCurrency, formatMonthYear, getDaysInMonth } from "../../utils/formatters";
import { generateNativePDF, prepareMonthlyReportData } from "../../utils/monthlyReportGenerator";
import Error from "../_ErrorBoundary";

Chart.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement);

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
  const [view, setView] = useState<ViewType>(ViewType.MONTH);

  const bookingStatusChartRef = useRef<HTMLDivElement>(null);
  const areaRevenueChartRef = useRef<HTMLDivElement>(null);
  const roomRevenueChartRef = useRef<HTMLDivElement>(null);
  const dailyCommissionChartRef = useRef<HTMLDivElement>(null);

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

  const mobileOrdersQuery = useQuery({
    queryKey: ["mobileOrders", selectedMonth, selectedYear],
    queryFn: () => fetchMobileOrders(1, 1000, selectedMonth, selectedYear),
    staleTime: 5 * 60 * 1000,
  });

  const commissionStats = useMemo(() => {
    const result = calculateCommissionFromMobileOrders(
      mobileOrdersQuery.data,
      selectedMonth,
      selectedYear
    );

    return result;
  }, [mobileOrdersQuery.data, selectedMonth, selectedYear]);

  const dailyCommissionData = useMemo(() => {
    return calculateDailyCommissionData(
      mobileOrdersQuery.data,
      selectedMonth,
      selectedYear
    );
  }, [mobileOrdersQuery.data, selectedMonth, selectedYear]);

  const calendarEventsQuery = useQuery({
    queryKey: ['calendarEvents', selectedMonth, selectedYear, dailyRevenueData, dailyBookingsResponse, dailyCancellationsResponse, dailyNoShowsRejectedResponse],
    queryFn: async () => {
      const daysInMonthArray = getDaysInMonth(selectedMonth, selectedYear, true);
      const events: CalendarEvent[] = [];

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

  const totalMonthlyHotelRevenue = dailyRevenueData?.reduce((sum: number, dailyRevenue: number) => sum + (dailyRevenue || 0), 0) || 0;
  const totalMonthlyRevenue = totalMonthlyHotelRevenue + (commissionStats?.total_commission || 0);

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
    revenue: totalMonthlyRevenue,
    roomRevenue: data?.room_revenue || 0,
    venueRevenue: data?.venue_revenue || 0,
    commissionRevenue: commissionStats?.total_commission || 0,
    formattedRevenue: formatCurrency(totalMonthlyRevenue),
    formattedRoomRevenue: data?.formatted_room_revenue,
    formattedVenueRevenue: data?.formatted_venue_revenue,
    formattedCommissionRevenue: formatCurrency(commissionStats?.total_commission || 0),
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
    setView(newView as ViewType);
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
      commissionStats,
      dailyCommissionData,
    });

    const getCanvasFromRef = (ref: React.RefObject<HTMLDivElement>) => {
      if (!ref.current) return null;
      return ref.current.querySelector('canvas');
    };

    const bookingStatusCanvas = getCanvasFromRef(bookingStatusChartRef);
    const areaRevenueCanvas = getCanvasFromRef(areaRevenueChartRef);
    const roomRevenueCanvas = getCanvasFromRef(roomRevenueChartRef);
    const dailyCommissionCanvas = getCanvasFromRef(dailyCommissionChartRef);

    if (bookingStatusCanvas) reportData.charts.bookingStatusChart = bookingStatusCanvas;
    if (areaRevenueCanvas) reportData.charts.areaRevenueChart = areaRevenueCanvas;
    if (roomRevenueCanvas) reportData.charts.roomRevenueChart = roomRevenueCanvas;
    if (dailyCommissionCanvas) reportData.charts.dailyCommissionChart = dailyCommissionCanvas;

    const pdfDoc = generateNativePDF(reportData);

    const pdfBlob = pdfDoc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
  };

  const EventComponent = ({ event }: EventComponentProps) => {
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
          tooltip={`Total revenue including bookings and food commission for ${formattedMonthYear}`}
        />
      </div>

      {/* Commission Tracking Section */}
      {mobileOrdersQuery.isPending ? (
        <FoodOrdersCommissionSkeleton />
      ) : (
        <motion.div
          variants={itemVariants}
          className="bg-white shadow-lg rounded-lg p-6 mb-6"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-800">Food Orders Commission</h2>
          </div>

          {/* Commission Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-gradient-to-r from-green-400 to-green-600 text-white p-4 rounded-lg shadow"
            >
              <h3 className="text-md font-semibold">Total Food Orders</h3>
              <p className="text-2xl font-bold">{commissionStats?.total_orders || 0}</p>
              <p className="text-sm mt-1">For {formattedMonthYear}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="bg-gradient-to-r from-blue-400 to-blue-600 text-white p-4 rounded-lg shadow"
            >
              <h3 className="text-md font-semibold">Commission Earned (20%)</h3>
              <p className="text-2xl font-bold">{formatCurrency(commissionStats?.total_commission || 0)}</p>
              <p className="text-sm mt-1">From {commissionStats?.completed_orders || 0} completed order</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="bg-gradient-to-r from-purple-400 to-purple-600 text-white p-4 rounded-lg shadow"
            >
              <h3 className="text-lg font-semibold">Total Food Sales</h3>
              <p className="text-2xl font-bold">{formatCurrency(commissionStats?.total_sales || 0)}</p>
              <p className="text-sm mt-1">For {formattedMonthYear}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="bg-gradient-to-r from-orange-400 to-orange-600 text-white p-4 rounded-lg shadow"
            >
              <h3 className="text-md font-semibold">Avg Commission</h3>
              <p className="text-2xl font-bold">{formatCurrency(commissionStats?.average_commission_per_order || 0)}</p>
              <p className="text-sm mt-1">Per completed order</p>
            </motion.div>
          </div>

          {/* Daily Commission Line Graph */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-6"
            ref={dailyCommissionChartRef}
          >
            <h3 className="text-2xl font-semibold mb-4 text-gray-800">Daily Commission Trend - {formattedMonthYear}</h3>
            <div className="h-64">
              <Line
                data={{
                  labels: dailyCommissionData.dailyLabels,
                  datasets: [
                    {
                      label: 'Daily Commission Earned',
                      data: dailyCommissionData.dailyCommission,
                      borderColor: 'rgb(59, 130, 246)',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      fill: true,
                      tension: 0.4,
                      pointRadius: 4,
                      pointHoverRadius: 6,
                      pointBackgroundColor: 'rgb(59, 130, 246)',
                      pointBorderColor: 'white',
                      pointBorderWidth: 2,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: true,
                      position: 'top',
                    },
                    tooltip: {
                      callbacks: {
                        label: (context) => {
                          const value = context.raw as number;
                          return `Commission: ${formatCurrency(value)}`;
                        },
                      },
                    },
                  },
                  scales: {
                    x: {
                      title: {
                        display: true,
                        text: 'Day of Month',
                      },
                      grid: {
                        display: false,
                      },
                    },
                    y: {
                      title: {
                        display: true,
                        text: 'Commission Amount (₱)',
                      },
                      beginAtZero: true,
                      ticks: {
                        callback: function (value) {
                          return formatCurrency(value as number);
                        },
                      },
                    },
                  },
                }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}

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
