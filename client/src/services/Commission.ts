import { ADMIN } from "./_axios";

// Commission management service functions
export const syncCraveonOrdersToCommissions = async () => {
  try {
    const response = await ADMIN.post("/sync-craveon-orders", {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error("Error syncing CraveOn orders:", error);
    throw error;
  }
};

export const createCommissionRecord = async (commissionData: {
  craveon_order_id: number;
  booking_id?: number;
  room_id?: number;
  area_id?: number;
  guest_name?: string;
  guest_email?: string;
  total_order_value: number;
  commission_rate?: number;
  order_status: string;
  ordered_at: string;
}) => {
  try {
    const response = await ADMIN.post("/create-commission", commissionData, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error("Error creating commission record:", error);
    throw error;
  }
};

export const updateCommissionStatus = async (
  commissionId: number,
  status: string
) => {
  try {
    const response = await ADMIN.put(
      `/commission/${commissionId}/status`,
      { order_status: status },
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating commission status:", error);
    throw error;
  }
};
