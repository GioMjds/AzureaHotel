/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnimatePresence, motion } from "framer-motion";
import { FC, FormEvent, KeyboardEvent, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Notification from "../components/Notification";
import { useUserContext } from "../contexts/AuthContext";
import { resendOtp, verifyOtp } from "../services/Auth";
import { NotificationType } from "../types/RegistrationFlowClient";

const RegistrationFlow: FC = () => {
  const [otp, setOTP] = useState<string[]>(Array(6).fill(""));
  const [resendDisabled, setResendDisabled] = useState<boolean>(true);
  const [timer, setTimer] = useState<number>(120);
  const [otpError, setOtpError] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: NotificationType;
    icon: string;
  } | null>(null);

  const location = useLocation();
  const navigate = useNavigate();

  const { setIsAuthenticated, setUserDetails } = useUserContext();
  const { email, password, isGoogleAuth } =
    (location.state as {
      email: string;
      password: string;
      isGoogleAuth?: boolean;
    }) || {};

  useEffect(() => {
    if (!email || !password) {
      navigate("/");
    }
  }, [email, password, navigate]);

  const handleOTPChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value.slice(0, 1);
    setOTP(newOtp);
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOTPKeyDown = (
    e: KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      if (prevInput) {
        prevInput.focus();
      }
    }
  };

  const resendOTP = async () => {
    setResendDisabled(true);
    setTimer(120);
    try {
      await resendOtp(email);
      setOTP(Array(6).fill(""));

      setNotification({
        message: "Verification code has been resent to your email",
        type: NotificationType.SUCCESS,
        icon: "fas fa-paper-plane",
      });

      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error(`Failed to resend OTP: ${error}`);
      setNotification({
        message: "Failed to resend verification code",
        type: NotificationType.ERROR,
        icon: "fas fa-exclamation-circle",
      });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (resendDisabled && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setResendDisabled(false);
            if (interval) clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendDisabled, timer]);

  const handleOTPSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setOtpError("");

    setIsVerifying(true);
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setOtpError("Please enter a valid 6-digit OTP");
      setIsVerifying(false);
      return;
    }

    try {
      const response = await verifyOtp(email, password, otpCode);

      if (response.status === 200) {
        if (response.data.user && response.data.user.id) {
          if (response.data.access_token) {
            localStorage.setItem("access_token", response.data.access_token);
          }
          if (response.data.refresh_token) {
            localStorage.setItem("refresh_token", response.data.refresh_token);
          }

          setIsAuthenticated(true);
          setUserDetails({
            ...response.data.user,
            id: response.data.user.id,
            role: response.data.user.role || "guest",
          });

          setNotification({
            message: "Registration completed successfully! Redirecting...",
            type: NotificationType.SUCCESS,
            icon: "fas fa-check-circle",
          });

          const hasPendingBooking = localStorage.getItem(
            "pendingBookingCallback"
          );
          const returnUrl = localStorage.getItem("bookingReturnUrl");

          if (hasPendingBooking) {
            sessionStorage.setItem("redirectAfterReload", returnUrl || "/");
            localStorage.removeItem("pendingBookingCallback");
            if (returnUrl) {
              localStorage.removeItem("bookingReturnUrl");
            }
          }

          window.location.href = "/";
        } else {
          setOtpError(
            "Registration successful but user data is incomplete. Please try logging in."
          );
        }
      }
    } catch (error: any) {
      if (error.response) {
        const { data, status } = error.response;
        switch (status) {
          case 400:
          case 404:
          case 500:
            setOtpError(
              data.error || "Something went wrong. Please try again later."
            );
            break;
          default:
            setOtpError("Something went wrong. Please try again later.");
            break;
        }
      } else {
        setOtpError("Something went wrong. Please try again later.");
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const cardVariants = {
    initial: { opacity: 0, y: 50, scale: 0.9 },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        type: "spring",
        stiffness: 100,
      },
    },
    exit: {
      opacity: 0,
      y: -50,
      scale: 0.95,
      transition: { duration: 0.3 },
    },
  };

  const inputVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: (i: number) => ({
      scale: 1,
      opacity: 1,
      transition: {
        delay: i * 0.1,
        duration: 0.4,
        type: "spring",
        stiffness: 200,
      },
    }),
    focus: {
      scale: 1.05,
      boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.3)",
      borderColor: "#3b82f6",
    },
    filled: {
      backgroundColor: "#ebf5ff",
      borderColor: "#3b82f6",
    },
  };

  const buttonVariants = {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.7,
        duration: 0.4,
      },
    },
    hover: {
      scale: 1.03,
      boxShadow: "0 4px 12px rgba(59, 130, 246, 0.25)",
      transition: { duration: 0.2 },
    },
    tap: { scale: 0.97 },
  };

  const textVariants = {
    initial: { opacity: 0, y: 15 },
    animate: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.4,
      },
    }),
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4 py-12 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-blue-200 opacity-20 blur-3xl"></div>
        <div className="absolute top-1/3 -right-32 w-96 h-96 rounded-full bg-purple-200 opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-32 left-1/4 w-80 h-80 rounded-full bg-indigo-200 opacity-20 blur-3xl"></div>
      </div>

      <AnimatePresence>
        <motion.div
          variants={cardVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8 relative z-10 border border-gray-100"
        >
          <div className="flex flex-col items-center mb-6">
            <motion.div
              className="text-4xl mb-4 text-blue-500 bg-blue-50 p-5 rounded-full"
              initial={{ rotate: -10, scale: 0.8, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              transition={{
                duration: 0.6,
                type: "spring",
                stiffness: 200,
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-2 8V8a2 2 0 00-2-2H7a2 2 0 00-2 2v8a2 2 0 002 2h10a2 2 0 002-2z"
                />
              </svg>
            </motion.div>
            <motion.h2
              variants={textVariants}
              initial="initial"
              animate="animate"
              custom={0}
              className="text-2xl font-bold mb-2 text-center bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
            >
              {isGoogleAuth
                ? "Complete Your Google Registration"
                : "Complete Your Registration"}
            </motion.h2>
            <motion.p
              variants={textVariants}
              initial="initial"
              animate="animate"
              custom={1}
              className="text-gray-600 text-center max-w-xs"
            >
              {isGoogleAuth
                ? "Please confirm your information and enter the 6-digit verification code sent to your email."
                : "Please enter your information and the 6-digit verification code sent to your email."}
            </motion.p>
          </div>

          <AnimatePresence>
            {otpError && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-red-50 text-red-700 p-3 mb-6 text-center rounded-lg border border-red-200 flex items-center justify-center space-x-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{otpError}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleOTPSubmit}>
            <motion.div
              className="flex justify-center gap-2 mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              {otp.map((digit, index) => (
                <motion.input
                  key={index}
                  id={`otp-input-${index}`}
                  type="text"
                  autoComplete="off"
                  maxLength={1}
                  variants={inputVariants}
                  initial="initial"
                  animate="animate"
                  custom={index}
                  whileFocus="focus"
                  className="w-12 h-14 text-center text-xl font-semibold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-0 shadow-sm transition-all duration-200"
                  value={digit}
                  onChange={(e) => handleOTPChange(e.target.value, index)}
                  onKeyDown={(e) => handleOTPKeyDown(e, index)}
                />
              ))}
            </motion.div>

            <motion.div
              className="text-center mb-6 flex justify-center items-center space-x-3"
              variants={textVariants}
              initial="initial"
              animate="animate"
              custom={2}
            >
              <motion.a
                href="#"
                className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors duration-200 font-medium hover:underline"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
              >
                Change Email
              </motion.a>
              <span className="text-gray-300">|</span>
              <motion.a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (!resendDisabled) {
                    resendOTP();
                  }
                }}
                className={`text-sm font-medium flex items-center ${
                  resendDisabled
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-indigo-600 hover:text-indigo-800 transition-colors duration-200 hover:underline"
                }`}
                whileHover={!resendDisabled ? { scale: 1.05 } : {}}
                whileTap={!resendDisabled ? { scale: 0.97 } : {}}
              >
                Resend Code
                {resendDisabled && (
                  <motion.span
                    className="ml-2 bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full text-xs font-semibold"
                    animate={{
                      opacity: timer <= 10 ? [0.5, 1] : 1,
                    }}
                    transition={{
                      repeat: timer <= 10 ? Infinity : 0,
                      repeatType: "reverse",
                      duration: 0.5,
                    }}
                  >
                    {timer}s
                  </motion.span>
                )}
              </motion.a>
            </motion.div>

            <motion.button
              variants={buttonVariants}
              initial="initial"
              animate="animate"
              whileHover="hover"
              whileTap="tap"
              type="submit"
              disabled={isVerifying}
              className={`w-full py-3 rounded-lg font-semibold cursor-pointer uppercase text-gray-50 shadow-md transition-all ${
                isVerifying
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
              }`}
            >
              {isVerifying ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                "Complete Registration"
              )}
            </motion.button>
          </form>
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {notification && (
          <Notification
            icon={notification.icon}
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default RegistrationFlow;
