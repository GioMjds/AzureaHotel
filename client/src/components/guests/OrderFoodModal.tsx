// Utility to get image src from base64 or data URL
function getFoodImageSrc(image: string): string {
    if (!image) return '';
    // If already a data URL, return as is
    if (image.startsWith('data:image/')) return image;
    // Otherwise, treat as base64 PNG
    return `data:image/png;base64,${image}`;
}
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Minus, Plus, Search, ShoppingCart, X } from "lucide-react";
import { FC, useEffect, useMemo, useState } from "react";
import { fetchCraveOnFoods } from "../../services/Food";

interface FoodItem {
    category_id: number;
    category_name: string;
    image: string;
    item_id: number;
    item_name: string;
    price: number;
}

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

    const { data: foodData, isLoading, isError, error } = useQuery({
        queryKey: ["craveOnFoods"],
        queryFn: fetchCraveOnFoods,
        enabled: isOpen,
    });

    useEffect(() => {
        console.log('[OrderFoodModal] foodData:', foodData);
        if (isError) {
            console.error('[OrderFoodModal] Error fetching food data:', error);
        }
    }, [foodData, isError, error]);

    const activeItems: FoodItem[] = useMemo(() => {
        console.log('[OrderFoodModal] Calculating activeItems from foodData:', foodData);
        return foodData?.active_items || [];
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
                searchRegex.test(item.item_name) ||
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

    const handlePlaceOrder = () => {
        console.log("Placing order:", cart);
        setCart([]);
        onClose();
    };

    if (!isOpen) return null;

    return (
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
                            className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
                            onClick={onClose}
                        >
                            <X size={24} />
                        </button>
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold">Order Food</h2>
                                <p className="text-orange-100">Booking #{bookingId}</p>
                            </div>
                            <button
                                onClick={() => setShowCart(!showCart)}
                                className="relative bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-3 transition-colors"
                            >
                                <ShoppingCart size={24} />
                                {getTotalItems() > 0 && (
                                    <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute -top-2 -right-2 bg-yellow-400 text-orange-600 rounded-full text-xs font-bold w-6 h-6 flex items-center justify-center"
                                    >
                                        {getTotalItems()}
                                    </motion.span>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="flex h-[calc(90vh-120px)]">
                        {/* Main Content */}
                        <div className={`transition-all duration-300 ${showCart ? 'w-2/3' : 'w-full'} flex flex-col`}>
                            {/* Search and Filters */}
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

                            {/* Food Items */}
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
                                                        src={getFoodImageSrc(item.image)}
                                                        alt={item.item_name}
                                                        className="w-full h-40 object-cover"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).style.display = 'none';
                                                        }}
                                                    />
                                                    <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                                                        {item.category_name}
                                                    </div>
                                                </div>
                                                <div className="p-4">
                                                    <h3 className="font-semibold text-gray-800 mb-1">{item.item_name}</h3>
                                                    <p className="text-orange-600 font-bold text-lg mb-3">
                                                        ₱{item.price.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                                    </p>
                                                    <div className="flex items-center justify-between">
                                                        {getItemQuantity(item.item_id) === 0 ? (
                                                            <button
                                                                onClick={() => addToCart(item)}
                                                                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                                                            >
                                                                <Plus size={16} />
                                                                Add to Cart
                                                            </button>
                                                        ) : (
                                                            <div className="flex items-center gap-3">
                                                                <button
                                                                    onClick={() => removeFromCart(item.item_id)}
                                                                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                                                                >
                                                                    <Minus size={16} />
                                                                </button>
                                                                <span className="font-semibold text-lg min-w-[2rem] text-center">
                                                                    {getItemQuantity(item.item_id)}
                                                                </span>
                                                                <button
                                                                    onClick={() => addToCart(item)}
                                                                    className="bg-orange-500 hover:bg-orange-600 text-white w-8 h-8 rounded-full flex items-center justify-center transition-colors"
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
                        </div>

                        {/* Cart Sidebar */}
                        <AnimatePresence>
                            {showCart && (
                                <motion.div
                                    initial={{ x: "100%" }}
                                    animate={{ x: 0 }}
                                    exit={{ x: "100%" }}
                                    transition={{ type: "spring", damping: 20, stiffness: 300 }}
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
                                                            <h4 className="font-semibold text-sm">{item.item_name}</h4>
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
                                                                    className="bg-gray-200 hover:bg-gray-300 w-6 h-6 rounded-full flex items-center justify-center"
                                                                >
                                                                    <Minus size={12} />
                                                                </button>
                                                                <span className="font-semibold">{item.quantity}</span>
                                                                <button
                                                                    onClick={() => addToCart(item)}
                                                                    className="bg-orange-500 hover:bg-orange-600 text-white w-6 h-6 rounded-full flex items-center justify-center"
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
                                                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-3 rounded-lg font-semibold transition-colors"
                                            >
                                                Place Order
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default OrderFoodModal;