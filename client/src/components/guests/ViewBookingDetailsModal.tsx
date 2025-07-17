import { useQuery } from "@tanstack/react-query"
import { AnimatePresence, motion } from "framer-motion"
import { X } from "lucide-react"
import { FC, useEffect, useState } from "react"
import { toast } from "react-toastify"
import { BookingDetailsSkeleton } from "../../motions/skeletons/GuestDetailSkeleton"
import { fetchBookingDetail, generateCheckoutEReceipt } from "../../services/Booking"
import { generateEReceipt } from "../../utils/reports"
import BookingData from "../bookings/BookingData"
import { ViewBookingDetailsModalProps } from "../../types/GuestProfileClient"

const ViewBookingDetailsModal: FC<ViewBookingDetailsModalProps> = ({ isOpen, bookingId, onClose }) => {
    const [isGeneratingReceipt, setIsGeneratingReceipt] = useState(false);

    const { data, isLoading, isError } = useQuery({
        queryKey: ['bookingDetails', bookingId],
        queryFn: () => fetchBookingDetail(bookingId),
    });

    const handleGenerateEReceipt = async () => {
        if (!data) return;

        try {
            setIsGeneratingReceipt(true);
            const receiptData = await generateCheckoutEReceipt(data.id.toString());

            if (receiptData.success) {
                await generateEReceipt(receiptData.data);                       
                toast.success("E-Receipt generated successfully!");
            } else {
                toast.error("Failed to generate E-Receipt");
            }
        } catch (error) {
            console.error(`Error generating E-Receipt: ${error}`);
            toast.error("Failed to generate E-Receipt. Please try again.");
        } finally {
            setIsGeneratingReceipt(false);
        }
    };
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        }
        if (isOpen) window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);
    
    return (
        <AnimatePresence mode="wait">
            {bookingId && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.95, y: 20 }}
                        className="relative max-w-4xl mx-auto mt-20 bg-white rounded-xl shadow-2xl overflow-hidden"
                    >
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-gray-800">Booking Details</h2>
                            <div className="flex items-center gap-3">
                                {data && data.status === 'checked_out' && (
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleGenerateEReceipt}
                                        disabled={isGeneratingReceipt}
                                        className="px-4 py-2 cursor-pointer bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg font-medium transition-colors duration-200 disabled:cursor-not-allowed"
                                    >
                                        {isGeneratingReceipt ? 'Generating...' : 'Download E-Receipt'}
                                    </motion.button>
                                )}
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={onClose}
                                    className="p-2 hover:bg-gray-100 cursor-pointer hover:text-red-600 rounded-full text-gray-500"
                                >
                                    <X size={24} />
                                </motion.button>
                            </div>
                        </div>

                        <div className="max-h-[70vh] overflow-y-auto p-3">
                            {isLoading ? (
                                <BookingDetailsSkeleton />
                            ) : isError ? (
                                <div className="text-red-500 p-4">Failed to load booking details</div>
                            ) : (
                                <BookingData bookingId={data.id} />
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

export default ViewBookingDetailsModal