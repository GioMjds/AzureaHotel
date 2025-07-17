import { PlaceFoodOrderData, PlaceFoodOrderResponse, ReviewFoodOrderData } from "../types/GuestProfileClient";
import { booking } from "./_axios";

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
