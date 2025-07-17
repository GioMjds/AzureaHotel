export interface CreateUserFormData {
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    role: string;
}

export interface PaginationData {
    total_pages: number;
    current_page: number;
    total_items: number;
    page_size: number;
}

export interface UsersResponse {
    users: IUser[];
    pagination: PaginationData;
}

export interface IUser {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    password?: string;
    confirm_password: string;
    role: string;
    profile_image?: string;
    last_booking_date?: Date;
    is_archived?: boolean;
    valid_id_front?: string;
    valid_id_back?: string;
    valid_id_type?: string;
    is_verified?: string;
    is_senior_or_pwd?: boolean;
}

export interface IUserFormModalProps {
    isOpen: boolean;
    cancel: () => void;
    userData?: IUser | null;
    loading?: boolean;
}

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';