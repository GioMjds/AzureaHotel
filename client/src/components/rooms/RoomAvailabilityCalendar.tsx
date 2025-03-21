import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const RoomAvailabilityCalendar = () => {
  const navigate = useNavigate();
  const [arrivalDate, setArrivalDate] = useState<Date | null>(null);
  const [departureDate, setDepartureDate] = useState<Date | null>(null);

  const handleCheckAvailability = () => {
    // Basic validation
    if (!arrivalDate || !departureDate) {
      alert("Please provide both arrival and departure dates.");
      return;
    }
    if (departureDate <= arrivalDate) {
      alert("Departure date must be greater than arrival date.");
      return;
    }

    // Convert to YYYY-MM-DD
    const arrivalStr = arrivalDate.toISOString().split("T")[0];
    const departureStr = departureDate.toISOString().split("T")[0];

    // Redirect to /availability with query params
    navigate(`/availability?arrival=${arrivalStr}&departure=${departureStr}`);
  };

  return (
    <div className="bg-[#ffffffe6] px-5 mb-10 sm:mb-15 w-full shadow-md drop-shadow-md inset-shadow-md">
      <div className="py-3 font-montserrat">
        <div className="flex flex-col justify-around gap-3">
          {/* Header - Hidden on small screens */}
          <div className="hidden sm:flex justify-between items-center">
            <h1 className="text-sm font-montserrat font-medium text-gray-500">
              <i className="fas fa-calendar-check text-blue-500 text-lg mr-3"></i>
              Tell us when — your perfect stay awaits you.
            </h1>
            <h1 className="text-sm font-montserrat font-medium">
              Find out more &gt;
            </h1>
          </div>

          {/* Form Section */}
          <div className="flex flex-wrap justify-center items-center gap-3 w-full">
            {/* Arrival Date */}
            <div className="flex flex-col min-w-[150px] flex-grow bg-white px-4 py-2">
              <label htmlFor="arrival" className="text-xs tracking-tight mb-1">
                Arrival Date
              </label>
              <DatePicker
                id="arrival"
                selected={arrivalDate}
                onChange={(date) => setArrivalDate(date)}
                dateFormat="yyyy-MM-dd"
                className="border-b-2 outline-0 italic cursor-pointer"
                placeholderText="Select arrival date"
              />
            </div>

            {/* Departure Date */}
            <div className="flex flex-col min-w-[150px] flex-grow bg-white px-4 py-2">
              <label htmlFor="departure" className="text-xs tracking-tight mb-1">
                Departure Date
              </label>
              <DatePicker
                id="departure"
                selected={departureDate}
                onChange={(date) => setDepartureDate(date)}
                dateFormat="yyyy-MM-dd"
                className="border-b-2 outline-0 italic cursor-pointer"
                placeholderText="Select departure date"
              />
            </div>

            {/* Search Button */}
            <div className="flex flex-col min-w-[150px] flex-grow">
              <button
                onClick={handleCheckAvailability}
                className="p-3 py-5 flex-1 bg-blue-600 font-medium transition duration-300 cursor-pointer text-sm text-white w-full"
              >
                Check Availability
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomAvailabilityCalendar;
