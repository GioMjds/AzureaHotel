import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, ChefHat, Clock, MapPin, X } from "lucide-react";
import { FC } from "react";
import { fetchCraveOnFoods, fetchFoodOrders } from "../../services/Food";
import { FoodItem, FoodOrder, ViewFoodOrderModalProps } from "../../types/GuestProfileClient";

const ViewFoodOrderModal: FC<ViewFoodOrderModalProps> = ({ orderId, visible, onClose }) => {
    const { data, isLoading, error } = useQuery({
        queryKey: ['foodOrderDetails', orderId],
        queryFn: () => fetchFoodOrders(),
    });

    const { data: foodData } = useQuery({
        queryKey: ["craveOnFoods"],
        queryFn: () => fetchCraveOnFoods(),
        enabled: visible,
    });

    const order: FoodOrder = data?.data?.find((o: FoodOrder) => o.order_id === orderId);

    const getItemImageData = (item: FoodItem) => {
        if (item.image && item.image.trim() !== '') {
            return {
                image: item.image,
                image_mime: item.image_mime || 'image/jpeg'
            };
        }

        // Otherwise, try to find it in the food data
        if (foodData?.data) {
            const foodItem = foodData.data.find((food: FoodItem) => food.item_id === item.item_id);
            if (foodItem && foodItem.image) {
                return {
                    image: foodItem.image,
                    image_mime: foodItem.image_mime || 'image/jpeg'
                };
            }
        }

        return { image: null, image_mime: null };
    };

    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), 'MMM dd, yyyy • hh:mm a');
        } catch {
            return dateString;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'preparing':
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'processing':
                return 'bg-blue-100 text-blue-800 border-blue-300';
            case 'ready':
                return 'bg-green-100 text-green-800 border-green-300';
            case 'completed':
                return 'bg-emerald-100 text-emerald-800 border-emerald-300';
            case 'reviewed':
                return 'bg-purple-100 text-purple-800 border-purple-300';
            case 'delivered':
                return 'bg-blue-100 text-blue-800 border-blue-300';
            case 'cancelled':
                return 'bg-red-100 text-red-800 border-red-300';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    return (
        <AnimatePresence>
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
                        className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto"
                    >
                        <button
                            className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                            onClick={onClose}
                        >
                            <X className="w-5 h-5" />
                        </button>
                        {isLoading ? (
                            <div className="flex flex-col items-center py-8">
                                <ChefHat className="w-10 h-10 text-emerald-600 mb-2" />
                                <p className="text-gray-600">Loading food order details...</p>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center py-8">
                                <ChefHat className="w-10 h-10 text-red-500 mb-2" />
                                <p className="text-gray-600">Failed to load order details.</p>
                            </div>
                        ) : !order ? (
                            <div className="flex flex-col items-center py-8">
                                <ChefHat className="w-10 h-10 text-gray-400 mb-2" />
                                <p className="text-gray-600">Order not found.</p>
                            </div>
                        ) : (
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-gray-800">Order #{order.order_id}</h2>
                                    <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
                                        {order.status}
                                    </div>
                                </div>

                                {order.booking_info && (
                                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                                        <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                            <MapPin className="w-4 h-4" />
                                            Food Order Details
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <span className="font-medium">Location:</span> {order.booking_info.room_name || order.booking_info.area_name}
                                            </div>
                                            <div>
                                                <span className="font-medium">Type:</span> {order.booking_info.is_venue_booking ? 'Venue' : 'Room'}
                                            </div>
                                            <div className="col-span-1 sm:col-span-2">
                                                <span className="font-medium">Duration:</span> {formatDate(order.booking_info.check_in_date)} - {formatDate(order.booking_info.check_out_date)}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="mb-6">
                                    <h3 className="font-semibold text-gray-700 mb-3">Ordered Items ({order.items.length})</h3>
                                    <div className="space-y-3">
                                        {order.items.map((item, idx) => {
                                            const imageData = getItemImageData(item);
                                            return (
                                                <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                                    {imageData.image ? (
                                                        <img
                                                            src={`data:${imageData.image_mime};base64,${imageData.image}`}
                                                            alt={item.name}
                                                            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                target.style.display = 'none';
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                                                            <ChefHat className="w-8 h-8 text-gray-400" />
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium text-gray-800 truncate">{item.name}</div>
                                                        {item.category_name && (
                                                            <div className="text-sm text-gray-600">Category: {item.category_name}</div>
                                                        )}
                                                        <div className="text-sm text-gray-600">Quantity: {item.quantity}</div>
                                                        <div className="text-sm text-gray-600">Unit Price: ₱{item.price.toFixed(2)}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-bold text-emerald-600">₱{(item.price * item.quantity).toFixed(2)}</div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="border-t pt-4">
                                    <div className="flex justify-between items-center text-lg font-bold mb-4">
                                        <span>Total Amount:</span>
                                        <span className="text-emerald-600">₱{order.total_amount.toFixed(2)}</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4" />
                                            <div>
                                                <div className="font-medium">Ordered:</div>
                                                <div>{formatDate(order.created_at)}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            <div>
                                                <div className="font-medium">Last Updated:</div>
                                                <div>{formatDate(order.updated_at || order.created_at)}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ViewFoodOrderModal;