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

export interface PlaceFoodOrderResponse {
  message: string;
  success: boolean;
  user_id: number;
  order_id: number;
  total_amount: number;
  hotel_booking_info: {
    hotel_booking_id: number;
    hotel_user_id: number;
    guest_name: string;
    guest_email: string;
    room_or_area: string;
    check_in_date: string;
    check_out_date: string;
  };
  craveon_order_info: {
    craveon_user_id: number;
    craveon_order_id: number;
    items_count: number;
    status: string;
  };
}

export interface FoodOrderReview {
  id: number;
  order_id: number;
  rating: number;
  comment: string;
  created_at: string;
  order_details: {
    total_amount: number;
    guest_name: string;
    hotel_room_area: string;
    ordered_at: string;
  };
}

export interface ReviewFoodOrderData {
  order_id: number;
  rating: number;
  comment?: string;
}

export interface ReviewFoodOrderResponse {
  success: boolean;
  message: string;
  review: {
    id: number;
    order_id: number;
    rating: number;
    comment: string;
    order_details: {
      guest_name: string;
      total_amount: number;
      hotel_room_area: string;
      status: string;
    };
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

export const placeFoodOrder = async (
  orderData: PlaceFoodOrderData
): Promise<PlaceFoodOrderResponse> => {
  try {
    const formData = new FormData();
    formData.append("booking_id", orderData.booking_id.toString());

    const itemsForBackend = orderData.items.map((item) => ({
      item_id: item.item_id,
      quantity: item.quantity,
    }));
    formData.append("items", JSON.stringify(itemsForBackend));

    if (orderData.payment_ss) {
      formData.append("payment_ss", orderData.payment_ss);
    }

    const response = await booking.post<PlaceFoodOrderResponse>(
      "/place_food_order",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
      }
    );
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

export const reviewFoodOrder = async (reviewData: ReviewFoodOrderData) => {
  try {
    const response = await booking.post("/review_food_order", reviewData, {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to review food order: ${error}`);
    throw error;
  }
};

export const getUserFoodOrderReviews = async () => {
  try {
    const response = await booking.get("/user/food_order_reviews", {
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch food order reviews: ${error}`);
    throw error;
  }
};

export const getReviewableFoodOrders = async () => {
  try {
    const response = await booking.get("/user/reviewable_food_orders", {
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch reviewable food orders: ${error}`);
    throw error;
  }
};
