/* eslint-disable @typescript-eslint/no-explicit-any */
import { FC, useState } from "react";
import { useNavigate } from "react-router-dom";
import { forgotPassword, verifyResetOtp, resetPassword } from '../services/Auth';
import { useUserContext } from "../contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { Step, EmailFormData, OtpFormData, PasswordFormData } from "../types/ForgotPasswordClient";

const ForgotPassword: FC = () => {
  const navigate = useNavigate();
  const { setIsAuthenticated } = useUserContext();

  const [step, setStep] = useState<Step>(Step.email);
  const [email, setEmail] = useState<string>("");

  const emailForm = useForm<EmailFormData>({
    mode: "onChange",
    defaultValues: {
      email: "",
    }
  });

  const otpForm = useForm<OtpFormData>({
    mode: "onChange",
    defaultValues: {
      otp: "",
    }
  });

  const passwordForm = useForm<PasswordFormData>({
    mode: "onChange",
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    }
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: (email: string) => forgotPassword(email),
    onSuccess: (response) => {
      if (response.status === 200) {
        setStep(Step.otp);
        setEmail(emailForm.getValues("email"));
        emailForm.reset();
      }
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 'Failed to send OTP.';
      emailForm.setError("email", { message: errorMessage });
    }
  });

  const verifyOtpMutation = useMutation({
    mutationFn: (data: { email: string; otp: string }) => verifyResetOtp(data.email, data.otp),
    onSuccess: (response) => {
      if (response.status === 200) {
        setStep(Step.newPassword);
        otpForm.reset();
      }
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || "OTP verification failed.";
      otpForm.setError("otp", { message: errorMessage });
    }
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (data: { email: string; newPassword: string; confirmPassword: string }) => resetPassword(data.email, data.newPassword, data.confirmPassword),
    onSuccess: (response) => {
      if (response.status === 200) {
        setIsAuthenticated(true);
        window.location.href = '/';
        navigate("/");
      }
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || "Password reset failed.";
      passwordForm.setError("newPassword", { message: errorMessage });
    }
  })

  const handleEmailSubmit = emailForm.handleSubmit((data) => {
    forgotPasswordMutation.mutate(data.email);
  });

  const handleOtpSubmit = otpForm.handleSubmit((data) => {
    verifyOtpMutation.mutate({
      email,
      otp: data.otp
    })
  });

  const handleNewPasswordSubmit = passwordForm.handleSubmit((data) => {
    if (data.newPassword !== data.confirmPassword) {
      passwordForm.setError("confirmPassword", {
        message: "Passwords do not match."
      });
      return;
    }
    resetPasswordMutation.mutate({
      email,
      newPassword: data.newPassword,
      confirmPassword: data.confirmPassword
    })
  })

  const resendOtp = () => {
    if (email) forgotPasswordMutation.mutate(email)
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  const stepIndicatorVariants = {
    active: { color: "#3b82f6", scale: 1.05 },
    inactive: { color: "#9ca3af", scale: 1 }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-blue-50 to-gray-100 p-4"
    >
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md"
      >
        {/* Step Progress Indicator */}
        <motion.div
          className="flex justify-between mb-8 relative"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -z-10"></div>
          <motion.div
            className={`absolute top-1/2 left-0 h-1 bg-blue-500 -z-10 ${step === 'email' ? 'w-0' : step === 'otp' ? 'w-1/2' : 'w-full'}`}
            transition={{ duration: 0.5 }}
          ></motion.div>

          {[Step.email, Step.otp, Step.newPassword].map((stepName, index) => (
            <motion.div
              key={stepName}
              className="flex flex-col items-center"
              variants={itemVariants}
            >
              <motion.div
                className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${step === stepName ? 'bg-purple-700 text-white' : 'bg-gray-200 text-gray-600'}`}
                variants={stepIndicatorVariants}
                animate={step === stepName ? "active" : "inactive"}
              >
                {index + 1}
              </motion.div>
              <motion.span
                className={`text-sm ${step === stepName ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}
              >
                {stepName === 'email' ? 'Email' : stepName === 'otp' ? 'OTP' : 'Reset'}
              </motion.span>
            </motion.div>
          ))}
        </motion.div>

        <AnimatePresence mode="wait">
          {step === Step.email && (
            <motion.form
              key="email"
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 50, opacity: 0 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleEmailSubmit}
              className="space-y-4"
            >
              <motion.h2
                className="text-3xl font-bold mb-6 text-center text-gray-800"
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                Forgot Password
              </motion.h2>

              <AnimatePresence>
                {emailForm.formState.errors.email && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mb-4 p-3 bg-red-100 text-red-600 rounded-lg flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {emailForm.formState.errors.email.message}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                className="space-y-2"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div variants={itemVariants}>
                  <label htmlFor="email" className="block text-gray-700 mb-2 font-medium">Email Address</label>
                  <motion.input
                    type="email"
                    id="email"
                    {...emailForm.register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i,
                        message: "Invalid email address",
                      }
                    })}
                    placeholder="name@gmail.com"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    whileFocus={{ scale: 1.01, boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.5)" }}
                  />
                </motion.div>
              </motion.div>

              <motion.button
                type="submit"
                disabled={forgotPasswordMutation.isPending || !emailForm.formState.isValid}
                className={`w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex justify-center items-center ${forgotPasswordMutation.isPending || !emailForm.formState.isValid ? "cursor-not-allowed" : "cursor-pointer"}`}
                whileHover={!forgotPasswordMutation.isPending ? { scale: 1.02 } : {}}
                whileTap={!forgotPasswordMutation.isPending ? { scale: 0.98 } : {}}
              >
                {forgotPasswordMutation.isPending ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending OTP...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Send OTP
                  </>
                )}
              </motion.button>
            </motion.form>
          )}

          {step === Step.otp && (
            <motion.form
              key="otp"
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 50, opacity: 0 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleOtpSubmit}
              className="space-y-4"
            >
              <div className="flex justify-between items-center mb-6">
                <motion.h2
                  className="text-3xl font-bold text-gray-800"
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  Enter OTP
                </motion.h2>
                <motion.button
                  type="button"
                  onClick={() => setStep(Step.email)}
                  className="text-sm text-blue-500 hover:underline flex items-center"
                  whileHover={{ x: -2 }}
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back
                </motion.button>
              </div>

              <AnimatePresence>
                {otpForm.formState.errors.otp && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mb-4 p-3 bg-red-100 text-red-600 rounded-lg flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {otpForm.formState.errors.otp.message}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                className="space-y-2"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div variants={itemVariants}>
                  <label htmlFor="otp" className="block text-gray-700 mb-2 font-medium">One-Time Password</label>
                  <motion.input
                    type="text"
                    id="otp"
                    {...otpForm.register("otp", {
                      required: "OTP is required",
                    })}
                    placeholder="Enter 6-digit OTP"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    whileFocus={{ scale: 1.01, boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.5)" }}
                  />
                </motion.div>
              </motion.div>

              <div className="flex justify-between items-center mb-4">
                <motion.button
                  type="button"
                  onClick={resendOtp}
                  disabled={forgotPasswordMutation.isPending}
                  className="text-sm text-blue-500 hover:underline flex items-center"
                  whileHover={{ x: 2 }}
                >
                  {forgotPasswordMutation.isPending ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Resending...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Resend OTP
                    </>
                  )}
                </motion.button>
              </div>

              <motion.button
                type="submit"
                disabled={verifyOtpMutation.isPending || !otpForm.formState.isValid}
                className={`w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex justify-center items-center ${verifyOtpMutation.isPending || !otpForm.formState.isValid ? "cursor-not-allowed" : "cursor-pointer"}`}
                whileHover={!verifyOtpMutation.isPending ? { scale: 1.02 } : {}}
                whileTap={!verifyOtpMutation.isPending ? { scale: 0.98 } : {}}
              >
                {verifyOtpMutation.isPending ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Verify OTP
                  </>
                )}
              </motion.button>
            </motion.form>
          )}

          {step === Step.newPassword && (
            <motion.form
              key="newPassword"
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 50, opacity: 0 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleNewPasswordSubmit}
              className="space-y-4"
            >
              <div className="flex justify-between items-center mb-6">
                <motion.h2
                  className="text-3xl font-bold text-gray-800"
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  Reset Password
                </motion.h2>
                <motion.button
                  type="button"
                  onClick={() => setStep(Step.otp)}
                  className="text-sm text-blue-500 cursor-pointer hover:underline flex items-center"
                  whileHover={{ x: -2 }}
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back
                </motion.button>
              </div>

              <AnimatePresence>
                {passwordForm.formState.errors.root && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mb-4 p-3 bg-red-100 text-red-600 rounded-lg flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {passwordForm.formState.errors.root.message}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                className="space-y-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div variants={itemVariants}>
                  <label htmlFor="newPassword" className="block text-gray-700 mb-2 font-medium">New Password</label>
                  <motion.input
                    type="password"
                    id="newPassword"
                    {...passwordForm.register("newPassword", {
                      required: "New password is required",
                      minLength: {
                        value: 8,
                        message: "Password must be at least 8 characters long",
                      },
                      validate: (value) => {
                        if (value !== passwordForm.getValues("confirmPassword")) {
                          return "Passwords do not match";
                        }
                        return true;
                      }
                    })}
                    placeholder="Enter new password"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    whileFocus={{ scale: 1.01, boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.5)" }}
                  />
                  {passwordForm.formState.errors.newPassword && (
                    <p className="mt-1 text-sm text-red-600">
                      {passwordForm.formState.errors.newPassword.message}
                    </p>
                  )}
                </motion.div>

                <motion.div variants={itemVariants}>
                  <label htmlFor="confirmPassword" className="block text-gray-700 mb-2 font-medium">Confirm Password</label>
                  <motion.input
                    type="password"
                    id="confirmPassword"
                    {...passwordForm.register("confirmPassword", {
                      required: "Confirm password is required",
                    })}
                    placeholder="Confirm new password"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    whileFocus={{ scale: 1.01, boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.5)" }}
                  />
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">
                      {passwordForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </motion.div>
              </motion.div>

              <motion.button
                type="submit"
                disabled={resetPasswordMutation.isPending || !passwordForm.formState.isValid}
                className={`w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex justify-center items-center ${resetPasswordMutation.isPending || !passwordForm.formState.isValid ? "cursor-not-allowed" : "cursor-pointer"}`}
                whileHover={resetPasswordMutation.isPending ? { scale: 1.02 } : {}}
                whileTap={resetPasswordMutation.isPending ? { scale: 0.98 } : {}}
              >
                {resetPasswordMutation.isPending ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Resetting...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Reset Password
                  </>
                )}
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default ForgotPassword;