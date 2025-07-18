import { motion } from "framer-motion"
import Skeleton from "react-loading-skeleton"
import "react-loading-skeleton/dist/skeleton.css"

// Food Orders Commission Skeleton Component
export const FoodOrdersCommissionSkeleton = () => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white shadow-lg rounded-lg p-6 mb-6"
        >
            <div className="flex justify-between items-center mb-4">
                <Skeleton width={280} height={32} />
            </div>

            {/* Commission Summary Cards Skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[...Array(4)].map((_, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="bg-gray-100 p-4 rounded-lg shadow h-24"
                    >
                        <Skeleton width={120} height={16} className="mb-2" />
                        <Skeleton width={80} height={24} className="mb-1" />
                        <Skeleton width={100} height={14} />
                    </motion.div>
                ))}
            </div>

            {/* Daily Commission Chart Skeleton */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="mt-6"
            >
                <Skeleton width={350} height={28} className="mb-4" />
                <div className="h-64 bg-gray-50 rounded-lg">
                    <Skeleton height={256} />
                </div>
            </motion.div>
        </motion.div>
    )
}

const DashboardSkeleton = () => {
    return (
        <div className="p-6 container mx-auto animate-pulse">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <Skeleton width={250} height={40} className="mb-2 md:mb-0" />

                <div className="flex items-center gap-4 w-full md:w-auto">
                    {/* Month Controls */}
                    <div className="flex items-center bg-white rounded-lg shadow-sm h-10 w-48">
                        <Skeleton circle width={32} height={32} className="m-2" />
                        <Skeleton width={100} height={24} className="mx-2" />
                        <Skeleton circle width={32} height={32} className="m-2" />
                    </div>

                    {/* Report Button */}
                    <Skeleton width={200} height={40} className="rounded-lg" />
                </div>
            </div>

            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 mb-8">
                {[...Array(4)].map((_, index) => (
                    <div key={index} className="p-4 bg-white shadow rounded-lg h-24">
                        <Skeleton height={20} width={120} className="mb-2" />
                        <Skeleton height={28} width={80} />
                    </div>
                ))}
            </div>

            {/* Monthly Trends Section */}
            <div className="mb-8">
                <Skeleton width={200} height={28} className="mb-4" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[...Array(3)].map((_, index) => (
                        <div key={index} className="bg-white shadow-lg rounded-lg p-4 h-80">
                            <Skeleton width={160} height={24} className="mb-2 mx-auto" />
                            <Skeleton height={240} className="mt-4" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Key Business Insights Section */}
            <div className="mb-8">
                <Skeleton width={280} height={28} className="mb-4" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[...Array(4)].map((_, index) => (
                        <div key={index} className="bg-white shadow-lg rounded-lg p-4 h-80">
                            <Skeleton width={200} height={24} className="mb-2 mx-auto" />
                            {index === 2 ? (
                                <div className="flex justify-center mt-6">
                                    <Skeleton circle width={150} height={150} />
                                </div>
                            ) : (
                                <Skeleton height={240} className="mt-4" />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Food Orders Commission Section Skeleton */}
            <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <Skeleton width={280} height={32} />
                </div>

                {/* Commission Summary Cards Skeleton */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[...Array(4)].map((_, index) => (
                        <div key={index} className="bg-gray-100 p-4 rounded-lg shadow h-24">
                            <Skeleton width={120} height={16} className="mb-2" />
                            <Skeleton width={80} height={24} className="mb-1" />
                            <Skeleton width={100} height={14} />
                        </div>
                    ))}
                </div>

                {/* Daily Commission Chart Skeleton */}
                <div className="mt-6">
                    <Skeleton width={350} height={28} className="mb-4" />
                    <div className="h-64 bg-gray-50 rounded-lg">
                        <Skeleton height={256} />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DashboardSkeleton