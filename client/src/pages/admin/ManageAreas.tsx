/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "react-toastify";
import AreaDetailsModal from "../../components/admin/AreaDetailsModal";
import EditAreaModal from "../../components/admin/EditAreaModal";
import Modal from "../../components/Modal";
import { AreaCard } from "../../memo/AreaCard";
import EventLoader from "../../motions/loaders/EventLoader";
import ManageSkeleton from "../../motions/skeletons/ManageSkeleton";
import { addNewArea, deleteArea, editArea, fetchAreas } from "../../services/Admin";
import { IArea } from "../../types/AreaAdmin";
import { AddAreaResponse, Area, PaginationData } from "../../types/AreaClient";
import Error from "../_ErrorBoundary";

const ManageAreas = () => {
  const [pageSize] = useState<number>(9);
  const [showFormModal, setShowFormModal] = useState<boolean>(false);
  const [editAreaData, setEditAreaData] = useState<IArea | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showViewModal, setShowViewModal] = useState<boolean>(false);
  const [viewAreaData, setViewAreaData] = useState<Area | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [deleteAreaId, setDeleteAreaId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [loaderText, setLoaderText] = useState<string>("");

  const queryClient = useQueryClient();

  const { data: areasResponse, isLoading, isError } = useQuery<{
    data: Area[];
    pagination: PaginationData;
  }>({
    queryKey: ["areas", currentPage, pageSize],
    queryFn: () => fetchAreas(currentPage, pageSize),
    staleTime: 1000 * 60 * 5,
  });

  const areas = areasResponse?.data || [];
  const pagination = areasResponse?.pagination;

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNextPage = () => {
    if (pagination && currentPage < pagination.total_pages) setCurrentPage((prev) => prev + 1);
  };

  const goToPage = (page: number) => setCurrentPage(page);

  const addAreaMutation = useMutation<AddAreaResponse, unknown, FormData>({
    mutationFn: addNewArea,
    onMutate: () => {
      setLoading(true);
      setLoaderText("Adding area...");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "areas",
      });
      setShowFormModal(false);
      toast.success("Area added successfully!");
      setCurrentPage(1);
    },
    onError: (error: any) => {
      console.error(`Error adding area: ${error}`);
      toast.error(`Failed to add area.`);
    },
    onSettled: () => {
      setLoading(false);
      setLoaderText("");
    },
  });

  const editAreaMutation = useMutation<
    AddAreaResponse,
    unknown,
    { areaId: number; formData: FormData }
  >({
    mutationFn: ({ areaId, formData }) => editArea(areaId, formData),
    onMutate: () => {
      setLoading(true);
      setLoaderText("Updating area...");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "areas",
      });
      setShowFormModal(false);
      toast.success("Area updated successfully!");
    },
    onError: (error: any) => {
      toast.error(`Failed to update area: ${error.message || "Unknown error"}`);
      console.error(`Error updating area: ${error}`);
    },
    onSettled: () => {
      setLoading(false);
      setLoaderText("");
    },
  });

  const deleteAreaMutation = useMutation<any, unknown, number>({
    mutationFn: deleteArea,
    onMutate: () => {
      setLoading(true);
      setLoaderText("Deleting area...");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "areas",
      });
      setShowModal(false);

      if (areas.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      }
    },
    onSettled: () => {
      setLoading(false);
      setLoaderText("");
    },
  });

  const handleAddNew = () => {
    setEditAreaData(null);
    setShowFormModal(true);
  };

  const handleViewArea = useCallback((area: Area) => {
    setViewAreaData(area);
    setShowViewModal(true);
  }, []);

  const handleEditArea = useCallback((area: Area) => {
    let parsedAreaPrce: number;

    if (typeof area.price_per_hour === 'string') {
      const priceString = area.price_per_hour.replace(/[₱,]/g, "");
      parsedAreaPrce = parseFloat(priceString);
    } else {
      parsedAreaPrce = area.price_per_hour;
    }
    let images: string[] = [];
    if (Array.isArray(area.images)) {
      images = area.images.map((img: any) => img.area_image).filter(Boolean);
    }

    setEditAreaData({
      id: area.id,
      area_name: area.area_name,
      images: images,
      description: area.description,
      capacity: area.capacity,
      price_per_hour: parsedAreaPrce,
      status: area.status,
      discount_percent: area.discount_percent || 0,
    });
    setShowFormModal(true);
  }, []);

  const handleDeleteArea = useCallback((areaId: number) => {
    setDeleteAreaId(areaId);
    setShowModal(true);
  }, []);

  const confirmDelete = () => {
    if (deleteAreaId != null) deleteAreaMutation.mutate(deleteAreaId);
  };

  const cancelDelete = () => {
    setDeleteAreaId(null);
    setShowModal(false);
  };

  const handleSave = async (areaData: IArea): Promise<void> => {
    const formData = new FormData();

    // Append basic area fields
    formData.append("area_name", areaData.area_name);
    formData.append("description", areaData.description || "");
    formData.append("capacity", String(areaData.capacity || 0));
    formData.append("price_per_hour", String(areaData.price_per_hour || 0));
    formData.append("status", areaData.status);
    formData.append("discount_percent", areaData.discount_percent?.toString() || '0');

    // Handle images
    if (areaData.images && areaData.images.length > 0) {
      areaData.images.forEach(img => {
        if (img instanceof File) {
          formData.append("images", img);
        } else if (typeof img === 'string') {
          formData.append("existing_images", img);
        }
      });
    }

    try {
      if (!areaData.id) {
        await addAreaMutation.mutateAsync(formData);
      } else {
        await editAreaMutation.mutateAsync({
          areaId: areaData.id,
          formData
        });
      }
    } catch (error) {
      console.error(`Error saving area: ${error}`);
      throw error;
    }
  };

  if (isLoading) return <ManageSkeleton type="area" />;
  if (isError) return <Error />;

  return (
    <div className="overflow-y-hidden h-full">
      <div className="p-3 container mx-auto">
        {loading && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-900/80 z-[500]">
            <EventLoader text={loaderText} />
          </div>
        )}

        {/* Add New Area Button */}
        <div className="flex flex-row items-center mb-5 justify-between">
          <h1 className="text-3xl font-bold">Manage Areas</h1>
          <motion.button
            onClick={handleAddNew}
            className="px-4 py-2 text-xl bg-purple-500 text-white rounded-lg hover:bg-purple-600 cursor-pointer font-semibold transition-colors duration-300"
            whileHover={{ scale: 1.05, backgroundColor: "#7c3aed" }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, type: "spring" }}
          >
            + Add New Area
          </motion.button>
        </div>

        {/* Areas Grid or Empty State */}
        {areas.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {areas.map((area) => (
              <AreaCard
                key={area.id}
                area={area}
                onView={handleViewArea}
                onEdit={handleEditArea}
                onDelete={handleDeleteArea}
              />
            ))}
          </div>
        ) : (
          <motion.div
            className="flex flex-col items-center justify-center mt-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, type: "spring" }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <MapPin className="w-16 h-16 text-gray-400 mb-4" />
            </motion.div>
            <motion.p
              className="text-2xl font-semibold"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              No Areas Found
            </motion.p>
            <motion.p
              className="mt-2 text-gray-500 text-center max-w-md"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              It looks like you haven't added any areas yet. Click the button
              below to create your first area.
            </motion.p>
          </motion.div>
        )}

        {/* Pagination Controls */}
        {pagination && pagination.total_pages > 1 && (
          <div className="flex justify-center items-center gap-2 my-5">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className={`p-2 rounded-full ${currentPage === 1
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                }`}
            >
              <ChevronLeft size={20} />
            </button>

            <div className="flex gap-1">
              {Array.from({ length: pagination.total_pages }).map(
                (_, index) => {
                  const pageNumber = index + 1;
                  const isVisible =
                    pageNumber === 1 ||
                    pageNumber === pagination.total_pages ||
                    Math.abs(pageNumber - currentPage) <= 1;

                  if (!isVisible) {
                    if (
                      pageNumber === 2 ||
                      pageNumber === pagination.total_pages - 1
                    ) {
                      return (
                        <span
                          key={`ellipsis-${pageNumber}`}
                          className="px-3 py-1"
                        >
                          ...
                        </span>
                      );
                    }
                    return null;
                  }

                  return (
                    <button
                      key={pageNumber}
                      onClick={() => goToPage(pageNumber)}
                      className={`w-8 h-8 rounded-full ${currentPage === pageNumber
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 hover:bg-blue-100"
                        }`}
                    >
                      {pageNumber}
                    </button>
                  );
                }
              )}
            </div>

            <button
              onClick={handleNextPage}
              disabled={pagination && currentPage === pagination.total_pages}
              className={`p-2 rounded-full ${pagination && currentPage === pagination.total_pages
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                }`}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}

        {/* Edit/Add Area Modal */}
        {showFormModal && (
          <AnimatePresence mode="wait">
            <EditAreaModal
              isOpen={showFormModal}
              cancel={() => setShowFormModal(false)}
              onSave={handleSave}
              areaData={editAreaData}
              loading={addAreaMutation.isPending || editAreaMutation.isPending}
            />
          </AnimatePresence>
        )}

        {/* View Area Modal */}
        {viewAreaData && (
          <AreaDetailsModal
            isOpen={showViewModal}
            onClose={() => setShowViewModal(false)}
            areaData={viewAreaData}
          />
        )}

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={showModal}
          icon="fas fa-trash"
          title="Delete Area"
          description="Are you sure you want to delete this area?"
          cancel={cancelDelete}
          onConfirm={confirmDelete}
          className="px-4 py-2 bg-red-600 text-white rounded-md uppercase font-bold hover:bg-red-700 transition-all duration-300"
          cancelText="No"
          confirmText="Delete Area"
        />
      </div>
    </div>
  );
};

export default ManageAreas;
