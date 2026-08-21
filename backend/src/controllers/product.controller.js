import ProductService from "../services/product.service.js";
import ApiError from "../api-error.js";
import mongoose from "mongoose";

const bookService = new ProductService();

// Helper to convert title/name to URL-friendly slug
function generateSlug(text) {
    return text
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd')
        .replace(/([^0-9a-z-\s])/g, '')
        .replace(/(\s+)/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export async function create(req, res, next) {
    const { title, name, price, quantity } = req.body;
    
    if (!title || (!name && !title)) {
        return next(new ApiError(400, "Tên/Tiêu đề sản phẩm không được để trống"));
    }

    if (price !== undefined && (isNaN(price) || price < 0)) {
        return next(new ApiError(400, "Giá sản phẩm phải là số không âm"));
    }

    if (quantity !== undefined && (isNaN(quantity) || quantity < 0)) {
        return next(new ApiError(400, "Số lượng sản phẩm phải là số nguyên không âm"));
    }

    // Auto fill name & slug if missing
    const payload = { ...req.body };
    if (!payload.name) payload.name = title;
    if (!payload.slug) payload.slug = generateSlug(title) + "-" + Date.now();

    try {
        const document = await bookService.create(payload);
        return res.status(201).json({ message: "Tạo sản phẩm thành công", document });
    } catch (error) {
        console.error("Product Create Error:", error);
        if (error.code === 11000) {
            return next(new ApiError(409, "Slug sản phẩm đã tồn tại"));
        }
        if (error.name === "ValidationError") {
            return next(new ApiError(422, error.message));
        }
        return next(new ApiError(500, "Lỗi server khi tạo sản phẩm"));
    }
}

export async function findAll(req, res, next) {
    let documents = [];
    try {
        const { title } = req.query;
        if (title) {
            documents = await bookService.findByName(title);
        } else {
            documents = await bookService.find({});
        }
    } catch (error) {
        console.error("Product FindAll Error:", error);
        return next(new ApiError(500, "Đã xảy ra lỗi khi lấy danh sách sản phẩm"));
    }
    return res.json(documents);
}

export async function findOne(req, res, next) {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return next(new ApiError(400, "Định dạng ID sản phẩm không hợp lệ"));
    }
    try {
        const document = await bookService.findById(req.params.id);
        if (!document) {
            return next(new ApiError(404, "Không tìm thấy sản phẩm"));
        }
        return res.json(document);
    } catch (error) {
        console.error("Product FindOne Error:", error);
        return next(new ApiError(500, `Lỗi khi lấy thông tin sản phẩm với id ${req.params.id}`));
    }
}

export async function update(req, res, next) {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return next(new ApiError(400, "Định dạng ID sản phẩm không hợp lệ"));
    }
    if (Object.keys(req.body).length === 0) {
        return next(new ApiError(400, "Dữ liệu cập nhật không được để trống"));
    }
    try {
        const document = await bookService.update(req.params.id, req.body);
        if (!document) {
            return next(new ApiError(404, "Không tìm thấy sản phẩm"));
        }
        return res.json({ message: "Cập nhật sản phẩm thành công", document });
    } catch (error) {
        console.error("Product Update Error:", error);
        if (error.code === 11000) {
            return next(new ApiError(409, "Slug sản phẩm trùng lặp"));
        }
        if (error.name === "ValidationError") {
            return next(new ApiError(422, error.message));
        }
        return next(new ApiError(500, `Lỗi khi cập nhật sản phẩm với id ${req.params.id}`));
    }
}

export async function deleteOne(req, res, next) {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return next(new ApiError(400, "Định dạng ID sản phẩm không hợp lệ"));
    }
    try {
        const document = await bookService.delete(req.params.id);
        if (!document) {
            return next(new ApiError(404, "Không tìm thấy sản phẩm"));
        }
        return res.json({ message: "Xóa sản phẩm thành công" });
    } catch (error) {
        console.error("Product Delete Error:", error);
        return next(new ApiError(500, `Không thể xóa sản phẩm với id ${req.params.id}`));
    }
}

export async function deleteAll(req, res, next) {
    try {
        const deleteCount = await bookService.deleteAll();
        return res.json({
            message: `Đã xóa thành công ${deleteCount} sản phẩm`
        });
    } catch (error) {
        console.error("Product DeleteAll Error:", error);
        return next(new ApiError(500, "Đã xảy ra lỗi khi xóa tất cả sản phẩm"));
    }
}

export async function uploadImage(req, res, next) {
    if (!req.file) {
        return next(new ApiError(400, "Vui lòng chọn một file ảnh"));
    }
    
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return next(new ApiError(400, "Định dạng ID sản phẩm không hợp lệ"));
    }

    try {
        const imageUrl = `/images/products/${req.file.filename}`;
        
        // Update product in DB
        const document = await bookService.update(req.params.id, { 
            image: imageUrl,
            imageSource: 'admin_upload',
            imageVerified: true
        });

        if (!document) {
            return next(new ApiError(404, "Không tìm thấy sản phẩm"));
        }

        return res.json({ 
            message: "Tải ảnh lên thành công", 
            imageUrl,
            document 
        });
    } catch (error) {
        console.error("Product Image Upload Error:", error);
        return next(new ApiError(500, `Lỗi khi lưu ảnh cho sản phẩm ${req.params.id}`));
    }
}

export default {
    create, findAll, findOne, update, deleteOne, deleteAll, uploadImage
};
