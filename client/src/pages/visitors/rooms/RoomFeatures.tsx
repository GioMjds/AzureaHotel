
const RoomFeatures = () => {
  return (
    <section className="bg-purple-900 py-8">
      {/* Dark Blue Background */}
      <div className="max-w-6xl mx-auto flex flex-wrap justify-center gap-12 px-6">
        {/* Free Wifi */}
        <div className="flex items-center gap-3 text-white">
          <i className="fa-solid fa-wifi text-xl"></i> {/* Font Awesome Icon */}
          <span className="uppercase tracking-wide font-montserrat text-lg">
            Free Wifi
          </span>
        </div>

        {/* Room Service */}
        <div className="flex items-center gap-3 text-white">
          <i className="fa-solid fa-bell-concierge text-xl"></i>
          <span className="uppercase tracking-wide font-montserrat text-lg">
            Room Service
          </span>
        </div>

        {/* Housekeeping */}
        <div className="flex items-center gap-3 text-white">
          <i className="fa-solid fa-broom text-xl"></i>
          <span className="uppercase tracking-wide font-montserrat text-lg">
            Housekeeping
          </span>
        </div>

        {/* 24/7 Support */}
        <div className="flex items-center gap-3 text-white">
          <i className="fa-solid fa-phone-volume text-xl"></i>
          <span className="uppercase tracking-wide font-montserrat text-lg">
            24/7 Support
          </span>
        </div>
      </div>
    </section>
  );
};

export default RoomFeatures;
