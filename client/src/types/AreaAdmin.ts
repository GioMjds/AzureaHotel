export interface IArea {
    id: number;
    area_name: string;
    description: string;
    capacity: number;
    price_per_hour: number | string;
    status: "available" | "maintenance";
    images: (File | string)[];
    discount_percent?: number;
}

export interface IAreaFormModalProps {
    isOpen: boolean;
    cancel: () => void;
    onSave: (data: IArea) => Promise<void>;
    areaData: IArea | null;
    loading?: boolean;
}