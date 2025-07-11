import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { AlertTriangle, Calendar, ChefHat, Clock, Eye, MapPin, Package } from "lucide-react";
import { fetchFoodOrders, FoodOrder } from "../../services/Food";

const GuestFoodOrders = () => {
    const { data: foodOrdersResponse, isLoading, error } = useQuery({
        queryKey: ['guestFoodOrders'],
        queryFn: () => fetchFoodOrders(),
        enabled: true,
    });

    const foodOrders = foodOrdersResponse?.data || [];

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'preparing':
                return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'ready':
                return 'bg-green-100 text-green-800 border-green-300';
            case 'delivered':
                return 'bg-blue-100 text-blue-800 border-blue-300';
            case 'cancelled':
                return 'bg-red-100 text-red-800 border-red-300';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'preparing':
                return <ChefHat className="w-4 h-4" />;
            case 'ready':
                return <Package className="w-4 h-4" />;
            case 'delivered':
                return <Eye className="w-4 h-4" />;
            case 'cancelled':
                return <AlertTriangle className="w-4 h-4" />;
            default:
                return <Clock className="w-4 h-4" />;
        }
    };

    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), 'MMM dd, yyyy • hh:mm a');
        } catch {
            return dateString;
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-3 container mx-auto p-3">
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <ChefHat className="w-8 h-8 text-emerald-600" />
                        <h1 className="text-2xl font-bold text-gray-800">Your Food Orders</h1>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, index) => (
                            <div key={index} className="bg-gray-50 rounded-lg p-4 animate-pulse">
                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                                <div className="space-y-2">
                                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-3 container mx-auto p-3">
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <ChefHat className="w-8 h-8 text-emerald-600" />
                        <h1 className="text-2xl font-bold text-gray-800">Your Food Orders</h1>
                    </div>
                    <div className="text-center py-12">
                        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <p className="text-gray-600 text-lg">Failed to load food orders</p>
                        <p className="text-gray-500 text-sm mt-2">Please try again later</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3 container mx-auto p-3">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-lg shadow-sm p-6"
            >
                <div className="flex items-center gap-3 mb-6">
                    <ChefHat className="w-8 h-8 text-emerald-600" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Your Food Orders</h1>
                        <p className="text-gray-600">
                            {foodOrders.length > 0
                                ? `${foodOrders.length} order${foodOrders.length > 1 ? 's' : ''} found`
                                : 'Track your delicious orders here'
                            }
                        </p>
                    </div>
                </div>

                {foodOrders.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="text-center py-12"
                    >
                        <ChefHat className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">No Food Orders Yet</h3>
                        <p className="text-gray-600 mb-4">
                            You haven't placed any food orders yet. Order some delicious meals during your stay!
                        </p>
                        <div className="bg-emerald-50 rounded-lg p-4 inline-block">
                            <p className="text-emerald-700 text-sm">
                                💡 Food orders are available when you're checked in to your room
                            </p>
                        </div>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {foodOrders.map((order: FoodOrder, index: number) => (
                            <motion.div
                                key={order.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
                            >
                                <div className="p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-gray-600">Order</span>
                                            <span className="text-sm font-bold text-emerald-600">
                                                #{order.order_id}
                                            </span>
                                        </div>
                                        <div className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(order.status)}`}>
                                            {getStatusIcon(order.status)}
                                            {order.status}
                                        </div>
                                    </div>

                                    {order.booking_info && (
                                        <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center gap-2 mb-2">
                                                <MapPin className="w-4 h-4 text-gray-500" />
                                                <span className="text-sm font-medium text-gray-700">
                                                    {order.booking_info.is_venue_booking
                                                        ? order.booking_info.area_name
                                                        : order.booking_info.room_name
                                                    }
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                                <Calendar className="w-3 h-3" />
                                                <span>
                                                    {formatDate(order.booking_info.check_in_date)} - {formatDate(order.booking_info.check_out_date)}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2 mb-4">
                                        {order.items.map((item, itemIndex) => (
                                            <div key={itemIndex} className="flex justify-between items-center text-sm">
                                                <div className="flex-1">
                                                    <span className="font-medium text-gray-800">{item.name}</span>
                                                    <span className="text-gray-600 ml-2">x{item.quantity}</span>
                                                </div>
                                                <span className="font-medium text-gray-800">
                                                    ₱{(item.price * item.quantity).toFixed(2)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="border-t pt-3">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-medium text-gray-600">Total Amount</span>
                                            <span className="text-lg font-bold text-emerald-600">
                                                ₱{order.total_amount.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <Clock className="w-3 h-3" />
                                            <span>Ordered {formatDate(order.created_at)}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default GuestFoodOrders;