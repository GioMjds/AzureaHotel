import { AnimatePresence, motion } from "framer-motion"
import { FC, useEffect, useState } from "react"
import { IdCard, X, AlertCircle } from "lucide-react"
import { useForm, SubmitHandler } from "react-hook-form"
import { ID_TYPE_OPTIONS } from "../../constants/GuestProfileOptions"
import { FormInputs, ValidIDUploadModalProps } from "../../types/GuestProfileClient"

const ValidIDUploadModal: FC<ValidIDUploadModalProps> = ({ isOpen, onClose, onUpload, isLoading }) => {
    const [frontPreview, setFrontPreview] = useState<string | null>(null);
    const [backPreview, setBackPreview] = useState<string | null>(null);
    
    const { 
        register, 
        handleSubmit, 
        formState: { errors }, 
        watch, 
        reset 
    } = useForm<FormInputs>({
        defaultValues: {
            idType: "",
        }
    });

    const frontFileWatch = watch("frontFile");
    const backFileWatch = watch("backFile");
    
    useEffect(() => {
        if (frontFileWatch?.[0]) {
            const objectUrl = URL.createObjectURL(frontFileWatch[0]);
            setFrontPreview(objectUrl);
            return () => URL.revokeObjectURL(objectUrl);
        }
    }, [frontFileWatch]);

    useEffect(() => {
        if (backFileWatch?.[0]) {
            const objectUrl = URL.createObjectURL(backFileWatch[0]);
            setBackPreview(objectUrl);
            return () => URL.revokeObjectURL(objectUrl);
        }
    }, [backFileWatch]);

    const onSubmit: SubmitHandler<FormInputs> = (data) => {
        try {
            if (data.frontFile[0] && data.backFile[0]) {
                onUpload(data.idType, data.frontFile[0], data.backFile[0]);
            }
        } catch (error) {
            console.error(`Error uploading files: ${error}`);
        }
    };

    const handleClose = () => {
        reset();
        setFrontPreview(null);
        setBackPreview(null);
        onClose();
    };

    const ErrorMessage: FC<{ message?: string }> = ({ message }) => {
        if (!message) return null;
        
        return (
            <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center text-red-500 text-sm mt-1"
            >
                <AlertCircle className="h-4 w-4 mr-1" />
                <span>{message}</span>
            </motion.div>
        );
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden"
                    >
                        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-white flex items-center">
                                <IdCard className="h-5 w-5 mr-2" />
                                Upload Valid ID
                            </h3>
                            <motion.button
                                whileHover={{ rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={handleClose}
                                className="text-white hover:text-red-200 transition-colors"
                            >
                                <X size={24} />
                            </motion.button>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)}>
                            {/* Upload Section */}
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Front of ID
                                    </label>
                                    <motion.label
                                        whileHover={{ scale: 1.02 }}
                                        className={`block border-2 border-dashed rounded-lg p-4 text-center cursor-pointer ${
                                            errors.frontFile ? 'border-red-400 bg-red-50' : 'border-gray-300'
                                        }`}
                                    >
                                        <input
                                            type="file"
                                            accept="image/*"
                                            {...register("frontFile", { 
                                                required: "Front ID image is required" 
                                            })}
                                            className="hidden"
                                        />
                                        <span className="text-sm text-gray-500">Click to select front ID image</span>
                                    </motion.label>
                                    <ErrorMessage message={errors.frontFile?.message} />
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Back of ID
                                    </label>
                                    <motion.label
                                        whileHover={{ scale: 1.02 }}
                                        className={`block border-2 border-dashed rounded-lg p-4 text-center cursor-pointer ${
                                            errors.backFile ? 'border-red-400 bg-red-50' : 'border-gray-300'
                                        }`}
                                    >
                                        <input
                                            type="file"
                                            accept="image/*"
                                            {...register("backFile", { 
                                                required: "Back ID image is required" 
                                            })}
                                            className="hidden"
                                        />
                                        <span className="text-sm text-gray-500">Click to select back ID image</span>
                                    </motion.label>
                                    <ErrorMessage message={errors.backFile?.message} />
                                </div>
                            </div>

                            <div className="px-6 mb-3 space-y-1">
                                <label className="block text-sm font-medium text-gray-700">
                                    ID Type
                                </label>
                                <select
                                    {...register("idType", { 
                                        required: "Please select an ID type" 
                                    })}
                                    className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                                        errors.idType ? 'border-red-400 bg-red-50' : 'border-gray-300'
                                    }`}
                                >
                                    <option value="" disabled>Select ID Type</option>
                                    {ID_TYPE_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                <ErrorMessage message={errors.idType?.message} />
                            </div>

                            <div className="px-6 py-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Front Preview
                                    </label>
                                    <div className="border-2 border-gray-200 rounded-lg h-48 overflow-hidden">
                                        {frontPreview ? (
                                            <img
                                                src={frontPreview}
                                                alt="Front ID preview"
                                                className="w-full h-full object-contain bg-gray-50 p-2"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-400">
                                                No front image selected
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Back Preview
                                    </label>
                                    <div className="border-2 border-gray-200 rounded-lg h-48 overflow-hidden">
                                        {backPreview ? (
                                            <img
                                                src={backPreview}
                                                alt="Back ID preview"
                                                className="w-full h-full object-contain bg-gray-50 p-2"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-400">
                                                No back image selected
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Footer Section */}
                            <div className="px-6 pb-6">
                                <div className="flex justify-end gap-3">
                                    <motion.button
                                        type="button"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleClose}
                                        className="px-4 py-2 text-gray-600 cursor-pointer hover:bg-gray-100 rounded-lg"
                                    >
                                        Cancel
                                    </motion.button>
                                    <motion.button
                                        type="submit"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        disabled={isLoading}
                                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? (
                                            <span className="flex items-center">
                                                <motion.span
                                                    animate={{ rotate: 360 }}
                                                    transition={{ repeat: Infinity, duration: 1 }}
                                                    className="inline-block h-4 w-4 border-2 border-white/30 border-t-white rounded-full mr-2"
                                                />
                                                Uploading...
                                            </span>
                                        ) : (
                                            'Upload IDs'
                                        )}
                                    </motion.button>
                                </div>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ValidIDUploadModal;