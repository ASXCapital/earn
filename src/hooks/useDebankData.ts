import { useState, useEffect } from 'react';
import axios from 'axios';
import { Protocol } from '../types/deBanktypes'; // Import the Protocol type

const useDebankData = () => {
    const [data, setData] = useState<Protocol[] | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get<Protocol[]>('/api/debank');

                // Transform the data as needed, assuming response.data is already in the expected format
                const formattedData = response.data.map((protocol) => ({
                    ...protocol,
                    stats: protocol.stats || { asset_usd_value: 0, net_usd_value: 0 }, // Handle missing stats
                    portfolio_item_list: protocol.portfolio_item_list || [], // Handle missing portfolio items
                }));

                setData(formattedData);
            } catch (error) {
                console.error('Failed to fetch data from backend:', error);
            }
        };

        fetchData();
    }, []);

    return data;
};

export default useDebankData;
