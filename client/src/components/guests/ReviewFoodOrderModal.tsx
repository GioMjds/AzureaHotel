import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { ChefHat, Star, X } from "lucide-react";
import { FC, useState } from "react";
import { toast } from "react-toastify";
import { FoodOrder, reviewFoodOrder, ReviewFoodOrderData } from "../../services/Food";

interface ReviewFoodOrderModalProps {
    order: FoodOrder | null;
    visible: boolean;
    onClose: () => void;
}

const ReviewFoodOrderModal: FC<ReviewFoodOrderModalProps> = ({ order, visible, onClose }) => {
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [comment, setComment] = useState("");
    const queryClient = useQueryClient();

    const reviewMutation = useMutation({
        mutationFn: (reviewData: ReviewFoodOrderData) => reviewFoodOrder(reviewData),
        onSuccess: (data) => {
            toast.success(data.message || "Review submitted successfully!");
            queryClient.invalidateQueries({ queryKey: ['guestFoodOrders'] });
            queryClient.invalidateQueries({ queryKey: ['userFoodOrderReviews'] });
            queryClient.invalidateQueries({ queryKey: ['reviewableFoodOrders'] });
            handleClose();
        },
        onError: (error: Error & { response?: { data?: { error?: string } } }) => {
            toast.error(error?.response?.data?.error || "Failed to submit review");
        },
    });

    const ratingText = (rating: number) => {
        switch (rating) {
            case 1: return "Poor";
            case 2: return "Fair";
            case 3: return "Good";
            case 4: return "Very Good";
            case 5: return "Excellent";
            default: return "";
        }
    }

    const handleClose = () => {
        setRating(0);
        setHoveredRating(0);
        setComment("");
        onClose();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!order) return;
        if (rating === 0) {
            toast.error("Please select a rating");
            return;
        }

        const reviewData: ReviewFoodOrderData = {
            order_id: parseInt(order.order_id),
            rating,
            comment: comment.trim() || undefined,
        };

        reviewMutation.mutate(reviewData);
    };

    const renderStars = () => {
        return [...Array(5)].map((_, index) => {
            const starValue = index + 1;
            return (
                <button
                    key={index}
                    type="button"
                    className={`transition-colors duration-200 ${starValue <= (hoveredRating || rating)
                            ? "text-yellow-400"
                            : "text-gray-300"
                        }`}
                    onClick={() => setRating(starValue)}
                    onMouseEnter={() => setHoveredRating(starValue)}
                    onMouseLeave={() => setHoveredRating(0)}
                >
                    <Star className="w-8 h-8 fill-current" />
                </button>
            );
        });
    };

    if (!order) return null;

    return (
        <AnimatePresence mode="wait">
            {visible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 relative"
                    >
                        <div className="p-6">
                            <button
                                className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                                onClick={handleClose}
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="flex items-center gap-3 mb-6">
                                <ChefHat className="w-8 h-8 text-emerald-600" />
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">Review Your Order</h2>
                                    <p className="text-sm text-gray-600">Order #{order.order_id}</p>
                                </div>
                            </div>

                            {/* Order Summary */}
                            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                                <div className="space-y-2 mb-3">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-sm">
                                            <span>{item.name} x{item.quantity}</span>
                                            <span>₱{(item.price * item.quantity).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="border-t pt-2 flex justify-between font-semibold">
                                    <span>Total:</span>
                                    <span className="text-emerald-600">₱{order.total_amount.toFixed(2)}</span>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit}>
                                {/* Rating */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        How was your food? *
                                    </label>
                                    <div className="flex justify-center gap-1 mb-2">
                                        {renderStars()}
                                    </div>
                                    <div className="text-center">
                                        <span className="text-sm text-gray-500">
                                            {ratingText(rating)}
                                        </span>
                                    </div>
                                </div>

                                {/* Comment */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Share your experience (optional)
                                    </label>
                                    <textarea
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                                        rows={4}
                                        placeholder="Tell us about your food experience..."
                                        maxLength={500}
                                    />
                                    <div className="text-right text-xs text-gray-500 mt-1">
                                        {comment.length}/500
                                    </div>
                                </div>

                                {/* Submit Buttons */}
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                        disabled={reviewMutation.isPending}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:bg-gray-400"
                                        disabled={reviewMutation.isPending || rating === 0}
                                    >
                                        {reviewMutation.isPending ? "Submitting..." : "Submit Review"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ReviewFoodOrderModal;
