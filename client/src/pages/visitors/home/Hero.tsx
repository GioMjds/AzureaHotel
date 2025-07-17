import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import RoomAvailabilityCalendar from "../../../components/rooms/RoomAvailabilityCalendar";
import { slides } from "../../../constants/HomepageHeroSlides";

const Hero = () => {
  const navigate = useNavigate();

  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const getTomorrowString = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  const handleCheckAvailability = () => {
    const arrivalDate = getTodayString();
    const departureDate = getTomorrowString();
    navigate(`/availability?arrival=${arrivalDate}&departure=${departureDate}`);
  };

  return (
    <section className="relative w-full h-screen">
      <Swiper
        modules={[Autoplay]}
        slidesPerView={1}
        loop={true}
        autoplay={{ delay: 10000, disableOnInteraction: false }}
        className="w-full h-full"
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.id}>
            <div
              className="h-screen bg-cover bg-center relative before:absolute before:inset-0 before:bg-black/60 before:z-0"
              style={{
                backgroundImage: `url(${slide.image})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                willChange: "transform",
              }}
            >
              {/* Preload next image */}
              <link
                rel="preload"
                as="image"
                href={slide.image}
                type="image/jpeg"
              />

              <div className="flex flex-col justify-center items-center h-screen z-10 relative text-center px-6 sm:px-12 md:px-20">
                <div className="text-white max-w-4xl">
                  <motion.h1
                    className="font-playfair mb-4 text-4xl leading-tight md:text-5xl sm:text-6xl"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.8,
                      delay: 0.3,
                      ease: "easeOut",
                    }}
                  >
                    {slide.heading}
                  </motion.h1>
                  <motion.p
                    className="font-montserrat text-xl leading-relaxed sm:text-lg md:text-xl"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.8,
                      delay: 0.6,
                      ease: "easeOut",
                    }}
                  >
                    {slide.description}
                  </motion.p>
                  <div className="flex justify-center items-center sm:hidden mt-10">
                    <button
                      onClick={handleCheckAvailability}
                      className="sm:w-auto py-4 px-8 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 uppercase font-semibold text-lg text-white cursor-pointer shadow-lg flex items-center justify-center gap-3"
                    >
                      Check Availability
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      <div className="hidden absolute bottom-1 w-full sm:flex justify-center z-20">
        <div className="lg:w-9/12 xl:w-8/12 2xl:w-7/12">
          <RoomAvailabilityCalendar />
        </div>
      </div>
    </section>
  );
};

export default Hero;
