import { FC } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { fetchFoodOrders, FoodOrder } from "../../services/Food";
import { X, ChefHat, Clock } from "lucide-react";

interface ViewFoodOrderModalProps {
    orderId: string | number;
    visible: boolean;
    onClose: () => void;
}

const ViewFoodOrderModal: FC<ViewFoodOrderModalProps> = ({ orderId, visible, onClose }) => {
    const { data, isLoading, error } = useQuery({
        queryKey: ['foodOrderDetails', orderId],
        queryFn: () => fetchFoodOrders(),
    });

    const order: FoodOrder | undefined = data?.data?.find((o: FoodOrder) => o.order_id === orderId);

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
                        className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative"
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
                                <h2 className="text-xl font-bold mb-2">Order #{order.order_id}</h2>
                                <div className="mb-3 text-sm text-gray-600">
                                    Status: <span className="font-semibold">{order.status}</span>
                                </div>
                                <div className="mb-4">
                                    <div className="font-semibold mb-1">Items:</div>
                                    <ul className="space-y-2">
                                        {order.items.map((item, idx) => (
                                            <li key={idx} className="flex justify-between">
                                                <span>{item.name} x{item.quantity}</span>
                                                <span>₱{(item.price * item.quantity).toFixed(2)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="mb-2 flex justify-between text-sm">
                                    <span>Total Amount:</span>
                                    <span className="font-bold text-emerald-600">₱{order.total_amount.toFixed(2)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Clock className="w-4 h-4" />
                                    <span>Ordered: {order.created_at}</span>
                                </div>
                                {order.booking_info && (
                                    <div className="mt-4 p-3 bg-gray-50 rounded">
                                        <div>
                                            <span className="font-semibold">Booking:</span> {order.booking_info.room_name || order.booking_info.area_name}
                                        </div>
                                        <div>
                                            <span className="font-semibold">Check-in:</span> {order.booking_info.check_in_date}
                                        </div>
                                        <div>
                                            <span className="font-semibold">Check-out:</span> {order.booking_info.check_out_date}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ViewFoodOrderModal;