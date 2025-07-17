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
  status:
    | "pending"
    | "confirmed"
    | "preparing"
    | "ready"
    | "completed"
    | "cancelled";
  payment_ss: string;
  cancellation_reason?: string;
}

export interface MobileOrderCustomer {
  customer_id: number;
  email: string;
  full_name: string;
  address: string;
  contact: string;
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
  status:
    | "pending"
    | "confirmed"
    | "preparing"
    | "ready"
    | "completed"
    | "cancelled";
  cancellation_reason?: string;
}
