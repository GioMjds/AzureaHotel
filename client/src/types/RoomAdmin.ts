import { Amenity, Room } from "./RoomClient";

export interface IRoom {
  id: number;
  roomName: string;
  roomType: string;
  roomNumber?: string;
  bedType: string;
  amenities: number[];
  roomPrice: number;
  roomImage: File | string;
  images: (File | string)[];
  status: "Available" | "Maintenance" | "Occupied";
  description: string;
  maxGuests: number;
  pax?: number;
  roomAdmission?: string;
  discount_percent?: number;
}

export interface IRoomFormModalProps {
  isOpen: boolean;
  cancel: () => void;
  onSave: (data: IRoom) => Promise<void>;
  roomData: IRoom | null;
  loading?: boolean;
}

export interface RoomDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomData: Room | null;
  allAmenities: Amenity[];
}
