/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Calendar, Eye, Search, SearchIcon } from "lucide-react";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ViewBookingDetailsModal from "../../components/guests/ViewBookingDetailsModal";
import { useUserContext } from "../../contexts/AuthContext";
import GuestBookingsError from "../../motions/error-fallback/GuestBookingsError";
import GuestBookingsSkeleton from "../../motions/skeletons/GuestBookingsSkeleton";
import { fetchUserBookings } from "../../services/Booking";
import { formatCurrency, formatDate, formatStatus, getStatusColor, parsePriceValue } from "../../utils/formatters";

const GuestCancellations: FC = () => {
  const { userDetails } = useUserContext();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [changingPage, setChangingPage] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<number>(null);
  const [showBookingDetailModal, setShowBookingDetailModal] = useState<boolean>(false);

  const pageSize = 5;

  const userBookingsQuery = useQuery({
    queryKey: ['userBookings', 'cancelled', currentPage, pageSize],
    queryFn: async () => {
      const response = await fetchUserBookings({ page: 1, pageSize: 100 });

      const allBookings = response.data || [];
      const cancelledBookings = allBookings.filter(
        (booking: any) => booking.status.toLowerCase() === "cancelled"
      );

      const totalCancelledItems = cancelledBookings.length;
      const calculatedTotalPages = Math.max(1, Math.ceil(totalCancelledItems / pageSize));

      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedBookings = cancelledBookings.slice(startIndex, endIndex);

      return {
        data: paginatedBookings,
        pagination: {
          total_pages: calculatedTotalPages,
          current_page: currentPage,
          total_items: totalCancelledItems,
          page_size: pageSize
        }
      };
    },
    enabled: !!userDetails?.id
  });

  useEffect(() => {
    if (changingPage && !userBookingsQuery.isPending) {
      setChangingPage(false);
    }
  }, [changingPage, userBookingsQuery.isPending]);

  const { bookings, totalPages, isLoading, errorMessage } = useMemo(() => {
    return {
      bookings: userBookingsQuery.data?.data || [],
      totalPages: userBookingsQuery.data?.pagination?.total_pages || 1,
      isLoading: userBookingsQuery.isPending || changingPage,
      errorMessage: userBookingsQuery.isError
        ? <GuestBookingsError error={userBookingsQuery.error} />
        : null
    };
  }, [userBookingsQuery, changingPage]);

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking: any) => {
      const matchesSearch =
        (booking.is_venue_booking
          ? (booking.area_name || booking.area_details?.area_name || '')
          : (booking.room_name || booking.room_details?.room_name || ''))
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (booking.room_type || booking.room_details?.room_type || '')
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (booking.booking_reference || booking.id || '')
          .toString()
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      return matchesSearch;
    });
  }, [bookings, searchTerm]);

  const handlePageChange = useCallback((newPage: number) => {
    setChangingPage(true);
    setCurrentPage(newPage);
    window.scrollTo(0, 0);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  }, []);

  if (isLoading) return <GuestBookingsSkeleton />;
  if (errorMessage) return <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">{errorMessage}</div>;

  return (
    <div className="space-y-3 container mx-auto p-3">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Cancelled Bookings</h1>
        <p className="text-gray-600 text-lg">View your cancelled hotel bookings</p>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-grow max-w-md">
          <input
            type="text"
            placeholder="Search by room name or booking reference..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6">
          {filteredBookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 table-fixed">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Date of Cancellation</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Check Out</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBookings.map((booking: any) => {
                    const isVenueBooking = booking.is_venue_booking;
                    let itemName, itemImage, totalAmount;

                    if (isVenueBooking) {
                      itemName = booking.area_name || booking.area_details?.area_name || "Venue";
                      itemImage = booking.area_details?.images[0]?.area_image

                      const startTime = booking.start_time || booking.check_in_date;
                      const endTime = booking.end_time || booking.check_out_date;
                      let duration = 1;

                      if (startTime && endTime) {
                        try {
                          const start = new Date(startTime);
                          const end = new Date(endTime);
                          const diffTime = Math.abs(end.getTime() - start.getTime());
                          duration = Math.ceil(diffTime / (1000 * 60 * 60)) || 1;
                        } catch (e) {
                          console.error(`"Error calculating venue duration: ${e}`);
                        }
                      }

                      const venuePrice =
                        parsePriceValue(booking.price_per_hour || booking.area_details?.price_per_hour || "0");

                      totalAmount = booking.total_price || booking.total_amount || (venuePrice * duration);
                    } else {
                      itemName = booking.room_name || booking.room_details?.room_name || "Room";
                      itemImage = booking.room_details?.images[0]?.room_image;

                      const checkInDate = booking.check_in_date;
                      const checkOutDate = booking.check_out_date;
                      let nights = 1;

                      if (checkInDate && checkOutDate) {
                        try {
                          const checkIn = new Date(checkInDate);
                          const checkOut = new Date(checkOutDate);
                          const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
                          nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
                        } catch (e) {
                          console.error(`Error calculating room nights: ${e}`);
                        }
                      }

                      const nightlyRate =
                        parsePriceValue(booking.room_price || booking.room_details?.room_price || "0");

                      totalAmount = booking.total_price || booking.total_amount || (nightlyRate * nights);
                    }

                    const checkInDate = booking.check_in_date;
                    const checkOutDate = booking.check_out_date;
                    const status = formatStatus(booking.status);
                    const id = booking.id;
                    const cancellationDate = booking.updated_at;

                    return (
                      <tr key={id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              <img
                                loading="lazy"
                                src={itemImage}
                                alt={itemName}
                                className="h-10 w-10 rounded-md object-cover"
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-lg font-semibold text-gray-900">{itemName}</div>
                              {isVenueBooking ? (
                                <div className="text-md bg-blue-100 text-blue-800 px-2 py-0.5 rounded inline-block mt-1">Area</div>
                              ) : (
                                <div className="text-md bg-green-100 text-green-800 px-2 py-0.5 rounded inline-block mt-1">Room</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap text-lg text-gray-500">
                          {formatDate(cancellationDate)}
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap text-lg text-gray-500">
                          {formatDate(checkInDate)}
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap text-lg text-gray-500">
                          {formatDate(checkOutDate)}
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <span className={`p-2 text-sm font-semibold rounded-full ${getStatusColor(status)}`}>
                            {status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap text-lg font-semibold text-gray-900">
                          {formatCurrency(typeof totalAmount === 'string' ? parsePriceValue(totalAmount) : totalAmount || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                          <div className="flex justify-center space-x-2">
                            <button
                              className="bg-gray-600 hover:bg-gray-700 uppercase text-white p-2 rounded-full flex items-center cursor-pointer transition-all duration-300"
                              onClick={() => {
                                setSelectedBookingId(booking.id);
                                setShowBookingDetailModal(true);
                              }}
                            >
                              <Eye size={24} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <nav className="flex items-center space-x-1">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`px-3 py-1 rounded-l-md border ${currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-purple-600 hover:bg-purple-50 cursor-pointer'
                        }`}
                    >
                      <ArrowLeft size={20} />
                    </button>

                    <div className="text-gray-700 text-lg border rounded-lg p-1 border-purple-600 font-medium">
                      Page <span className="text-purple-600">{currentPage}</span> | <span className="text-purple-600">{totalPages}</span>
                    </div>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-1 rounded-r-md border ${currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-purple-600 hover:bg-purple-50 cursor-pointer'
                        }`}
                    >
                      <ArrowRight size={20} />
                    </button>
                  </nav>
                </div>
              )}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="py-16 flex flex-col items-center justify-center text-center"
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{
                  duration: 0.5,
                  delay: 0.2,
                  type: "spring",
                  stiffness: 200
                }}
                className="bg-gray-100 p-4 rounded-full mb-4"
              >
                <Calendar size={50} className="text-purple-500" />
              </motion.div>

              <motion.h3
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-xl font-bold text-gray-800 mb-2"
              >
                No Cancelled Bookings Found
              </motion.h3>

              {searchTerm && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-gray-500 max-w-md mb-6"
                >
                  You don't have any cancelled bookings yet. When you cancel your booking, it will appear here.
                </motion.p>
              )}

              {searchTerm && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex flex-col sm:flex-row gap-3"
                >
                  <div className="flex items-center bg-purple-50 text-purple-700 px-4 py-2 rounded-lg">
                    <SearchIcon size={18} className="mr-2" />
                    <span>Search: <strong>"{searchTerm}"</strong></span>
                    <button
                      onClick={() => setSearchTerm("")}
                      className="ml-2 text-purple-500 hover:text-purple-700"
                    >
                      ×
                    </button>
                  </div>
                </motion.div>
              )}

              {!searchTerm && (
                <motion.button
                  onClick={() => navigate("/")}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-purple-600 hover:bg-purple-700 text-white p-3 cursor-pointer uppercase rounded-lg font-semibold shadow-md"
                >
                  Book Now
                </motion.button>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {showBookingDetailModal && (
        <ViewBookingDetailsModal
          bookingId={selectedBookingId}
          onClose={() => {
            setShowBookingDetailModal(false);
            setSelectedBookingId(null);
          }}
        />
      )}
    </div>
  );
};

export default GuestCancellations;