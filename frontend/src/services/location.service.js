import axios from "axios";

const apiClient = axios.create({
    baseURL: "https://provinces.open-api.vn/api",
    headers: {
        "Content-Type": "application/json",
    },
});

class LocationService {
    async getProvinces() {
        return (await apiClient.get("/p/")).data;
    }

    async getDistricts(provinceCode) {
        if (!provinceCode) return [];
        const res = await apiClient.get(`/p/${provinceCode}?depth=2`);
        return res.data.districts || [];
    }

    async getWards(districtCode) {
        if (!districtCode) return [];
        const res = await apiClient.get(`/d/${districtCode}?depth=2`);
        return res.data.wards || [];
    }
}

export default new LocationService();
