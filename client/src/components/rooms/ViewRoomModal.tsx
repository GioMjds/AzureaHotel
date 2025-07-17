import { AnimatePresence, motion } from "framer-motion";
import { FC, useEffect, useState } from "react";
import { IViewRoomModalProps } from "../../types/RoomClient";

const ViewRoomModal: FC<IViewRoomModalProps> = ({ isOpen, roomData, onClose }) => {
    const [imageSrc, setImageSrc] = useState<string>("");

    useEffect(() => {
        if (roomData) {
            if (roomData.roomImage instanceof File) {
                const objectUrl = URL.createObjectURL(roomData.roomImage);
                setImageSrc(objectUrl);
                return () => URL.revokeObjectURL(objectUrl);
            } else {
                setImageSrc(roomData.roomImage);
            }
        }
    }, [roomData]);

    if (!roomData) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg relative"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-3 right-3 text-gray-600 hover:text-gray-800 text-2xl leading-none"
                        >
                            &times;
                        </button>

                        {/* Room Image */}
                        <img
                            src={imageSrc}
                            alt={roomData.roomName}
                            className="w-full h-48 object-cover rounded"
                        />

                        {/* Room Details */}
                        <div className="mt-4 grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Type:</p>
                                <p className="font-semibold">{roomData.roomType}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Number:</p>
                                <p className="font-semibold">{roomData.roomNumber}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Status:</p>
                                <p className="font-semibold">{roomData.status}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Price:</p>
                                <p className="font-semibold">{roomData.roomPrice.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Admission:</p>
                                <p className="font-semibold">{roomData.roomAdmission}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Bed Type:</p>
                                <p className="font-semibold capitalize">
                                    {roomData.bedType}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Pax:</p>
                                <p className="font-semibold">{roomData.pax}</p>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ViewRoomModal;
