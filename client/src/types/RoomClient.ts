import { IRoom } from "./RoomAdmin";

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Amenity {
  id: number;
  description: string;
}

export interface RoomImage {
  id: number;
  room_image: string;
}

export interface Room {
  id: number;
  room_name: string;
  room_type: string;
  images: RoomImage[];
  bed_type: string;
  status: "available" | "maintenance";
  discounted_price?: number | null;
  room_price: string | number;
  description: string;
  max_guests: number;
  amenities?: Amenity[];
  discount_percent?: number;
  average_rating?: number;
  senior_discounted_price?: number | null;
}

export interface RoomsResponse {
  data: Room[];
  pagination: PaginationData;
}

export interface AddRoomResponse {
  data: any;
}

export interface AmenityResponse {
  data: Amenity[];
  pagination?: PaginationData;
}

export interface PaginationData {
  total_pages: number;
  current_page: number;
  total_items: number;
  page_size: number;
}

export interface RoomCardProps {
  id: string | number;
  name: string;
  image: string;
  images: RoomImage[];
  title: string;
  price: string;
  description: string;
  discounted_price?: number;
  discount_percent?: number;
  senior_discounted_price?: number;
}

export interface RoomAvailableProps {
  image: string;
  title: string;
  bedType: string;
  capacity: number;
  price: number;
  availableRooms: number;
  onBookNow: () => void;
}

export interface RoomAvailabilityCalendarProps {
  onDatesChange?: (arrival: string, departure: string) => void;
}

export interface IViewRoomModalProps {
    isOpen: boolean;
    roomData: IRoom | null;
    onClose: () => void;
}