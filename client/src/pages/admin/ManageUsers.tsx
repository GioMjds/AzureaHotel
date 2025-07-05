/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";
import { PencilIcon, TrashIcon } from "lucide-react";
import { FC, useCallback, useState } from "react";
import { toast } from "react-toastify";
import EditUserModal from "../../components/admin/EditUserModal";
import Modal from "../../components/Modal";
import EventLoader from "../../motions/loaders/EventLoader";
import ManageAmenitiesSkeleton from "../../motions/skeletons/ManageAmenitiesSkeleton";
import { archiveUser, fetchAllUsers } from "../../services/Admin";
import { IUser } from "../../types/UsersAdmin";
import Error from "../_ErrorBoundary";

type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

const ManageUsers: FC = () => {
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [editModal, setEditModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const queryClient = useQueryClient();
  const pageSize = 6;

  const { data, isLoading, isError } = useQuery<{
    users: IUser[];
    pagination: {
      total_pages: number;
      current_page: number;
      total_items: number;
      page_size: number;
    }
  }>({
    queryKey: ["users", currentPage],
    queryFn: () => fetchAllUsers(currentPage, pageSize),
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: number) => archiveUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User archived successfully");
      setShowDeleteModal(false);
      setIsSubmitting(false);
    },
    onError: () => {
      toast.error("Failed to archive user");
      setIsSubmitting(false);
    }
  });

  const handleEdit = useCallback((user: IUser) => {
    setSelectedUser(user);
    setEditModal(true);
  }, []);

  const handleDelete = useCallback((user: IUser) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  }, []);

  const confirmDeleteUser = useCallback(async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);
    try {
      await deleteMutation.mutateAsync(selectedUser.id);
    } catch (error) {
      console.error(`Error archiving user: ${error}`);
      setIsSubmitting(false);
    }
  }, [deleteMutation, selectedUser]);

  const getVerificationStatus = (status: VerificationStatus, isSeniorOrPwd?: boolean) => {
    if (isSeniorOrPwd) {
      return (
        <span className="inline-flex uppercase font-semibold items-center px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-md mr-2">
          ✅ Verified (20% Off)
        </span>
      );
    }
    switch (status) {
      case "verified":
        return (
          <span className="inline-flex uppercase font-semibold items-center px-2 py-1 rounded-full bg-green-100 text-green-800 text-md">
            ✅ Verified
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex uppercase font-semibold items-center px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 text-md">
            ⏳ Pending
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex uppercase font-semibold items-center px-2 py-1 rounded-full bg-red-100 text-red-800 text-md">
            ❌ Rejected
          </span>
        )
      case "unverified":
      default:
        return (
          <span className="inline-flex uppercase font-semibold items-center px-2 py-1 rounded-full bg-red-100 text-red-800 text-md">
            ❌ Unverified
          </span>
        );
    }
  };

  const isEditBtnRestricted = (user: IUser) => user.role === "guest" && user.is_verified !== 'pending';

  if (isLoading) return <ManageAmenitiesSkeleton />;
  if (isError) return <Error />;

  return (
    <div className="min-h-[calc(100vh-25px)] p-3 md:p-3 overflow-y-auto container mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl md:text-3xl font-semibold">Manage Users</h1>
      </div>

      {data.users && data.users.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-10">
          <p className="text-5xl font-bold text-gray-700">🚫 No Users Found</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-md font-medium text-gray-500 uppercase tracking-wider">Profile Image</th>
                  <th className="px-6 py-3 text-left text-md font-medium text-gray-500 uppercase tracking-wider">First Name</th>
                  <th className="px-6 py-3 text-left text-md font-medium text-gray-500 uppercase tracking-wider">Last Name</th>
                  <th className="px-6 py-3 text-left text-md font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-center text-md font-medium text-gray-500 uppercase tracking-wider">Verification Status</th>
                  <th className="px-6 py-3 text-center text-md font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.users && data.users.map((user: any) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <img
                        src={user.profile_image}
                        alt={`${user.first_name}'s profile`}
                        className="h-13 w-13 rounded-full object-cover"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xl text-gray-700">{user.first_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-xl text-gray-700">{user.last_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-xl text-gray-700">{user.email}</td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      {getVerificationStatus(user.is_verified, user.is_senior_or_pwd)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-md font-medium text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => !isEditBtnRestricted(user) && handleEdit(user)}
                          className={`
                            bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md transition-colors duration-300
                            ${isEditBtnRestricted(user) ? "opacity-50 cursor-not-allowed hover:bg-blue-600" : "cursor-pointer"}
                          `}
                          title={isEditBtnRestricted(user) ? "Guest is not verified" : "Edit User"}
                          disabled={isEditBtnRestricted(user)}
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          className="bg-red-600 hover:bg-red-700 text-white p-2 cursor-pointer rounded-md transition-colors duration-300"
                          title="Archive User"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-center items-center gap-4 mt-4">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-200 rounded-md disabled:opacity-50 hover:bg-gray-300 transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {data.pagination.current_page || 1} of {data?.pagination.total_pages || 1}
            </span>
            <button
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={currentPage === (data?.pagination.total_pages || 1)}
              className="px-4 py-2 bg-gray-200 rounded-md disabled:opacity-50 hover:bg-gray-300 transition-colors"
            >
              Next
            </button>
          </div>
        </>
      )}

      {/* Edit Modal - Using existing EditUserModal component */}
      <EditUserModal
        isOpen={editModal}
        cancel={() => {
          setEditModal(false);
          setSelectedUser(null);
        }}
        userData={selectedUser}
        loading={isSubmitting}
      />

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <Modal
            isOpen={showDeleteModal}
            icon="fas fa-exclamation-triangle"
            title="Archive User"
            description={`Are you sure you want to archive ${selectedUser?.first_name} ${selectedUser?.last_name}? This action cannot be undone.`}
            cancel={() => {
              setShowDeleteModal(false);
              setSelectedUser(null);
            }}
            onConfirm={confirmDeleteUser}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-300 cursor-pointer uppercase font-semibold"
            confirmText={isSubmitting ? "Archiving..." : "Archive"}
            cancelText="Cancel"
            loading={isSubmitting}
          />
        )}
      </AnimatePresence>

      {isSubmitting && <EventLoader text="Processing Request" />}
    </div>
  );
};

export default ManageUsers;
