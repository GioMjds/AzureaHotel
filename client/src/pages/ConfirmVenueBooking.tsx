/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, BookCheck } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import GCashPaymentModal from "../components/bookings/GCashPaymentModal";
import LoginModal from "../components/LoginModal";
import Modal from "../components/Modal";
import SignupModal from "../components/SignupModal";
import { useUserContext } from "../contexts/AuthContext";
import EventLoader from "../motions/loaders/EventLoader";
import { createReservation, fetchAreaById } from "../services/Booking";
import { AreaData, FormData, ReservationFormData } from "../types/BookingClient";
import { calculateAreaPricing } from "../utils/pricingUtils";

const ConfirmVenueBooking = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, userDetails } = useUserContext();

  const areaId = searchParams.get("areaId");
  const startTime = searchParams.get("startTime");
  const endTime = searchParams.get("endTime");
  const totalPrice = searchParams.get("totalPrice");

  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [showSignupModal, setShowSignupModal] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [pendingFormData, setPendingFormData] = useState<ReservationFormData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [gcashProof, setGcashProof] = useState<File | null>(null);
  const [gcashPreview, setGcashPreview] = useState<string | null>(null);
  const [showGCashModal, setShowGCashModal] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    trigger
  } = useForm<FormData>({
    mode: "onBlur",
    defaultValues: {
      firstName: userDetails.first_name || "",
      lastName: userDetails.last_name || "",
      phoneNumber: "",
      numberOfGuests: 1,
      specialRequests: "",
      paymentMethod: 'gcash',
    },
  });

  const firstName = watch("firstName");
  const lastName = watch("lastName");
  const phoneNumber = watch("phoneNumber");
  const numberOfGuests = watch("numberOfGuests");
  const paymentMethod = watch('paymentMethod')

  const { data: areaData, isLoading } = useQuery<AreaData>({
    queryKey: ["area", areaId],
    queryFn: () => fetchAreaById(areaId as string),
    enabled: !!areaId,
  });

  useMemo(() => {
    if (!areaId || !startTime || !endTime) navigate("/areas");
  }, [areaId, startTime, endTime, navigate]);

  const formatDateTime = (dateTimeString: string | null) => {
    if (!dateTimeString) return "";
    const date = new Date(dateTimeString);
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const day = days[date.getDay()];
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const formatted = `${day}, ${date.getDate()} ${monthNames[date.getMonth()]
      }, ${date.getFullYear()} at ${date.getHours() % 12 || 12}:${date
        .getMinutes()
        .toString()
        .padStart(2, "0")} ${date.getHours() >= 12 ? "PM" : "AM"}`;
    return formatted;
  };

  const formattedStartTime = formatDateTime(startTime);
  const formattedEndTime = formatDateTime(endTime);

  const onSubmit: SubmitHandler<FormData> = (data) => {
    if (isSubmitting) return;
    if (paymentMethod === 'gcash' && !gcashProof) {
      alert("Please upload GCash payment proof");
      return;
    }
    if (!areaId || !startTime || !endTime || !totalPrice) {
      alert("Missing booking information. Please try again.");
      return;
    }

    let finalPrice = parseFloat(totalPrice);

    if (areaData) {
      const pricingResult = calculateAreaPricing({
        areaData: areaData,
        userDetails,
        hours: 1
      });

      finalPrice = pricingResult.finalPrice;
    }

    const reservationData: ReservationFormData = {
      firstName: data.firstName,
      lastName: data.lastName,
      phoneNumber: data.phoneNumber.replace(/\s+/g, ""),
      specialRequests: data.specialRequests || "",
      areaId: areaId!,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      totalPrice: finalPrice,
      status: "pending",
      isVenueBooking: true,
      numberOfGuests: data.numberOfGuests,
      paymentMethod: "gcash",
      paymentProof: gcashProof
    };

    setPendingFormData(reservationData);
    setShowConfirmModal(true);
  };

  const handleConfirmBooking = async () => {
    if (!pendingFormData) return;

    if (paymentMethod === 'gcash') {
      if (!gcashProof) {
        alert("Please upload GCash payment proof");
        return;
      }
    }

    setShowConfirmModal(false);
    setIsSubmitting(true);

    try {
      const response = await createReservation(pendingFormData);
      navigate(`/booking-accepted?bookingId=${response.id}&isVenue=true`);
    } catch (error: any) {
      console.error(`Error creating reservation: ${error}`);
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = isSubmitting ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [isSubmitting]);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.1,
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: { duration: 0.3 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10,
      },
    },
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl mt-16">
        <h1 className="text-2xl md:text-3xl font-bold text-center mb-8">
          Confirm Area Booking
        </h1>
        <div className="text-center py-10">
          <div
            className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
            role="status"
          >
            <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
              Loading...
            </span>
          </div>
          <p className="mt-2 text-gray-600">Loading area details...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {isSubmitting && (
          <EventLoader text="Processing your booking..." type="reserve" />
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <Modal
        icon="fa-solid fa-book"
        title="Confirm Your Area Booking"
        description={`You're about to book ${areaData?.area_name} for ${formattedStartTime} to ${formattedEndTime}. The total price is ₱${parseFloat(totalPrice).toLocaleString()}. Would you like to proceed?`}
        cancel={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmBooking}
        confirmText={
          <div className="flex items-center">
            <BookCheck className="mr-2 h-5 w-5" />
            Book Now
          </div>
        }
        cancelText="Cancel"
        isOpen={showConfirmModal}
        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-md uppercase font-bold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 cursor-pointer flex items-center"
      />

      <GCashPaymentModal
        isOpen={showGCashModal}
        onClose={() => {
          setShowGCashModal(false);
          if (!gcashProof) {
            setValue('paymentMethod', 'physical');
            trigger('paymentMethod')
          }
        }}
        onProofSubmit={(file, preview) => {
          setGcashProof(file);
          setGcashPreview(preview);
          setValue('paymentMethod', 'gcash', { shouldValidate: true });
          setShowGCashModal(false);
        }}
        initialPreview={gcashPreview}
        totalPrice={totalPrice ? parseFloat(totalPrice) : undefined}
      />

      <motion.div
        className="container mx-auto px-4 py-8 max-w-7xl mt-16"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <div className="flex justify-between items-center mb-8">
          <motion.button
            variants={itemVariants}
            onClick={() => navigate(-1)}
            className="flex items-center cursor-pointer gap-2 px-4 py-2 rounded-lg bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors duration-300"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Go Back</span>
          </motion.button>
          <motion.h1
            className="text-2xl md:text-3xl font-bold text-center bg-gradient-to-r from-blue-600 to-indigo-800 bg-clip-text text-transparent"
            variants={itemVariants}
          >
            Confirm Booking
          </motion.h1>
          <div className="w-[100px]"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section - Takes 2/3 width on large screens */}
          <motion.div className="lg:col-span-2" variants={itemVariants}>
            <motion.form
              id="booking-form"
              onSubmit={(e: FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                handleSubmit(onSubmit)();
              }}
              className="rounded-lg shadow-xl p-6 backdrop-blur-sm bg-white/90 border border-gray-100"
              whileHover={{
                boxShadow:
                  "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              }}
              transition={{ type: "spring", stiffness: 100, damping: 10 }}
            >
              <motion.h2
                className="text-xl font-semibold mb-4 text-blue-800"
                variants={itemVariants}
              >
                Enter Your Booking Details
              </motion.h2>

              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <motion.div variants={itemVariants}>
                  <label
                    htmlFor="firstName"
                    className="block text-md font-medium text-gray-700 mb-1"
                  >
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    {...register("firstName", {
                      required: "First name is required",
                      pattern: {
                        value: /^[A-Za-z\s]+$/,
                        message: "Name should contain only letters and spaces",
                      },
                      minLength: {
                        value: 2,
                        message: "Name must be at least 2 characters long",
                      },
                    })}
                    className={`w-full px-3 py-2 border ${errors.firstName ? "border-red-500" : "border-gray-300"
                      } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 transition-all duration-300`}
                  />
                  {errors.firstName && (
                    <motion.p
                      className="text-red-500 text-sm mt-1"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      {errors.firstName.message}
                    </motion.p>
                  )}
                </motion.div>
                <motion.div variants={itemVariants}>
                  <label
                    htmlFor="lastName"
                    className="block text-md font-medium text-gray-700 mb-1"
                  >
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    {...register("lastName", {
                      required: "Last name is required",
                      pattern: {
                        value: /^[A-Za-z\s]+$/,
                        message: "Name should contain only letters and spaces",
                      },
                      minLength: {
                        value: 2,
                        message: "Name must be at least 2 characters long",
                      },
                    })}
                    className={`w-full px-3 py-2 border ${errors.lastName ? "border-red-500" : "border-gray-300"
                      } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 transition-all duration-300`}
                  />
                  {errors.lastName && (
                    <motion.p
                      className="text-red-500 text-sm mt-1"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      {errors.lastName.message}
                    </motion.p>
                  )}
                </motion.div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label
                    htmlFor="phoneNumber"
                    className="block text-md font-medium text-gray-700 mb-1"
                  >
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    {...register("phoneNumber", {
                      required: "Phone number is required",
                      validate: (value) => {
                        const cleanedValue = value.replace(/[^\d+]/g, "");
                        const phPattern = /^(\+639\d{9}|09\d{9})$/;
                        if (!phPattern.test(cleanedValue))
                          return "Phone number must be a Philippine number.";
                        return true;
                      },
                    })}
                    className={`w-full px-3 py-2 border ${errors.phoneNumber ? "border-red-500" : "border-gray-300"
                      } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 transition-all duration-300`}
                  />
                  {errors.phoneNumber && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.phoneNumber.message}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Must be a PH phone number (e.g., +639XXXXXXXXX or
                    09XXXXXXXXX)
                  </p>
                </div>

                {/* Number of Guests */}
                <div>
                  <label
                    htmlFor="numberOfGuests"
                    className="block text-md font-medium text-gray-700 mb-1"
                  >
                    Number of Guests <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="numberOfGuests"
                    {...register("numberOfGuests", {
                      required: "Number of guests is required",
                      min: {
                        value: 1,
                        message: "At least 1 guest is required",
                      },
                      max: {
                        value: areaData?.capacity,
                        message: `Maximum capacity is ${areaData?.capacity} guests`,
                      },
                    })}
                    min="1"
                    className={`w-full px-3 py-2 border ${errors.numberOfGuests
                      ? "border-red-500"
                      : "border-gray-300"
                      } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 transition-all duration-300`}
                  />
                  {errors.numberOfGuests && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.numberOfGuests.message}
                    </p>
                  )}
                  {areaData?.capacity && (
                    <p className="mt-1 text-sm text-gray-500">
                      Max guests: {areaData.capacity} guests
                    </p>
                  )}
                </div>
              </div>

              {/* GCash Payment Proof */}
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-4">
                <div>
                  <label className="block text-md font-medium text-gray-700 mb-1">
                    GCash Payment Proof <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowGCashModal(true)}
                    className="w-full py-2 px-3 border border-gray-300 rounded-md bg-gray-50 hover:bg-gray-100 cursor-pointer"
                  >
                    Upload Payment Proof
                  </button>
                  {gcashPreview && (
                    <div className="mt-2 relative">
                      <img
                        src={gcashPreview}
                        alt="Payment Proof for GCash"
                        className="w-full h-auto object-contain"
                        loading="lazy"
                      />
                      <button
                        onClick={() => {
                          setGcashPreview(null);
                          setGcashProof(null);
                          setValue('paymentMethod', 'physical', { shouldValidate: true });
                        }}
                        className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-md hover:bg-gray-100 cursor-pointer"
                        aria-label="Remove image"
                      >
                        <svg
                          className="w-4 h-4 text-red-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Booking Times */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label
                    htmlFor="startTime"
                    className="block text-md font-medium text-gray-700 mb-1"
                  >
                    Start Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="startTime"
                    name="startTime"
                    disabled
                    value={formattedStartTime}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 transition-all duration-300"
                  />
                </div>
                <div>
                  <label
                    htmlFor="endTime"
                    className="block text-md font-medium text-gray-700 mb-1"
                  >
                    End Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="endTime"
                    name="endTime"
                    disabled
                    value={formattedEndTime}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 transition-all duration-300"
                  />
                </div>
              </div>

              <motion.div variants={itemVariants} className="mb-4">
                <label
                  htmlFor="specialRequests"
                  className="block text-md font-medium text-gray-700 mb-1"
                >
                  Special Requests
                </label>
                <textarea
                  id="specialRequests"
                  {...register("specialRequests")}
                  rows={4}
                  className="w-full px-3 py-2 resize-none border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 transition-all duration-300"
                  placeholder="Any special requirements or notes for your stay..."
                />
              </motion.div>

              {/* Submit Button for Mobile View */}
              <div className="lg:hidden mt-6">
                <motion.button
                  type="button"
                  onClick={() => handleSubmit(onSubmit)()}
                  disabled={isSubmitting}
                  className={`w-full py-3 px-6 rounded-md text-white text-center cursor-pointer font-semibold ${isSubmitting
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg"
                    }`}
                  whileTap={{ scale: 0.98 }}
                  whileHover={{
                    boxShadow:
                      "0 10px 15px -3px rgba(59, 130, 246, 0.3), 0 4px 6px -4px rgba(59, 130, 246, 0.3)",
                  }}
                >
                  {isSubmitting ? (
                    ""
                  ) : isAuthenticated ? (
                    <div className="flex items-center justify-center">
                      <BookCheck className="w-5 h-5 mr-2" />
                      Complete Booking
                    </div>
                  ) : (
                    "Continue to Login"
                  )}
                </motion.button>
              </div>
            </motion.form>
          </motion.div>

          {/* Sidebar - Takes 1/3 width on large screens */}
          <motion.div className="lg:col-span-1" variants={itemVariants}>
            {/* Venue Information */}
            <motion.div
              className="rounded-lg shadow-md p-6 mb-6 backdrop-blur-sm bg-white/90 border border-gray-100"
              whileHover={{
                boxShadow:
                  "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              }}
              transition={{ type: "spring", stiffness: 100, damping: 10 }}
            >
              <div className="relative mb-4 overflow-hidden rounded-md">
                <motion.img
                  loading="lazy"
                  src={areaData?.images[0].area_image}
                  alt={areaData?.area_name}
                  className="w-full h-40 object-cover rounded-md"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <motion.h3
                className="text-2xl font-semibold mb-4 bg-gradient-to-r from-blue-600 to-indigo-800 bg-clip-text text-transparent"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {areaData?.area_name}
              </motion.h3>

              {/* Additional Venue Details */}
              <motion.div
                className="border-t pt-3 space-y-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex justify-between">
                  <span className="text-gray-600 text-lg">Max Guests:</span>
                  <span className="font-semibold text-lg">
                    {areaData?.capacity} people
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-lg">Price:</span>
                  <span className="font-semibold text-lg">
                    {areaData?.price_per_hour}
                  </span>
                </div>
              </motion.div>
            </motion.div>

            {/* Booking Details */}
            <motion.div
              className="rounded-lg shadow-md p-6 mb-6 backdrop-blur-sm bg-white/90 border border-gray-100"
              variants={itemVariants}
              whileHover={{
                boxShadow:
                  "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              }}
              transition={{ type: "spring", stiffness: 100, damping: 10 }}
            >
              <motion.h3
                className="text-xl font-semibold mb-4 bg-gradient-to-r from-blue-600 to-indigo-800 bg-clip-text text-transparent"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Your Booking Details
              </motion.h3>

              <div className="grid grid-cols-1 gap-2 mb-2">
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <p className="text-lg text-gray-800">
                    Name: <span className="font-semibold">{firstName} {lastName}</span>
                  </p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <p className="text-lg text-gray-800">
                    Phone Number: <span className="font-semibold">{phoneNumber}</span>
                  </p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <p className="text-lg text-gray-800">
                    Number of Guests: <span className="font-semibold">{numberOfGuests} {numberOfGuests <= 1 ? "guest" : "guests"}</span>
                  </p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <p className="text-lg text-gray-800">
                    Start: <span className="font-semibold">{formattedStartTime}</span>
                  </p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <p className="text-lg text-gray-800">
                    End: <span className="font-semibold">{formattedEndTime}</span>
                  </p>
                </motion.div>
              </div>
            </motion.div>

            {/* Pricing Summary */}
            <motion.div
              className="rounded-lg shadow-md p-6 mb-6 backdrop-blur-sm bg-white/90 border border-gray-100"
              variants={itemVariants}
              whileHover={{
                boxShadow:
                  "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              }}
              transition={{ type: "spring", stiffness: 100, damping: 10 }}
            >
              <motion.h3
                className="text-xl font-semibold mb-4 bg-gradient-to-r from-blue-600 to-indigo-800 bg-clip-text text-transparent"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Pricing Summary
              </motion.h3>
              <motion.div
                className="border-t pt-3 flex justify-between items-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
              >
                <span className="font-semibold text-2xl">Total Price:</span>
                <motion.span
                  className="font-bold text-blue-600 text-2xl"
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                >
                  ₱{parseFloat(totalPrice).toLocaleString()}
                </motion.span>
              </motion.div>
            </motion.div>

            <div className="hidden lg:block">
              <motion.button
                type="button"
                onClick={() => handleSubmit(onSubmit)()}
                disabled={isSubmitting || (paymentMethod === 'gcash' && !gcashProof)}
                className={`w-full py-3 px-6 rounded-md text-white text-center text-xl font-semibold flex items-center justify-center ${isSubmitting
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-500 to-indigo-500 cursor-pointer hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg"
                  }`}
                variants={itemVariants}
                whileTap={{ scale: 0.98 }}
                whileHover={{
                  boxShadow:
                    "0 10px 15px -3px rgba(59, 130, 246, 0.3), 0 4px 6px -4px rgba(59, 130, 246, 0.3)",
                }}
              >
                {isSubmitting ? (
                  ""
                ) : isAuthenticated ? (
                  <>
                    <BookCheck className="w-8 h-8 mr-2" />
                    Complete Booking
                  </>
                ) : (
                  "Continue to Login"
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Login Modal */}
        <AnimatePresence>
          {showLoginModal && (
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <LoginModal
                toggleLoginModal={() => setShowLoginModal(false)}
                openSignupModal={() => setShowSignupModal(true)}
                onSuccessfulLogin={handleConfirmBooking}
                bookingInProgress={true}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Signup Modal */}
        <AnimatePresence>
          {showSignupModal && (
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <SignupModal
                openLoginModal={() => setShowLoginModal(true)}
                toggleRegisterModal={() => setShowSignupModal(false)}
                onSuccessfulSignup={handleConfirmBooking}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
};

export default ConfirmVenueBooking;
