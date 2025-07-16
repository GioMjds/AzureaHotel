import { faBars, faChevronLeft, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMutation } from "@tanstack/react-query";
import { FC, useCallback, useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import hotelLogo from "../../assets/hotel_logo.png";
import Modal from "../../components/Modal";
import { menuItems } from "../../constants/AdminMenuSidebar";
import { useUserContext } from "../../contexts/AuthContext";
import useWebSockets from "../../hooks/useWebSockets";
import { logout } from "../../services/Auth";
import { webSocketAdminActives, WebSocketEvent } from "../../services/websockets";

interface AdminSidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const AdminSidebar: FC<AdminSidebarProps> = ({ collapsed, setCollapsed }) => {
  const navigate = useNavigate();
  const { setIsAuthenticated, setRole, userDetails } = useUserContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeBookingCount, setActiveBookingCount] = useState<number>(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  const modalCancel = () => setIsModalOpen(false);

  const { mutate: logoutMutation, isPending: logoutLoading } = useMutation({
    mutationFn: logout,
    onSuccess: (response) => {
      if (response.status === 200) {
        setIsAuthenticated(false);
        setRole("");
        navigate("/");
      }
    },
    onError: (error) => {
      console.error(`Failed to logout: ${error}`);
    },
  });

  const handleLogout = () => logoutMutation();

  const { send } = useWebSockets(webSocketAdminActives, userDetails?.id, {
    active_count_update: (data: WebSocketEvent) => {
      if (data.type === "active_count_update") {
        setActiveBookingCount(data.count);
      }
    },
    auth_response: (data: WebSocketEvent) => {
      if (data.type === "auth_response") {
        if (data.success && send) {
          send({ type: "get_active_count" });
        }
      }
    },
    bookings_data_update: (data: WebSocketEvent) => {
      if (data.type === "bookings_data_update") {
        setActiveBookingCount(data.count);
      }
    },
  });

  const requestActiveCount = useCallback(() => {
    if (send && userDetails?.id) {
      send({ type: "get_active_count" });
    }
  }, [send, userDetails?.id]);

  useEffect(() => {
    if (userDetails?.id) {
      const timer = setTimeout(() => {
        requestActiveCount();

        if (send) {
          send({ type: "connection_test", message: "Hello from AdminSidebar" });
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [userDetails, requestActiveCount, send]);

  useEffect(() => {
    if (userDetails?.id) {
      const interval = setInterval(() => {
        requestActiveCount();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [userDetails?.id, requestActiveCount]);

  const updatedMenuItems = menuItems.map(item => {
    if (item.label === "Manage Bookings") {
      return {
        ...item,
        label: (
          <div className="flex items-center justify-between w-full">
            <span>Manage Bookings</span>
            {activeBookingCount > 0 && (
              <span className="bg-purple-600 font-semibold text-white rounded-full px-2 py-1 text-xs ml-2">
                {activeBookingCount}
              </span>
            )}
          </div>
        )
      }
    }
    return item;
  });

  const sidebarBase = "z-40 flex flex-col bg-white text-black h-screen fixed top-0 left-0 transition-all duration-300 shadow-lg";
  const sidebarWidth = collapsed ? "w-20 min-w-[5rem]" : "w-72 min-w-[18rem]";
  const sidebarMobile = mobileOpen ? "left-0" : "-left-full";

  return (
    <>
      {/* Mobile menu bar */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-md bg-white shadow-md border border-gray-200 hover:bg-purple-100 transition"
        >
          <FontAwesomeIcon icon={faBars} className="text-xl text-purple-700" />
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`
          ${sidebarBase}
          ${sidebarWidth}
          ${collapsed ? "items-center" : "items-stretch"}
          ${mobileOpen ? "block" : "hidden"}
          lg:block
          ${mobileOpen ? sidebarMobile : ""}
        `}
      >
        {/* Collapse/Expand button */}
        <div className={`flex items-center justify-between py-3 px-3 border-b border-purple-200 ${collapsed ? "flex-col space-y-2" : ""}`}>
          <img
            loading="lazy"
            src={hotelLogo}
            alt="Hotel Logo"
            className={`object-contain transition-all duration-300 ${collapsed ? "h-16 w-16" : "h-16 w-auto"}`}
          />
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 cursor-pointer rounded-md hover:bg-purple-100 transition hidden lg:block"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <FontAwesomeIcon icon={collapsed ? faBars : faChevronLeft} className="text-lg text-purple-700" />
          </button>
        </div>

        {/* Menu items */}
        <nav className={`flex-grow overflow-y-auto p-2 w-full ${collapsed ? "px-1" : "px-2"}`}>
          <ul className="space-y-2">
            {updatedMenuItems.map((item, index) => (
              <li key={index} className="w-full">
                <NavLink
                  to={item.link}
                  end={item.link === "/admin"}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-md cursor-pointer transition-colors duration-300 py-2 px-3 w-full ${isActive
                      ? "border-r-4 border-purple-600 bg-purple-100/80 text-purple-700 font-bold"
                      : "hover:bg-purple-100/80"
                    } ${collapsed ? "justify-center px-2" : ""}`
                  }
                  onClick={() => setMobileOpen(false)}
                >
                  <FontAwesomeIcon
                    icon={item.icon}
                    className="w-5 h-5 text-xl"
                  />
                  {!collapsed && <span className="text-base">{item.label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout button */}
        <div className={`px-3 py-4 w-full ${collapsed ? "px-1" : ""}`}>
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full flex justify-center items-center gap-2 p-3 rounded-md transition-all duration-300 text-red-600 hover:bg-black/15 cursor-pointer"
          >
            <i className="fa fa-sign-out-alt font-light"></i>
            {!collapsed && <span className="font-semibold text-base uppercase">Log Out</span>}
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        ></div>
      )}

      {/* Logout Modal */}
      <Modal
        isOpen={isModalOpen}
        icon="fas fa-sign-out-alt"
        title="Log Out"
        description="Are you sure you want to log out?"
        cancel={modalCancel}
        onConfirm={handleLogout}
        loading={logoutLoading}
        className={`bg-red-600 hover:bg-red-700 font-bold uppercase text-white px-4 py-2 rounded-md shadow hover:shadow-lg outline-none focus:outline-none ease-linear transition-all duration-300 cursor-pointer ${logoutLoading ? "opacity-50 cursor-not-allowed" : ""}`}
        confirmText={
          logoutLoading ? (
            <>
              <FontAwesomeIcon icon={faSpinner} spin className="mr-2" /> Logging
              out...
            </>
          ) : (
            "Log Out"
          )
        }
        cancelText="Cancel"
      />
    </>
  );
};

export default AdminSidebar;