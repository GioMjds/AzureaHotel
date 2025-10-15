import { motion } from 'framer-motion';
import { FC } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

interface ManageSkeletonProps {
    items?: number;
    type?: 'area' | 'room';
}

const ManageSkeleton: FC<ManageSkeletonProps> = ({
    items = 9,
    type = 'area'
}) => {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: 'spring',
                damping: 12,
                stiffness: 100
            }
        }
    };

    const renderSkeletonCard = (index: number) => (
        <motion.div
            key={index}
            variants={itemVariants}
            className="bg-white shadow-md rounded-lg overflow-hidden flex flex-col h-full"
        >
            {/* Image placeholder */}
            <Skeleton height={192} width="100%" />

            <div className="p-4 flex flex-col h-full">
                {/* Header - Title and Status */}
                <div className="flex justify-between items-center mb-2">
                    <Skeleton width={120} height={24} /> {/* Title */}
                    <Skeleton width={80} height={20} className="rounded-full" /> {/* Status */}
                </div>

                {/* Tags/Metadata */}
                <div className="mb-2 flex flex-wrap gap-1">
                    <Skeleton width={85} height={22} className="rounded-full" /> {/* Type */}

                    {/* Additional tags for room type */}
                    {type === 'room' && (
                        <>
                            <Skeleton width={70} height={22} className="rounded-full" /> {/* Bed Type */}
                            <Skeleton width={110} height={22} className="rounded-full" /> {/* Capacity */}
                        </>
                    )}
                </div>

                {/* Description with lines */}
                <div className="mb-4">
                    <Skeleton count={2} className="mb-1" /> {/* Description */}
                </div>

                {/* Bottom section - Price and Actions */}
                <div className="mt-auto flex justify-between items-center">
                    <Skeleton width={80} height={28} /> {/* Price */}

                    {/* Action buttons */}
                    <div className="flex gap-2">
                        <Skeleton width={40} height={38} className="rounded" /> {/* View */}
                        <Skeleton width={40} height={38} className="rounded" /> {/* Edit */}
                        <Skeleton width={40} height={38} className="rounded" /> {/* Delete */}
                    </div>
                </div>
            </div>
        </motion.div>
    );

    return (
        <div className="p-4 container mx-auto">
            {/* Header */}
            <div className="flex flex-row items-center mb-5 justify-between">
                <div>
                    <Skeleton width={180} height={36} className="mb-2" /> {/* Title */}
                    <Skeleton width={120} height={20} /> {/* Count */}
                </div>
                <Skeleton width={150} height={40} className="rounded-lg" /> {/* Add button */}
            </div>

            {/* Grid Layout */}
            <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {Array.from({ length: items }).map((_, index) => renderSkeletonCard(index))}
            </motion.div>

            {/* Pagination */}
            <div className="flex justify-center items-center gap-2 my-5">
                <Skeleton width={40} height={40} className="rounded-full" /> {/* Previous */}
                <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <Skeleton key={index} width={32} height={32} className="rounded-full" />
                    ))}
                </div>
                <Skeleton width={40} height={40} className="rounded-full" /> {/* Next */}
            </div>
        </div>
    );
};

export default ManageSkeleton;
