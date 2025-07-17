import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { AlertTriangle, Calendar, ChefHat, Clock, Eye, Filter, MapPin, Package, Search, Star } from "lucide-react";
import { useMemo, useState } from "react";
import ReviewFoodOrderModal from "../../components/guests/ReviewFoodOrderModal";
import ViewFoodOrderModal from "../../components/guests/ViewFoodOrderModal";
import { fetchFoodOrders } from "../../services/Food";
import { FoodOrder } from "../../types/GuestProfileClient";

const GuestFoodOrders = () => {
    const [selectedOrderId, setSelectedOrderId] = useState<string | number | null>(null);
    const [modalVisible, setModalVisible] = useState<boolean>(false);
    const [reviewOrder, setReviewOrder] = useState<FoodOrder | null>(null);
    const [reviewModalVisible, setReviewModalVisible] = useState<boolean>(false);
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const itemsPerPage = 6;

    const { data: foodOrdersResponse, isLoading, error } = useQuery({
        queryKey: ['guestFoodOrders'],
        queryFn: () => fetchFoodOrders(),
        enabled: true,
    });

    const foodOrders = useMemo(() => foodOrdersResponse?.data || [], [foodOrdersResponse?.data]);

    // Filter and search logic
    const filteredOrders = useMemo(() => {
        let filtered = foodOrders;

        // Filter by status
        if (selectedStatus !== 'all') {
            filtered = filtered.filter((order: FoodOrder) =>
                order.status?.toLowerCase() === selectedStatus.toLowerCase()
            );
        }

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter((order: FoodOrder) =>
                order.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        return filtered;
    }, [foodOrders, selectedStatus, searchTerm]);

    // Pagination logic
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
    const paginatedOrders = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredOrders.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredOrders, currentPage, itemsPerPage]);

    // Status options for filter
    const statusOptions = useMemo(() => {
        const allStatuses = [...new Set(foodOrders.map((order: FoodOrder) => order.status))].filter(Boolean) as string[];
        return [
            { value: 'all', label: 'All Orders', count: foodOrders.length },
            ...allStatuses.map((status: string) => ({
                value: status.toLowerCase(),
                label: status.charAt(0).toUpperCase() + status.slice(1),
                count: foodOrders.filter((order: FoodOrder) => order.status === status).length
            }))
        ];
    }, [foodOrders]);

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

    const getStatusIcon = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'preparing':
            case 'pending':
                return <ChefHat className="w-4 h-4" />;
            case 'processing':
                return <Clock className="w-4 h-4" />;
            case 'ready':
                return <Package className="w-4 h-4" />;
            case 'completed':
                return <Package className="w-4 h-4" />;
            case 'reviewed':
                return <Star className="w-4 h-4" />;
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

    const isOrderReviewable = (order: FoodOrder) => {
        return order.status?.toLowerCase() === 'completed';
    };

    const isOrderReviewed = (order: FoodOrder) => {
        return order.status?.toLowerCase() === 'reviewed';
    };

    const handleReviewOrder = (order: FoodOrder) => {
        setReviewOrder(order);
        setReviewModalVisible(true);
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
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
                    <div className="flex items-center gap-3">
                        <ChefHat className="w-8 h-8 text-emerald-600" />
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Your Food Orders</h1>
                            <p className="text-gray-600">
                                {filteredOrders.length > 0
                                    ? `${filteredOrders.length} of ${foodOrders.length} order${filteredOrders.length > 1 ? 's' : ''} found`
                                    : 'Track your delicious orders here'
                                }
                            </p>
                        </div>
                    </div>

                    {/* Filters */}
                    {foodOrders.length > 0 && (
                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search orders..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                                />
                            </div>

                            {/* Status Filter */}
                            <div className="relative">
                                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm appearance-none bg-white"
                                >
                                    {statusOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label} ({option.count})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {filteredOrders.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="text-center py-12"
                    >
                        <ChefHat className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">
                            {searchTerm || selectedStatus !== 'all' ? 'No matching orders found' : 'No Food Orders Yet'}
                        </h3>
                        <p className="text-gray-600 mb-4">
                            {searchTerm || selectedStatus !== 'all'
                                ? 'Try adjusting your search or filter criteria'
                                : "You haven't placed any food orders yet. Order some delicious meals during your stay!"
                            }
                        </p>
                        {!(searchTerm || selectedStatus !== 'all') && (
                            <div className="bg-emerald-50 rounded-lg p-4 inline-block">
                                <p className="text-emerald-700 text-sm">
                                    💡 Food orders are available when you're checked in to your room
                                </p>
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {paginatedOrders.map((order: FoodOrder, index: number) => (
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
                                            <div className="text-sm font-medium text-gray-700 mb-2">
                                                Items ({order.items.length}):
                                            </div>
                                            <div className="max-h-24 overflow-y-auto space-y-1">
                                                {order.items.map((item, itemIndex) => (
                                                    <div key={itemIndex} className="flex justify-between items-center text-sm bg-gray-50 rounded p-2">
                                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                                            {item.image && item.image.trim() !== '' ? (
                                                                <img
                                                                    src={`data:${item.image_mime};base64,${item.image}`}
                                                                    alt={item.name}
                                                                    className="w-8 h-8 rounded object-cover flex-shrink-0"
                                                                    onError={(e) => {
                                                                        const target = e.target as HTMLImageElement;
                                                                        target.style.display = 'none';
                                                                    }}
                                                                />
                                                            ) : (
                                                                <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center flex-shrink-0">
                                                                    <ChefHat className="w-4 h-4 text-gray-400" />
                                                                </div>
                                                            )}
                                                            <span className="truncate">{item.name}</span>
                                                            <span className="text-gray-500 text-xs">x{item.quantity}</span>
                                                        </div>
                                                        <span className="font-medium">₱{(item.price * item.quantity).toFixed(2)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="border-t pt-3">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-semibold text-gray-700">Total:</span>
                                                <span className="font-bold text-emerald-600">₱{order.total_amount.toFixed(2)}</span>
                                            </div>

                                            <div className="flex gap-2 mt-2">
                                                <button
                                                    className="flex-1 cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded transition text-sm"
                                                    onClick={() => {
                                                        setSelectedOrderId(order.order_id);
                                                        setModalVisible(true);
                                                    }}
                                                >
                                                    View Details
                                                </button>

                                                {isOrderReviewable(order) && (
                                                    <button
                                                        className="flex-1 cursor-pointer bg-yellow-500 hover:bg-yellow-600 text-white py-2 rounded transition text-sm flex items-center justify-center gap-1"
                                                        onClick={() => handleReviewOrder(order)}
                                                    >
                                                        <Star className="w-4 h-4" />
                                                        Review
                                                    </button>
                                                )}

                                                {isOrderReviewed(order) && (
                                                    <div className="flex-1 bg-purple-100 text-purple-700 py-2 rounded text-sm flex items-center justify-center gap-1 cursor-not-allowed">
                                                        <Star className="w-4 h-4 fill-current" />
                                                        Reviewed
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 mt-8 pt-6 border-t">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>

                                <div className="flex gap-1">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={`px-3 py-2 text-sm rounded-lg ${currentPage === page
                                                ? 'bg-emerald-600 text-white'
                                                : 'border border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        )}

                        <ViewFoodOrderModal
                            orderId={selectedOrderId}
                            visible={modalVisible}
                            onClose={() => setModalVisible(false)}
                        />
                        <ReviewFoodOrderModal
                            order={reviewOrder}
                            visible={reviewModalVisible}
                            onClose={() => setReviewModalVisible(false)}
                        />
                    </>
                )}
            </motion.div>
        </div>
    );
};

export default GuestFoodOrders;
