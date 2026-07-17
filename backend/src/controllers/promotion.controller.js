import Promotion from "../models/promotion.model.js";

const mapToFrontend = (promo) => {
    if (!promo) return null;
    return {
        id: promo._id,
        _id: promo._id,
        ma_khuyen_mai: promo.code,
        ten: promo.name,
        loai_giam_gia: promo.discount_type === 'fixed_amount' ? 'fixed' : promo.discount_type,
        gia_tri_giam: promo.discount_value,
        ngay_bat_dau: promo.start_date,
        ngay_ket_thuc: promo.end_date,
        gia_tri_don_toi_thieu: promo.min_order_value,
        so_tien_giam_toi_da: promo.max_discount_amount,
        gioi_han_su_dung: promo.usage_limit,
        so_lan_da_dung: promo.used_count || 0,
        trang_thai: promo.status,
        createdAt: promo.createdAt,
        updatedAt: promo.updatedAt
    };
};

const mapToBackend = (body) => {
    return {
        code: body.ma_khuyen_mai,
        name: body.ten,
        discount_type: body.loai_giam_gia === 'fixed' ? 'fixed_amount' : body.loai_giam_gia,
        discount_value: body.gia_tri_giam,
        start_date: body.ngay_bat_dau,
        end_date: body.ngay_ket_thuc,
        min_order_value: body.gia_tri_don_toi_thieu || 0,
        max_discount_amount: body.so_tien_giam_toi_da || null,
        usage_limit: body.gioi_han_su_dung || null,
        status: body.trang_thai || "active"
    };
};

const createPromotion = async (req, res) => {
    try {
        const payload = mapToBackend(req.body);
        const promotion = new Promotion(payload);
        await promotion.save();
        res.status(201).json(mapToFrontend(promotion));
    } catch (error) {
        console.error("Lỗi khi thêm khuyến mãi:", error);
        res.status(500).json({ error: "Lỗi khi thêm khuyến mãi" });
    }
};

const getPromotions = async (req, res) => {
    try {
        const promotions = await Promotion.find().sort({ createdAt: -1 });
        const result = promotions.map(mapToFrontend);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi lấy danh sách khuyến mãi" });
    }
};

const getPromotionById = async (req, res) => {
    try {
        const promotion = await Promotion.findById(req.params.id);
        if (!promotion) {
            return res.status(404).json({ error: "Không tìm thấy khuyến mãi" });
        }
        res.status(200).json(mapToFrontend(promotion));
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi lấy thông tin khuyến mãi" });
    }
};

const updatePromotion = async (req, res) => {
    try {
        const payload = mapToBackend(req.body);
        const promotion = await Promotion.findByIdAndUpdate(req.params.id, payload, { new: true });
        if (!promotion) {
            return res.status(404).json({ error: "Không tìm thấy khuyến mãi" });
        }
        res.status(200).json(mapToFrontend(promotion));
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi cập nhật khuyến mãi" });
    }
};

const deletePromotion = async (req, res) => {
    try {
        const promotion = await Promotion.findByIdAndDelete(req.params.id);
        if (!promotion) {
            return res.status(404).json({ error: "Không tìm thấy khuyến mãi" });
        }
        res.status(200).json({ message: "Xóa thành công" });
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi xóa khuyến mãi" });
    }
};

export default {
    createPromotion,
    getPromotions,
    getPromotionById,
    updatePromotion,
    deletePromotion
};
