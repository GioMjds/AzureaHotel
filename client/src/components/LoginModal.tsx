/* eslint-disable @typescript-eslint/no-explicit-any */
import { faEye, faEyeSlash, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { FC, useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import { useUserContext } from "../contexts/AuthContext";
import { login } from "../services/Auth";
import GoogleButton from "./GoogleButton";
import Notification from "./Notification";

interface LoginProps {
  toggleLoginModal: () => void;
  openSignupModal: () => void;
  onSuccessfulLogin?: () => void;
  bookingInProgress?: boolean;
}

interface LoginFormInputs {
  email: string;
  password: string;
}

const LoginModal: FC<LoginProps> = ({ toggleLoginModal, openSignupModal, onSuccessfulLogin, bookingInProgress = false }) => {
  const navigate = useNavigate();
  const { setIsAuthenticated, setRole, setUserDetails, setProfileImage, isAuthenticated, role } = useUserContext();
  const queryClient = useQueryClient();

  const [passwordVisible, setPasswordVisible] = useState<boolean>(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info" | "warning";
    icon: string;
  } | null>(null);

  const { register, handleSubmit, formState: { errors }, setError } = useForm<LoginFormInputs>({
    mode: "onBlur",
    defaultValues: {
      email: "",
      password: ""
    }
  });

  const togglePassword = () => setPasswordVisible(!passwordVisible);

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.3, delay: 0.1 } }
  };

  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      y: 40,
      rotateX: 20,
      transformPerspective: 1000
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      rotateX: 0,
      transition: {
        type: "spring",
        damping: 20,
        stiffness: 200,
        duration: 0.4
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: 40,
      rotateX: 10,
      transition: {
        duration: 0.3,
        ease: "easeInOut"
      }
    }
  };

  const formItemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.1 + custom * 0.1,
        duration: 0.4,
        ease: "easeOut"
      }
    })
  };

  const { mutate: loginMutation, isPending: loading } = useMutation({
    mutationFn: async (formData: LoginFormInputs) => {
      return await login(formData.email, formData.password);
    },
    onSuccess: (response) => {
      if (response.status === 200) {
        const { user } = response.data;
        setUserDetails(user);
        setProfileImage(user.profile_image || "");
        setIsAuthenticated(true);
        setRole(user.role || "guest");
        queryClient.invalidateQueries({ queryKey: ['userAuth'] });

        if (onSuccessfulLogin) {
          onSuccessfulLogin();
          return;
        }

        if (user.role === "admin") navigate("/admin");
        else navigate("/guest/bookings");
      }
    },
    onError: (error: any) => {
      console.error(`Failed to login: ${error}`);

      const errData = error.response?.data;
      const statusCode = error.response?.status;

      setError("email", { message: "", type: "" });
      setError("password", { message: "", type: "" });
      setError("root.serverError", { message: "", type: "" });

      if (statusCode === 403) {
        setError('email', {
          message: errData?.error,
          type: "403"
        });
        return;
      }

      if (statusCode === 401) {
        setError('password', {
          message: errData?.error,
          type: "401"
        });
        return;
      }

      if (errData && errData.error) {
        const message = errData.error;
        if (message.toLowerCase().includes("user does not exist")) {
          setError("email", { message: message, type: "404" });
        } else if (message.toLowerCase().includes("password")) {
          setError("password", { message: message, type: "401" });
        } else {
          setError("root.serverError", { message: message, type: "500" });
        }
      } else {
        setError("root.serverError", { message: "An error occured", type: "500" });
      }
    }
  });

  useEffect(() => {
    if (isAuthenticated) {
      if (role === 'admin') navigate("/admin");
      else navigate("/guest/bookings");
    }
  }, [isAuthenticated, role, navigate]);

  const onSubmit: SubmitHandler<LoginFormInputs> = (data) => loginMutation(data);

  return (
    <>
      <AnimatePresence mode="popLayout">
        <motion.section
          className="relative z-20 min-h-screen flex items-center justify-center"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={overlayVariants}
        >
          <motion.div
            className="relative z-30 w-full max-w-md bg-white rounded-xl border border-gray-200 sm:max-w-md xl:p-2 dark:border-gray-700 shadow-2xl backdrop-blur-sm"
            variants={modalVariants}
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="absolute top-3 right-3 z-40 cursor-pointer w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-red-600 bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
              onClick={toggleLoginModal}
            >
              <i className="fa fa-x"></i>
            </motion.button>

            <div className="p-7 space-y-4 md:space-y-6 sm:p-9">
              <motion.img
                src={logo}
                alt={logo}
                loading="lazy"
                className="w-16 h-16 mx-auto mb-2"
                variants={formItemVariants}
                custom={0}
              />

              <motion.h1
                className="text-3xl text-center font-bold text-gray-800 mb-2 tracking-wide"
                variants={formItemVariants}
                custom={0}
              >
                Welcome to <span className="text-purple-600">Azurea</span>
              </motion.h1>

              {bookingInProgress && (
                <motion.div
                  className="p-4 bg-blue-50 border border-blue-200 rounded-md mb-4"
                  variants={formItemVariants}
                  custom={2}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.4 }}
                >
                  <h4 className="font-semibold text-blue-700 mb-1">Login Required to Complete Booking</h4>
                  <p className="text-sm text-blue-600">
                    Please log in to your account to complete your booking. Don't worry, all your booking information has been saved.
                  </p>
                </motion.div>
              )}

              <motion.div
                className="border-b-2 border-gray-300 my-4 origin-center"
                variants={formItemVariants}
                custom={3}
              ></motion.div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
                <motion.div
                  className="mb-3"
                  variants={formItemVariants}
                  custom={4}
                >
                  <label
                    htmlFor="email"
                    className="text-md font-semibold text-gray-700 tracking-tighter"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <i className="fa-solid fa-user absolute left-3 top-3 z-20 text-gray-600"></i>
                    <motion.input
                      type="email"
                      id="email"
                      {...register('email', {
                        required: "Email is required",
                        pattern: {
                          value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                          message: "Invalid email address"
                        }
                      })}
                      placeholder="email@gmail.com"
                      className="bg-gray-50 border border-gray-300 text-sm text-gray-900 rounded-sm mt-1 focus:ring-blue-600 block w-full p-2.5 pl-9"
                    />
                    {errors.email && (
                      <motion.p
                        className="text-red-600 text-sm mt-1"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {errors.email.message}
                      </motion.p>
                    )}
                  </div>
                </motion.div>

                <motion.div
                  className="mb-2 relative"
                  variants={formItemVariants}
                  custom={5}
                >
                  <label
                    htmlFor="password"
                    className="text-md font-semibold text-gray-700 tracking-tighter"
                  >
                    Password
                  </label>
                  <div className="relative flex items-center">
                    <i className="fa-solid fa-lock absolute left-3 top-4 z-20 text-gray-600"></i>
                    <motion.input
                      type={passwordVisible ? "text" : "password"}
                      id="password"
                      {...register("password", {
                        required: "Password is required",
                        minLength: {
                          value: 6,
                          message: "Password must be at least 6 characters"
                        }
                      })}
                      className="bg-gray-50 border border-gray-300 text-sm text-gray-900 rounded-sm mt-1 focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 pl-9"
                      placeholder="Enter your password"
                    />
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={togglePassword}
                      className="absolute right-3 bottom-2 cursor-pointer text-gray-800"
                    >
                      <FontAwesomeIcon
                        icon={passwordVisible ? faEyeSlash : faEye}
                        size="lg"
                      />
                    </motion.div>
                  </div>
                  {errors.password && (
                    <motion.p
                      className="text-red-600 text-sm mt-1"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {errors.password.message}
                    </motion.p>
                  )}
                  <div className="py-2">
                    <motion.div
                      whileHover={{ x: 3 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <Link
                        to="/forgot-password"
                        className="text-md font-semibold text-purple-500 hover:text-purple-700 hover:underline tracking-tighter transition-colors"
                      >
                        Forgot password?
                      </Link>
                    </motion.div>
                  </div>
                </motion.div>
                <motion.button
                  variants={formItemVariants}
                  custom={6}
                  whileHover={{ scale: 1.02, boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.3)" }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={loading}
                  className={`w-full bg-purple-700 text-white py-2 rounded-lg hover:bg-purple-800 cursor-pointer transition-all duration-300 flex items-center justify-center ${loading ? "bg-purple-700/30 cursor-not-allowed" : ""}`}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faSpinner} className="mr-2" spin />{" "}
                      Logging in...
                    </div>
                  ) : (
                    bookingInProgress ? "Login & Complete Booking" : "Login"
                  )}
                </motion.button>

                <motion.div
                  className="mt-4"
                  variants={formItemVariants}
                  custom={7}
                >
                  <div className="flex items-center justify-center my-2">
                    <hr className="w-full border-gray-300" />
                    <span className="px-3 text-gray-500 text-sm">OR</span>
                    <hr className="w-full border-gray-300" />
                  </div>
                  <GoogleButton text="Login with Google" />
                </motion.div>
              </form>
              <motion.div
                className="mt-6 text-center"
                variants={formItemVariants}
                custom={8}
              >
                <span className="text-gray-600">Don't have an account? </span>
                <motion.button
                  onClick={() => {
                    toggleLoginModal();
                    openSignupModal();
                  }}
                  className="text-purple-500 cursor-pointer font-bold hover:text-purple-700 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Register here
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        </motion.section>
      </AnimatePresence>
      {notification && (
        <Notification
          icon={notification.icon}
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </>
  );
};

export default LoginModal;
