import axios from 'axios';
import userManager from './user-manager';

const baseURL: string = import.meta.env.VITE_API_URL;

/** URL paths that should NOT receive the Authorization header */
const excludedUrls: string[] = [
    '/auth/token',
    '/auth/register',
    '/public/',
];

const axiosInstance = axios.create({
    baseURL,
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json',
    },
});

axiosInstance.interceptors.request.use(
    async (config) => {
        const requestUrl = config.url ?? '';
        const isExcluded = excludedUrls.some((url) => requestUrl.startsWith(url));

        if (!isExcluded) {
            const user = await userManager.getUser();
            if (user?.access_token) {
                config.headers.Authorization = `Bearer ${user.access_token}`;
            }
        }

        return config;
    },
    (error) => Promise.reject(error),
);

export default axiosInstance;