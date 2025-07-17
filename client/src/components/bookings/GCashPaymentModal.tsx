import { AnimatePresence, motion } from "framer-motion"
import { ChangeEvent, FC, useEffect, useState } from "react"
import GCashMOP1 from "../../assets/GCash_MOP1.jpg";
import GCashMOP2 from "../../assets/GCash_MOP2.jpg";
import { GCashPaymentModalProps } from "../../types/BookingGuest";

const GCashPaymentModal: FC<GCashPaymentModalProps> = ({ isOpen, onClose, onProofSubmit, onProofRemove, initialPreview, totalPrice }) => {
    const [preview, setPreview] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [showError, setShowError] = useState<boolean>(false);

    useEffect(() => {
        if (initialPreview) setPreview(initialPreview);
    }, [initialPreview]);

    useEffect(() => {
        if (!isOpen) {
            setPreview(null);
            setFile(null);
            setShowError(false);
        }
    }, [isOpen]);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        setShowError(false);
        if (selectedFile) {
            const reader = new FileReader();
            setFile(selectedFile);
            reader.onloadend = () => setPreview(reader.result as string);
            reader.readAsDataURL(selectedFile);
        }
    };

    const handleSubmit = () => {
        if (!file) {
            setShowError(true);
            return;
        }
        if (preview) {
            onProofSubmit(file, preview);
            onClose();
        }
    };

    const handleRemove = () => {
        setPreview(null);
        setFile(null);
        onProofRemove();
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        className="bg-white rounded-xl p-8 max-w-xl w-full mx-4"
                        initial={{ scale: 0.95, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.95, y: -20 }}
                    >
                        <div className="flex flex-col h-full min-h-[300px]">
                            <h2 className="text-3xl font-bold mb-6 text-blue-800">GCash Payment</h2>

                            <div className="flex-grow overflow-y-auto">
                                <p className="text-gray-600 mb-2 text-lg">
                                    Please scan one of the QR codes below and upload your payment receipt.
                                </p>

                                <div className="grid grid-cols-2 gap-6 mb-2">
                                    <div className="rounded-xl bg-gray-100 p-4 flex items-center justify-center">
                                        <img
                                            src={GCashMOP1}
                                            alt="GCash QR Code 1"
                                            className="max-w-full h-28 object-contain"
                                        />
                                    </div>
                                    <div className="rounded-xl bg-gray-100 p-4 flex items-center justify-center">
                                        <img
                                            src={GCashMOP2}
                                            alt="GCash QR Code 2"
                                            className="max-w-full h-28 object-contain"
                                        />
                                    </div>
                                </div>

                                <div className="mb-2">
                                    <input
                                        type="file"
                                        name="payment_proof"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="w-full cursor-pointer p-4 border-2 border-dashed border-gray-300 rounded-xl file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-base file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                    <p className="text-sm text-gray-500 mt-2">
                                        Note: Must pay atleast 50% of the total amount (₱{(totalPrice / 2).toLocaleString()}).
                                    </p>
                                    {showError && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="text-red-500 text-sm mt-2"
                                        >
                                            Please upload a payment proof image
                                        </motion.div>
                                    )}
                                    {preview && (
                                        <div className="mt-6 relative">
                                            <img
                                                src={preview}
                                                alt="Receipt preview"
                                                className="w-36 h-36 object-contain border-2 border-gray-200 rounded-xl"
                                            />
                                            <button
                                                onClick={handleRemove}
                                                className="absolute cursor-pointer top-3 right-3 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-4 mt-2 border-gray-200">
                                <button
                                    onClick={onClose}
                                    className="flex-1 cursor-pointer px-6 py-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors text-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    className={`flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl transition-colors text-lg ${!file ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-blue-700"}`}
                                >
                                    Submit Proof
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

export default GCashPaymentModal