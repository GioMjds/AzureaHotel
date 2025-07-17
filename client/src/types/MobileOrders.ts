export interface MobileOrderItem {
  item_id: number;
  name: string;
  price: number;
  quantity: number;
}

export interface MobileOrder {
  order_id: number;
  ordered_at: string;
  items: MobileOrderItem[];
  total_amount: number;
  status: "Pending" | "Processing" | "Completed" | "Cancelled" | "Reviewed";
  payment_submitted: boolean;
  cancellation_reason?: string;
}

export interface MobileOrderCustomer {
  customer: {
    customer_id: number;
    email: string;
    full_name: string;
    address: string;
    contact: string;
    hotel_user: number; // 0 or 1
  };
  orders: MobileOrder[];
}

export interface MobileOrdersResponse {
  customers: MobileOrderCustomer[];
  pagination: {
    current_page: number;
    page_size: number;
    total_pages: number;
    total_items: number;
  };
}

export interface MobileOrderStatusUpdate {
  order_id: number;
  status: "Pending" | "Processing" | "Completed" | "Cancelled" | "Reviewed";
  cancellation_reason?: string;
}
