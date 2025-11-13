import axios from "axios";
import { fetchAuthSession } from "aws-amplify/auth";

// ✅ Correct Vite environment variable usage
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // example: https://94fv9s1dxj.execute-api.ap-south-1.amazonaws.com
});

// ✅ Intercept every request and attach Cognito JWT
api.interceptors.request.use(
  async (config) => {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.accessToken?.toString();

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.error("❌ Failed to get token:", err);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
