import { motion } from "framer-motion";
import { Edit, Eye, Trash2 } from "lucide-react";
import { FC, memo, useCallback, useMemo } from "react";
import { Area } from "../types/AreaClient";
import { MemoizedImage } from "./MemoizedImage";

interface AreaCardProps {
    area: Area;
    onView: (area: Area) => void;
    onEdit: (area: Area) => void;
    onDelete: (id: number) => void;
}

export const AreaCard: FC<AreaCardProps> = memo(
    ({
        area,
        onView,
        onEdit,
        onDelete,
    }) => {
        const firstImage =
            Array.isArray(area.images) && area.images.length > 0
                ? area.images[0].area_image
                : null;
        const areaImageProps = useMemo(
            () => ({
                src: firstImage,
                alt: area.area_name,
            }),
            [firstImage, area.area_name]
        );

        const handleView = useCallback(() => onView(area), [area, onView]);
        const handleEdit = useCallback(() => onEdit(area), [area, onEdit]);
        const handleDelete = useCallback(
            () => onDelete(area.id),
            [area.id, onDelete]
        );

        if (!area) return null;

        return (
            <motion.div
                className="bg-white shadow-md rounded-lg overflow-hidden flex flex-col h-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                    duration: 0.4,
                    type: "spring",
                    damping: 12,
                }}
                whileHover={{
                    y: -5,
                    boxShadow:
                        "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                }}
            >
                <div className="relative">
                    <MemoizedImage
                        src={areaImageProps.src}
                        alt={areaImageProps.alt}
                        className="w-full h-40 object-cover"
                    />
                    {area.discount_percent > 0 && (
                        <span className="absolute top-3 left-3 bg-red-600 text-white text-base font-extrabold px-4 py-2 rounded-full shadow-lg z-10 border-4 border-white drop-shadow-lg tracking-wide uppercase">
                            -{area.discount_percent}% OFF
                        </span>
                    )}
                </div>
                <div className="p-4 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-2xl font-bold text-gray-900">
                            {area.area_name}
                        </h2>
                        <span
                            className={`text-md font-semibold ${area.status === "available"
                                ? "text-green-600"
                                : "text-amber-600"
                                } uppercase`}
                        >
                            {area.status === "available" ? "AVAILABLE" : "MAINTENANCE"}
                        </span>
                    </div>
                    <span className="flex items-center mb-2">
                        <span className="inline-flex items-center rounded-md px-2 py-1 text-sm font-semibold mr-2 bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-3.5 w-3.5 mr-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                            </svg>
                            Max Guests: {area.capacity}
                        </span>
                    </span>
                    <p className="text-gray-700 text-sm mb-2 line-clamp-2">
                        {area.description || "No description provided."}
                    </p>

                    <div className="mt-auto flex justify-between items-center">
                        <div className="flex flex-col">
                            {area.discounted_price ? (
                                <>
                                    <span className="text-sm font-bold text-gray-500 line-through">{area.price_per_hour}</span>
                                    <span className="text-xl font-bold text-green-600">
                                        {area.discounted_price}
                                    </span>
                                </>
                            ) : (
                                <span className="text-xl font-bold text-gray-900">{area.price_per_hour}</span>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <motion.button
                                onClick={handleView}
                                className="px-3 py-2 uppercase font-semibold bg-gray-600 text-white rounded cursor-pointer hover:bg-gray-700 transition-colors duration-300"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Eye />
                            </motion.button>
                            <motion.button
                                onClick={handleEdit}
                                className="px-3 py-2 uppercase font-semibold bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700 transition-colors duration-300"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Edit />
                            </motion.button>
                            <motion.button
                                onClick={handleDelete}
                                className="px-3 py-2 uppercase font-semibold bg-red-600 text-white rounded cursor-pointer hover:bg-red-700 transition-colors duration-300"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Trash2 />
                            </motion.button>
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    }
);

AreaCard.displayName = "AreaCard";