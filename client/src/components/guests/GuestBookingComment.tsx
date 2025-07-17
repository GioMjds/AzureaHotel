import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Send, Star, X } from "lucide-react";
import { FC, useState } from "react";
import { toast } from "react-toastify";
import { createReview } from "../../services/Booking";
import { GuestBookingCommentProps } from "../../types/BookingGuest";

const GuestBookingComment: FC<GuestBookingCommentProps> = ({ bookingId, isOpen, onClose, bookingDetails }) => {
    const [rating, setRating] = useState<number>(0);
    const [hoverRating, setHoverRating] = useState<number>(0);
    const [comment, setComment] = useState<string>("");
    const queryClient = useQueryClient();

    const reviewMutation = useMutation({
        mutationFn: () => createReview(bookingId, {
            review_text: comment,
            rating
        }),
        onSuccess: () => {
            toast.success("Thank you for your feedback!");
            queryClient.invalidateQueries({ queryKey: ['userBookings'] });
            queryClient.invalidateQueries({ queryKey: ['guestBookings'] });
            queryClient.invalidateQueries({ queryKey: ['bookingDetails', bookingId] });
            queryClient.invalidateQueries({ queryKey: ['userReviews'] });
            setRating(0);
            setComment("");
            onClose();
        },
        onError: () => {
            toast.error("Failed to submit review");
        }
    });

    const handleSubmit = () => {
        if (rating === 0) {
            toast.error("Please select a rating");
            return;
        }

        if (comment.trim() === "") {
            toast.error("Please provide feedback");
            return;
        }

        reviewMutation.mutate();
    };

    const handleRatingClick = (value: number) => setRating(value);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                duration: 0.3,
                staggerChildren: 0.1
            }
        },
        exit: {
            opacity: 0,
            transition: {
                duration: 0.2
            }
        }
    };

    const modalVariants = {
        hidden: { y: 50, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: "spring",
                damping: 25,
                stiffness: 300
            }
        },
        exit: {
            y: 50,
            opacity: 0,
            transition: {
                duration: 0.3
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: "spring",
                damping: 25,
                stiffness: 300
            }
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onClick={onClose}
            >
                <motion.div
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
                    variants={modalVariants}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
                        <motion.h3
                            className="text-xl font-bold text-gray-800 dark:text-white"
                            variants={itemVariants}
                        >
                            Leave Your Feedback
                        </motion.h3>
                        <motion.button
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white focus:outline-none"
                            onClick={onClose}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <X size={24} />
                        </motion.button>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                        {/* Booking details */}
                        {bookingDetails && (
                            <motion.div
                                className="mb-6 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg"
                                variants={itemVariants}
                            >
                                <p className="text-sm text-blue-800 dark:text-blue-300">
                                    {bookingDetails.propertyType === "room" ? "Room" : "Venue"}:
                                    <span className="font-semibold ml-1">{bookingDetails.propertyName}</span>
                                </p>
                                <p className="text-sm text-blue-800 dark:text-blue-300">
                                    Stay: <span className="font-semibold">{new Date(bookingDetails.checkInDate).toLocaleDateString()} - {new Date(bookingDetails.checkOutDate).toLocaleDateString()}</span>
                                </p>
                            </motion.div>
                        )}

                        {/* Star Rating */}
                        <motion.div
                            className="mb-6 text-center"
                            variants={itemVariants}
                        >
                            <p className="mb-3 text-gray-700 dark:text-gray-300">How would you rate your experience?</p>
                            <div className="flex justify-center space-x-2">
                                {[1, 2, 3, 4, 5].map((value) => (
                                    <motion.button
                                        key={value}
                                        className="focus:outline-none"
                                        onClick={() => handleRatingClick(value)}
                                        onMouseEnter={() => setHoverRating(value)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        whileHover={{ scale: 1.2 }}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        <Star
                                            size={32}
                                            className={`${(hoverRating || rating) >= value
                                                ? "fill-yellow-400 text-yellow-400"
                                                : "text-gray-300 dark:text-gray-600"
                                                } transition-colors duration-200`}
                                        />
                                    </motion.button>
                                ))}
                            </div>
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                {rating > 0 ? (
                                    rating === 5 ? "Excellent!" :
                                        rating === 4 ? "Very Good!" :
                                            rating === 3 ? "Good" :
                                                rating === 2 ? "Fair" : "Poor"
                                ) : "Select a rating"}
                            </p>
                        </motion.div>

                        {/* Comment Box */}
                        <motion.div className="mb-6" variants={itemVariants}>
                            <label htmlFor="comment" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                Share your experience
                            </label>
                            <textarea
                                id="comment"
                                rows={4}
                                className="w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="Tell us about your stay..."
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                            ></textarea>
                        </motion.div>
                    </div>

                    {/* Footer */}
                    <motion.div
                        className="flex justify-end p-5 border-t border-gray-200 dark:border-gray-700"
                        variants={itemVariants}
                    >
                        <motion.button
                            className="px-6 py-2.5 bg-gray-300 cursor-pointer dark:bg-gray-700 text-gray-700 dark:text-white rounded-lg mr-2 font-medium focus:outline-none"
                            onClick={onClose}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            disabled={reviewMutation.isPending}
                        >
                            Cancel
                        </motion.button>
                        <motion.button
                            className="px-6 py-2.5 bg-blue-600 cursor-pointer text-white rounded-lg font-medium focus:outline-none flex items-center justify-center min-w-[120px]"
                            onClick={handleSubmit}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            disabled={reviewMutation.isPending}
                        >
                            {reviewMutation.isPending ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <>
                                    <Send size={18} className="mr-2" />
                                    Submit
                                </>
                            )}
                        </motion.button>
                    </motion.div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default GuestBookingComment;