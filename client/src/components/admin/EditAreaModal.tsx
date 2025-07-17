/* eslint-disable @typescript-eslint/no-explicit-any */
import { faPlus, faSave } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AnimatePresence, motion } from "framer-motion";
import { ChangeEvent, FC, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { IArea, IAreaFormModalProps } from "../../types/AreaAdmin";
import { parsePriceValue } from "../../utils/formatters";

const EditAreaModal: FC<IAreaFormModalProps> = ({ onSave, areaData, isOpen, cancel, loading = false }) => {
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const { register, handleSubmit, formState: { errors }, reset, watch, setValue, setError } = useForm<IArea>({
    mode: "onBlur",
    defaultValues: {
      id: areaData?.id || 0,
      area_name: areaData?.area_name || "",
      description: areaData?.description || "",
      capacity: areaData?.capacity || 0,
      price_per_hour: areaData?.price_per_hour ? parsePriceValue(areaData.price_per_hour) : 0,
      status: areaData?.status || "available",
      images: areaData?.images || [],
      discount_percent: areaData?.discount_percent || 0,
    }
  });

  const images = watch("images");

  useEffect(() => {
    if (areaData) {
      reset({
        id: areaData.id || 0,
        area_name: areaData.area_name || "",
        description: areaData.description || "",
        capacity: areaData.capacity || 0,
        price_per_hour: areaData.price_per_hour ? parsePriceValue(areaData.price_per_hour) : 0,
        status: areaData.status || "available",
        images: areaData.images || [],
        discount_percent: areaData.discount_percent || 0,
      });
    }
  }, [areaData, reset]);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const existingImages = images?.filter((img: any) => typeof img === 'string') || [];
      setValue("images", [...existingImages, ...files]);
    }
  };

  const handleRemoveImage = (idx: number) => {
    const updatedImages = images.filter((_, i) => i !== idx);
    setValue("images", updatedImages);
  };

  const renderImagePreviews = () => {
    if (!images || images.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-2">
        {images.map((img: any, idx: number) => {
          const src = typeof img === 'string' ? img : URL.createObjectURL(img);
          return (
            <div key={idx} className="relative group">
              <img
                src={src}
                alt={`Preview ${idx + 1}`}
                className="w-20 h-20 object-cover rounded-lg border border-gray-200 shadow-sm mt-4"
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

  const onSubmit = async (data: IArea) => {
    try {
      await onSave(data);
    } catch (error: any) {
      const errors = error.response?.data?.error || {};
      Object.entries(errors).forEach(([key, message]) => {
        setError(key as keyof IArea, { type: 'server', message: message as string });
      })
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") cancel();
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
            className="bg-white w-full max-w-3xl rounded-xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto"
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
              {areaData ? "Edit Area" : "Add New Area"}
            </motion.h2>

            <motion.form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4"
              variants={formVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Column */}
                <div className="space-y-4">
                  {/* Area Name */}
                  <motion.div variants={itemVariants}>
                    <label className="block text-sm font-medium mb-1 text-gray-700">
                      Area Name
                    </label>
                    <input
                      type="text"
                      name="area_name"
                      {...register('area_name', { required: "Area name is required" })}
                      placeholder="Enter Area Name"
                      className="border border-gray-300 rounded-md w-full p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                    />
                    {errors.area_name && (
                      <motion.p
                        className="text-red-500 text-xs mt-1"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {errors.area_name.message}
                      </motion.p>
                    )}
                  </motion.div>

                  {/* Grid layout for Capacity and Price */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Capacity */}
                    <motion.div variants={itemVariants}>
                      <label className="block text-sm font-medium mb-1 text-gray-700">
                        Maximum No. of Guests
                      </label>
                      <input
                        type="number"
                        name="capacity"
                        {...register("capacity", {
                          required: "Capacity is required",
                          valueAsNumber: true,
                          min: { value: 1, message: "Capacity must be at least 1" }
                        })}
                        className="border border-gray-300 rounded-md w-full p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                      />
                      {errors.capacity && (
                        <motion.p
                          className="text-red-500 text-xs mt-1"
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          {errors.capacity.message}
                        </motion.p>
                      )}
                    </motion.div>

                    {/* Price Per Hour */}
                    <motion.div variants={itemVariants}>
                      <label className="block text-sm font-medium mb-1 text-gray-700">
                        Price (₱)
                      </label>
                      <input
                        type="number"
                        name="price_per_hour"
                        {...register("price_per_hour", {
                          required: "Price is required",
                          valueAsNumber: true,
                          min: { value: 0, message: "Price cannot be negative" }
                        })}
                        className="border border-gray-300 rounded-md w-full p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                      />
                      {errors.price_per_hour && (
                        <motion.p
                          className="text-red-500 text-xs mt-1"
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          {errors.price_per_hour.message}
                        </motion.p>
                      )}
                    </motion.div>
                  </div>

                  {/* Status - Only show for editing existing areas */}
                  {areaData?.id ? (
                    <motion.div variants={itemVariants}>
                      <label className="block text-sm font-medium mb-1 text-gray-700">
                        Status
                      </label>
                      <select
                        name="status"
                        {...register("status")}
                        className="border border-gray-300 rounded-md w-full p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                      >
                        <option value="available">Available</option>
                        <option value="maintenance">Maintenance</option>
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
                  ) : null}

                  {/* Description */}
                  <motion.div variants={itemVariants}>
                    <label className="block text-sm font-medium mb-1 text-gray-700">
                      Description
                    </label>
                    <textarea
                      name="description"
                      {...register("description")}
                      rows={4}
                      placeholder="Enter description"
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

                  {/* Discount Percentage */}
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
                  {/* Area Image */}
                  <motion.div variants={itemVariants}>
                    <label className="block text-sm font-medium mb-1 text-gray-700">
                      Area Images
                    </label>
                    <div className="border border-dashed border-gray-300 rounded-md p-4 text-center hover:border-blue-500 transition-colors duration-200">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                        className="hidden"
                        id='area-image-upload'
                      />
                      <motion.label
                        htmlFor="area-image-upload"
                        className="cursor-pointer flex flex-col items-center justify-center"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm text-gray-500">Click to upload an image</span>
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
                </div>
              </div>

              {/* Action Buttons */}
              <motion.div
                className="flex justify-end space-x-3 pt-6 border-t border-gray-100 mt-6"
                variants={itemVariants}
              >
                <motion.button
                  type="submit"
                  disabled={loading}
                  className={`relative overflow-hidden px-4 py-2 bg-blue-600 text-white rounded-md transition-colors duration-300 font-medium ${loading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:bg-blue-700'}`}
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                >
                  {/* Text sliding out left */}
                  <motion.span
                    className="block uppercase font-semibold"
                    variants={contentVariants}
                    initial="rest"
                    animate={isHovered ? "hover" : "rest"}
                  >
                    {loading ? 'Saving...' : areaData ? 'Update Area' : 'Create Area'}
                  </motion.span>

                  {/* Icon sliding in from right */}
                  <motion.span
                    className="absolute inset-0 flex items-center justify-center"
                    variants={iconVariants}
                    initial="rest"
                    animate={isHovered ? "hover" : "rest"}
                  >
                    <FontAwesomeIcon size="xl" icon={areaData ? faSave : faPlus} />
                  </motion.span>
                </motion.button>
              </motion.div>
            </motion.form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EditAreaModal;
