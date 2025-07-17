import { motion } from "framer-motion";
import { AlertCircle, Calendar, CheckCircle2, Clock, CreditCard, User, Watch, XCircle } from "lucide-react";
import { FC, ReactNode, memo, useMemo } from "react";
import { BookingCardProps } from "../../types/BookingGuest";
import { formatCurrency, formatStatus, formatTime } from "../../utils/formatters";
import { Statuses } from "../../types/BookingClient";

const getStatusInfo = (status: string): { color: string; icon: ReactNode } => {
  const normalizedStatus = status.toLowerCase();

  switch (normalizedStatus) {
    case Statuses.CONFIRMED:
      return {
        color: 'bg-green-100 text-green-700 border-green-300',
        icon: <CheckCircle2 className="w-4 h-4 mr-1" />
      };
    case Statuses.PENDING:
      return {
        color: 'bg-yellow-100 text-yellow-700 border-yellow-300',
        icon: <Clock className="w-4 h-4 mr-1" />
      };
    case Statuses.CANCELLED:
      return {
        color: 'bg-red-100 text-red-700 border-red-300',
        icon: <XCircle className="w-4 h-4 mr-1" />
      };
    case Statuses.REJECTED:
      return {
        color: 'bg-red-100 text-red-700 border-red-300',
        icon: <XCircle className="w-4 h-4 mr-1" />
      };
    case Statuses.RESERVED:
      return {
        color: 'bg-blue-100 text-blue-700 border-blue-300',
        icon: <CheckCircle2 className="w-4 h-4 mr-1" />
      };
    case Statuses.CHECKED_IN:
      return {
        color: 'bg-indigo-100 text-indigo-700 border-indigo-300',
        icon: <CheckCircle2 className="w-4 h-4 mr-1" />
      };
    case Statuses.CHECKED_OUT:
      return {
        color: 'bg-purple-100 text-purple-700 border-purple-300',
        icon: <CheckCircle2 className="w-4 h-4 mr-1" />
      };
    default:
      return {
        color: 'bg-gray-100 text-gray-700 border-gray-300',
        icon: <AlertCircle className="w-4 h-4 mr-1" />
      };
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

const contentVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3
    }
  }
};

const BookingCard: FC<BookingCardProps> = memo(({
  roomType,
  imageUrl,
  dates,
  guests,
  price,
  status,
  userDetails,
  specialRequest,
  paymentProof,
  bookingDate,
  cancellationReason,
  cancellationDate,
  totalPrice,
  numberOfGuests,
  arrivalTime,
  downPayment,
}) => {
  const statusInfo = useMemo(() => getStatusInfo(status), [status]);
  const displayPrice = totalPrice || price;

  const imgSrc = useMemo(() => {
    return imageUrl;
  }, [imageUrl]);

  return (
    <motion.div
      className="bg-white rounded-xl shadow-md overflow-hidden w-full mx-auto mb-6"
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      layout="position"
    >
      {/* Header Section */}
      <div className="relative">
        <div className="h-[300px] overflow-hidden">
          <img
            src={imgSrc}
            alt={roomType}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        <div className="absolute top-4 right-4">
          <span className={`flex items-center px-4 py-1 rounded-full border text-sm font-semibold ${statusInfo.color}`}>
            {statusInfo.icon}
            {formatStatus(status)}
          </span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <h2 className="text-5xl font-bold font-playfair text-white">{roomType}</h2>
        </div>
      </div>

      {/* Content Section */}
      <motion.div
        className="p-6"
        variants={contentVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Booking Details */}
        <motion.div variants={itemVariants} className="mb-6">
          <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-4">
            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-blue-600 mr-2" />
              <div>
                <span className="block text-sm text-gray-500">Dates</span>
                <span className="block font-medium">{dates}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="block text-2xl font-bold text-blue-600">{formatCurrency(displayPrice || 0)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center">
              <User className="w-5 h-5 text-indigo-600 mr-2 flex-shrink-0" />
              <div>
                <span className="block text-lg text-gray-500">Number of Guests</span>
                <span className="block font-semibold">{numberOfGuests || 1} / {guests} {(numberOfGuests || 1) > 1 ? 'guests' : 'guest'}</span>
              </div>
            </div>

            <div className="flex items-center">
              <Clock className="w-5 h-5 text-indigo-600 mr-2 flex-shrink-0" />
              <div>
                <span className="block text-lg text-gray-500">Booked On</span>
                <span className="block font-semibold">{bookingDate || 'N/A'}</span>
              </div>
            </div>

            {arrivalTime && (
              <div className="flex items-center">
                <Watch className="w-5 h-5 text-indigo-600 mr-2 flex-shrink-0" />
                <div>
                  <span className="block text-md text-gray-500">Expected Arrival Time</span>
                  <span className="block font-semibold">{formatTime(arrivalTime)}</span>
                </div>
              </div>
            )}

            {downPayment && (
              <div className="flex items-center">
                <Watch className="w-5 h-5 text-indigo-600 mr-2 flex-shrink-0" />
                <div>
                  <span className="block text-md text-gray-500">Down Payment</span>
                  <span className="block font-semibold">{formatCurrency(downPayment)}</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* User Information - only render when available */}
        {userDetails && (
          <motion.div
            variants={itemVariants}
            className="mb-6 bg-gray-50 rounded-lg p-4"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              <User className="w-5 h-5 mr-2 text-gray-600" />
              Guest Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex flex-col">
                <span className="text-lg font-semibold text-gray-700">Name</span>
                <span className="font-medium text-lg">{userDetails.fullName}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-semibold text-gray-700">Email</span>
                <span className="font-medium text-lg">{userDetails.email}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-semibold text-gray-700">Phone Number</span>
                <span className="font-medium text-lg">{userDetails.phoneNumber}</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Special Requests - only render when available */}
        {specialRequest && (
          <motion.div
            variants={itemVariants}
            className="mb-6 bg-blue-50 rounded-lg p-4"
          >
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Special Requests</h3>
            <p className="text-blue-700">{specialRequest}</p>
          </motion.div>
        )}

        {/* Cancellation/Rejection Reason - only render when applicable */}
        {(status.toLowerCase() === 'cancelled' || status.toLowerCase() === 'rejected') && cancellationReason && (
          <motion.div
            variants={itemVariants}
            className="mb-6 bg-red-50 rounded-lg p-4"
          >
            <h3 className="text-lg font-semibold text-red-800 mb-2 flex items-center">
              <XCircle className="w-5 h-5 mr-2" />
              {status.toLowerCase() === 'cancelled' ? 'Cancellation Reason' : 'Rejection Reason'}
            </h3>
            <p className="text-red-700">{cancellationReason}</p>
            {cancellationDate && (
              <p className="text-sm text-red-500 mt-2">
                {status.toLowerCase() === 'cancelled' ? 'Cancelled on: ' : 'Rejected on: '}
                {cancellationDate}
              </p>
            )}
          </motion.div>
        )}

        {/* GCash Payment Modal */}
        {paymentProof && (
          <motion.div
            variants={itemVariants}
            className="mt-6"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              <CreditCard className="w-5 h-5 mr-2 text-gray-600" />
              GCash Payment Proof
            </h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <img
                src={paymentProof}
                alt="Payment Proof"
                className="w-full h-auto object-contain cursor-pointer transition-transform hover:scale-[1.01]"
                loading="lazy"
              />
            </div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
});

BookingCard.displayName = "BookingCard";

export default BookingCard;
