import { booking } from "./_axios";

export const fetchCraveOnFoods = async () => {
    try {
        const response = await booking.get('/fetch_foods', {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        return response.data;
    } catch (error) {
        console.error(`Failed to fetch food data from CraveOn: ${error}`);
        throw error;
    }
};