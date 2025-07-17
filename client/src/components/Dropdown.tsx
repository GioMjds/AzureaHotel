import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import { FC, ReactNode, memo, useCallback, useEffect, useRef, useState } from "react";

interface DropdownItem {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
    className?: string;
}

interface CustomDropdownProps {
    userDetails?: {
        first_name: string;
        last_name: string;
        email: string;
        profile_image?: string | null;
        is_verified?: "verified" | "unverified";
    };
    options: DropdownItem[];
    position?: "top" | "right" | "bottom" | "left";
    children: ReactNode;
}

const Dropdown: FC<CustomDropdownProps> = ({ options, position = "bottom", children, userDetails }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleToggle = useCallback(() => {
        setIsOpen((prev) => !prev);
    }, []);

    const handleOptionClick = useCallback((onClick: () => void) => {
        onClick();
        setIsOpen(false);
    }, []);

    const userFullname = `${userDetails?.first_name} ${userDetails?.last_name}`;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    let dropdownPositionClasses = "";
    switch (position) {
        case "top":
            dropdownPositionClasses = "absolute left-0 bottom-full mb-2";
            break;
        case "left":
            dropdownPositionClasses = "absolute right-full mr-2 top-0";
            break;
        case "right":
            dropdownPositionClasses = "absolute left-full ml-2 top-0";
            break;
        case "bottom":
        default:
            dropdownPositionClasses = "absolute right-2 mt-2";
            break;
    }

    return (
        <div className="relative inline-block" ref={dropdownRef}>
            <div onClick={handleToggle} className="cursor-pointer">
                {children}
            </div>
            <AnimatePresence mode="wait">
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 15 }}
                        transition={{ duration: 0.3 }}
                        className={`${dropdownPositionClasses} bg-white text-gray-800 rounded-md shadow-lg z-50 overflow-hidden min-w-[250px] max-w-xs`}
                    >
                        {userDetails && (
                            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-gray-50">
                                <div className="w-10 h-10 relative rounded-full overflow-hidden border border-accent">
                                    <img
                                        src={userDetails.profile_image as string}
                                        alt={userFullname}
                                        loading="lazy"
                                        className="object-cover"
                                    />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="font-semibold text-primary text-lg flex items-center flex-wrap min-w-0">
                                        <span className="truncate max-w-[140px]">{userFullname}</span>
                                        {userDetails.is_verified === "verified" && (
                                            <CheckCircle className="ml-2 text-green-500 flex-shrink-0" size={20} />
                                        )}
                                    </span>
                                    <span className="text-sm text-gray-500 truncate max-w-[180px]">{userDetails.email}</span>
                                </div>
                            </div>
                        )}
                        <ul className="py-2">
                            {options.map((option, index) => (
                                <li key={`${option.label}-${index}`}>
                                    <button
                                        className={`flex w-full items-center px-4 py-2 text-md cursor-pointer font-semibold hover:bg-gray-100 text-left ${option.className}`}
                                        onClick={() => handleOptionClick(option.onClick)}
                                    >
                                        {option.icon && (
                                            <span className={`mr-2 ${option.className}`}>{option.icon}</span>
                                        )}
                                        {option.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default memo(Dropdown);
