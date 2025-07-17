import { AnimatePresence, motion } from "framer-motion";
import { FC, useEffect, useMemo, useState } from "react";
import { MemoizedImage } from "../../memo/MemoizedImage";
import { AreaDetailsModalProps } from "../../types/AreaClient";

const AreaDetailsModal: FC<AreaDetailsModalProps> = ({ isOpen, onClose, areaData }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
    const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

    const areaImages = useMemo(() => {
        if (!areaData || !Array.isArray(areaData.images)) {
            return [];
        }
        return areaData.images.map(img => ({
            src: img.area_image,
            alt: areaData.area_name,
        }));
    }, [areaData]);

    useEffect(() => {
        setCurrentImageIndex(0);
        setIsFullScreen(false);
    }, [areaData, isOpen]);

    const openFullScreen = (idx: number) => {
        setCurrentImageIndex(idx);
        setIsFullScreen(true);
    };

    const closeFullScreen = () => setIsFullScreen(false);
    
    const handleNextImage = () => {
        if (areaImages.length > 1) {
            setCurrentImageIndex((prev) => (prev + 1) % areaImages.length);
        }
    };
    const handlePrevImage = () => {
        if (areaImages.length > 1) {
            setCurrentImageIndex((prev) => (prev - 1 + areaImages.length) % areaImages.length);
        }
    };

    if (!areaData) return null;

    return (
        <AnimatePresence mode="wait">
            {isOpen && (
                <motion.div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <motion.div
                        className="bg-white w-full max-w-4xl rounded-xl shadow-2xl relative max-h-[90vh] overflow-hidden flex flex-col"
                        initial={{ scale: 0.9, y: 50, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.9, y: 50, opacity: 0 }}
                        transition={{
                            type: "spring",
                            damping: 30,
                            stiffness: 300,
                            mass: 0.8,
                        }}
                    >
                        {/* Close button */}
                        <motion.button
                            onClick={onClose}
                            className="absolute top-4 right-4 z-50 bg-white/80 hover:bg-white text-gray-700 hover:text-red-600 rounded-full p-2 transition-all duration-200 shadow-md cursor-pointer"
                            whileTap={{ scale: 0.8 }}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </motion.button>
                        <div className="grid grid-cols-1 md:grid-cols-2 h-full max-h-[90vh]">
                            {/* Left: Image Gallery */}
                            <div className="relative h-64 md:h-full">
                                {areaImages.length > 0 ? (
                                    <div className="relative h-full">
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent z-10"></div>
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.2 }}
                                            className="h-full"
                                        >
                                            <div
                                                className="relative h-full cursor-pointer"
                                                onClick={() => openFullScreen(currentImageIndex)}
                                            >
                                                <MemoizedImage
                                                    src={areaImages[currentImageIndex]?.src || areaImages[0]?.src}
                                                    alt={areaImages[currentImageIndex]?.alt}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        </motion.div>
                                        {/* Gallery Navigation */}
                                        {areaImages.length > 1 && (
                                            <>
                                                <button
                                                    onClick={handlePrevImage}
                                                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow-md z-20"
                                                    aria-label="Previous image"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={handleNextImage}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow-md z-20"
                                                    aria-label="Next image"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </button>
                                            </>
                                        )}
                                        {/* Image counter */}
                                        {areaImages.length > 1 && (
                                            <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm z-20">
                                                {currentImageIndex + 1} / {areaImages.length}
                                            </div>
                                        )}
                                        {/* Thumbnail Gallery */}
                                        {areaImages.length > 1 && (
                                            <div className="absolute bottom-16 left-0 right-0 flex justify-center gap-2 px-4 z-20">
                                                <div className="bg-black/40 backdrop-blur-sm p-2 rounded-lg flex gap-2 overflow-x-auto max-w-full">
                                                    {areaImages.map((img, idx) => (
                                                        <div
                                                            key={idx}
                                                            className={`h-12 w-16 rounded overflow-hidden cursor-pointer transition-all duration-300 ${idx === currentImageIndex ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'}`}
                                                            onClick={() => setCurrentImageIndex(idx)}
                                                        >
                                                            <img
                                                                src={img.src}
                                                                alt={`Thumbnail ${idx + 1}`}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        <div className="absolute bottom-4 left-4 z-20 md:hidden">
                                            <motion.h1
                                                className="text-2xl font-bold text-white mb-1"
                                                initial={{ y: 10, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                transition={{ delay: 0.3 }}
                                            >
                                                {areaData.area_name}
                                            </motion.h1>
                                            <motion.div
                                                className="flex items-center"
                                                initial={{ y: 10, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                transition={{ delay: 0.4 }}
                                            >
                                                <span
                                                    className={`px-3 py-1 rounded-full text-sm font-medium ${areaData.status === "available"
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-amber-100 text-amber-800"
                                                        }`}
                                                >
                                                    {areaData.status === "available"
                                                        ? "AVAILABLE"
                                                        : "MAINTENANCE"}
                                                </span>
                                            </motion.div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
                                        <motion.svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-20 w-20 opacity-50"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 0.5 }}
                                            transition={{ delay: 0.2 }}
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1}
                                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                            />
                                        </motion.svg>
                                    </div>
                                )}
                            </div>
                            {/* Right Column: Area Information - SCROLLABLE */}
                            <div className="overflow-y-auto" style={{ maxHeight: "90vh" }}>
                                <div className="p-6 flex flex-col">
                                    <motion.div
                                        className="hidden md:block mb-4"
                                        initial={{ y: 10, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        <h1 className="text-3xl font-bold text-gray-900">
                                            {areaData.area_name}
                                        </h1>
                                        <div className="flex items-center mt-2">
                                            <span
                                                className={`px-3 py-1 rounded-full text-sm font-medium ${areaData.status === "available"
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-amber-100 text-amber-800"
                                                    }`}
                                            >
                                                {areaData.status === "available"
                                                    ? "AVAILABLE"
                                                    : "MAINTENANCE"}
                                            </span>
                                        </div>
                                    </motion.div>
                                    <motion.div
                                        className="bg-gray-50 p-4 rounded-lg mb-5 shadow-inner border border-gray-400"
                                        initial={{ y: 10, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.3 }}
                                    >
                                        <h3 className="text-sm uppercase tracking-wider text-gray-500 font-medium mb-2">
                                            Description
                                        </h3>
                                        <p className="text-gray-700">
                                            {areaData.description || "No description available."}
                                        </p>
                                    </motion.div>
                                    <motion.div
                                        className="grid grid-cols-2 gap-4 mb-6"
                                        initial={{ y: 10, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.4 }}
                                    >
                                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-400">
                                            <span className="block text-gray-500 text-md">
                                                Capacity
                                            </span>
                                            <div className="flex items-center mt-1">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-5 w-5 text-blue-600 mr-1"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                                    />
                                                </svg>
                                                <span className="text-2xl font-bold text-gray-800">
                                                    {areaData.capacity} <span className="text-md font-normal text-gray-600">people</span>
                                                </span>
                                            </div>
                                        </div>
                                        <div className="bg-green-50 p-3 rounded-lg border border-green-400">
                                            <span className="block text-gray-500 text-md">Price</span>
                                            <div className="flex items-center mt-1">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-5 w-5 text-green-600 mr-1"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                    />
                                                </svg>
                                                <span className="text-2xl font-bold text-gray-800">
                                                    {areaData.price_per_hour.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                    <motion.div
                                        className="bg-indigo-50 p-4 rounded-lg mb-5"
                                        initial={{ y: 10, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.5 }}
                                    >
                                        <h3 className="text-sm uppercase tracking-wider text-indigo-500 font-medium mb-2">
                                            Booking Information
                                        </h3>
                                        <p className="text-gray-700 text-sm">
                                            This venue is available for fixed hours (8:00 AM - 5:00 PM)
                                            and can be booked for
                                            <span className="font-medium"> {areaData.price_per_hour.toLocaleString()}</span> per booking.
                                        </p>
                                    </motion.div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
            {/* Full Screen Image Viewer */}
            <AnimatePresence>
                {isFullScreen && areaImages.length > 0 && (
                    <motion.div
                        className="fixed inset-0 bg-black z-[60] flex items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={closeFullScreen}
                    >
                        <button
                            className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 z-10 hover:bg-black/80"
                            onClick={e => { e.stopPropagation(); closeFullScreen(); }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <div className="w-full h-full flex flex-col" onClick={e => e.stopPropagation()}>
                            {/* Main Image */}
                            <div className="flex-1 flex items-center justify-center overflow-hidden">
                                <motion.img
                                    src={areaImages[currentImageIndex]?.src}
                                    alt={areaImages[currentImageIndex]?.alt}
                                    className="max-w-full max-h-full object-contain"
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ duration: 0.3 }}
                                />
                            </div>
                            {/* Navigation Controls */}
                            <div className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2 flex justify-between px-4">
                                <button
                                    className="bg-black/30 hover:bg-black/60 rounded-full p-3 text-white transition-all"
                                    onClick={e => { e.stopPropagation(); handlePrevImage(); }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <button
                                    className="bg-black/30 hover:bg-black/60 rounded-full p-3 text-white transition-all"
                                    onClick={e => { e.stopPropagation(); handleNextImage(); }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                            {/* Thumbnail strip */}
                            <div className="h-24 bg-black/80 flex items-center justify-center p-2 overflow-x-auto">
                                <div className="flex gap-2">
                                    {areaImages.map((img, idx) => (
                                        <div
                                            key={idx}
                                            className={`h-16 w-20 rounded overflow-hidden cursor-pointer transition-all duration-300 ${idx === currentImageIndex ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'}`}
                                            onClick={e => { e.stopPropagation(); setCurrentImageIndex(idx); }}
                                        >
                                            <img
                                                src={img.src}
                                                alt={`Thumbnail ${idx + 1}`}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {/* Image Counter */}
                            <div className="absolute bottom-28 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full">
                                {currentImageIndex + 1} / {areaImages.length}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </AnimatePresence>
    );
};

export default AreaDetailsModal;