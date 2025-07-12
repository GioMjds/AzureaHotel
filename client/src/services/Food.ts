import { booking } from "./_axios";

export interface FoodItem {
  item_id: number;
  name: string;
  price: number;
  image: string;
  image_mime: string;
  quantity: number;
  category_id: number;
  category_name: string;
}

export interface PlaceFoodOrderData {
  booking_id: number;
  items: FoodItem[];
  payment_ss?: File;
}

export interface FoodOrder {
  id: number;
  order_id: string;
  items: FoodItem[];
  total_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
  booking_info?: {
    id: number;
    room_name?: string;
    area_name?: string;
    check_in_date: string;
    check_out_date: string;
    is_venue_booking: boolean;
  };
}

export const fetchCraveOnFoods = async () => {
  try {
    const response = await booking.get("/fetch_foods", {
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch food data from CraveOn: ${error}`);
    throw error;
  }
};

export const placeFoodOrder = async (orderData: PlaceFoodOrderData) => {
  try {
    const formData = new FormData();
    formData.append("booking_id", orderData.booking_id.toString());

    // Backend expects 'items' as JSON string, not just 'items'
    const itemsForBackend = orderData.items.map((item) => ({
      item_id: item.item_id,
      quantity: item.quantity,
    }));
    formData.append("items", JSON.stringify(itemsForBackend));

    if (orderData.payment_ss) {
      formData.append("payment_ss", orderData.payment_ss);
    }

    const response = await booking.post("/place_food_order", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to place food order: ${error}`);
    throw error;
  }
};

export const fetchFoodOrders = async (bookingId?: number) => {
  try {
    const params = bookingId ? { booking_id: bookingId } : {};
    const response = await booking.get(`/fetch_food_orders`, {
      params,
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch food orders: ${error}`);
    throw error;
  }
};
