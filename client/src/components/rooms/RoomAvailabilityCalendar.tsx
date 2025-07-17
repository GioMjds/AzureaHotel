import { AnimatePresence, motion } from "framer-motion";
import { CalendarRange } from "lucide-react";
import { memo, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Alert from "../Alert";
import { RoomAvailabilityCalendarProps } from "../../types/RoomClient";

const ARRIVAL_DATE_KEY = "hotel_arrival_date";
const DEPARTURE_DATE_KEY = "hotel_departure_date";

const RoomAvailabilityCalendar = memo(({ onDatesChange }: RoomAvailabilityCalendarProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [arrivalDate, setArrivalDate] = useState<string>("");
  const [departureDate, setDepartureDate] = useState<string>("");
  const [alertInfo, setAlertInfo] = useState<{
    message: string;
    type: "success" | "error" | "info" | "warning";
  } | null>(null);

  useEffect(() => {
    const arrivalParam = searchParams.get("arrival");
    const departureParam = searchParams.get("departure");

    if (arrivalParam) {
      setArrivalDate(arrivalParam);
    } else {
      const savedArrival = localStorage.getItem(ARRIVAL_DATE_KEY);
      if (savedArrival) setArrivalDate(savedArrival);
    }

    if (departureParam) {
      setDepartureDate(departureParam);
    } else {
      const savedDeparture = localStorage.getItem(DEPARTURE_DATE_KEY);
      if (savedDeparture) setDepartureDate(savedDeparture);
    }
  }, [searchParams]);

  useEffect(() => {
    if (arrivalDate) {
      localStorage.setItem(ARRIVAL_DATE_KEY, arrivalDate);
    }

    if (departureDate) {
      localStorage.setItem(DEPARTURE_DATE_KEY, departureDate);
    }
  }, [arrivalDate, departureDate]);

  const getTodayString = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, "0");
    const day = today.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const validateDates = (): boolean => {
    if (!arrivalDate || !departureDate) {
      setAlertInfo({
        message: "Please provide both arrival and departure dates. Please try again",
        type: "error",
      });
      return false;
    }

    const today = getTodayString();
    if (arrivalDate < today) {
      setAlertInfo({
        message: "Arrival date cannot be in the past. Please try again",
        type: "error",
      });
      return false;
    }
    if (departureDate < today) {
      setAlertInfo({
        message: "Departure date cannot be in the past. Please try again",
        type: "error",
      });
      return false;
    }
    if (departureDate <= arrivalDate) {
      setAlertInfo({
        message:
          "Departure date must be greater than arrival date. Please try again",
        type: "error",
      });
      return false;
    }

    setAlertInfo(null);
    return true;
  };

  const handleCheckAvailability = () => {
    if (!validateDates()) return;

    localStorage.setItem(ARRIVAL_DATE_KEY, arrivalDate);
    localStorage.setItem(DEPARTURE_DATE_KEY, departureDate);

    if (onDatesChange) {
      onDatesChange(arrivalDate, departureDate);
    } else {
      navigate(`/availability?arrival=${arrivalDate}&departure=${departureDate}`, { replace: true });
    }
  };

  const handleArrivalDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setArrivalDate(newDate);

    if (newDate && (!departureDate || departureDate <= newDate)) {
      const nextDay = new Date(newDate);
      nextDay.setDate(nextDay.getDate() + 1);

      const year = nextDay.getFullYear();
      const month = (nextDay.getMonth() + 1).toString().padStart(2, "0");
      const day = nextDay.getDate().toString().padStart(2, "0");

      setDepartureDate(`${year}-${month}-${day}`);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 20,
        stiffness: 100,
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 120,
      },
    },
  };

  const buttonVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { type: "spring", stiffness: 300 },
    },
    hover: {
      scale: 1.03,
      boxShadow:
        "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      transition: { duration: 0.3 },
    },
    tap: { scale: 0.97 },
  };

  return (
    <div className="relative">
      {/* Render custom alert if there's any error */}
      <AnimatePresence>
        {alertInfo && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", damping: 25 }}
            className="mb-4"
          >
            <Alert
              message={alertInfo.message}
              type={alertInfo.type}
              onClose={() => setAlertInfo(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 mb-8 sm:mb-15 w-full shadow-lg rounded-xl overflow-hidden border border-blue-100"
      >
        <motion.div variants={itemVariants} className="py-1 font-montserrat">
          <motion.div
            variants={itemVariants}
            className="flex flex-col justify-around gap-5"
          >
            {/* Header */}
            <motion.div
              variants={itemVariants}
              className="flex justify-between items-center"
            >
              <motion.h1
                variants={itemVariants}
                className="text-md md:text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text"
              >
                Find Your Perfect Stay
              </motion.h1>
              <p className="text-gray-600 text-sm mt-1">
                Search only shows rooms that are available (not reserved or
                occupied)
              </p>
            </motion.div>

            {/* Form Section */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row justify-center items-center gap-4 w-full"
            >
              {/* Arrival Date */}
              <motion.div variants={itemVariants} className="w-full">
                <div className="flex flex-col">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                    Check-in Date
                  </label>
                  <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm cursor-pointer transition-all overflow-hidden hover:shadow-md hover:border-blue-300 focus-within:ring-2 focus-within:ring-blue-400 focus-within:border-blue-400">
                    <input
                      type="date"
                      value={arrivalDate}
                      onChange={handleArrivalDateChange}
                      min={getTodayString()}
                      className="w-full py-3 px-4 outline-none font-medium text-gray-800 cursor-pointer appearance-none focus:outline-none bg-white text-base"
                      required
                    />
                  </div>
                </div>
              </motion.div>

              {/* Departure Date */}
              <motion.div variants={itemVariants} className="w-full">
                <div className="flex flex-col">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                    Check-out Date
                  </label>
                  <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm cursor-pointer transition-all overflow-hidden hover:shadow-md hover:border-blue-300 focus-within:ring-2 focus-within:ring-blue-400 focus-within:border-blue-400">
                    <input
                      type="date"
                      value={departureDate}
                      onChange={(e) => setDepartureDate(e.target.value)}
                      min={arrivalDate || getTodayString()}
                      className="w-full py-3 px-4 outline-none font-medium text-gray-800 cursor-pointer appearance-none focus:outline-none bg-white text-base"
                      required
                    />
                  </div>
                </div>
              </motion.div>

              {/* Search Button */}
              <motion.div variants={itemVariants} className="w-full sm:w-auto">
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={handleCheckAvailability}
                  className="w-full sm:w-auto py-4 px-8 rounded-xl bg-gradient-to-r from-indigo-800 to-purple-800 uppercase font-semibold text-lg text-white cursor-pointer shadow-lg flex items-center justify-center gap-3"
                >
                  <CalendarRange size={50} />
                  <span>Check Availability</span>
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
});

export default RoomAvailabilityCalendar;
