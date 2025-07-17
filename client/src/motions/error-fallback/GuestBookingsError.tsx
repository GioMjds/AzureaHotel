import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import { FC } from "react";
import { useNavigate } from "react-router-dom";

interface GuestBookingsErrorProps {
    error?: {
        status?: number;
        message?: string;
    };
    refetch?: () => void;
}

const GuestBookingsError: FC<GuestBookingsErrorProps> = ({ error, refetch }) => {
    const navigate = useNavigate();
    const statusCode = error?.status;
    
    let errorTitle = "Something went wrong";
    let errorMessage = "We encountered an unexpected error while loading your bookings.";

    switch (statusCode) {
        case 401:
            errorTitle = "Unauthorized Access";
            errorMessage = "You need to be logged in to view your bookings.";
            break;
        case 403:
            errorTitle = "Access Forbidden";
            errorMessage = "You don't have permission to view these bookings.";
            break;
        case 404:
            errorTitle = "Bookings Not Found";
            errorMessage = "We couldn't find any booking records for your account.";
            break;
        case 429:
            errorTitle = "Too Many Requests";
            errorMessage = "You've made too many requests. Please wait a moment and try again.";
            break;
        case 500:
            errorTitle = "Server Error";
            errorMessage = "Our servers are experiencing issues. Please try again later.";
            break;
        case 503:
            errorTitle = "Service Unavailable";
            errorMessage = "The booking service is temporarily unavailable. Please try again later.";
            break;
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)]"
        >
            <motion.div
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="max-w-2xl w-full bg-white rounded-xl shadow-lg overflow-hidden"
            >
                <div className="bg-gradient-to-r from-red-500 to-red-600 p-4 flex items-center">
                    <AlertTriangle className="text-white h-8 w-8 mr-3" />
                    <h1 className="text-xl font-bold text-white">{errorTitle}</h1>
                </div>

                <div className="p-8 space-y-6">
                    <div className="flex justify-center">
                        <motion.div
                            animate={{
                                rotate: [0, 10, -10, 0],
                            }}
                            transition={{
                                repeat: Infinity,
                                repeatType: "reverse",
                                duration: 2,
                            }}
                        >
                            <AlertTriangle className="h-16 w-16 text-red-500" />
                        </motion.div>
                    </div>

                    <div className="text-center space-y-2">
                        <p className="text-gray-700 text-xl">{errorMessage}</p>
                        {error?.message && (
                            <p className="text-gray-500 text-sm mt-2 bg-gray-100 p-2 rounded">
                                Error details: {error.message}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        {refetch && (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={refetch}
                                className="flex items-center justify-center px-6 py-3 bg-red-600 text-white rounded-lg font-medium shadow-md hover:bg-red-700 transition-colors"
                            >
                                <RefreshCw className="mr-2 h-5 w-5" />
                                Try Again
                            </motion.button>
                        )}

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate("/")}
                            className="flex items-center justify-center px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-medium shadow-md hover:bg-gray-300 transition-colors"
                        >
                            <ArrowLeft className="mr-2 h-5 w-5" />
                            Go to Homepage
                        </motion.button>
                    </div>
                </div>

                <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
                    <p className="text-center text-sm text-gray-500">
                        Need immediate help?{" "}
                        <a
                            href={`mailto:azureahotelmanagement@gmail.com`}
                            className="text-red-600 hover:underline"
                        >
                            Contact our support team
                        </a>
                    </p>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default GuestBookingsError;