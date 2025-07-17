import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Ban, BookCheck, BookOpen, Calendar, CheckCircle, Clock, CreditCard, LogOut, Receipt, Send, Star, XCircle } from "lucide-react";
import { FC, useCallback, useEffect, useMemo, useState } from "react";

interface LoaderProps {
  text?: string;
  type?: "default" | "reserve" | "checkin" | "checkout" | "noshow" | "cancelled" | "rejected";
}

const EventLoader: FC<LoaderProps> = ({
  text = "Processing your booking...",
  type = "default"
}) => {
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState(0);
  const [flare, setFlare] = useState({ x: 0, y: 0, show: false });

  const updateProgress = useCallback(() => {
    setProgress(prev => {
      const newProgress = prev + (1 - prev / 100) * 2;
      return newProgress >= 95 ? 95 : newProgress;
    });
  }, []);

  const updateStep = useCallback(() => {
    setStep(prev => (prev + 1) % 4);
  }, []);

  const showFlare = useCallback(() => {
    setFlare({
      x: Math.random() * 80 + 10,
      y: Math.random() * 80 + 10,
      show: true
    });

    setTimeout(() => {
      setFlare(prev => ({ ...prev, show: false }));
    }, 700);
  }, []);

  // Setup and cleanup intervals with a single useEffect
  useEffect(() => {
    const progressTimer = setInterval(updateProgress, 100);
    const stepTimer = setInterval(updateStep, 2500);
    const flareTimer = setInterval(showFlare, 3000);

    return () => {
      clearInterval(progressTimer);
      clearInterval(stepTimer);
      clearInterval(flareTimer);
    };
  }, [updateProgress, updateStep, showFlare]);

  // Memoize the colors to prevent recalculation
  const colors = useMemo(() => {
    switch (type) {
      case "reserve":
        return {
          primary: "#4f46e5",
          secondary: "#10b981",
          gradient: "from-indigo-600 to-emerald-500",
          lightGradient: "from-indigo-100 to-emerald-100",
          accent: "bg-indigo-600",
          accentLight: "bg-indigo-50",
          textColor: "text-indigo-700",
          icon: <BookOpen className="w-7 h-7" strokeWidth={1.5} />,
          iconBg: "bg-indigo-100",
          iconColor: "text-indigo-600"
        };
      case "checkin":
        return {
          primary: "#3b82f6",
          secondary: "#60a5fa",
          gradient: "from-blue-600 to-blue-400",
          lightGradient: "from-blue-100 to-sky-100",
          accent: "bg-blue-600",
          accentLight: "bg-blue-50",
          textColor: "text-blue-700",
          icon: <CheckCircle className="w-7 h-7" strokeWidth={1.5} />,
          iconBg: "bg-blue-100",
          iconColor: "text-blue-600"
        };
      case "checkout":
        return {
          primary: "#8b5cf6",
          secondary: "#a78bfa",
          gradient: "from-purple-600 to-purple-400",
          lightGradient: "from-purple-100 to-violet-100",
          accent: "bg-purple-600",
          accentLight: "bg-purple-50",
          textColor: "text-purple-700",
          icon: <LogOut className="w-7 h-7" strokeWidth={1.5} />,
          iconBg: "bg-purple-100",
          iconColor: "text-purple-600"
        };
      case "noshow":
        return {
          primary: "#d97706",
          secondary: "#fbbf24",
          gradient: "from-amber-600 to-amber-400",
          lightGradient: "from-amber-100 to-yellow-100",
          accent: "bg-amber-600",
          accentLight: "bg-amber-50",
          textColor: "text-amber-700",
          icon: <AlertCircle className="w-7 h-7" strokeWidth={1.5} />,
          iconBg: "bg-amber-100",
          iconColor: "text-amber-600"
        };
      case "cancelled":
        return {
          primary: "#ef4444",
          secondary: "#f87171",
          gradient: "from-red-600 to-red-400",
          lightGradient: "from-red-100 to-rose-100",
          accent: "bg-red-600",
          accentLight: "bg-red-50",
          textColor: "text-red-700",
          icon: <XCircle className="w-7 h-7" strokeWidth={1.5} />,
          iconBg: "bg-red-100",
          iconColor: "text-red-600"
        };
      case "rejected":
        return {
          primary: "#dc2626",
          secondary: "#b91c1c",
          gradient: "from-red-700 to-red-500",
          lightGradient: "from-red-200 to-red-100",
          accent: "bg-red-700",
          accentLight: "bg-red-50",
          textColor: "text-red-800",
          icon: <Ban className="w-7 h-7" strokeWidth={1.5} />,
          iconBg: "bg-red-100",
          iconColor: "text-red-700"
        };
      default:
        return {
          primary: "#4f46e5",
          secondary: "#6366f1",
          gradient: "from-indigo-600 to-indigo-400",
          lightGradient: "from-indigo-100 to-blue-100",
          accent: "bg-indigo-600",
          accentLight: "bg-indigo-50",
          textColor: "text-indigo-700",
          icon: <Calendar className="w-7 h-7" strokeWidth={1.5} />,
          iconBg: "bg-indigo-100",
          iconColor: "text-indigo-600"
        };
    }
  }, [type]);

  const { primary, gradient, lightGradient, accentLight, textColor, icon, iconBg, iconColor } = colors;

  // Memoize booking steps to prevent recreation on each render
  const bookingSteps = useMemo(() => [
    {
      icon: <BookOpen className="w-5 h-5" />,
      text: "Preparing reservation...",
      detail: "Checking availability"
    },
    {
      icon: <CreditCard className="w-5 h-5" />,
      text: "Processing details...",
      detail: "Securing your booking"
    },
    {
      icon: <Send className="w-5 h-5" />,
      text: "Confirming booking...",
      detail: "Almost there"
    },
    {
      icon: <Receipt className="w-5 h-5" />,
      text: "Finalizing reservation...",
      detail: "Creating your booking"
    }
  ], []);

  const containerVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.05,
        duration: 0.3
      }
    },
    exit: {
      opacity: 0,
      transition: {
        when: "afterChildren",
        staggerChildren: 0.05,
        staggerDirection: -1,
        duration: 0.3
      }
    }
  };

  const itemVariants = {
    initial: { opacity: 0, y: 10 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    },
    exit: {
      opacity: 0,
      y: -10,
      transition: { duration: 0.2 }
    }
  };

  const floatingAnimation = {
    y: [0, -8, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }
  };

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center z-[9999]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Background overlay with blur */}
      <motion.div
        className="absolute inset-0 bg-white backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 opacity-0"
          style={{
            backgroundImage: `radial-gradient(${primary}99 1px, transparent 1px)`,
            backgroundSize: '30px 30px'
          }}
        />
      </div>

      {/* Main Container */}
      <motion.div
        className="relative z-10 w-full max-w-5xl px-4 mx-auto flex flex-col items-center justify-center"
        variants={containerVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {/* Main Animation Content */}
        <div className="w-full flex flex-col md:flex-row items-center justify-center gap-12 py-8">

          {/* Left Side - Booking Document */}
          <motion.div
            className="relative w-full md:w-1/2 flex justify-center"
            variants={itemVariants}
          >
            <div className="relative w-64 md:w-80 aspect-[3/4]">
              {/* Shadow under the document */}
              <motion.div
                className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-[90%] h-[10px] bg-black/20 blur-md rounded-full"
                animate={{
                  width: ['90%', '85%', '90%'],
                  opacity: [0.2, 0.15, 0.2]
                }}
                transition={{ duration: 2, repeat: Infinity, repeatType: "mirror" }}
              />

              {/* Main Document */}
              <motion.div
                className={`w-full h-full ${accentLight} rounded-lg shadow-lg relative overflow-hidden`}
                animate={{
                  y: [0, -5, 0],
                  boxShadow: [
                    "0 4px 6px rgba(0,0,0,0.05), 0 10px 15px -3px rgba(0,0,0,0.1)",
                    "0 4px 6px rgba(0,0,0,0.08), 0 15px 15px -3px rgba(0,0,0,0.15)",
                    "0 4px 6px rgba(0,0,0,0.05), 0 10px 15px -3px rgba(0,0,0,0.1)"
                  ]
                }}
                transition={{ duration: 3, repeat: Infinity, repeatType: "mirror" }}
              >
                {/* Document Header */}
                <div className={`h-16 w-full bg-gradient-to-r ${gradient} rounded-t-lg flex items-center px-4`}>
                  <motion.div
                    className="flex items-center space-x-2 text-white"
                    animate={{ x: [0, 1, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                      {icon}
                    </div>
                    <div>
                      <motion.h3
                        className="font-semibold text-sm md:text-base"
                        animate={{ opacity: [0.95, 1, 0.95] }}
                        transition={{ duration: 3, repeat: Infinity }}
                      >
                        Booking Confirmation
                      </motion.h3>
                    </div>
                  </motion.div>
                </div>

                {/* Content Area with Light Flare Effect */}
                <div className="p-4 relative overflow-hidden">
                  {/* Light flare effect */}
                  <AnimatePresence>
                    {flare.show && (
                      <motion.div
                        className="absolute w-16 h-16 bg-white rounded-full filter blur-md opacity-40"
                        style={{
                          left: `${flare.x}%`,
                          top: `${flare.y}%`,
                          transform: 'translate(-50%, -50%)'
                        }}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: [0, 0.7, 0], scale: [0, 1, 1.5] }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.7 }}
                      />
                    )}
                  </AnimatePresence>

                  {/* Form Content */}
                  <div className="space-y-5 mt-4">
                    {/* Logo and Status */}
                    <div className="flex justify-between items-center">
                      <motion.div
                        className="w-12 h-12 rounded-md bg-gradient-to-br from-gray-200 to-gray-100 flex items-center justify-center"
                        animate={{ rotate: [0, 2, 0, -2, 0] }}
                        transition={{ duration: 6, repeat: Infinity }}
                      >
                        <Star className="w-6 h-6 text-amber-500" fill="#f59e0b" strokeWidth={1} />
                      </motion.div>
                      <motion.div
                        className={`px-3 py-1 rounded-full bg-gradient-to-r ${lightGradient} text-xs md:text-sm ${textColor} font-medium flex items-center gap-1.5`}
                        animate={{ opacity: [0.9, 1, 0.9] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <span className="relative flex h-2 w-2">
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${iconBg}`}></span>
                          <span className={`relative inline-flex rounded-full h-2 w-2 ${iconBg}`}></span>
                        </span>
                        Processing
                      </motion.div>
                    </div>

                    {/* Form Fields - made to look like a real booking form */}
                    <div className="space-y-3">
                      {[
                        { label: "Booking ID", width: "60%" },
                        { label: "Guest", width: "90%" },
                        { label: "Check-in", width: "50%" },
                        { label: "Check-out", width: "50%" },
                        { label: "Room Type", width: "75%" },
                        { label: "Total Amount", width: "40%" }
                      ].map((field, i) => (
                        <div key={i} className="space-y-1">
                          <motion.div
                            className="text-xs text-gray-400 font-medium"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.2 }}
                          >
                            {field.label}
                          </motion.div>
                          <motion.div
                            className="h-2.5 bg-gray-200 rounded-sm"
                            style={{ width: field.width }}
                            initial={{ width: 0 }}
                            animate={{ width: field.width }}
                            transition={{
                              duration: 0.5,
                              delay: 0.2 + i * 0.15,
                              ease: "easeOut"
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Processing Stamp that periodically appears */}
                <AnimatePresence>
                  {step === 2 && (
                    <motion.div
                      className="absolute bottom-4 right-4 origin-bottom-right"
                      initial={{ scale: 0, rotate: -20, opacity: 0 }}
                      animate={{ scale: 1, rotate: 0, opacity: 0.8 }}
                      exit={{ scale: 0, rotate: 20, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <div className="w-24 h-24 border-2 border-green-500 rounded-full flex items-center justify-center transform rotate-[-15deg]">
                        <div className="text-green-500 text-xs font-bold">PROCESSING</div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Success checkmark that appears periodically */}
              <AnimatePresence>
                {step === 3 && (
                  <motion.div
                    className="absolute -bottom-6 -right-6 rounded-full p-4 bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-600/20"
                    initial={{ scale: 0, rotate: -45, opacity: 0 }}
                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                    exit={{ scale: 0, rotate: 45, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  >
                    <BookCheck className="w-6 h-6 text-white" strokeWidth={2.5} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Right Side - Status Updates */}
          <motion.div
            className="w-full md:w-2/5 flex flex-col items-center md:items-start space-y-8"
            variants={itemVariants}
          >
            {/* Title */}
            <motion.h2
              className={`text-2xl font-bold ${textColor} text-center md:text-left`}
              animate={{ opacity: [0.9, 1, 0.9] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {text}
            </motion.h2>

            {/* Steps Display */}
            <div className="w-full max-w-md space-y-5">
              {bookingSteps.map((bookingStep, idx) => (
                <motion.div
                  key={idx}
                  className={`flex items-center space-x-3 ${idx === step ? 'opacity-100' : 'opacity-40'}`}
                  animate={idx === step ? { x: [0, 4, 0] } : {}}
                  transition={idx === step ? { duration: 1.5, repeat: Infinity } : {}}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center
                    ${idx === step ? `${iconBg} ${iconColor}` : 'bg-gray-100 text-gray-400'}`}>
                    {idx < step ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : bookingStep.icon}
                  </div>
                  <div>
                    <div className={`text-sm font-medium ${idx === step ? textColor : 'text-gray-500'}`}>
                      {bookingStep.text}
                    </div>
                    {idx === step && (
                      <motion.div
                        className="text-xs text-gray-400"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        {bookingStep.detail}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Current Task Info */}
            <motion.div
              className={`p-4 rounded-lg bg-gradient-to-br ${lightGradient} w-full max-w-md`}
              animate={floatingAnimation}
            >
              <div className="flex items-start space-x-3">
                <div className={`mt-0.5 w-8 h-8 rounded-md ${iconBg} ${iconColor} flex items-center justify-center`}>
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className={`text-sm font-medium ${textColor}`}>
                    Your booking is being processed
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    This may take a few moments. Please don't refresh or close this page.
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Progress Bar */}
            <div className="w-full max-w-md space-y-1">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Processing</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full bg-gradient-to-r ${gradient}`}
                  style={{ width: "0%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Loading Indicators */}
        <motion.div
          className="mt-10 flex justify-center space-x-2"
          variants={itemVariants}
        >
          {[0, 1, 2].map((dot) => (
            <motion.div
              key={dot}
              className={`w-1.5 h-1.5 rounded-full ${iconBg}`}
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: dot * 0.3,
              }}
            />
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default EventLoader;
