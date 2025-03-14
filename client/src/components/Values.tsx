const Values = () => {
  return (
    <section className="py-16 px-6 sm:px-12 md:px-20 lg:px-32 bg-white text-center">
      {/* Section Title */}
      <h2
        className="font-playfair font-bold text-gray-900 mb-12"
        style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}
      >
        Our Values
      </h2>

      {/* Values */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        {/* Hospitality */}
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-blue-700 text-white flex justify-center items-center rotate-45 mb-6 relative">
            <i className="fa fa-users -rotate-45 relative text-xl"></i>
          </div>
          <h3 className="font-playfair text-xl font-semibold mb-4">
            Hospitality
          </h3>
          <p className="text-gray-700 max-w-xs">
            We welcome every guest with warmth and respect, creating a home away
            from home.
          </p>
        </div>

        {/* Comfort */}
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-blue-700 text-white flex justify-center items-center rotate-45 mb-6 relative">
            <i className="fa fa-bed -rotate-45 relative text-xl"></i>
          </div>
          <h3 className="font-playfair text-xl font-semibold mb-4">Comfort</h3>
          <p className="text-gray-700 max-w-xs">
            Our spaces are designed to offer peace and relaxation, ensuring a
            restful stay.
          </p>
        </div>

        {/* Culture */}
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-blue-700 text-white flex justify-center items-center rotate-45 mb-6 relative">
            <i className="fa fa-globe -rotate-45 relative text-xl"></i>
          </div>
          <h3 className="font-playfair text-xl font-semibold mb-4">Culture</h3>
          <p className="text-gray-700 max-w-xs">
            We celebrate diversity and showcase the beauty of our local and
            global traditions.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Values;
