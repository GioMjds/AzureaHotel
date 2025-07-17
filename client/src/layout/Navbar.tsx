/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import { faBell, faBookBookmark, faChevronDown, faCircleUser, faPizzaSlice, faRightToBracket, faSpinner, faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { FC, useCallback, useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import hotelLogo from "../assets/hotel_logo.png";
import Dropdown from "../components/Dropdown";
import LoginModal from "../components/LoginModal";
import Modal from "../components/Modal";
import Notification from "../components/Notification";
import SignupModal from "../components/SignupModal";
import { navLinks } from "../constants/Navbar";
import { useUserContext } from "../contexts/AuthContext";
import useWebSockets from "../hooks/useWebSockets";
import SlotNavButton from "../motions/CustomNavbar";
import { logout } from "../services/Auth";
import { getGuestDetails, getGuestNotifications, markAllNotificationsAsRead, markNotificationAsRead } from "../services/Guest";
import { NotificationMessage, webSocketService } from "../services/websockets";

interface NotificationType {
  id: string;
  message: string;
  notification_type: string;
  booking_id: string;
  is_read: boolean;
  created_at: string;
}

interface WebSocketNotification {
  notification: NotificationMessage;
  unread_count: number;
}

const Navbar: FC = () => {
  const [loginModal, setLoginModal] = useState(false);
  const [registerModal, setRegisterModal] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [offset, setOffset] = useState<number>(0);

  const limit = 10

  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info" | "warning";
    icon: string;
  } | null>(null);

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    isAuthenticated,
    profileImage,
    userDetails,
    setProfileImage,
    clearAuthState,
  } = useUserContext();

  const { data: notificationsData, isFetching } = useQuery({
    queryKey: ["guestNotifications", offset],
    queryFn: () => getGuestNotifications(offset, limit),
    enabled: isAuthenticated,
    staleTime: 15000,
    placeholderData: (previousData) => previousData,
  });

  const handleAuthResponse = ({ success, message }: { success: boolean; message?: string }) => {
    if (!success) {
      console.error(`WebSocket auth failed: ${message}`);
      webSocketService.disconnect();
    }
  };

  const handleNewNotification = ({ notification, unread_count }: WebSocketNotification) => {
    queryClient.setQueryData(['guestNotifications'], (old: any) => {
      if (!old) return { notifications: [notification], unread_count };

      const currentNotifications = old.notifications || [];

      const notificationExists = currentNotifications.some(
        (existingNotif: NotificationType) =>
          existingNotif.id === notification.id ||
          (existingNotif.booking_id === notification.booking_id &&
            existingNotif.notification_type === notification.notification_type &&
            Math.abs(new Date(existingNotif.created_at).getTime() - new Date(notification.created_at).getTime()) < 1000)
      );

      if (notificationExists) {
        return old;
      }

      return {
        notifications: [notification, ...currentNotifications],
        unread_count
      };
    });

    setUnreadCount(unread_count);
  };

  const handleCountUpdate = ({ count }: { count: number }) => {
    queryClient.setQueryData(['guestNotifications'], (old: any) => ({
      ...old,
      unread_count: count
    }));

    setUnreadCount(count);
  };

  const { isSuccess: isWebSocketConnected } = useQuery<boolean, Error>({
    queryKey: ['wsConnection', userDetails?.id],
    queryFn: async (): Promise<boolean> => {
      try {
        if (!isAuthenticated || !userDetails?.id) return false;
        webSocketService.connect(userDetails.id.toString());
        return true;
      } catch (error) {
        console.error('WebSocket connection error:', error);
        webSocketService.disconnect();
        return false;
      }
    },
    enabled: isAuthenticated && !!userDetails?.id,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: 3
  });

  useQuery<null, Error>({
    queryKey: ['wsVisibilityCheck'],
    queryFn: async (): Promise<null> => {
      if (isAuthenticated && userDetails?.id && document.visibilityState === 'visible') {
        if (!isWebSocketConnected || !webSocketService.isConnected) {
          webSocketService.connect(userDetails.id.toString());
        }
        await queryClient.invalidateQueries({ queryKey: ["guestNotifications"] });
      }
      return null;
    },
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    enabled: isAuthenticated && !!userDetails?.id
  });

  useWebSockets(webSocketService, userDetails?.id, {
    auth_response: handleAuthResponse,
    new_notification: handleNewNotification,
    unread_update: handleCountUpdate,
    initial_count: handleCountUpdate,
  });

  useEffect(() => {
    if (notificationsData) {
      setUnreadCount(notificationsData.unread_count);
    }
  }, [notificationsData]);

  const loadMoreNotifications = useCallback(() => {
    setOffset(prev => prev + limit);
  }, []);

  const handleMarkAllRead = useCallback(async () => {
    try {
      await markAllNotificationsAsRead();
      webSocketService.markAsRead();
      await queryClient.invalidateQueries({ queryKey: ["guestNotifications"] });
      setUnreadCount(0);
    } catch (error) {
      console.error(`Error marking notifications as read: ${error}`);
    }
  }, [queryClient]);

  const toggleNotifications = useCallback(() => {
    setIsNotificationsOpen(prev => !prev);
    if (unreadCount > 0 && isNotificationsOpen) {
      handleMarkAllRead();
    }
  }, [unreadCount, isNotificationsOpen, handleMarkAllRead]);

  const notifications = notificationsData?.notifications || [];
  const notificationCount = notificationsData?.unread_count || 0;

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => markNotificationAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guestNotifications"] });
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guestNotifications"] });
    }
  });

  const handleNotificationClick = useCallback((notification: NotificationType) => {
    if (!notification.is_read) markAsReadMutation.mutate(notification.id.toString());

    navigate('/guest/bookings/');
    setIsNotificationsOpen(false);
  }, [navigate, markAsReadMutation]);

  const handleMarkAllAsRead = useCallback(() => {
    markAllAsReadMutation.mutate();
  }, [markAllAsReadMutation]);

  const handleLogout = useCallback(() => {
    logoutMutation();
  }, []);

  const toggleLoginModal = useCallback(() => setLoginModal((prev) => !prev), []);
  const toggleRegisterModal = useCallback(() => setRegisterModal((prev) => !prev), []);

  const toggleMenu = useCallback(() => setMenuOpen((prev) => !prev), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (loginModal) setLoginModal(false);
        if (registerModal) setRegisterModal(false);
        if (isNotificationsOpen) setIsNotificationsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [loginModal, registerModal, isNotificationsOpen]);

  const { refetch: fetchGuestDetails } = useQuery({
    queryKey: ['guestDetails', userDetails?.id],
    queryFn: async () => {
      if (!isAuthenticated || !userDetails?.id) return null;
      const response = await getGuestDetails(userDetails.id);
      return response.data;
    },
    enabled: isAuthenticated && !!userDetails?.id,
  });

  const { mutate: logoutMutation, isPending: logoutLoading } = useMutation({
    mutationFn: logout,
    onSuccess: (response) => {
      if (response.status === 200) {
        queryClient.invalidateQueries({ queryKey: ['userAuth'] });
        clearAuthState();
        setIsModalOpen(false);
        navigate("/", { replace: true });
      } else {
        throw new Error("Logout failed");
      }
    },
    onError: () => {
      setNotification({
        message: "Error during logout, but session cleared",
        type: "warning",
        icon: "fas fa-exclamation-triangle"
      });
    },
  });

  useEffect(() => {
    if (isAuthenticated) {
      setLoginModal(false);
      setRegisterModal(false);
    }
  }, [isAuthenticated, setProfileImage]);

  useEffect(() => {
    if (isAuthenticated && userDetails?.id) fetchGuestDetails();
  }, [isAuthenticated, userDetails?.id, fetchGuestDetails]);

  useEffect(() => {
    let reconnectionTimer: NodeJS.Timeout | null = null;

    if (isAuthenticated && userDetails?.id && !isWebSocketConnected && !webSocketService.isConnected) {
      reconnectionTimer = setTimeout(() => {
        webSocketService.connect(userDetails.id.toString());
      }, 5000);
    }

    return () => {
      if (reconnectionTimer) clearTimeout(reconnectionTimer);
    };
  }, [isAuthenticated, userDetails?.id, isWebSocketConnected]);

  return (
    <>
      {notification && (
        <Notification
          icon={notification.icon}
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <nav className="fixed top-0 left-0 w-full z-40 transition-all duration-75 bg-gray-300 shadow-sm text-semibold font-playfair">
        <div className="container mx-auto flex items-center justify-between h-16 sm:h-18 md:h-20 px-4 sm:px-6 lg:px-10">
          {/* Left Section */}
          <div className="flex items-center">
            <Link to="/">
              <img
                loading="lazy"
                src={hotelLogo}
                alt="Hotel Logo"
                className="h-8 sm:h-10 w-auto cursor-pointer"
              />
            </Link>
          </div>

          {/* Center Section */}
          <div className="hidden lg:flex ">
            <ul className="flex space-x-6 xl:space-x-8">
              {navLinks.map((link, index) => (
                <SlotNavButton
                  key={index}
                  to={link.link}
                  className="text-black hover:text-purple-800"
                >
                  <i className={link.icon}></i> {link.text}
                </SlotNavButton>
              ))}
            </ul>
          </div>

          {/* Right Section */}
          <div className="hidden lg:flex items-center">
            {!isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <button
                  className="py-2 px-3 text-base font-bold border-2 rounded-md hover:border-violet-600 hover:text-violet-600 transition duration-300 focus:ring-2 focus:ring-violet-400 active:scale-95 cursor-pointer"
                  onClick={toggleLoginModal}
                >
                  <FontAwesomeIcon icon={faRightToBracket} /> Login
                </button>

                <button
                  className="py-2 px-3 text-base font-bold border-2 rounded-md hover:border-violet-600 hover:text-violet-600 transition duration-300 focus:ring-2 focus:ring-violet-400 active:scale-95 cursor-pointer"
                  onClick={toggleRegisterModal}
                >
                  Register
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                {/* Notification Bell */}
                <div className="relative">
                  <motion.button
                    className="p-2 relative flex items-center justify-center rounded-full"
                    onClick={toggleNotifications}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <motion.div
                      animate={notificationCount > 0 ? {
                        scale: [1, 1.1, 1],
                      } : {}}
                      transition={{
                        repeat: Infinity,
                        repeatDelay: 5,
                        duration: 0.5
                      }}
                    >
                      <FontAwesomeIcon icon={faBell} size="2x" className="text-purple-900/80 hover:text-purple-800 transition-colors duration-300 cursor-pointer" />
                    </motion.div>
                    {unreadCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 15 }}
                        className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold font-montserrat rounded-full w-5 h-5 flex items-center justify-center"
                      >
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </motion.span>
                    )}
                  </motion.button>

                  {/* Notifications Dropdown */}
                  {isNotificationsOpen && (
                    <AnimatePresence>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="absolute -right-28 mt-2 w-80 bg-white rounded-lg shadow-xl z-50 max-h-96 overflow-hidden flex flex-col"
                      >
                        <motion.div
                          className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50"
                          initial={{ y: -10 }}
                          animate={{ y: 0 }}
                          transition={{ delay: 0.1 }}
                        >
                          <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                              <FontAwesomeIcon icon={faBell} className="text-purple-600" />
                              Notifications
                            </h3>
                            {notificationCount > 0 && (
                              <button
                                onClick={handleMarkAllAsRead}
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                              >
                                Mark all as read
                              </button>
                            )}
                          </div>
                        </motion.div>
                        <motion.div
                          className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 divide-y divide-gray-100 flex-grow"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                        >
                          {notifications && notifications.length > 0 ? (
                            <>
                              <AnimatePresence>
                                {notifications.map((notif: NotificationType, index: number) => (
                                  <motion.div
                                    key={notif.id || index}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.05 * index }}
                                    whileHover={{ backgroundColor: "rgba(243, 244, 246, 0.8)" }}
                                    className={`px-4 py-3 cursor-pointer transition-colors ${!notif.is_read ? 'bg-blue-50 border-l-4 border-blue-600' : 'hover:bg-gray-50'}`}
                                    onClick={() => handleNotificationClick(notif)}
                                  >
                                    <div className="flex items-start gap-3">
                                      <div className={`shrink-0 mt-1 rounded-full p-2.5 shadow-sm ${notif.notification_type === 'reserved' ? 'bg-green-100 text-green-800' :
                                        notif.notification_type === 'no_show' ? 'bg-purple-100 text-purple-800' :
                                          notif.notification_type === 'rejected' ? 'bg-red-100 text-red-800' :
                                            notif.notification_type === 'checked_in' ? 'bg-blue-100 text-blue-800' :
                                              notif.notification_type === 'checked_out' ? 'bg-teal-100 text-teal-800' :
                                                notif.notification_type === 'cancelled' ? 'bg-amber-100 text-amber-800' :
                                                  'bg-blue-100 text-blue-800'
                                        }`}>
                                        <FontAwesomeIcon icon={
                                          notif.notification_type === 'reserved' ? faCircleUser :
                                            notif.notification_type === 'no_show' ? faCircleUser :
                                              notif.notification_type === 'rejected' ? faCircleUser :
                                                notif.notification_type === 'checked_in' ? faCircleUser :
                                                  notif.notification_type === 'checked_out' ? faCircleUser :
                                                    notif.notification_type === 'cancelled' ? faCircleUser :
                                                      faBell
                                        } />
                                      </div>
                                      <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-800 mb-0.5">{notif.message}</p>
                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                          <span className="inline-block w-2 h-2 rounded-full bg-gray-300"></span>
                                          {new Date(notif.created_at).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })}
                                        </p>
                                      </div>
                                    </div>
                                  </motion.div>
                                ))}
                              </AnimatePresence>

                              {notificationsData?.has_more && (
                                <motion.div
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  className="p-2 border-t border-gray-100"
                                >
                                  <button
                                    onClick={loadMoreNotifications}
                                    disabled={isFetching}
                                    className="w-full py-2 text-sm cursor-pointer text-purple-600 hover:bg-purple-50 rounded-md flex items-center justify-center gap-2"
                                  >
                                    {isFetching ? (
                                      <FontAwesomeIcon icon={faSpinner} spin />
                                    ) : (
                                      'Load More Notifications'
                                    )}
                                  </button>
                                </motion.div>
                              )}
                            </>
                          ) : (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="flex flex-col items-center justify-center py-12 px-4 text-center text-gray-500"
                            >
                              <FontAwesomeIcon icon={faBell} size="4x" className="text-purple-600 mb-3" />
                              <p className="text-gray-600 text-xl">No notifications yet</p>
                              <p className="text-sm text-gray-400 mt-1">We'll notify you when something happens</p>
                            </motion.div>
                          )}
                        </motion.div>
                      </motion.div>
                    </AnimatePresence>
                  )}
                </div>

                <Dropdown
                  userDetails={userDetails}
                  options={[
                    {
                      label: "Account",
                      onClick: () => navigate(`/guest/${userDetails?.id}`),
                      icon: <FontAwesomeIcon icon={faCircleUser} />,
                    },
                    {
                      label: "My Bookings",
                      onClick: () => navigate(`/guest/bookings`),
                      icon: <FontAwesomeIcon icon={faBookBookmark} />,
                    },
                    {
                      label: "My Food Orders",
                      onClick: () => navigate(`/guest/food-orders`),
                      icon: <FontAwesomeIcon icon={faPizzaSlice} />,
                    },
                    {
                      label: "Log Out",
                      onClick: () => setIsModalOpen(true),
                      icon: <FontAwesomeIcon icon={faRightToBracket} />,
                      className: "text-red-500",
                    },
                  ]}
                  position="bottom"
                >
                  <div className="flex items-center bg-gray-50 rounded-full px-2 py-1">
                    <img
                      loading="lazy"
                      src={profileImage}
                      alt="Profile"
                      className="h-12 w-12 rounded-full object-cover"
                    />
                    <FontAwesomeIcon
                      icon={faChevronDown}
                      className="ml-2 text-gray-700"
                    />
                  </div>
                </Dropdown>
              </div>
            )}
          </div>

          {/* Mobile Menu */}
          <div className="lg:hidden flex items-center">
            {isAuthenticated && (
              <div className="relative mr-4">
                <motion.button
                  className="p-2"
                  onClick={toggleNotifications}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <motion.div
                    animate={notificationCount > 0 ? {
                      scale: [1, 1.1, 1],
                      rotate: [0, -5, 5, -5, 0]
                    } : {}}
                    transition={{
                      repeat: notificationCount > 0 ? Infinity : 0,
                      repeatDelay: 5,
                      duration: 0.5
                    }}
                  >
                    <FontAwesomeIcon icon={faBell} size="lg" className="text-gray-700" />
                  </motion.div>
                  {unreadCount > 9 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 15 }}
                      className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                  )}
                </motion.button>

                {/* Mobile Notifications Dropdown */}
                {isNotificationsOpen && (
                  <div className="fixed inset-0 bg-black/30 z-40" onClick={toggleNotifications}>
                    <AnimatePresence>
                      <motion.div
                        onClick={e => e.stopPropagation()}
                        initial={{ opacity: 0, x: 300, y: 0 }}
                        animate={{ opacity: 1, x: 0, y: 0 }}
                        exit={{ opacity: 0, x: 300 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="absolute right-4 top-16 w-80 bg-white rounded-lg shadow-xl z-50 max-h-[80vh] overflow-hidden flex flex-col"
                      >
                        <motion.div
                          className="px-4 py-3 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-purple-50 to-indigo-50"
                          initial={{ y: -20 }}
                          animate={{ y: 0 }}
                          transition={{ delay: 0.1 }}
                        >
                          <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                              <FontAwesomeIcon icon={faBell} className="text-purple-600" />
                              Notifications
                            </h3>
                            {notificationCount > 0 && (
                              <button
                                onClick={handleMarkAllAsRead}
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                              >
                                Mark all as read
                              </button>
                            )}
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.1, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={toggleNotifications}
                            className="text-gray-500 hover:text-gray-700 transition-colors p-1.5 rounded-full hover:bg-gray-100"
                          >
                            <FontAwesomeIcon icon={faTimes} />
                          </motion.button>
                        </motion.div>

                        <motion.div
                          className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 divide-y divide-gray-100 flex-grow"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                        >
                          {notifications && notifications.length > 0 ? (
                            <AnimatePresence>
                              {notifications.map((notif: NotificationType, index: number) => (
                                <motion.div
                                  key={notif.id || index}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.05 * index }}
                                  whileHover={{ backgroundColor: "rgba(243, 244, 246, 0.8)" }}
                                  className={`px-4 py-3 cursor-pointer transition-colors ${!notif.is_read ? 'bg-blue-50 border-l-4 border-blue-600' : 'hover:bg-gray-50'}`}
                                  onClick={() => handleNotificationClick(notif)}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className={`shrink-0 mt-1 rounded-full p-2.5 shadow-sm ${notif.notification_type === 'reserved' ? 'bg-green-100 text-green-800' :
                                      notif.notification_type === 'no_show' ? 'bg-purple-100 text-purple-800' :
                                        notif.notification_type === 'rejected' ? 'bg-red-100 text-red-800' :
                                          notif.notification_type === 'checked_in' ? 'bg-blue-100 text-blue-800' :
                                            notif.notification_type === 'checked_out' ? 'bg-teal-100 text-teal-800' :
                                              notif.notification_type === 'cancelled' ? 'bg-amber-100 text-amber-800' :
                                                'bg-blue-100 text-blue-800'
                                      }`}>
                                      <FontAwesomeIcon icon={
                                        notif.notification_type === 'reserved' ? faCircleUser :
                                          notif.notification_type === 'no_show' ? faCircleUser :
                                            notif.notification_type === 'rejected' ? faCircleUser :
                                              notif.notification_type === 'checked_in' ? faCircleUser :
                                                notif.notification_type === 'checked_out' ? faCircleUser :
                                                  notif.notification_type === 'cancelled' ? faCircleUser :
                                                    faBell
                                      } />
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-gray-800 mb-0.5">{notif.message}</p>
                                      <p className="text-xs text-gray-500 flex items-center gap-1">
                                        <span className="inline-block w-2 h-2 rounded-full bg-gray-300"></span>
                                        {new Date(notif.created_at).toLocaleDateString('en-US', {
                                          month: 'short',
                                          day: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </p>
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                            </AnimatePresence>
                          ) : (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="flex flex-col items-center justify-center py-12 px-4 text-center text-gray-500"
                            >
                              <FontAwesomeIcon icon={faBell} size="4x" className="text-gray-700 mb-3" />
                              <p className="text-gray-600">No notifications yet</p>
                              <p className="text-xs text-gray-400 mt-1">We'll notify you when something happens</p>
                            </motion.div>
                          )}
                        </motion.div>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                )}
              </div>
            )}

            <button onClick={toggleMenu} className="text-2xl p-2">
              <i className="fa fa-bars"></i>
            </button>
          </div>

          {menuOpen && (
            <div className="lg:hidden">
              <div
                className="fixed inset-0 bg-black/30 z-40"
                onClick={closeMenu}
              ></div>
              <ul className="fixed top-0 right-0 w-full h-screen md:w-3/5 sm:w-4/5 bg-white shadow-md text-black z-50 flex flex-col">
                <div className="flex justify-between items-center pt-4 p-3 bg-gray-200">
                  <Link to="/">
                    <img
                      loading="lazy"
                      src={hotelLogo}
                      alt="Hotel Logo"
                      className="h-8 w-auto cursor-pointer block sm:hidden md:hidden"
                    />
                  </Link>
                  <button onClick={closeMenu}>
                    <i className="fa fa-times text-3xl mr-3 sm:mr-0 "></i>
                  </button>
                </div>
                <li className="p-4 text-black/70">
                  <i className="fa fa-bars text-black/70 mr-3"></i> Navigation
                </li>
                {navLinks.map((link, index) => (
                  <li
                    key={index}
                    className="p-4 mx-7 hover:bg-purple-200 hover:text-purple-700 rounded-md cursor-pointer"
                    onClick={closeMenu}
                  >
                    <NavLink
                      to={link.link}
                      className={({ isActive }) =>
                        `flex items-center ${isActive ? "text-purple-600 font-bold" : ""
                        }`
                      }
                    >
                      <i className={`mr-3 ${link.icon}`}></i> {link.text}
                    </NavLink>
                  </li>
                ))}
                {!isAuthenticated ? (
                  <>
                    <li
                      className="p-4 border-t-2 mt-3 mx-7 border-gray-200 hover:bg-purple-200 hover:text-purple-700 rounded-md cursor-pointer"
                      onClick={toggleLoginModal}
                    >
                      <i className="fa-regular fa-user mr-3"></i> Login
                    </li>
                    <li
                      className="p-4 mx-7 hover:bg-purple-200 hover:text-purple-700 rounded-md cursor-pointer"
                      onClick={toggleRegisterModal}
                    >
                      <i className="fa fa-user-plus mr-1"></i> Sign Up
                    </li>
                  </>
                ) : (
                  <>
                    <li
                      className="p-4 mx-7 hover:bg-purple-200 hover:text-purple-700 rounded-md cursor-pointer"
                      onClick={() => navigate(`/guest/${userDetails?.id}`)}
                    >
                      <i className="fa fa-user-circle mr-3"></i> Account
                    </li>
                    <li
                      className="p-4 mx-7 hover:bg-purple-200 hover:text-purple-700 rounded-md cursor-pointer"
                      onClick={() => setIsModalOpen(true)}
                    >
                      <i className="fa fa-sign-out-alt mr-3"></i> Log Out
                    </li>
                  </>
                )}
              </ul>
            </div>
          )}
        </div>
      </nav>

      {loginModal && (
        <div className="fixed inset-0 bg-black/50 z-50">
          <LoginModal
            toggleLoginModal={toggleLoginModal}
            openSignupModal={toggleRegisterModal}
          />
        </div>
      )}
      {registerModal && (
        <div className="fixed inset-0 bg-black/50 z-50">
          <SignupModal
            toggleRegisterModal={toggleRegisterModal}
            openLoginModal={toggleLoginModal}
          />
        </div>
      )}
      <Modal
        isOpen={isModalOpen}
        icon="fa fa-sign-out-alt"
        title="Log Out"
        description="Are you sure you want to log out?"
        cancel={() => setIsModalOpen(!isModalOpen)}
        onConfirm={handleLogout}
        className={`bg-red-600 text-white active:bg-red-700 font-bold uppercase px-4 py-2 cursor-pointer rounded-md shadow hover:shadow-lg outline-none focus:outline-none transition-all duration-150 ${logoutLoading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        loading={logoutLoading}
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

export default Navbar;
