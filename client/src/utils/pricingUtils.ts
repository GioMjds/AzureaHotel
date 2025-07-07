import { RoomData } from "../types/BookingClient";

interface User {
  id: number;
  username: string;
  email: string;
  profile_image?: string;
  is_verified?: string;
  last_booking_date?: string | null;
  role?: string;
  is_senior_or_pwd?: boolean;
}

interface AreaData {
  id: number;
  area_name: string;
  description: string;
  price_per_hour: string | number;
  price_per_hour_numeric?: number;
  discounted_price?: string | number;
  discounted_price_numeric?: number;
  senior_discounted_price?: string | number;
  discount_percent?: number;
  capacity: number;
  status: string;
}

interface PricingOptions {
  roomData: RoomData;
  userDetails: User | null;
  nights: number;
}

interface AreaPricingOptions {
  areaData: AreaData;
  userDetails: User | null;
  hours: number;
}

interface PricingResult {
  originalPrice: number;
  finalPrice: number;
  discountType: "admin" | "senior" | "long_stay" | "none";
  discountPercent: number;
  totalPrice: number;
}

export const calculateRoomPricing = ({
  roomData,
  userDetails,
  nights,
}: PricingOptions): PricingResult => {
  const parsePrice = (val: number | string | null | undefined): number => {
    if (!val) return 0;
    if (typeof val === "number") return val;
    if (typeof val === "string") {
      return parseFloat(val.replace(/[^\d.]/g, "")) || 0;
    }
    return 0;
  };

  // Get base price - try multiple field names for compatibility
  const originalPrice = parsePrice(
    roomData.price_per_night || roomData.room_price || 0
  );

  if (originalPrice === 0) {
    return {
      originalPrice: 0,
      finalPrice: 0,
      discountType: "none",
      discountPercent: 0,
      totalPrice: 0,
    };
  }

  const isSeniorOrPwd = userDetails?.is_senior_or_pwd;

  // Get available discounts from backend
  const adminDiscounted = parsePrice(
    roomData.discounted_price_numeric || roomData.discounted_price
  );
  const seniorDiscounted = parsePrice(roomData.senior_discounted_price);
  const backendDiscountPercent = roomData.discount_percent || 0;

  // Calculate Long Stay Discount
  let longStayDiscount = 0;
  if (nights >= 7) {
    longStayDiscount = 10;
  } else if (nights >= 3) {
    longStayDiscount = 5;
  }
  const longStayDiscountedPrice =
    longStayDiscount > 0 ? originalPrice * (1 - longStayDiscount / 100) : null;

  // Collect all available discounts with their types
  const availableDiscounts: Array<{
    price: number;
    type: "admin" | "senior" | "long_stay";
    percent: number;
  }> = [];

  // Backend admin discount (always available if exists)
  if (adminDiscounted && adminDiscounted < originalPrice) {
    availableDiscounts.push({
      price: adminDiscounted,
      type: "admin",
      percent:
        backendDiscountPercent ||
        ((originalPrice - adminDiscounted) / originalPrice) * 100,
    });
  }

  // Senior/PWD discount (only if user is eligible)
  if (isSeniorOrPwd && seniorDiscounted && seniorDiscounted < originalPrice) {
    availableDiscounts.push({
      price: seniorDiscounted,
      type: "senior",
      percent: 20,
    });
  }

  // Long stay discount (frontend calculated)
  if (longStayDiscountedPrice && longStayDiscountedPrice < originalPrice) {
    availableDiscounts.push({
      price: longStayDiscountedPrice,
      type: "long_stay",
      percent: longStayDiscount,
    });
  }

  // Pick the best discount (lowest price)
  let finalPricePerNight = originalPrice;
  let discountType: "admin" | "senior" | "long_stay" | "none" = "none";
  let discountPercent = 0;

  if (availableDiscounts.length > 0) {
    const bestDiscount = availableDiscounts.reduce((best, current) =>
      current.price < best.price ? current : best
    );
    finalPricePerNight = bestDiscount.price;
    discountType = bestDiscount.type;
    discountPercent = bestDiscount.percent;
  }

  return {
    originalPrice,
    finalPrice: finalPricePerNight,
    discountType,
    discountPercent,
    totalPrice: finalPricePerNight * nights,
  };
};

export const calculateAreaPricing = ({
  areaData,
  userDetails,
  hours = 1,
}: AreaPricingOptions): PricingResult => {
  const parsePrice = (val: number | string | null | undefined): number => {
    if (!val) return 0;
    if (typeof val === "number") return val;
    if (typeof val === "string") {
      return parseFloat(val.replace(/[^\d.]/g, "")) || 0;
    }
    return 0;
  };

  // Get base price - try multiple field names for compatibility
  const originalPrice = parsePrice(
    areaData.price_per_hour_numeric || areaData.price_per_hour || 0
  );

  if (originalPrice === 0) {
    return {
      originalPrice: 0,
      finalPrice: 0,
      discountType: "none",
      discountPercent: 0,
      totalPrice: 0,
    };
  }

  const isSeniorOrPwd = userDetails?.is_senior_or_pwd;

  // Get available discounts from backend
  const adminDiscounted = parsePrice(
    areaData.discounted_price_numeric || areaData.discounted_price
  );
  const seniorDiscounted = parsePrice(areaData.senior_discounted_price);
  const backendDiscountPercent = areaData.discount_percent || 0;

  // Collect all available discounts with their types
  const availableDiscounts: Array<{
    price: number;
    type: "admin" | "senior";
    percent: number;
  }> = [];

  // Backend admin discount (always available if exists)
  if (adminDiscounted && adminDiscounted < originalPrice) {
    availableDiscounts.push({
      price: adminDiscounted,
      type: "admin",
      percent:
        backendDiscountPercent ||
        ((originalPrice - adminDiscounted) / originalPrice) * 100,
    });
  }

  // Senior/PWD discount (only if user is eligible)
  if (isSeniorOrPwd && seniorDiscounted && seniorDiscounted < originalPrice) {
    availableDiscounts.push({
      price: seniorDiscounted,
      type: "senior",
      percent: 20,
    });
  }

  // Pick the best discount (lowest price)
  let finalPricePerHour = originalPrice;
  let discountType: "admin" | "senior" | "long_stay" | "none" = "none";
  let discountPercent = 0;

  if (availableDiscounts.length > 0) {
    const bestDiscount = availableDiscounts.reduce((best, current) =>
      current.price < best.price ? current : best
    );
    finalPricePerHour = bestDiscount.price;
    discountType = bestDiscount.type;
    discountPercent = bestDiscount.percent;
  }

  return {
    originalPrice,
    finalPrice: finalPricePerHour,
    discountType,
    discountPercent,
    totalPrice: finalPricePerHour * hours,
  };
};

export const formatPrice = (price: number): string => {
  return `₱${price.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const getDiscountLabel = (
  discountType: string,
  discountPercent: number
): string => {
  switch (discountType) {
    case "admin":
      return `Discount (${discountPercent}%)`;
    case "senior":
      return "Senior/PWD Discount (20%)";
    case "long_stay":
      return `Long Stay Discount (${discountPercent}%)`;
    default:
      return "";
  }
};
