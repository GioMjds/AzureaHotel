import { useQuery } from '@tanstack/react-query';
import { addMonths, differenceInCalendarDays, eachDayOfInterval, endOfMonth, format, isBefore, isSameDay, parseISO, startOfDay, startOfMonth } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useUserContext } from '../contexts/AuthContext';
import { fetchAreaBookings, fetchAreaById } from '../services/Booking';
import { AreaData, BookingData, BookingsByDate } from '../types/BookingClient';
import { calculateAreaPricing } from '../utils/pricingUtils';

const VenueBookingCalendar = () => {
    const { userDetails } = useUserContext();
    const { areaId } = useParams<{ areaId: string }>();
    const [searchParams] = useSearchParams();
    const arrivalParam = searchParams.get("arrival");
    const navigate = useNavigate();

    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [bookingsByDate, setBookingsByDate] = useState<BookingsByDate>({});
    const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
    const [price, setPrice] = useState<number>(0);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const isVerifiedUser = userDetails?.is_verified === 'verified';
    const lastBookingDay = userDetails?.last_booking_date;
    const daysSinceLastBooking = lastBookingDay
        ? differenceInCalendarDays(startOfDay(new Date()), lastBookingDay)
        : Infinity;

    const isBookingLocked = !isVerifiedUser && daysSinceLastBooking === 0;

    useEffect(() => {
        if (arrivalParam) {
            try {
                const parsedDate = parseISO(arrivalParam);
                setSelectedDate(parsedDate);
                setCurrentMonth(parsedDate);
            } catch (error) {
                console.error(`Error parsing arrival date from URL: ${error}`);
            }
        }
    }, [arrivalParam]);

    const { data: areaData, isLoading: isLoadingArea } = useQuery<AreaData>({
        queryKey: ['area', areaId],
        queryFn: () => fetchAreaById(areaId),
        enabled: !!areaId
    });

    const { data: bookingsData, isLoading: isLoadingBookings } = useQuery<{ data: BookingData[] }>({
        queryKey: ['areaBookings', areaId, currentMonth],
        queryFn: async () => {
            const startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
            const endDate = format(endOfMonth(addMonths(currentMonth, 1)), 'yyyy-MM-dd');
            return await fetchAreaBookings(areaId, startDate, endDate);
        },
        enabled: !!areaId
    });

    useEffect(() => {
        if (bookingsData?.data) {
            const newBookingsByDate: BookingsByDate = {};

            bookingsData.data.forEach(booking => {
                const dateString = format(parseISO(booking.check_in_date), 'yyyy-MM-dd');

                if (!newBookingsByDate[dateString]) {
                    newBookingsByDate[dateString] = {
                        status: booking.status,
                        bookingId: booking.id,
                        unavailableTimes: []
                    };
                }

                if (booking.start_time && booking.end_time) {
                    newBookingsByDate[dateString].unavailableTimes.push({
                        start_time: booking.start_time,
                        end_time: booking.end_time,
                        status: booking.status
                    });
                }
            });

            setBookingsByDate(newBookingsByDate);
        }
    }, [bookingsData]);

    useEffect(() => {
        if (areaData) {
            const pricingResult = calculateAreaPricing({
                areaData: areaData,
                userDetails,
                hours: 1
            });
            setPrice(pricingResult.finalPrice);
        }
    }, [areaData, userDetails]);

    const months = [currentMonth, addMonths(currentMonth, 1)];

    const prevMonth = () => setCurrentMonth(addMonths(currentMonth, -1));
    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

    const isDateBooked = (date: Date): boolean => {
        const dateString = format(date, 'yyyy-MM-dd');
        const booking = bookingsByDate[dateString];

        if (booking && booking.status) {
            const status = booking.status.toLowerCase();
            return ['checked_in', 'reserved'].includes(status);
        }

        return false;
    };

    const getDateStatus = (date: Date): string | null => {
        const dateString = format(date, 'yyyy-MM-dd');
        return bookingsByDate[dateString]?.status || null;
    };

    const isDateUnavailable = (date: Date) => {
        const todayStart = startOfDay(new Date());
        const now = new Date();

        if (isBefore(date, todayStart)) return true;
        if (isSameDay(date, now) && now.getHours() >= 17) return true;

        return isDateBooked(date);
    };

    const handleDateClick = (date: Date) => {
        if (isDateUnavailable(date)) return;
        setSelectedDate(date);
        setErrorMessage(null);
    };

    const handleDateHover = (date: Date) => {
        if (!isDateUnavailable(date)) setHoveredDate(date);
    };

    const getDateCellClass = (date: Date) => {
        const isUnavailable = isDateUnavailable(date);
        const isSelected = selectedDate && isSameDay(date, selectedDate);
        const isHovered = hoveredDate && isSameDay(date, hoveredDate);
        const dateStatus = getDateStatus(date);

        const className = "relative h-11 w-11 flex items-center justify-center text-lg font-semibold";

        if (isSelected) return `${className} bg-blue-600 text-white font-medium`;
        if (isHovered && !isUnavailable) return `${className} bg-blue-100 border border-blue-300 cursor-pointer`;

        if (dateStatus && ['reserved', 'checked_in'].includes(dateStatus.toLowerCase())) {
            switch (dateStatus.toLowerCase()) {
                case 'reserved':
                    return `${className} bg-green-200 text-green-800 border-2 border-green-600 font-medium cursor-not-allowed`;
                case 'checked_in':
                    return `${className} bg-blue-200 text-blue-800 border-2 border-blue-600 font-medium cursor-not-allowed`;
                default:
                    return `${className} bg-gray-300 text-gray-500 cursor-not-allowed`;
            }
        }

        if (isUnavailable) return `${className} bg-gray-300 text-gray-500 cursor-not-allowed`;
        return `${className} bg-white border border-gray-300 hover:bg-gray-100 cursor-pointer`;
    };

    const isTodayUnavailable = () => {
        const now = new Date();
        return now.getHours() >= 17 && isSameDay(now, new Date());
    }

    const getDateContent = (date: Date) => {
        return format(date, 'd');
    };

    const handleProceed = () => {
        if (selectedDate && areaData) {
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            const startTime = `${dateStr}`;
            const endTime = `${dateStr}T17:00:00`;
            navigate(`/confirm-area-booking?areaId=${areaId}&startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}&totalPrice=${price}`);
        }
    };

    if (isLoadingArea || isLoadingBookings) {
        return (
            <div className="flex justify-center items-center h-[calc(100vh-80px)]">
                <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-7 py-10 mt-16">
            <div className="flex justify-between items-center mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center cursor-pointer gap-2 px-4 py-2 rounded-lg bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors duration-300"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Go Back</span>
                </button>
                <h2 className="text-4xl font-semibold text-center">Book Your Area</h2>
                <div className="w-[100px]" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg shadow-md ring-3 ring-purple-500 p-6">
                        <h3 className="text-2xl font-bold mb-4">Select Your Booking Date</h3>

                        {/* Selected Date */}
                        <div className="flex flex-col text-lg md:flex-row md:items-center md:justify-between mb-6 p-4 bg-gray-50 rounded-lg">
                            <div>
                                <span className="text-gray-600">Selected Date:</span>
                                <span className="ml-2 font-semibold">
                                    {selectedDate ? format(selectedDate, 'EEE, MMM dd, yyyy') : 'Select a date'}
                                </span>
                            </div>
                            <div className="mt-2 md:mt-0">
                                <span className="text-gray-600">Duration:</span>
                                <span className="ml-2 font-semibold text-blue-600">
                                    9 hours (8:00 AM - 5:00 PM)
                                </span>
                            </div>
                        </div>

                        {/* Error Message */}
                        {errorMessage && (
                            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
                                <p>{errorMessage}</p>
                            </div>
                        )}

                        {isBookingLocked && (
                            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
                                <p>⚠️ Daily booking limit reached. Verify your ID to book multiple stays.</p>
                            </div>
                        )}

                        {!arrivalParam && isTodayUnavailable() && (
                            <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-md">
                                <p>⚠️ Note: Today's date is unavailable for new bookings after 5:00 PM.
                                    Please select a future date for your reservation.</p>
                            </div>
                        )}

                        {arrivalParam ? (
                            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                                <p className="font-medium text-blue-800">
                                    Date pre-selected: {selectedDate ? format(selectedDate, 'EEEE, MMMM dd, yyyy') : ''}
                                </p>
                                <p className="text-sm text-blue-600 mt-1">
                                    This venue is available for full-day rental only.
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Calendar Controls */}
                                <div className="flex justify-between items-center mb-4">
                                    <button
                                        onClick={prevMonth}
                                        className="p-2 rounded-full hover:bg-gray-100"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <div className="text-lg font-semibold">
                                        {format(currentMonth, 'MMMM yyyy')}
                                    </div>
                                    <button
                                        onClick={nextMonth}
                                        className="p-2 rounded-full hover:bg-gray-100"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Calendar Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                    {months.map((month, monthIndex) => {
                                        const monthStart = startOfMonth(month);
                                        const monthEnd = endOfMonth(month);
                                        const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

                                        const startWeekday = monthStart.getDay();

                                        const calendarDays = [];

                                        for (let i = 0; i < startWeekday; i++) {
                                            calendarDays.push(null);
                                        }

                                        calendarDays.push(...days);

                                        return (
                                            <div key={monthIndex}>
                                                <div className="text-center font-medium mb-2">
                                                    {format(month, 'MMMM yyyy')}
                                                </div>
                                                <div className="grid grid-cols-7 gap-1">
                                                    {/* Weekday headers */}
                                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                                                        <div key={day} className="text-center text-xs text-gray-500 font-medium py-2">
                                                            {day}
                                                        </div>
                                                    ))}

                                                    {/* Calendar days */}
                                                    {calendarDays.map((day, i) => (
                                                        <div key={i} className="h-10 flex items-center justify-center">
                                                            {day ? (
                                                                <div
                                                                    className={getDateCellClass(day)}
                                                                    onClick={() => handleDateClick(day)}
                                                                    onMouseEnter={() => handleDateHover(day)}
                                                                    onMouseLeave={() => setHoveredDate(null)}
                                                                >
                                                                    {getDateContent(day)}
                                                                </div>
                                                            ) : (
                                                                <div></div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}

                        {/* Full Day Booking Information */}
                        {selectedDate && (
                            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <h4 className="font-semibold text-blue-800 mb-2 text-lg">Full Day Booking Details</h4>
                                <p className="text-blue-700">
                                    This venue is available for fixed hours only. Your booking will be scheduled for:
                                </p>
                                <div className="flex justify-between items-center bg-white p-3 rounded-md mt-2 shadow-sm">
                                    <div>
                                        <p className="text-gray-700 font-medium">Date:</p>
                                        <p className="text-blue-600 font-semibold">{format(selectedDate, 'EEEE, MMMM dd, yyyy')}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-700 font-medium">Time:</p>
                                        <p className="text-blue-600 font-semibold">8:00 AM - 5:00 PM (9 hours)</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Calendar Legend - only show if calendar is visible */}
                        {!arrivalParam && (
                            <div className="mt-6 border-t pt-4">
                                <h4 className="text-sm font-medium mb-3">CALENDAR LEGEND</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-4">
                                    <div className="flex items-center">
                                        <div className="h-6 w-6 bg-white border-1 border-gray-800 mr-2 rounded-full"></div>
                                        <span className="text-sm">Available</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="h-6 w-6 bg-blue-600 mr-2 rounded-full"></div>
                                        <span className="text-sm">Selected Date</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="h-6 w-6 bg-gray-300 mr-2 rounded-full"></div>
                                        <span className="text-sm">Unavailable</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="h-6 w-6 bg-green-200 border-2 border-green-600 mr-2 rounded-full"></div>
                                        <span className="text-sm">Reserved</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="h-6 w-6 bg-blue-200 border-2 border-blue-600 mr-2 rounded-full"></div>
                                        <span className="text-sm">Checked In</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Proceed Button */}
                        <div className="flex justify-end mt-6">
                            <button
                                onClick={handleProceed}
                                disabled={!selectedDate || isBookingLocked}
                                className={`px-6 py-2 rounded-md font-semibold ${selectedDate
                                    ? 'text-white bg-blue-600 hover:bg-blue-700 cursor-pointer'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                            >
                                Proceed to Booking
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Side - Area Info (1/3 width on large screens) */}
                <div className="lg:col-span-1">
                    {areaData && (
                        <div className="bg-white rounded-lg ring-purple-500 ring-3 shadow-xl p-6 sticky top-24">
                            <div className="mb-4">
                                <img
                                    loading="lazy"
                                    src={Array.isArray(areaData.images) && areaData.images.length > 0 ? areaData.images[0].area_image : '/public/vite.svg'}
                                    alt={areaData.area_name}
                                    className="w-full h-48 object-cover rounded-lg"
                                    onError={e => (e.currentTarget.src = '/public/vite.svg')}
                                />
                            </div>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xl font-bold">{areaData.area_name}</h3>
                            </div>
                            {/* Price Display with Discount Logic */}
                            <div className="mb-3">
                                {(() => {
                                    const isSeniorOrPwd = userDetails?.is_senior_or_pwd;
                                    const parsePrice = (val: string | number | null | undefined) => {
                                        if (!val) return null;
                                        if (typeof val === 'number') return val;
                                        if (typeof val === 'string') {
                                            return parseFloat(val.replace(/[^\d.]/g, ''));
                                        }
                                        return null;
                                    };

                                    const originalPrice = parsePrice(areaData.price_per_hour) || 0;
                                    const adminDiscounted = parsePrice(areaData.discounted_price);
                                    const seniorDiscounted = parsePrice(areaData.senior_discounted_price);

                                    let displayDiscountedPrice: number | null = null;
                                    let displayDiscountPercent = 0;

                                    if (isSeniorOrPwd) {
                                        // For senior/PWD users, compare available discounts and pick the best (lowest price)
                                        const availableDiscounts = [];

                                        if (adminDiscounted !== null && adminDiscounted < originalPrice) {
                                            availableDiscounts.push({ price: adminDiscounted, percent: areaData.discount_percent ?? 0 });
                                        }

                                        if (seniorDiscounted !== null && seniorDiscounted < originalPrice) {
                                            availableDiscounts.push({ price: seniorDiscounted, percent: 20 });
                                        }

                                        if (availableDiscounts.length > 0) {
                                            // Pick the discount with the lowest price
                                            const bestDiscount = availableDiscounts.reduce((best, current) =>
                                                current.price < best.price ? current : best
                                            );
                                            displayDiscountedPrice = bestDiscount.price;
                                            displayDiscountPercent = bestDiscount.percent;
                                        }
                                    } else {
                                        // For non-senior users, only apply admin discount if available
                                        if (adminDiscounted !== null && adminDiscounted < originalPrice) {
                                            displayDiscountedPrice = adminDiscounted;
                                            displayDiscountPercent = areaData.discount_percent ?? 0;
                                        }
                                    }

                                    return (
                                        <>
                                            {displayDiscountedPrice !== null ? (
                                                <>
                                                    <div className="text-gray-500 line-through text-base">
                                                        ₱{originalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </div>
                                                    <div className="text-blue-600 font-bold text-lg">
                                                        ₱{displayDiscountedPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        <span className="ml-2 text-green-600 font-semibold text-sm">
                                                            -{displayDiscountPercent}% OFF
                                                        </span>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-lg font-semibold text-blue-600">
                                                    ₱{originalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                            <div className="flex flex-col space-y-2 mb-4 mt-3">
                                <div className="flex items-center text-gray-800">
                                    <span className="mr-2">👥</span>
                                    <span className="font-semibold">Capacity: {areaData.capacity} pax</span>
                                </div>
                            </div>
                            {/* Only show booking details if valid date selected */}
                            {selectedDate && (
                                <div className="border-t border-gray-200 pt-3 mt-3">
                                    <h4 className="font-semibold text-lg mb-3">Your Selection:</h4>
                                    <div className="p-1 rounded-md space-y-2">
                                        <div className="flex justify-between">
                                            <span>Date:</span>
                                            <span className="font-medium">{format(selectedDate, 'MMM dd, yyyy')}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Duration:</span>
                                            <span className="font-medium">9 hours (8AM - 5PM)</span>
                                        </div>
                                        <div className="flex justify-between text-3xl font-semibold text-blue-600 pt-2 border-t border-gray-200">
                                            <span>Total Price:</span>
                                            <span>
                                                ₱{price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VenueBookingCalendar;

