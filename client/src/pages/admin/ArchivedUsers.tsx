/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Undo2 } from "lucide-react";
import { FC, useCallback, useState } from "react";
import { toast } from "react-toastify";
import DefaultProfilePic from "../../assets/Default_pfp.jpg";
import { fetchAllUsers, restoreUser } from "../../services/Admin";
import { IUser, UsersResponse } from "../../types/UsersAdmin";
import Modal from "../../components/Modal";
import EventLoader from "../../motions/loaders/EventLoader";
import Error from "../_ErrorBoundary";
import ManageAmenitiesSkeleton from "../../motions/skeletons/ManageAmenitiesSkeleton";

const ArchivedUsers: FC = () => {
    const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
    const [showRestoreModal, setShowRestoreModal] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [currentPage, setCurrentPage] = useState<number>(1);

    const queryClient = useQueryClient();
    const pageSize = 6;

    const { data, isLoading, isError } = useQuery<UsersResponse>({
        queryKey: ["archived-users", currentPage],
        queryFn: () => fetchAllUsers(currentPage, pageSize, true),
    });

    const restoreMutation = useMutation({
        mutationFn: (userId: number) => restoreUser(userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["archived-users"] });
            toast.success("User restored successfully");
            setShowRestoreModal(false);
            setIsSubmitting(false);
        },
        onError: (error: string) => {
            toast.error(`Failed to restore user: ${error}`);
            setIsSubmitting(false);
        }
    });

    const handleRestore = useCallback((user: IUser) => {
        setSelectedUser(user);
        setShowRestoreModal(true);
    }, []);

    const confirmRestoreUser = useCallback(async () => {
        if (!selectedUser) return;
        setIsSubmitting(true);
        try {
            await restoreMutation.mutateAsync(selectedUser.id);
        } catch (error) {
            console.error(`Error restoring user: ${error}`);
            setIsSubmitting(false);
        }
    }, [restoreMutation, selectedUser]);

    if (isLoading) return <ManageAmenitiesSkeleton />;
    if (isError) return <Error />;

    return (
        <div className="min-h-[calc(100vh-25px)] p-3 md:p-3 overflow-y-auto container mx-auto">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl md:text-3xl font-semibold">Archived Users</h1>
            </div>

            {data.users && data.users.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center mt-10"
                >
                    <p className="text-5xl font-bold text-gray-700">📭 No Archived Users</p>
                </motion.div>
            ) : (
                <>
                    <motion.div
                        className="overflow-x-auto bg-white rounded-lg shadow"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Profile Image</th>
                                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">First Name</th>
                                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Last Name</th>
                                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3 text-center text-sm font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {data.users && data.users.map((user: any) => (
                                    <motion.tr
                                        key={user.id}
                                        className="hover:bg-gray-50"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <img
                                                src={user.profile_image || DefaultProfilePic}
                                                alt={`${user.first_name}'s profile`}
                                                className="h-13 w-13 rounded-full object-cover"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-lg text-gray-700">{user.first_name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-lg text-gray-700">{user.last_name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-lg text-gray-700">{user.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-md font-medium text-center">
                                            <div className="flex items-center justify-center space-x-2">
                                                <motion.button
                                                    onClick={() => handleRestore(user)}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    className="bg-green-600 hover:bg-green-700 text-white p-3 cursor-pointer rounded-md transition-colors duration-300"
                                                    title="Restore User"
                                                >
                                                    <Undo2 className="h-5 w-5" />
                                                </motion.button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </motion.div>
                    <div className="flex justify-center items-center gap-4 mt-4">
                        <motion.button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            whileHover={{ scale: 1.05 }}
                            className="px-4 py-2 bg-gray-200 rounded-md disabled:opacity-50 hover:bg-gray-300 transition-colors"
                        >
                            Previous
                        </motion.button>
                        <span className="text-sm text-gray-600">
                            Page {data.pagination.current_page || 1} of {data?.pagination.total_pages || 1}
                        </span>
                        <motion.button
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            disabled={currentPage === (data?.pagination.total_pages || 1)}
                            whileHover={{ scale: 1.05 }}
                            className="px-4 py-2 bg-gray-200 rounded-md disabled:opacity-50 hover:bg-gray-300 transition-colors"
                        >
                            Next
                        </motion.button>
                    </div>
                </>
            )}

            {/* Restore Confirmation Modal */}
            <AnimatePresence>
                {showRestoreModal && (
                    <Modal
                        isOpen={showRestoreModal}
                        icon="fas fa-history"
                        title="Restore User"
                        description={`Are you sure you want to restore ${selectedUser?.first_name} ${selectedUser?.last_name}?`}
                        cancel={() => {
                            setShowRestoreModal(false);
                            setSelectedUser(null);
                        }}
                        onConfirm={confirmRestoreUser}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-300 cursor-pointer uppercase font-semibold"
                        confirmText={isSubmitting ? "Restoring..." : "Restore"}
                        cancelText="Cancel"
                        loading={isSubmitting}
                    />
                )}
            </AnimatePresence>

            {isSubmitting && <EventLoader text="Processing Request" />}
        </div>
    );
};

export default ArchivedUsers;