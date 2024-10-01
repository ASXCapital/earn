// src/hooks/useDebankData.ts
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Protocol } from '../types/deBanktypes';

interface DebankData {
    mainWallet: Protocol[];
    stakedLPs: Protocol[];
}

const useDebankData = () => {
    const [data, setData] = useState<DebankData | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get<DebankData>('/api/debank');

                // Make sure the response has the expected structure
                if (response.data && response.data.mainWallet && response.data.stakedLPs) {
                    setData(response.data);
                } else {
                    console.error('Unexpected data format received from API');
                }
            } catch (error) {
                console.error('Failed to fetch data from backend:', error);
            }
        };

        fetchData();
    }, []);

    return data;
};

export default useDebankData;
