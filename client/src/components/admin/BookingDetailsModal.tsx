/* eslint-disable @typescript-eslint/no-explicit-any */
import { motion } from "framer-motion";
import { AlertCircle, Calendar, Check, CheckCircle2, Clock, CreditCard, Image, X } from "lucide-react";
import { FC, useState } from "react";
import EventLoader from "../../motions/loaders/EventLoader";
import { BookingDetailProps, ExpandedImg, BookingAction } from "../../types/BookingClient";
import { formatCurrency, formatDate, formatTime, getBookingPrice } from "../../utils/formatters";
import BookingStatusBadge from "./BookingStatusBadge";

const BookingDetailsModal: FC<BookingDetailProps> = ({ booking, onClose, onConfirm, onReject, onCheckIn, onCheckOut, onNoShow, onCancel, canManage, isUpdating }) => {
    const [paymentAmount, setPaymentAmount] = useState<string>("");
    const [downPayment, setDownPayment] = useState<string>("");
    const [expandedImage, setExpandedImage] = useState<ExpandedImg | null>(null);
    const [pendingAction, setPendingAction] = useState<BookingAction | null>(null);

    const isVenueBooking: boolean = booking?.is_venue_booking;
    const bookingPrice: number = getBookingPrice(booking);

    const parseCurrencyAmount = (amount: any): number => {
        if (amount === null || amount === undefined) return 0;
        if (typeof amount === 'number') return amount;
        if (typeof amount === 'string') {
            const numericString = amount.replace(/[₱,]/g, '');
            return parseFloat(numericString) || 0;
        }
        return 0;
    };

    const currentPayment: number = parseFloat(paymentAmount) || 0;
    const currentDownPayment: number = parseFloat(downPayment) || 0;
    const downPaymentAmount: number = parseCurrencyAmount(booking?.down_payment);
    const remainingBalance: number = bookingPrice - downPaymentAmount;
    const isPaymentComplete: boolean = Math.abs(currentPayment - bookingPrice) < Number.EPSILON;
    const isRemainingPaymentComplete: boolean = Math.abs(currentPayment - remainingBalance) < Number.EPSILON;
    const isDownPaymentValid: boolean = currentDownPayment > 0 && currentDownPayment <= bookingPrice;
    const isReservedStatus: boolean = booking.status === "reserved";
    const isPendingStatus: boolean = booking.status === "pending";
    const hasDownPayment: boolean = parseFloat(downPayment) > 0;

    const isNoShowEligible = (): boolean => {
        const currentDate = new Date();
        const checkInDate = new Date(booking.check_in_date);

        const todayOnly = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
        const checkInOnly = new Date(checkInDate.getFullYear(), checkInDate.getMonth(), checkInDate.getDate());

        const cutOff = new Date(checkInDate);
        if (booking.is_venue_booking) {
            cutOff.setHours(8, 0, 0, 0);
        } else {
            if (!booking.time_of_arrival) return false;
            const [h, m] = booking.time_of_arrival.split(':').map(Number);
            cutOff.setHours(h, m, 0, 0);
        }
        const eligible = todayOnly.getTime() === checkInOnly.getTime() && currentDate.getTime() > cutOff.getTime();

        return eligible;
    };

    const isCheckInDateValid = (): { isValid: boolean; message: string } => {
        try {
            const currentDate = new Date();
            const checkInDate = new Date(booking.check_in_date);

            const currentDateOnly = new Date(currentDate);
            const checkInDateOnly = new Date(checkInDate);

            if (currentDateOnly.getTime() <= checkInDateOnly.getTime()) {
                return {
                    isValid: false,
                    message: "Check-in is not available yet. Guest is arriving earlier than the scheduled date."
                };
            }

            if (isVenueBooking) {
                const venueStartHour = 8;

                if (currentDate <= new Date(venueStartHour, 0, 0, 0)) {
                    return {
                        isValid: false,
                        message: "Venue booking check-in starts at 8:00 AM"
                    };
                }
            }

            if (booking.time_of_arrival) {
                const [hourStr, minStr] = booking.time_of_arrival.split(':');

                const arrivalHour = parseInt(hourStr, 10);
                const arrivalMinute = parseInt(minStr, 10);

                const currentMinutes = currentDate.getHours() * 60 + currentDate.getMinutes();
                const arrivalMinutes = arrivalHour * 60 + arrivalMinute;

                if (currentMinutes < arrivalMinutes) {
                    return {
                        isValid: false,
                        message: `Check-in is not available yet. Guest is arriving earlier than the scheduled time of ${formatTime(booking.time_of_arrival)}.`
                    };
                }
            }
            return { isValid: true, message: "" };
        } catch (error) {
            console.error(`Error validating check-in date: ${error}`);
            throw error;
        }
    };

    const isCheckOutDateValid = (): { isValid: boolean; message: string } => {
        try {
            const currentDate = new Date();
            const checkOutDate = new Date(booking.check_out_date);

            if (isVenueBooking) {
                const venueCheckOutTime = new Date(checkOutDate);
                venueCheckOutTime.setHours(17, 0, 0, 0);

                if (currentDate >= venueCheckOutTime) {
                    return { isValid: true, message: "" };
                } else {
                    return {
                        isValid: false,
                        message: "Venue checkout is only allowed on or after the scheduled check-out date."
                    };
                }
            } else {
                const currentDateOnly = new Date(currentDate);
                const checkOutDateOnly = new Date(checkOutDate);

                currentDateOnly.setHours(0, 0, 0, 0);
                checkOutDateOnly.setHours(0, 0, 0, 0);

                if (currentDateOnly >= checkOutDateOnly) {
                    return { isValid: true, message: "" }
                } else {
                    return {
                        isValid: false,
                        message: "Room checkout is only allowed on or after the scheduled check-out date."
                    }
                }
            }
        } catch (error) {
            console.error(`Error validating check-out date: ${error}`);
            throw error;
        }
    };

    const checkInValidation = isCheckInDateValid();
    const canCheckIn = checkInValidation.isValid &&
        (downPaymentAmount === bookingPrice || (currentPayment > 0 && currentPayment === remainingBalance));

    const checkOutValidation = isCheckOutDateValid();
    const canCheckOut = checkOutValidation.isValid;

    const canMarkNoShow = isNoShowEligible();

    const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        if (raw === '') {
            setPaymentAmount("");
            return;
        }

        const num = parseFloat(raw);
        if (isNaN(num)) return;

        const remaining = bookingPrice - downPaymentAmount;

        if (num >= 0 && num <= remaining) setPaymentAmount(raw);
    }

    const handleDownPaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const numValue = parseFloat(value) || 0;
        if (value === "") {
            setDownPayment("");
            return;
        }

        if (numValue > bookingPrice) return;
        setDownPayment(value);
    };

    const getLoadingText = () => {
        if (pendingAction) {
            switch (pendingAction) {
                case BookingAction.CHECK_IN: return "Checking in guest...";
                case BookingAction.CHECK_OUT: return "Checking out guest...";
                case BookingAction.CANCEL: return "Cancelling booking...";
                case BookingAction.NO_SHOW: return "Marking as no-show...";
                case BookingAction.REJECT: return "Rejecting booking request...";
                case BookingAction.RESERVE: return "Reserving booking...";
                default: return "Processing booking...";
            }
        }

        if (booking.status === "reserved" && isUpdating) return "Checking in guest...";
        switch (booking.status) {
            case "pending": return "Reserving booking...";
            case "reserved": return "Checking in guest...";
            case "checked_in": return "Checking out guest...";
            case "no_show": return "Marking as no-show...";
            case "cancelled": return "Cancelling booking...";
            case "rejected": return "Rejecting booking request...";
            default: return "Processing booking...";
        }
    };

    const getLoaderType = () => {
        if (pendingAction) {
            switch (pendingAction) {
                case BookingAction.CHECK_IN: return 'checkin';
                case BookingAction.CHECK_OUT: return 'checkout';
                case BookingAction.CANCEL: return 'cancelled';
                case BookingAction.NO_SHOW: return 'noshow';
                case BookingAction.REJECT: return 'rejected';
                case BookingAction.RESERVE: return 'reserve';
                default: return 'default';
            }
        }

        if (booking.status === 'reserved' && isUpdating) return 'checkin';
        switch (booking.status) {
            case "pending": return "reserve";
            case "reserved": return "checkin";
            case "checked_in": return "checkout";
            case "no_show": return "noshow";
            case "cancelled": return 'cancelled';
            case "rejected": return "rejected";
            default: return "default";
        }
    };

    if (!booking) return null;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
            {isUpdating ? (
                <div className="flex items-center justify-center w-full h-full">
                    <EventLoader
                        text={getLoadingText()}
                        type={getLoaderType() as "default" | "reserve" | "checkin" | "checkout" | "noshow" | "cancelled" | "rejected"}
                    />
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: "spring", damping: 20, stiffness: 300 }}
                    className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-auto p-4 sm:p-6 relative overflow-hidden border border-gray-200"
                >
                    <motion.button
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-500 hover:text-red-500 transition-colors z-10"
                    >
                        <X size={24} />
                    </motion.button>

                    <motion.h2
                        initial={{ y: -20 }}
                        animate={{ y: 0 }}
                        className="text-xl sm:text-2xl font-bold mb-4 text-center pb-2 border-b bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
                    >
                        User Booking Details
                    </motion.h2>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="space-y-3 overflow-y-auto max-h-[70vh] pr-2 custom-scrollbar"
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 p-4 rounded-lg shadow-inner">
                            <motion.div
                                className="flex flex-col sm:flex-row justify-between p-2 rounded-md"
                            >
                                <span className="font-semibold text-gray-700">Full Name:</span>
                                <span className="sm:text-right">{booking.user?.first_name} {booking.user?.last_name}</span>
                            </motion.div>

                            <motion.div
                                className="flex flex-col sm:flex-row justify-between p-2 rounded-md"
                            >
                                <span className="font-semibold text-gray-700">Property Type:</span>
                                <span>
                                    {isVenueBooking ? (
                                        <span className="bg-blue-100 text-blue-800 px-2 uppercase py-1 rounded-full text-md font-semibold">Area</span>
                                    ) : (
                                        <span className="bg-green-100 text-green-800 px-2 uppercase py-1 rounded-full text-md font-semibold">Room</span>
                                    )}
                                </span>
                            </motion.div>

                            <motion.div
                                className="flex flex-col sm:flex-row justify-between p-2 rounded-md"
                            >
                                <span className="font-semibold text-gray-700">{isVenueBooking ? "Area:" : "Room:"}</span>
                                <span className="sm:text-right font-medium">{isVenueBooking
                                    ? (booking.area_details?.area_name)
                                    : (booking.room_details?.room_name)}
                                </span>
                            </motion.div>

                            {(isVenueBooking ? booking.area_details?.capacity : booking.room_details?.max_guests) && (
                                <motion.div
                                    className="flex flex-col sm:flex-row justify-between p-2 rounded-md"
                                >
                                    <span className="font-semibold text-gray-700">No. of Guests:</span>
                                    <span>{booking.number_of_guests} / {isVenueBooking ? booking.area_details.capacity : booking.room_details.max_guests} people</span>
                                </motion.div>
                            )}

                            <motion.div
                                className="flex flex-col sm:flex-row justify-between p-2 rounded-md"
                            >
                                <span className="font-semibold text-gray-700">Check-in:</span>
                                <span>
                                    {isVenueBooking
                                        ? `${formatDate(booking.check_in_date)} 8:00 AM`
                                        : `${formatDate(booking.check_in_date)} at ${new Date(`2000-01-01T${booking.time_of_arrival}`).toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            hour12: true
                                        })}`}
                                </span>
                            </motion.div>

                            <motion.div
                                className="flex flex-col sm:flex-row justify-between p-2 rounded-md"
                            >
                                <span className="font-semibold text-gray-700">Check-out:</span>
                                <span>
                                    {isVenueBooking
                                        ? `${formatDate(booking.check_out_date)} 5:00 PM`
                                        : formatDate(booking.check_out_date)}
                                </span>
                            </motion.div>

                            <motion.div
                                className="flex flex-col sm:flex-row justify-between p-2 rounded-md"
                            >
                                <span className="font-semibold text-gray-700">Total Amount:</span>
                                <span className="font-bold text-indigo-600">
                                    ₱{bookingPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </motion.div>

                            <motion.div
                                className="flex flex-col sm:flex-row justify-between p-2 rounded-md"
                            >
                                <span className="font-semibold text-gray-700">Status:</span>
                                <BookingStatusBadge status={booking.status} />
                            </motion.div>
                        </div>

                        {/* Special Request of Guest Users to their booking */}
                        {booking.special_request && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                transition={{ duration: 0.3 }}
                                className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200 shadow-sm"
                            >
                                <h3 className="font-semibold text-xl mb-2 text-purple-800 flex items-center">
                                    Special Requests:
                                </h3>
                                <p className="text-sm text-purple-700 whitespace-pre-wrap">
                                    {booking.special_request}
                                </p>
                            </motion.div>
                        )}

                        {/* Down Payment section for pending bookings */}
                        {isPendingStatus && canManage && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                transition={{ duration: 0.3 }}
                                className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200 shadow-sm"
                            >
                                <h3 className="font-semibold mb-2 text-indigo-800 flex items-center">
                                    <CreditCard className="w-4 h-4 mr-2" />
                                    Down Payment
                                </h3>
                                <div className="flex flex-col sm:flex-row items-center gap-2">
                                    <div className="relative flex-1 w-full">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                            <span className="text-gray-500 text-xl">₱</span>
                                        </div>
                                        <motion.input
                                            whileFocus={{ boxShadow: "0 0 0 3px rgba(79, 70, 229, 0.3)" }}
                                            type="number"
                                            min="0"
                                            max={bookingPrice}
                                            value={downPayment}
                                            onChange={handleDownPaymentChange}
                                            placeholder={`Enter down payment amount (max: ${bookingPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`}
                                            className="w-full pl-10 py-2 border border-indigo-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                        />
                                    </div>
                                </div>
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="mt-2 text-sm"
                                >
                                    {!hasDownPayment && (
                                        <p className="text-amber-600 flex items-center">
                                            <AlertCircle className="w-4 h-4 mr-1" />
                                            Please enter a down payment amount to reserve this booking.
                                        </p>
                                    )}
                                    {currentDownPayment > bookingPrice && (
                                        <p className="text-red-600 flex items-center">
                                            <AlertCircle className="w-4 h-4 mr-1" />
                                            Down payment cannot exceed total amount of ₱{bookingPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.
                                        </p>
                                    )}
                                </motion.div>
                            </motion.div>
                        )}

                        {isReservedStatus && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                transition={{ duration: 0.3 }}
                                className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200 shadow-sm"
                            >
                                <h3 className="font-semibold mb-2 text-xl text-blue-800 flex items-center">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    Payment Details
                                </h3>

                                <div className="mb-3 p-2 bg-white rounded border border-blue-100">
                                    {downPaymentAmount > 0 && (
                                        <>
                                            <p className="text-gray-700 flex justify-between">
                                                <span className="font-medium">Down Payment:</span>
                                                <span className="text-green-600 font-semibold">
                                                    ₱ {downPaymentAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </p>
                                            <p className="text-gray-700 flex justify-between">
                                                <span className="font-medium">Remaining Balance:</span>
                                                <span className="text-amber-600 font-semibold">
                                                    ₱ {remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </p>
                                        </>
                                    )}
                                    <p className="text-gray-700 flex justify-between font-bold">
                                        <span className="font-medium">Total Booking Amount:</span>
                                        <span className="text-blue-600">
                                            ₱ {bookingPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </p>
                                </div>

                                {/* Payment input field for reservations with remaining balance */}
                                {downPaymentAmount !== bookingPrice && (
                                    <div className="flex flex-col sm:flex-row items-center gap-2 mb-4">
                                        <div className="relative flex-1 w-full">
                                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                                <span className="text-gray-500 text-xl">₱</span>
                                            </div>
                                            <motion.input
                                                whileFocus={{ boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.3)" }}
                                                type="number"
                                                min={0}
                                                max={remainingBalance}
                                                value={paymentAmount}
                                                onChange={handlePaymentChange}
                                                placeholder={`Enter amount (${remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`}
                                                className="w-full pl-10 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Payment validation message */}
                                {currentPayment > 0 && downPaymentAmount !== bookingPrice && (
                                    <div className="mt-2 mb-4 text-sm">
                                        <p className={(isPaymentComplete || isRemainingPaymentComplete) ? "text-green-600 flex items-center" : "text-red-600 flex items-center"}>
                                            {isPaymentComplete ? (
                                                <><CheckCircle2 className="w-4 h-4 mr-1" /> Payment amount matches the full booking total.</>
                                            ) : isRemainingPaymentComplete ? (
                                                <><CheckCircle2 className="w-4 h-4 mr-1" /> Payment amount matches the remaining balance.</>
                                            ) : (
                                                <><AlertCircle className="w-4 h-4 mr-1" />
                                                    {downPaymentAmount > 0
                                                        ? `Payment must be ₱${remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (remaining balance)`
                                                        : `Payment must be exactly ₱${bookingPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} to check in the guest.`
                                                    }
                                                </>
                                            )}
                                        </p>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="mt-4 grid grid-cols-1 md:grid-cols-1 gap-4"
                        >
                            {/* GCash Payment Proof */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200"
                            >
                                <h3 className="font-semibold mb-2 text-gray-700 flex items-center">
                                    <Image className="w-4 h-4 mr-2" />
                                    GCash Payment Proof:
                                </h3>
                                <img
                                    src={booking.payment_proof}
                                    alt="GCash Payment Proof"
                                    className="w-full h-auto rounded-lg cursor-zoom-in hover:opacity-90 transition-opacity"
                                    loading="lazy"
                                    onClick={() => setExpandedImage(ExpandedImg.PAYMENT_PROOF)}
                                />
                            </motion.div>
                        </motion.div>

                        {isVenueBooking && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                transition={{ duration: 0.3 }}
                                className="mt-4 p-4 bg-blue-100 rounded-lg border border-blue-300 shadow-sm"
                            >
                                <h3 className="font-semibold text-lg mb-2 text-blue-800 flex items-center">
                                    <Calendar className="w-5 h-5 mr-2" />
                                    Area Booking Note
                                </h3>
                                <p className="text-md text-blue-700 font-medium">
                                    Standard area bookings are scheduled from 8:00 AM to 5:00 PM (9 hours) on the selected date.
                                    {booking.check_in_date !== booking.check_out_date && " This booking spans multiple days."}
                                </p>
                            </motion.div>
                        )}
                    </motion.div>

                    {/* Action Buttons */}
                    {canManage && booking.status === "pending" && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="flex flex-col sm:flex-row justify-between gap-2 mt-6"
                        >
                            <motion.button
                                whileHover={{ scale: 1.02, backgroundColor: "#dc2626" }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                    setPendingAction(BookingAction.REJECT);
                                    onReject();
                                }}
                                className="px-4 py-2 cursor-pointer bg-red-600 text-white rounded-lg curp transition-colors flex items-center justify-center gap-2 shadow-sm"
                            >
                                <X size={18} />
                                Reject Booking
                            </motion.button>
                            <motion.button
                                whileTap={isDownPaymentValid ? { scale: 0.98 } : {}}
                                onClick={() => {
                                    setPendingAction(BookingAction.RESERVE);
                                    if (isDownPaymentValid) onConfirm(currentDownPayment);
                                }}
                                className={`px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm ${isDownPaymentValid
                                    ? 'bg-blue-600 text-white cursor-pointer hover:bg-blue-700'
                                    : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                    }`}
                                disabled={!isDownPaymentValid}
                            >
                                <Check size={18} />
                                Reserve Booking
                            </motion.button>
                        </motion.div>
                    )}

                    {canManage && booking.status === "reserved" && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="flex flex-col sm:flex-row justify-between gap-2 mt-6"
                        >
                            <div className="relative group">
                                <motion.button
                                    whileTap={canMarkNoShow ? { scale: 0.98 } : {}}
                                    onClick={() => {
                                        setPendingAction(BookingAction.NO_SHOW);
                                        if (onNoShow && canMarkNoShow) onNoShow();
                                    }}
                                    className={`px-4 py-2 rounded-lg flex items-center justify-center gap-2 shadow-sm ${canMarkNoShow
                                        ? 'bg-amber-600 text-white cursor-pointer'
                                        : 'bg-gray-400 text-gray-200 cursor-not-allowed'}`}
                                    disabled={!canMarkNoShow}
                                >
                                    <X size={18} />
                                    Mark as No Show
                                </motion.button>
                                {!canMarkNoShow && (
                                    <div className="absolute bottom-full left-0 mb-2 w-full opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 w-full">
                                            <p className="flex items-start text-amber-300">
                                                <Clock className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                                                {isVenueBooking
                                                    ? "No Show can be marked after 8:00 AM on the check-in date"
                                                    : "No Show can be marked after the guest's expected arrival time"}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                    setPendingAction(BookingAction.CANCEL);
                                    if (onCancel) onCancel();
                                }}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                            >
                                <X size={18} />
                                Cancel Booking
                            </motion.button>
                            <div className="relative group">
                                <motion.button
                                    whileTap={canCheckIn ? { scale: 0.98 } : {}}
                                    onClick={() => {
                                        setPendingAction(BookingAction.CHECK_IN);
                                        if (onCheckIn && canCheckIn) onCheckIn(bookingPrice);
                                    }}
                                    className={`px-4 py-2 text-white rounded-lg flex items-center justify-center gap-2 shadow-sm ${canCheckIn
                                        ? 'bg-blue-600 cursor-pointer hover:bg-blue-700'
                                        : 'bg-gray-400 cursor-not-allowed'
                                        }`}
                                    disabled={!canCheckIn}
                                >
                                    <Check size={18} />
                                    Check In Guest
                                </motion.button>

                                {!canCheckIn && (
                                    <div className="absolute bottom-full left-0 mb-2 w-full opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 w-full">
                                            {!checkInValidation.isValid && (
                                                <p className="flex items-start text-amber-300">
                                                    <Clock className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                                                    {checkInValidation.message}
                                                </p>
                                            )}
                                            {checkInValidation.isValid && currentPayment !== remainingBalance && (
                                                <p className="flex items-start text-amber-300">
                                                    <AlertCircle className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                                                    {downPaymentAmount > 0
                                                        ? `Payment must be exactly ${formatCurrency(remainingBalance)} (remaining balance) to check in.`
                                                        : `Full payment of ${formatCurrency(remainingBalance)} required to check in.`}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {canManage && booking.status === "checked_in" && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="flex justify-center mt-6"
                        >
                            <div className="relative group">
                                <motion.button
                                    whileTap={canCheckOut ? { scale: 0.95 } : {}}
                                    onClick={() => {
                                        setPendingAction(BookingAction.CHECK_OUT);
                                        if (onCheckOut && canCheckOut) onCheckOut();
                                    }}
                                    className={`px-6 py-3 text-white rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md duration-300 ${canCheckOut
                                        ? 'bg-indigo-600 cursor-pointer hover:bg-indigo-700'
                                        : 'bg-gray-400 cursor-not-allowed'
                                        }`}
                                    disabled={!canCheckOut}
                                >
                                    <Check size={18} />
                                    Check Out Guest
                                </motion.button>
                                {!canCheckOut && (
                                    <div className="absolute bottom-full left-0 mb-2 w-full opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 w-full">
                                            {!checkOutValidation.isValid && (
                                                <p className="flex items-start text-amber-300 mb-1">
                                                    <Clock className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                                                    {checkOutValidation.message}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            )}
            {expandedImage && (
                <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4"
                    onClick={() => setExpandedImage(null)}>
                    <div className="relative max-w-4xl w-full max-h-[90vh]">
                        <button
                            onClick={() => setExpandedImage(null)}
                            className="absolute -top-8 right-0 cursor-pointer text-white hover:text-gray-200 transition-colors z-50"
                        >
                            <X size={24} />
                        </button>
                        <motion.img
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2, ease: "easeIn" }}
                            loading="lazy"
                            src={expandedImage === "validId" ? booking.valid_id : booking.payment_proof}
                            alt={expandedImage === "validId" ? booking.valid_id : booking.payment_proof}
                            className="w-full max-h-[90vh] object-contain rounded-lg"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookingDetailsModal;