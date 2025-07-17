/* eslint-disable @typescript-eslint/no-explicit-any */
import { faPlus, faSave } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { ChangeEvent, FC, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { fetchAmenities } from "../../services/Admin";
import { IRoom, IRoomFormModalProps } from "../../types/RoomAdmin";

const EditRoomModal: FC<IRoomFormModalProps> = ({ isOpen, cancel, onSave, roomData, loading = false }) => {
    const [isHovered, setIsHovered] = useState<boolean>(false);

    const { register, handleSubmit, formState: { errors }, reset, watch, setError, setValue, getValues } = useForm<IRoom>({
        mode: "onBlur",
        defaultValues: {
            id: roomData?.id || 0,
            roomName: roomData?.roomName || "",
            roomType: roomData?.roomType || "premium",
            bedType: roomData?.bedType || "single",
            amenities: roomData?.amenities || [],
            roomPrice: roomData?.roomPrice,
            status: roomData?.status || "Available",
            description: roomData?.description || "",
            images: roomData?.images || [],
            maxGuests: roomData?.maxGuests || 1,
            discount_percent: roomData?.discount_percent || 0,
        }
    });

    const images = watch("images");

    useEffect(() => {
        if (roomData) {
            reset({
                id: roomData.id || 0,
                roomName: roomData.roomName || "",
                roomType: roomData.roomType || "premium",
                bedType: roomData.bedType || "single",
                amenities: roomData.amenities || [],
                roomPrice: roomData.roomPrice,
                status: roomData.status || "Available",
                description: roomData.description || "",
                images: roomData.images || [],
                maxGuests: roomData.maxGuests || 1,
                discount_percent: roomData.discount_percent || 0,
            });
        }
    }, [roomData, reset]);

    const { data: amenitiesData, isLoading: isLoadingAmenities, isError: isErrorAmenities } = useQuery({
        queryKey: ["amenities", 1, 100],
        queryFn: fetchAmenities,
        enabled: isOpen,
    });

    const availableAmenities = amenitiesData?.data || [];

    const handleAmenityChange = (amenityId: number) => {
        const currentAmenities = getValues("amenities");
        const newAmenities = currentAmenities.includes(amenityId)
            ? currentAmenities.filter(id => id !== amenityId)
            : [...currentAmenities, amenityId];
        setValue("amenities", newAmenities);
    };

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const existingImages = images.filter((img) => typeof img === 'string') || [];
            setValue("images", [
                ...existingImages,
                ...files
            ]);
        }
    };

    const renderImagePreviews = () => {
        if (!images || images.length === 0) return null;
        return (
            <div className="flex flex-wrap gap-2">
                {images.map((img: any, idx: number) => {
                    const src = typeof img === 'string' ? img : URL.createObjectURL(img);
                    
                    return (
                        <div key={idx} className="relative inline-block">
                            <img
                                src={src}
                                alt={`Preview ${idx + 1}`}
                                className="w-20 h-20 object-cover border border-gray-200 rounded-md shadow-sm mt-4"
                                loading="lazy"
                            />
                            <motion.button
                                type="button"
                                onClick={() => handleRemoveImage(idx)}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors duration-200"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                aria-label="Remove image"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </motion.button>
                        </div>
                    );
                })}
            </div>
        );
    };

    const handleRemoveImage = (idx: number) => {
        const updatedImages = images.filter((_, i) => i !== idx);
        setValue("images", updatedImages);
    };

    const onSubmit = async (data: IRoom) => {
        try {
            await onSave(data);
        } catch (error: any) {
            const apiErrors = error.response?.data?.error || {};
            Object.entries(apiErrors).forEach(([key, message]) => {
                setError(key as keyof IRoom, { type: 'server', message: message as string });
            });
        }
    };

    useEffect(() => {
        const handleKeyDown = (evt: KeyboardEvent) => {
            if (evt.key === "Escape") cancel();
        };
        if (isOpen) window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [cancel, isOpen]);

    const formVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.07,
                delayChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
    };

    const checkboxVariants = {
        hidden: { opacity: 0 },
        visible: (custom: number) => ({
            opacity: 1,
            x: 0,
            transition: {
                delay: 0.5 + (custom * 0.03),
                type: "spring",
                stiffness: 300,
                damping: 24
            }
        })
    };

    const contentVariants = {
        rest: { x: "0%", opacity: 1, transition: { duration: 0.3, ease: "easeOut" } },
        hover: { x: "125%", opacity: 0, transition: { duration: 0.3, ease: "easeOut" } }
    };

    const iconVariants = {
        rest: { x: "-125%", opacity: 0, transition: { duration: 0.3, ease: "easeOut" } },
        hover: { x: "0%", opacity: 1, transition: { duration: 0.3, ease: "easeOut" } }
    };

    return (
        <AnimatePresence mode="wait">
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 overflow-y-auto p-4"
                    onClick={cancel}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.9, y: 20, opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="bg-white w-full max-w-4xl rounded-xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button - positioned on top right */}
                        <motion.button
                            onClick={cancel}
                            className="absolute top-4 right-4 z-50 bg-white/80 hover:bg-white text-gray-700 hover:text-red-600 rounded-full p-2 transition-all duration-200 shadow-md"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </motion.button>

                        <motion.h2
                            className="text-2xl font-bold mb-6 text-gray-800"
                            initial={{ y: -10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.3 }}
                        >
                            {roomData ? "Edit Room" : "Add New Room"}
                        </motion.h2>

                        <motion.form
                            onSubmit={handleSubmit(onSubmit)}
                            className="space-y-4"
                            variants={formVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            {/* 2-column grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Left Column */}
                                <div className="space-y-4">
                                    {/* Room Name */}
                                    <motion.div variants={itemVariants}>
                                        <label className="block text-sm font-medium mb-1 text-gray-700">
                                            Room Name
                                        </label>
                                        <input
                                            type="text"
                                            name="roomName"
                                            {...register("roomName", {
                                                required: "Room name is required"
                                            })}
                                            placeholder="Enter Room Name"
                                            className="border border-gray-300 rounded-md w-full p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                                        />
                                        {errors.roomName && (
                                            <motion.p
                                                className="text-red-500 text-xs mt-1"
                                                initial={{ opacity: 0, y: -5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                {errors.roomName.message}
                                            </motion.p>
                                        )}
                                    </motion.div>

                                    {/* Room Type & Bed Type in 2-column grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Room Type */}
                                        <motion.div variants={itemVariants}>
                                            <label className="block text-sm font-medium mb-1 text-gray-700">
                                                Room Type
                                            </label>
                                            <div className="relative">
                                                <select
                                                    name="roomType"
                                                    {...register("roomType")}
                                                    className="appearance-none border border-gray-300 rounded-md w-full p-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-white"
                                                >
                                                    <option value="" disabled>Select Room Type</option>
                                                    <option value="premium">Premium</option>
                                                    <option value="suites">Suites</option>
                                                </select>
                                                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                                    </svg>
                                                </div>
                                            </div>
                                            {errors.roomType && (
                                                <motion.p
                                                    className="text-red-500 text-xs mt-1"
                                                    initial={{ opacity: 0, y: -5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    {errors.roomType.message}
                                                </motion.p>
                                            )}
                                        </motion.div>

                                        {/* Bed Type */}
                                        <motion.div variants={itemVariants}>
                                            <label className="block text-sm font-medium mb-1 text-gray-700">
                                                Bed Type
                                            </label>
                                            <div className="relative">
                                                <select
                                                    name="bedType"
                                                    {...register("bedType")}
                                                    className="appearance-none border border-gray-300 rounded-md w-full p-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-white"
                                                >
                                                    <option value="" disabled>Select Bed Type</option>
                                                    <option value="single">Single</option>
                                                    <option value="twin">Twin</option>
                                                    <option value="double">Double</option>
                                                    <option value="queen">Queen</option>
                                                    <option value="king">King</option>
                                                </select>
                                                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                                    </svg>
                                                </div>
                                            </div>
                                            {errors.bedType && (
                                                <motion.p
                                                    className="text-red-500 text-xs mt-1"
                                                    initial={{ opacity: 0, y: -5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    {errors.bedType.message}
                                                </motion.p>
                                            )}
                                        </motion.div>
                                    </div>

                                    {/* Max Guests & Status */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <motion.div variants={itemVariants}>
                                            <label className="block text-sm font-medium mb-1 text-gray-700">
                                                No. of Guest(s)
                                            </label>
                                            <input
                                                type="number"
                                                name="maxGuests"
                                                {...register("maxGuests", {
                                                    required: "Max guests is required",
                                                    valueAsNumber: true,
                                                    min: { value: 1, message: "Minimum 1 guest" }
                                                })}
                                                placeholder="Maximum number of guests"
                                                className="border border-gray-300 rounded-md w-full p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                                            />
                                            {errors.maxGuests && (
                                                <motion.p
                                                    className="text-red-500 text-xs mt-1"
                                                    initial={{ opacity: 0, y: -5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    {errors.maxGuests.message}
                                                </motion.p>
                                            )}
                                        </motion.div>

                                        {/* Status (Only when editing) */}
                                        {roomData && (
                                            <motion.div variants={itemVariants}>
                                                <label className="block text-sm font-medium mb-1 text-gray-700">
                                                    Status
                                                </label>
                                                <select
                                                    name="status"
                                                    {...register("status")}
                                                    className="border border-gray-300 rounded-md w-full p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                                                >
                                                    <option value="Available">Available</option>
                                                    <option value="Maintenance">Maintenance</option>
                                                </select>
                                                {errors.status && (
                                                    <motion.p
                                                        className="text-red-500 text-xs mt-1"
                                                        initial={{ opacity: 0, y: -5 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                    >
                                                        {errors.status.message}
                                                    </motion.p>
                                                )}
                                            </motion.div>
                                        )}
                                    </div>

                                    {/* Room Price */}
                                    <motion.div variants={itemVariants}>
                                        <label className="block text-sm font-medium mb-1 text-gray-700">
                                            Room Price (₱)
                                        </label>
                                        <input
                                            type="number"
                                            name="roomPrice"
                                            {...register("roomPrice", {
                                                required: "Room price is required",
                                                valueAsNumber: true,
                                                min: { value: 0, message: "Price cannot be negative" }
                                            })}
                                            className="border border-gray-300 rounded-md w-full p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                                        />
                                        {errors.roomPrice && (
                                            <motion.p
                                                className="text-red-500 text-xs mt-1"
                                                initial={{ opacity: 0, y: -5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                {errors.roomPrice.message}
                                            </motion.p>
                                        )}
                                    </motion.div>

                                    {/* Description */}
                                    <motion.div variants={itemVariants}>
                                        <label className="block text-sm font-medium mb-1 text-gray-700">
                                            Description
                                        </label>
                                        <textarea
                                            name="description"
                                            {...register("description")}
                                            rows={4}
                                            placeholder="Enter room description"
                                            className="border border-gray-300 rounded-md w-full p-2 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                                        />
                                        {errors.description && (
                                            <motion.p
                                                className="text-red-500 text-xs mt-1"
                                                initial={{ opacity: 0, y: -5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                {errors.description.message}
                                            </motion.p>
                                        )}
                                    </motion.div>

                                    <motion.div variants={itemVariants}>
                                        <label className="block text-sm font-medium mb-1 text-gray-700">
                                            Discount (%)
                                        </label>
                                        <input
                                            type="number"
                                            name="discount_percent"
                                            min={0}
                                            max={99}
                                            {...register("discount_percent", {
                                                valueAsNumber: true,
                                                min: { value: 0, message: "Min 0%" },
                                                max: { value: 99, message: "Max 99%" }
                                            })}
                                            className="border border-gray-300 rounded-md w-full p-2"
                                            placeholder="0"
                                        />
                                        {errors.discount_percent && (
                                            <motion.p className="text-red-500 text-xs mt-1">
                                                {errors.discount_percent.message}
                                            </motion.p>
                                        )}
                                    </motion.div>
                                </div>

                                {/* Right Column */}
                                <div className="space-y-4">
                                    {/* Room Image */}
                                    <motion.div variants={itemVariants}>
                                        <label className="block text-sm font-medium mb-1 text-gray-700">
                                            Room Image
                                        </label>
                                        <div className="border border-dashed border-gray-300 rounded-md p-4 text-center hover:border-blue-500 transition-colors duration-200">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                multiple
                                                className="hidden"
                                                id="room-image-upload"
                                            />
                                            <motion.label
                                                htmlFor="room-image-upload"
                                                className="cursor-pointer flex flex-col items-center justify-center"
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <span className="text-sm text-gray-500">Click to upload an image</span>
                                                <span className="text-xs text-gray-400 mt-1 block">
                                                    Maximum file size: 5MB per image
                                                </span>
                                            </motion.label>
                                        </div>

                                        {renderImagePreviews()}

                                        {errors.images && (
                                            <motion.p
                                                className="text-red-500 text-xs mt-1"
                                                initial={{ opacity: 0, y: -5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                {errors.images.message}
                                            </motion.p>
                                        )}
                                    </motion.div>

                                    {/* Amenities Section */}
                                    <motion.div variants={itemVariants} className="mt-4">
                                        <label className="block text-md font-medium mb-1 text-gray-700">
                                            Amenities
                                        </label>
                                        <div className="bg-gray-50 p-4 rounded-lg shadow-inner">
                                            {isLoadingAmenities ? (
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="flex justify-center p-4"
                                                >
                                                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                                                </motion.div>
                                            ) : isErrorAmenities ? (
                                                <p className="text-red-500">Failed to load amenities</p>
                                            ) : (
                                                <div className="grid grid-cols-1 md:grid-cols-2 space-y-2 gap-2 max-h-34 overflow-y-auto">
                                                    {availableAmenities.map((amenity: any, index: number) => (
                                                        <motion.div
                                                            key={amenity.id}
                                                            className="flex items-center"
                                                            custom={index}
                                                            variants={checkboxVariants}
                                                        >
                                                            <motion.div
                                                                className="flex items-center space-x-1"
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    id={`amenity-${amenity.id}`}
                                                                    checked={watch("amenities").includes(amenity.id)}
                                                                    onChange={() => handleAmenityChange(amenity.id)}
                                                                    className="text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                                                                />
                                                                <label
                                                                    htmlFor={`amenity-${amenity.id}`}
                                                                    className="text-xs text-gray-700 cursor-pointer"
                                                                >
                                                                    {amenity.description}
                                                                </label>
                                                            </motion.div>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        {errors.amenities && (
                                            <motion.p
                                                className="text-red-500 text-xs mt-1"
                                                initial={{ opacity: 0, y: -5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                {errors.amenities.message}
                                            </motion.p>
                                        )}
                                    </motion.div>

                                    {/* Action Buttons */}
                                    <motion.div
                                        className="flex justify-end space-x-3"
                                        variants={itemVariants}
                                    >
                                        <motion.button
                                            type="submit"
                                            disabled={loading}
                                            className={`relative overflow-hidden px-4 py-2 bg-blue-600 text-white rounded-md transition-colors duration-300 font-medium ${loading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:bg-blue-700'}`}
                                            onMouseEnter={() => setIsHovered(true)}
                                            onMouseLeave={() => setIsHovered(false)}
                                        >
                                            <motion.span
                                                className="block uppercase font-semibold"
                                                variants={contentVariants}
                                                initial="rest"
                                                animate={isHovered ? "hover" : "rest"}
                                            >
                                                {loading ? 'Saving...' : roomData ? 'Update Area' : 'Create Area'}
                                            </motion.span>

                                            <motion.span
                                                className="absolute inset-0 flex items-center justify-center"
                                                variants={iconVariants}
                                                initial="rest"
                                                animate={isHovered ? "hover" : "rest"}
                                            >
                                                <FontAwesomeIcon size="xl" icon={roomData ? faSave : faPlus} />
                                            </motion.span>
                                        </motion.button>
                                    </motion.div>
                                </div>
                            </div>
                        </motion.form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default EditRoomModal;
