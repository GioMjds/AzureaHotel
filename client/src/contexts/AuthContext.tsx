import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, FC, ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { authenticateUser } from "../services/Auth";

interface User {
    id: number;
    username: string;
    email: string;
    profile_image?: string;
    is_verified?: string;
    last_booking_date?: string | null;
    role?: string;
    is_senior_or_pwd?: boolean;
}

interface UserContextType {
    isAuthenticated: boolean;
    userDetails: User | null;
    sessionExpired: boolean;
    role?: string;
    isLoading: boolean;
    profileImage?: string;
    setIsAuthenticated: (value: boolean) => void;
    setUserDetails: (value: User | null) => void;
    setSessionExpired: (value: boolean) => void;
    setRole: (value: string) => void;
    setProfileImage?: (value: string) => void;
    clearAuthState: () => void;
}

const UserContext = createContext<UserContextType | null>(null);

export const UserProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [userDetails, setUserDetails] = useState<User | null>(null);
    const [sessionExpired, setSessionExpired] = useState<boolean>(false);
    const [role, setRole] = useState<string>("");
    const [profileImage, setProfileImage] = useState<string>("");

    const queryClient = useQueryClient();

    const clearAuthState = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['userAuth'] });
        setIsAuthenticated(false);
        setUserDetails(null);
        setSessionExpired(false);
        setRole("");
        setProfileImage("");
    }, [queryClient]);

    const { isLoading } = useQuery({
        queryKey: ['userAuth'],
        queryFn: async () => {
            try {
                const res = await authenticateUser();
                if (
                    res &&
                    res.data &&
                    res.data.isAuthenticated === true &&
                    res.data.user &&
                    res.data.user.id
                ) {
                    setIsAuthenticated(true);
                    setUserDetails(res.data.user);
                    setProfileImage(res.data.user.profile_image || "");
                    setRole(res.data.role || "");
                } else {
                    clearAuthState();
                }
                return res.data;
            } catch (error) {
                console.error(`Error fetching user authentication: ${error}`);
                throw error;
            }
        },
        retry: 1,
        refetchOnWindowFocus: true,
    });

    const contextValue = useMemo(() => ({
        isAuthenticated,
        userDetails,
        sessionExpired,
        role,
        isLoading,
        profileImage,
        setIsAuthenticated,
        setUserDetails,
        setSessionExpired,
        setRole,
        setProfileImage,
        clearAuthState,
    }), [
        isAuthenticated,
        userDetails,
        sessionExpired,
        role,
        isLoading,
        profileImage,
        clearAuthState,
    ]);

    return (
        <UserContext.Provider value={contextValue}>
            {children}
        </UserContext.Provider>
    )
}

export const useUserContext = () => {
    return useContext(UserContext);
}