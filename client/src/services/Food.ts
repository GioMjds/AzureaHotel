import { food } from "./_axios";

export const fetchCraveOnFoods = async () => {
    try {
        const response = await food.get('/Manage-Item', {
            headers: {
                'Accept': 'application/json',
            },
            withCredentials: true,
        });
        return response.data;
    } catch (error) {
        console.error(`Failed to fetch food data from CraveOn: ${error}`);
        throw error;
    }
};