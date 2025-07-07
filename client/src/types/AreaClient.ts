/* eslint-disable @typescript-eslint/no-explicit-any */
export interface AreaImage {
    id: number;
    area_image: string;
}

export interface Area {
    id: number;
    area_name: string;
    images: AreaImage[];
    description?: string;
    capacity: number;
    price_per_hour: number | string;
    discounted_price?: number | null;
    status?: "available" | "maintenance";
    average_rating?: number;
    discount_percent?: number;
    senior_discounted_price?: number | null;
}

export interface AreaCardProps {
    id: string | number;
    title: string;
    priceRange: string;
    image: string;
    images: AreaImage[];
    description: string;
    discounted_price?: number;
    discount_percent?: number;
    senior_discounted_price?: number;
}

export interface AreasResponse {
    data: Area[];
}

export interface AddAreaResponse {
    data: any;
}

export interface PaginationData {
    total_pages: number;
    current_page: number;
    total_items: number;
    page_size: number;
}