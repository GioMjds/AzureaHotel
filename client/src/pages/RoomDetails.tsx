/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowLeftIcon, ArrowRightIcon, Bookmark, Check, Home, Info, PhilippinePeso, Star, Users, X } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ReviewList from "../components/reviews/ReviewList";
import { useUserContext } from "../contexts/AuthContext";
import { MemoizedImage } from "../memo/MemoizedImage";
import RoomAndAreaDetailsSkeleton from "../motions/skeletons/RoomAndAreaDetailsSkeleton";
import { fetchAmenities } from "../services/Admin";
import { fetchRoomReviews } from "../services/Booking";
import { fetchRoomDetail } from "../services/Room";
import { Room } from "../types/RoomClient";
import Error from "./_ErrorBoundary";

const RoomDetails = () => {
  const [selectedImageIdx, setSelectedImageIdx] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const { isAuthenticated, userDetails } = useUserContext();
  const { id } = useParams<{ id: string }>();

  const navigate = useNavigate();
  const pageSize: number = 5;

  const { data: roomData, isLoading: isLoadingRoom, error: roomError } = useQuery<{ data: Room }>({
    queryKey: ["room", id],
    queryFn: () => fetchRoomDetail(id as string),
    enabled: !!id,
  });

  const { data: allAmenitiesData, isLoading: isLoadingAmenities, error: amenitiesError } = useQuery({
    queryKey: ["allAmenitiesForRoomDetails", 1, 100],
    queryFn: fetchAmenities,
  });

  const { data: reviewsData, isLoading: isLoadingReviews, error: reviewsError } = useQuery({
    queryKey: ["roomReviews", id, currentPage],
    queryFn: () => fetchRoomReviews(id as string, currentPage, pageSize),
    enabled: !!id,
  });

  if (isLoadingRoom) return <RoomAndAreaDetailsSkeleton />;
  if (roomError) return <Error />;

  const roomDetail = roomData?.data;
  if (!roomDetail) {
    return <div className="text-center mt-4">No room details available</div>;
  }

  // Image gallery state
  const images = roomDetail.images && roomDetail.images.length > 0
    ? roomDetail.images.map((img) => img.room_image)
    : [];

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedImageIdx((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedImageIdx((prev) => (prev + 1) % images.length);
  };

  const allAmenities = allAmenitiesData?.data || [];
  const getAmenityDescription = (amenityId: any) => {
    const found = allAmenities.find((a: any) => a.id === amenityId);
    return found ? found.description : `${amenityId}`;
  };

  const isBookingDisabled = (): boolean => {
    const status = roomDetail.status?.toLowerCase();
    return status === 'maintenance' || status === 'occupied' || status === 'reserved';
  };

  const reviews = reviewsData?.data || [];

  // Discount logic similar to RoomCard
  const isSeniorOrPwd = userDetails?.is_senior_or_pwd;
  const parsePrice = (val: number | string) => {
    if (!val) return null;
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      return parseFloat(val.replace(/[^\d.]/g, ''));
    }
    return null;
  };

  let displayDiscountedPrice: number | null = null;

  if (roomDetail) {
    const adminDiscounted = parsePrice(roomDetail.discounted_price);
    const seniorDiscounted = parsePrice(roomDetail.senior_discounted_price);
    const originalPrice = parsePrice(roomDetail.room_price);

    if (isSeniorOrPwd) {
      // For senior/PWD users, compare available discounts and pick the best (lowest price)
      const availableDiscounts = [];

      if (adminDiscounted !== null && adminDiscounted < originalPrice) {
        availableDiscounts.push({ price: adminDiscounted, percent: roomDetail.discount_percent ?? 0 });
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
      }
    } else {
      // For non-senior users, only apply admin discount if available
      if (adminDiscounted !== null && adminDiscounted < originalPrice) {
        displayDiscountedPrice = adminDiscounted;
      }
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 80,
        damping: 15
      }
    }
  };

  const imageVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 60,
        damping: 20,
        duration: 0.6
      }
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen bg-gradient-to-b from-gray-50 to-white"
    >
      {/* Top Back Button (History based) */}
      <div className="bg-white shadow-md py-3 px-4 sticky top-0 z-30">
        <div className="container mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors duration-300"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Go Back</span>
          </button>
        </div>
      </div>

      {/* Hero Banner with Image Gallery */}
      <div className="relative h-[60vh] md:h-[70vh] w-full overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{
            opacity: 1,
            scale: 1,
            transition: { duration: 1.2, ease: "easeOut" }
          }}
          className="absolute inset-0 bg-black/30 backdrop-blur-[2px] z-10"
        />
        {/* Main Gallery Image (no arrows here) */}
        {images.length > 0 && (
          <motion.img
            key={images[selectedImageIdx]}
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            loading="lazy"
            src={images[selectedImageIdx]}
            alt={roomDetail.room_name}
            className="absolute inset-0 h-full w-full object-cover z-10 transition-transform duration-10000"
          />
        )}

        <div className="relative z-25 h-full w-full flex flex-col justify-between">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="p-6"
          >
            <motion.button
              variants={itemVariants}
              onClick={() => navigate(-1)}
              className="inline-flex cursor-pointer items-center gap-2 mt-2 px-4 py-2 rounded-full bg-indigo-600/80 backdrop-blur-md text-white hover:bg-indigo-700/90 transition-all duration-300 shadow-lg"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Rooms</span>
            </motion.button>
          </motion.div>

          {/* Room Name */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7 }}
            className="p-6 md:p-8 text-center"
          >
            <h1 className="font-playfair text-4xl md:text-6xl lg:text-8xl font-bold text-white drop-shadow-lg">
              {roomDetail.room_name}
            </h1>
          </motion.div>
        </div>
      </div>

      {/* Content Section */}
      <motion.div
        variants={containerVariants}
        className="container mx-auto py-12 px-4 sm:px-6 relative z-10 -mt-8"
      >
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* Left Column - Room Details */}
          <motion.div
            variants={itemVariants}
            className="lg:col-span-2 space-y-8"
          >
            {/* Main Card */}
            <motion.div
              variants={imageVariants}
              className="bg-white rounded-xl overflow-hidden shadow-xl"
            >
              <div className="p-8">
                <h2 className="text-3xl font-playfair font-bold text-gray-800 mb-6 flex items-center">
                  <Info className="mr-3 text-blue-600" />
                  About This Room
                </h2>

                <p className="text-lg text-gray-700 leading-relaxed font-light mb-8">
                  {roomDetail.description}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mr-4">
                      <Users className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Max Guests</h3>
                      <p className="text-gray-600">{roomDetail.max_guests} people</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mr-4">
                      <PhilippinePeso className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Pricing</h3>
                      {displayDiscountedPrice && parsePrice(displayDiscountedPrice) !== parsePrice(roomDetail.room_price) ? (
                        <div className="space-y-1">
                          <div className="text-gray-400 line-through text-sm">
                            {roomDetail.room_price}
                          </div>
                          <div className="text-green-600 font-semibold text-lg">
                            {displayDiscountedPrice?.toLocaleString("en-PH", { style: "currency", currency: "PHP" })}
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-600 text-lg font-semibold">
                          {roomDetail.room_price}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Amenities Card */}
            <motion.div
              variants={itemVariants}
              className="bg-white rounded-xl p-8 shadow-lg"
            >
              <h2 className="text-2xl font-playfair font-bold text-gray-800 mb-6">
                Amenities & Features
              </h2>

              {isLoadingAmenities ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
              ) : amenitiesError ? (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg">
                  Failed to load amenities
                </div>
              ) : roomDetail.amenities.length === 0 ? (
                <p className="text-gray-500 italic">No amenities listed for this room</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {roomDetail.amenities.map((amenityId: any) => (
                    <div
                      key={amenityId}
                      className="flex items-start"
                    >
                      <Check className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{getAmenityDescription(amenityId.description)}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Reviews Card */}
            <motion.div
              variants={itemVariants}
              className="bg-white rounded-xl p-8 shadow-lg"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-playfair font-bold text-gray-800 flex items-center">
                  <Star className="mr-3 text-yellow-500" />
                  Guest Reviews
                </h2>

                <div className="flex items-center gap-2">
                  <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                  <span className="text-indigo-600 text-2xl font-bold drop-shadow-md">
                    {roomDetail.average_rating?.toFixed(1) || '0.0'}
                  </span>
                  <span className="text-gray-500 text-lg">({reviewsData?.total || 0} reviews)</span>
                </div>
              </div>

              <ReviewList
                reviews={reviews}
                isLoading={isLoadingReviews}
                error={reviewsError}
                currentPage={currentPage}
                totalPages={Math.ceil(reviewsData?.total / pageSize)}
                onPageChange={setCurrentPage}
              />
            </motion.div>
          </motion.div>

          {/* Right Column - Booking Card */}
          <motion.div
            variants={itemVariants}
            className="lg:col-span-1 space-y-6"
          >
            {/* Image with navigation arrows */}
            <motion.div
              variants={imageVariants}
              className="bg-white p-4 rounded-xl shadow-lg overflow-hidden relative flex items-center justify-center h-56"
            >
              <MemoizedImage
                src={images[selectedImageIdx]}
                alt={roomDetail.room_name}
                className="w-full h-full object-contain rounded-lg transition-all duration-500"
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute cursor-pointer left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-indigo-700 rounded-full p-1 shadow z-20"
                    aria-label="Previous image"
                  >
                    <ArrowLeftIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute cursor-pointer right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-indigo-700 rounded-full p-1 shadow z-20"
                    aria-label="Next image"
                  >
                    <ArrowRightIcon className="w-5 h-5" />
                  </button>
                </>
              )}
            </motion.div>

            {/* Booking Card */}
            <motion.div
              variants={itemVariants}
              className="bg-white rounded-xl overflow-hidden shadow-lg sticky top-24"
            >
              <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-700 text-white">
                <h3 className="text-4xl font-bold">Book Your Stay</h3>
              </div>

              <div className="p-6">
                {/* Room Information */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <Home className="w-5 h-5 text-blue-500 mr-3" />
                    <div>
                      <h4 className="font-medium text-gray-800">Room Type</h4>
                      <p className="text-indigo-600 text-lg font-semibold">{roomDetail.room_type.toUpperCase()}</p>
                    </div>
                  </div>

                  {/* Bed Type */}
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <h4 className="font-medium text-gray-800">Bed Type</h4>
                      <p className="text-gray-900 text-lg font-semibold capitalize">{roomDetail.bed_type || "Standard"}</p>
                    </div>
                  </div>
                </div>

                {isBookingDisabled() ? (
                  <div className="relative">
                    <button
                      disabled
                      className="w-full py-4 bg-gray-400 text-white font-bold text-lg rounded-lg flex items-center justify-center cursor-not-allowed transition-all"
                    >
                      <X className="w-5 h-5 mr-2" />
                      Currently Not Available
                    </button>
                    <div className="mt-2 text-center text-sm text-red-500">
                      This room is currently {roomDetail.status.toLowerCase()}
                    </div>
                  </div>
                ) : (
                  <Link to={`/booking/${roomDetail.id}`} className="block">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className={`w-full py-4 px-6 ${isAuthenticated
                        ? "bg-gradient-to-r cursor-pointer from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                        : "bg-gray-400 cursor-not-allowed"
                        } text-white font-bold text-lg rounded-lg transition-all duration-300 flex items-center justify-center`}
                      disabled={!isAuthenticated}
                    >
                      {isAuthenticated ? (
                        <>
                          <Bookmark className="w-5 h-5 mr-2" />
                          Book Now
                        </>
                      ) : (
                        "Login to Book"
                      )}
                    </motion.button>
                  </Link>
                )}

                {!isAuthenticated && !isBookingDisabled() && (
                  <p className="mt-3 text-center text-sm text-gray-500">
                    Please login to make a reservation
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default RoomDetails;
