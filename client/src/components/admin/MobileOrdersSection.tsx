import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign,
  Image as ImageIcon,
  MapPin,
  Package,
  Phone,
  User,
  XCircle
} from "lucide-react";
import { useState } from "react";
import { fetchMobileOrders, updateMobileOrderStatus } from "../../services/Admin";
import { MobileOrderCustomer, MobileOrdersResponse } from "../../types/MobileOrders";
import { formatCurrency } from "../../utils/formatters";

const MobileOrdersSection = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [expandedCustomers, setExpandedCustomers] = useState<Set<number>>(new Set());
  const [selectedPaymentImage, setSelectedPaymentImage] = useState<string | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());

  const queryClient = useQueryClient();

  const { data: mobileOrdersData, isLoading, error } = useQuery<MobileOrdersResponse>({
    queryKey: ["mobileOrders", currentPage, pageSize],
    queryFn: () => fetchMobileOrders(currentPage, pageSize),
    staleTime: 30000, // 30 seconds
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: number; status: string }) =>
      updateMobileOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mobileOrders"] });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'preparing':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'ready':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'confirmed':
        return <CheckCircle className="w-4 h-4" />;
      case 'preparing':
        return <Package className="w-4 h-4" />;
      case 'ready':
        return <AlertCircle className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const toggleCustomerExpansion = (customerId: number) => {
    setExpandedCustomers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(customerId)) {
        newSet.delete(customerId);
      } else {
        newSet.add(customerId);
      }
      return newSet;
    });
  };

  const toggleOrderExpansion = (orderId: number) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const handleStatusUpdate = async (orderId: number, newStatus: string) => {
    try {
      await updateOrderMutation.mutateAsync({ orderId, status: newStatus });
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  const calculateCustomerTotalOrders = (customer: MobileOrderCustomer) => {
    return customer.orders.length;
  };

  const calculateCustomerTotalAmount = (customer: MobileOrderCustomer) => {
    return customer.orders.reduce((sum, order) => sum + order.total_amount, 0);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-300 rounded w-1/4"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center text-red-600">
          <XCircle className="w-12 h-12 mx-auto mb-4" />
          <p className="text-lg font-semibold">Error loading mobile orders</p>
          <p className="text-sm text-gray-500 mt-2">Please try again later</p>
        </div>
      </div>
    );
  }

  const customers = mobileOrdersData?.customers || [];
  const pagination = mobileOrdersData?.pagination;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm"
    >
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Food Orders</h2>
              <p className="text-sm text-gray-500">
                {pagination?.total_items || 0} total orders from {customers.length} customers
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              Page {pagination?.current_page || 1} of {pagination?.total_pages || 1}
            </span>
          </div>
        </div>
      </div>

      <div className="p-6">
        {customers.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Mobile Orders</h3>
            <p className="text-gray-500">No mobile orders have been placed yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {customers.map((customer) => (
              <motion.div
                key={customer.customer_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Customer Header */}
                <div
                  className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => toggleCustomerExpansion(customer.customer_id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{customer.full_name}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            {customer.contact}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {customer.address}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {calculateCustomerTotalOrders(customer)} Orders
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatCurrency(calculateCustomerTotalAmount(customer))}
                        </div>
                      </div>
                      {expandedCustomers.has(customer.customer_id) ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Customer Orders */}
                <AnimatePresence>
                  {expandedCustomers.has(customer.customer_id) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 space-y-3">
                        {customer.orders.map((order) => (
                          <div
                            key={order.order_id}
                            className="border border-gray-200 rounded-lg p-4 bg-white"
                          >
                            {/* Order Header */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-gray-900">
                                  Order #{order.order_id}
                                </span>
                                <span className="flex items-center gap-1 text-sm text-gray-500">
                                  <Calendar className="w-4 h-4" />
                                  {new Date(order.ordered_at).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(order.status)}`}>
                                  {getStatusIcon(order.status)}
                                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                </span>
                                <button
                                  onClick={() => toggleOrderExpansion(order.order_id)}
                                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                >
                                  {expandedOrders.has(order.order_id) ? 'Hide Details' : 'View Details'}
                                </button>
                              </div>
                            </div>

                            {/* Order Summary */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <span className="text-sm text-gray-600">
                                  {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                                </span>
                                <span className="flex items-center gap-1 text-sm font-semibold text-gray-900">
                                  <DollarSign className="w-4 h-4" />
                                  {formatCurrency(order.total_amount)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {order.payment_ss && (
                                  <button
                                    onClick={() => setSelectedPaymentImage(order.payment_ss)}
                                    className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                                  >
                                    <ImageIcon className="w-4 h-4" />
                                    Payment Screenshot
                                  </button>
                                )}
                                {order.status !== 'completed' && order.status !== 'cancelled' && (
                                  <select
                                    value={order.status}
                                    onChange={(e) => handleStatusUpdate(order.order_id, e.target.value)}
                                    className="px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    disabled={updateOrderMutation.isPending}
                                  >
                                    <option value="pending">Pending</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="preparing">Preparing</option>
                                    <option value="ready">Ready</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                  </select>
                                )}
                              </div>
                            </div>

                            {/* Order Details */}
                            <AnimatePresence>
                              {expandedOrders.has(order.order_id) && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="mt-4 pt-4 border-t border-gray-200"
                                >
                                  <div className="space-y-3">
                                    <h4 className="font-medium text-gray-900">Order Items:</h4>
                                    <div className="space-y-2">
                                      {order.items.map((item) => (
                                        <div
                                          key={item.item_id}
                                          className="flex items-center justify-between p-3 bg-gray-50 rounded"
                                        >
                                          <div>
                                            <span className="font-medium text-gray-900">{item.name}</span>
                                            <span className="text-sm text-gray-500 ml-2">
                                              × {item.quantity}
                                            </span>
                                          </div>
                                          <div className="text-sm font-medium text-gray-900">
                                            {formatCurrency(item.price * item.quantity)}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                    {order.cancellation_reason && (
                                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                                        <h5 className="font-medium text-red-900 mb-1">Cancellation Reason:</h5>
                                        <p className="text-sm text-red-800">{order.cancellation_reason}</p>
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.total_pages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500">
              Page {pagination.current_page} of {pagination.total_pages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(pagination.total_pages, prev + 1))}
              disabled={currentPage === pagination.total_pages}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Payment Screenshot Modal */}
      <AnimatePresence>
        {selectedPaymentImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setSelectedPaymentImage(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-lg p-4 max-w-2xl max-h-[90vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Payment Screenshot</h3>
                <button
                  onClick={() => setSelectedPaymentImage(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <img
                src={`data:image/jpeg;base64,${selectedPaymentImage}`}
                alt="Payment Screenshot"
                className="max-w-full h-auto rounded"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MobileOrdersSection;
