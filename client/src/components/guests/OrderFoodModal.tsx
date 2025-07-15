/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Minus, Plus, Search, ShoppingCart, Upload, X } from "lucide-react";
import { FC, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import GCashQRCode from "../../assets/GCash_FoodOrder.jpg";
import { fetchCraveOnFoods, FoodItem, placeFoodOrder } from "../../services/Food";
import Modal from "../Modal";

interface OrderItem extends FoodItem {
    quantity: number;
}

interface OrderFoodModalProps {
    bookingId: number | null;
    isOpen: boolean;
    onClose: () => void;
}

const OrderFoodModal: FC<OrderFoodModalProps> = ({ bookingId, isOpen, onClose }) => {
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [cart, setCart] = useState<OrderItem[]>([]);
    const [showCart, setShowCart] = useState<boolean>(false);
    const [showPaymentSection, setShowPaymentSection] = useState(false);
    const [showFinalConfirmModal, setShowFinalConfirmModal] = useState(false);
    const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
    const [paymentPreview, setPaymentPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data: foodData, isLoading, isError } = useQuery({
        queryKey: ["craveOnFoods"],
        queryFn: () => fetchCraveOnFoods(),
    });

    const placeOrderMutation = useMutation({
        mutationFn: (orderData: { booking_id: number; items: any; payment_ss?: File }) => {
            return placeFoodOrder(orderData);
        },
        onSuccess: (response) => {
            if (response.success && response.user_id && response.order_id) {
                toast.success(response.message || "Food order placed successfully!");
                setCart([]);
                setShowPaymentSection(false);
                setShowFinalConfirmModal(false);
                setPaymentScreenshot(null);
                setPaymentPreview(null);
                onClose();
            } else {
                toast.error("Failed to place food order. Please try again.");
            }
        },
        onError: (error: any) => {
            toast.error(error?.message || "Failed to place food order. Please try again later.");
        }
    });

    const handlePlaceOrder = () => {
        if (!bookingId || cart.length === 0) {
            toast.error("Please add items to your cart before placing an order.");
            return;
        }
        setShowPaymentSection(true);
    };

    const handlePaymentSubmit = () => {
        if (!paymentScreenshot) {
            toast.error("Please upload a payment screenshot.");
            return;
        }
        setShowFinalConfirmModal(true);
    };

    const confirmFinalOrder = () => {
        if (!paymentScreenshot) {
            toast.error("Please upload a payment screenshot.");
            return;
        }

        const orderItems = cart.map(item => ({
            item_id: item.item_id,
            quantity: item.quantity,
        }));

        const orderPayload = {
            booking_id: bookingId!,
            items: orderItems,
            payment_ss: paymentScreenshot
        };

        placeOrderMutation.mutate(orderPayload);
        setShowFinalConfirmModal(false);
    };

    const handleBackToMenu = () => {
        setShowPaymentSection(false);
        setPaymentScreenshot(null);
        setPaymentPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.type.startsWith('image/')) {
                setPaymentScreenshot(file);
                const reader = new FileReader();
                reader.onload = (e) => {
                    setPaymentPreview(e.target?.result as string);
                };
                reader.readAsDataURL(file);
            } else {
                toast.error("Please select a valid image file.");
            }
        }
    };

    const activeItems: FoodItem[] = useMemo(() => {
        if (!foodData || !foodData.data) return [];
        return foodData?.data.map((item: any) => ({
            item_id: item.item_id,
            name: item.name,
            price: item.price,
            image: item.image,
            image_mime: item.image_mime,
            category_id: item.category_id,
            category_name: item.category_name,
            quantity: item.quantity
        }));
    }, [foodData]);

    const categories = useMemo(() => {
        const categorySet = new Set(activeItems.map(item => item.category_name));
        return Array.from(categorySet);
    }, [activeItems]);

    const filteredItems = useMemo(() => {
        let filtered = activeItems;

        if (selectedCategory !== "all") {
            filtered = filtered.filter(item => item.category_name === selectedCategory);
        }

        if (searchTerm.trim()) {
            const searchRegex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            filtered = filtered.filter(item =>
                searchRegex.test(item.name) ||
                searchRegex.test(item.category_name)
            );
        }

        return filtered;
    }, [activeItems, selectedCategory, searchTerm]);

    const addToCart = (item: FoodItem) => {
        setCart(prev => {
            const existingItem = prev.find(cartItem => cartItem.item_id === item.item_id);
            if (existingItem) {
                return prev.map(cartItem =>
                    cartItem.item_id === item.item_id
                        ? { ...cartItem, quantity: cartItem.quantity + 1 }
                        : cartItem
                );
            }
            return [...prev, { ...item, quantity: 1 }];
        });
    };

    const removeFromCart = (itemId: number) => {
        setCart(prev => {
            const existingItem = prev.find(cartItem => cartItem.item_id === itemId);
            if (existingItem && existingItem.quantity > 1) {
                return prev.map(cartItem =>
                    cartItem.item_id === itemId
                        ? { ...cartItem, quantity: cartItem.quantity - 1 }
                        : cartItem
                );
            }
            return prev.filter(cartItem => cartItem.item_id !== itemId);
        });
    };

    const getItemQuantity = (itemId: number) => {
        return cart.find(item => item.item_id === itemId)?.quantity || 0;
    };

    const getTotalPrice = () => {
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const getTotalItems = () => {
        return cart.reduce((total, item) => total + item.quantity, 0);
    };

    if (!isOpen) return null;

    return (
        <>
            <AnimatePresence>
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", damping: 20, stiffness: 300 }}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 relative">
                            <button
                                className="absolute top-3 right-3 text-white hover:text-gray-200 transition-colors"
                                onClick={onClose}
                            >
                                <X size={24} />
                            </button>
                            <div className="flex items-center justify-between">
                                <div>
                                    <AnimatePresence mode="wait">
                                        <motion.h2
                                            key={showPaymentSection ? "payment" : "order"}
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            transition={{ duration: 0.2 }}
                                            className="text-2xl font-bold"
                                        >
                                            {showPaymentSection ? "Payment" : "Order Food"}
                                        </motion.h2>
                                    </AnimatePresence>
                                    <p className="text-orange-100">Booking #{bookingId}</p>
                                </div>
                                <AnimatePresence>
                                    {!showPaymentSection && (
                                        <motion.button
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            transition={{ duration: 0.2 }}
                                            onClick={() => setShowCart(!showCart)}
                                            className="relative bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-3 transition-colors"
                                        >
                                            <ShoppingCart size={24} />
                                            {getTotalItems() > 0 && (
                                                <motion.span
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="absolute -top-3 -right-3 bg-yellow-400 text-orange-600 rounded-full text-xs font-bold w-6 h-6 flex items-center justify-center"
                                                >
                                                    {getTotalItems()}
                                                </motion.span>
                                            )}
                                        </motion.button>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        <div className="flex h-[calc(90vh-120px)]">                            {/* Main Content */}
                            <div className={`transition-all duration-300 ${showCart && !showPaymentSection ? 'w-2/3' : 'w-full'} flex flex-col`}>
                                <AnimatePresence mode="wait">
                                    {!showPaymentSection ? (
                                        <motion.div
                                            key="food-selection"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ duration: 0.3, ease: "easeInOut" }}
                                            className="flex flex-col h-full"
                                        >
                                            {/* Search and Filter Section */}
                                            <div className="p-6 border-b bg-gray-50">
                                                <div className="flex flex-col sm:flex-row gap-4">
                                                    <div className="relative flex-1">
                                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                                        <input
                                                            type="text"
                                                            placeholder="Search food items..."
                                                            value={searchTerm}
                                                            onChange={(e) => setSearchTerm(e.target.value)}
                                                            className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                                        />
                                                    </div>
                                                    <select
                                                        value={selectedCategory}
                                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                                        className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                                    >
                                                        <option value="all">All Categories</option>
                                                        {categories.map(category => (
                                                            <option key={category} value={category}>
                                                                {category}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Food Items Grid */}
                                            <div className="flex-1 overflow-y-auto p-6">
                                                {isLoading ? (
                                                    <div className="flex items-center justify-center h-40">
                                                        <Loader2 className="animate-spin text-orange-500" size={32} />
                                                        <span className="ml-2 text-gray-600">Loading food items...</span>
                                                    </div>
                                                ) : isError ? (
                                                    <div className="text-center py-12">
                                                        <p className="text-red-500 text-lg">Failed to load food items</p>
                                                        <p className="text-gray-600">Please try again later</p>
                                                    </div>
                                                ) : filteredItems.length === 0 ? (
                                                    <div className="text-center py-12">
                                                        <p className="text-gray-500 text-lg">No food items found</p>
                                                        <p className="text-gray-400">Try adjusting your search or filters</p>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                        {filteredItems.map((item) => (
                                                            <motion.div
                                                                key={item.item_id}
                                                                layout
                                                                initial={{ opacity: 0, y: 20 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                exit={{ opacity: 0, y: -20 }}
                                                                className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                                                            >
                                                                <div className="relative">
                                                                    <img
                                                                        src={`data:${item.image_mime};base64,${item.image}`}
                                                                        alt={item.name}
                                                                        className="w-full h-40 object-cover"
                                                                    />
                                                                    <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                                                                        {item.category_name}
                                                                    </div>
                                                                </div>
                                                                <div className="p-4">
                                                                    <h3 className="font-semibold text-gray-800 mb-1">{item.name}</h3>
                                                                    <p className="text-orange-600 font-bold text-lg mb-3">
                                                                        ₱{item.price.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                                                    </p>
                                                                    <div className="flex items-center justify-between">
                                                                        {getItemQuantity(item.item_id) === 0 ? (
                                                                            <button
                                                                                onClick={() => addToCart(item)}
                                                                                className="bg-orange-500 cursor-pointer hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                                                                            >
                                                                                <Plus size={16} />
                                                                                Add to Cart
                                                                            </button>
                                                                        ) : (
                                                                            <div className="flex items-center gap-3">
                                                                                <button
                                                                                    onClick={() => removeFromCart(item.item_id)}
                                                                                    className="bg-gray-200 cursor-pointer hover:bg-gray-300 text-gray-700 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                                                                                >
                                                                                    <Minus size={16} />
                                                                                </button>
                                                                                <span className="font-semibold text-lg min-w-[2rem] text-center">
                                                                                    {getItemQuantity(item.item_id)}
                                                                                </span>
                                                                                <button
                                                                                    onClick={() => addToCart(item)}
                                                                                    className="bg-orange-500 cursor-pointer hover:bg-orange-600 text-white w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                                                                                >
                                                                                    <Plus size={16} />
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    ) : (
                                        /* Payment Section */
                                        <motion.div
                                            key="payment-section"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            transition={{ duration: 0.3, ease: "easeInOut" }}
                                            className="flex-1 overflow-y-auto p-6"
                                        >
                                            <div className="max-w-2xl mx-auto">
                                                <motion.div
                                                    className="mb-6"
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.1 }}
                                                >
                                                    <button
                                                        onClick={handleBackToMenu}
                                                        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
                                                    >
                                                        <X size={20} />
                                                        Back to Menu
                                                    </button>
                                                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Payment Required</h3>
                                                    <p className="text-gray-600">
                                                        Total: <span className="font-bold text-orange-600 text-xl">₱{getTotalPrice().toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                                                    </p>
                                                </motion.div>

                                                <motion.div
                                                    className="bg-white rounded-xl border border-gray-200 p-6 mb-6"
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.2 }}
                                                >
                                                    <h4 className="text-lg font-semibold mb-4">Payment Instructions</h4>

                                                    {/* QR Code Section */}
                                                    <motion.div
                                                        className="flex justify-center mb-6"
                                                        initial={{ opacity: 0, scale: 0.9 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ delay: 0.3 }}
                                                    >
                                                        <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
                                                            <img
                                                                src={GCashQRCode}
                                                                alt="GCash QR Code for Food Order Payment"
                                                                className="w-48 h-48 object-contain"
                                                            />
                                                        </div>
                                                    </motion.div>

                                                    <motion.div
                                                        className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6"
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: 0.4 }}
                                                    >
                                                        <div className="space-y-2 text-sm">
                                                            <motion.p
                                                                className="flex items-start gap-2"
                                                                initial={{ opacity: 0, x: -10 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                transition={{ delay: 0.5 }}
                                                            >
                                                                <span className="bg-orange-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                                                                <span>Scan the QR code above or send payment via GCash</span>
                                                            </motion.p>
                                                            <motion.p
                                                                className="flex items-start gap-2"
                                                                initial={{ opacity: 0, x: -10 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                transition={{ delay: 0.6 }}
                                                            >
                                                                <span className="bg-orange-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                                                                <span>Take a screenshot of your payment confirmation</span>
                                                            </motion.p>
                                                            <motion.p
                                                                className="flex items-start gap-2"
                                                                initial={{ opacity: 0, x: -10 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                transition={{ delay: 0.7 }}
                                                            >
                                                                <span className="bg-orange-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                                                                <span>Upload the screenshot below and submit your order</span>
                                                            </motion.p>
                                                        </div>
                                                    </motion.div>
                                                </motion.div>

                                                <motion.div
                                                    className="bg-white rounded-xl border border-gray-200 p-6"
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.8 }}
                                                >
                                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                                        Upload Payment Screenshot
                                                    </label>
                                                    <input
                                                        type="file"
                                                        ref={fileInputRef}
                                                        onChange={handleFileUpload}
                                                        accept="image/*"
                                                        className="hidden"
                                                    />

                                                    <AnimatePresence mode="wait">
                                                        {!paymentPreview ? (
                                                            <motion.button
                                                                key="upload-area"
                                                                initial={{ opacity: 0 }}
                                                                animate={{ opacity: 1 }}
                                                                exit={{ opacity: 0 }}
                                                                onClick={() => fileInputRef.current?.click()}
                                                                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-orange-500 transition-colors group"
                                                            >
                                                                <Upload className="mx-auto mb-3 text-gray-400 group-hover:text-orange-500 transition-colors" size={40} />
                                                                <p className="text-gray-600 font-medium">Click to upload screenshot</p>
                                                                <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</p>
                                                            </motion.button>
                                                        ) : (
                                                            <motion.div
                                                                key="preview-area"
                                                                initial={{ opacity: 0, scale: 0.9 }}
                                                                animate={{ opacity: 1, scale: 1 }}
                                                                exit={{ opacity: 0, scale: 0.9 }}
                                                                className="relative"
                                                            >
                                                                <img
                                                                    src={paymentPreview}
                                                                    alt="Payment screenshot"
                                                                    className="w-full h-64 object-cover rounded-lg"
                                                                />
                                                                <button
                                                                    onClick={() => {
                                                                        setPaymentPreview(null);
                                                                        setPaymentScreenshot(null);
                                                                        if (fileInputRef.current) {
                                                                            fileInputRef.current.value = '';
                                                                        }
                                                                    }}
                                                                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                                                                >
                                                                    <X size={16} />
                                                                </button>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>

                                                    <motion.div
                                                        className="flex gap-3 mt-6"
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: 0.9 }}
                                                    >
                                                        <button
                                                            onClick={handleBackToMenu}
                                                            className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                                                        >
                                                            Back to Menu
                                                        </button>
                                                        <button
                                                            onClick={handlePaymentSubmit}
                                                            disabled={!paymentScreenshot || placeOrderMutation.isPending}
                                                            className={`flex-1 px-6 py-3 cursor-pointer rounded-lg font-semibold transition-colors ${!paymentScreenshot || placeOrderMutation.isPending
                                                                ? "bg-gray-400 cursor-not-allowed text-gray-600"
                                                                : "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                                                                }`}
                                                        >
                                                            {placeOrderMutation.isPending ? "Processing..." : "Submit Order"}
                                                        </button>
                                                    </motion.div>
                                                </motion.div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Cart Sidebar */}
                            <AnimatePresence>
                                {showCart && !showPaymentSection && (
                                    <motion.div
                                        initial={{ x: "100%", opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        exit={{ x: "100%", opacity: 0 }}
                                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                        className="w-1/3 bg-gray-50 border-l border-gray-200 flex flex-col"
                                    >
                                        <div className="p-4 border-b bg-white">
                                            <h3 className="font-bold text-lg">Your Order</h3>
                                        </div>

                                        <div className="flex-1 overflow-y-auto p-4">
                                            {cart.length === 0 ? (
                                                <div className="text-center py-8">
                                                    <ShoppingCart className="mx-auto text-gray-400 mb-2" size={48} />
                                                    <p className="text-gray-500">Your cart is empty</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {cart.map((item) => (
                                                        <motion.div
                                                            key={item.item_id}
                                                            initial={{ opacity: 0, x: 20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            exit={{ opacity: 0, x: -20 }}
                                                            className="bg-white rounded-lg p-3 border border-gray-200"
                                                        >
                                                            <div className="flex justify-between items-start mb-2">
                                                                <h4 className="font-semibold text-sm">{item.name}</h4>
                                                                <button
                                                                    onClick={() => removeFromCart(item.item_id)}
                                                                    className="text-red-500 hover:text-red-700"
                                                                >
                                                                    <X size={16} />
                                                                </button>
                                                            </div>
                                                            <div className="flex justify-between items-center">
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        onClick={() => removeFromCart(item.item_id)}
                                                                        className="bg-gray-200 cursor-pointer hover:bg-gray-300 w-6 h-6 rounded-full flex items-center justify-center"
                                                                    >
                                                                        <Minus size={12} />
                                                                    </button>
                                                                    <span className="font-semibold">{item.quantity}</span>
                                                                    <button
                                                                        onClick={() => addToCart(item)}
                                                                        className="bg-orange-500 cursor-pointer hover:bg-orange-600 text-white w-6 h-6 rounded-full flex items-center justify-center"
                                                                    >
                                                                        <Plus size={12} />
                                                                    </button>
                                                                </div>
                                                                <span className="font-bold text-orange-600">
                                                                    ₱{(item.price * item.quantity).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                                                </span>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {cart.length > 0 && (
                                            <div className="p-4 bg-white border-t">
                                                <div className="flex justify-between items-center mb-4">
                                                    <span className="font-bold text-lg">Total:</span>
                                                    <span className="font-bold text-xl text-orange-600">
                                                        ₱{getTotalPrice().toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={handlePlaceOrder}
                                                    disabled={placeOrderMutation.isPending}
                                                    className={`w-full py-3 cursor-pointer rounded-lg font-semibold transition-colors ${placeOrderMutation.isPending
                                                        ? "bg-gray-400 cursor-not-allowed"
                                                        : "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                                                        } text-white`}
                                                >
                                                    {placeOrderMutation.isPending ? "Placing your order..." : "Confirm Order"}
                                                </button>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </motion.div>
                {showFinalConfirmModal && (
                    <Modal
                        isOpen={showFinalConfirmModal}
                        title="Confirm Food Order Submission"
                        description={`Are you sure you want to submit this food order? Total: ₱${getTotalPrice().toLocaleString('en-PH', { minimumFractionDigits: 2 })}`}
                        cancel={() => setShowFinalConfirmModal(false)}
                        onConfirm={confirmFinalOrder}
                        confirmText="Yes, Submit Order"
                        cancelText="No, Cancel"
                        className="px-4 py-2 bg-emerald-600 text-white rounded-md font-bold hover:bg-emerald-700 transition-all duration-300 cursor-pointer"
                        loading={placeOrderMutation.isPending}
                    />
                )}
            </AnimatePresence>
        </>
    );
}

export default OrderFoodModal;