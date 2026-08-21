import axios from "axios";

const ApiClient = (baseUrl) => {
    const apiClient = axios.create({
        baseURL: baseUrl,
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
    });

    // Tự gắn token vào mỗi request
    apiClient.interceptors.request.use((config) => {
        const token = localStorage.getItem("authenticateToken");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });

    // Tự xử lý khi token hết hạn hoặc tài khoản bị khóa
    apiClient.interceptors.response.use(response => response, error => {
        const status = error.response?.status;
        const msg = error.response?.data?.message || "";
        
        if (status === 401 || (status === 403 && (msg.includes("khóa") || msg.includes("ngừng hoạt động")))) {
            localStorage.clear();
            if (!window.location.pathname.includes("/user/login")) {
                window.location.href = "/user/login?error=" + encodeURIComponent(msg || "Phiên làm việc hết hạn hoặc tài khoản bị khóa");
            }
        }
        return Promise.reject(error);
    });

    return apiClient;
};

export default ApiClient;
