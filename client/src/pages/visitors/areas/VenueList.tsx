/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import { FC, useMemo } from "react";
import VenueCard from "../../../components/areas/VenueCard";
import { useUserContext } from "../../../contexts/AuthContext";
import ContentLoader from "../../../motions/loaders/ContentLoader";
import { fetchAreas } from "../../../services/Area";
import { Area } from "../../../types/AreaClient";

interface AreaResponse {
  data: Area[];
}

const VenueList: FC = () => {
  const { userDetails } = useUserContext();

  const { data: areasData, isLoading, isError } = useQuery<AreaResponse>({
    queryKey: ["venues"],
    queryFn: fetchAreas,
  });

  const availableAreas = useMemo(() => {
    if (!areasData?.data) return [];
    return areasData.data
      .filter((area: any) => area.status === 'available')
      .map((area: any) => {
        const isSeniorOrPwd = userDetails?.is_senior_or_pwd;
        const hasDiscount = area.discounted_price && area.discount_percent > 0;
        const senior_discounted_price = area.senior_discounted_price;
        return {
          id: area.id,
          area_name: area.area_name,
          area_image: area.images,
          description: area.description || '',
          price_per_hour: hasDiscount && isSeniorOrPwd ? area.price_per_hour : area.price_per_hour,
          discounted_price: hasDiscount && isSeniorOrPwd ? area.discounted_price : null,
          discount_percent: hasDiscount && isSeniorOrPwd ? area.discount_percent : 0,
          senior_discounted_price,
        }
      });
  }, [areasData?.data, userDetails]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <h2 className="text-center text-3xl sm:text-4xl font-bold mb-8">
          Select Your Perfect Event Space
        </h2>
        <ContentLoader />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto p-6">
        <h2 className="text-center text-3xl sm:text-4xl font-bold mb-8">
          Select Your Perfect Event Space
        </h2>
        <div className="text-center text-red-500">
          Failed to load venues. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-center text-3xl sm:text-4xl font-bold mb-6">
        Select Your Perfect Event Space
      </h2>

      {availableAreas.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-lg text-gray-600">No areas available at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableAreas.map((area, index) => (
            <div key={index}>
              <VenueCard
                id={area.id}
                title={area.area_name}
                priceRange={area.price_per_hour.toString()}
                image={area.area_image}
                images={area.area_image}
                description={area.description}
                discount_percent={area.discount_percent > 0 ? area.discount_percent : null}
                discounted_price={area.discounted_price}
                senior_discounted_price={area.senior_discounted_price}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VenueList;