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

export interface FormFields {
  first_name: string;
  last_name: string;
  email: string;
}

export interface PasswordFields {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface OrderItem extends FoodItem {
  quantity: number;
}

export interface OrderFoodModalProps {
  bookingId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export interface ReviewFoodOrderModalProps {
  order: FoodOrder | null;
  visible: boolean;
  onClose: () => void;
}

export interface ValidIDUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (idType: string, front: File, back: File) => void;
  isLoading: boolean;
}

export interface FormInputs {
  idType: string;
  frontFile: FileList;
  backFile: FileList;
}

export interface ViewBookingDetailsModalProps {
  isOpen: boolean;
  bookingId: number;
  onClose: () => void;
}

export interface ViewFoodOrderModalProps {
  orderId: string | number;
  visible: boolean;
  onClose: () => void;
}
