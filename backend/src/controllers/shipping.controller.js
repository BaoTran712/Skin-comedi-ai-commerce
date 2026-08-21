import shippingService from "../services/shipping.service.js";

export const getMethods = (req, res) => {
    try {
        const methods = shippingService.getAvailableMethods();
        res.json(methods);
    } catch (error) {
        res.status(500).json({ message: "Lỗi lấy phương thức vận chuyển" });
    }
};
