import Supplier from "../models/supplier.model.js";

const createSupplier = async (req, res) => {
    try {
        const supplier = new Supplier(req.body);
        await supplier.save();
        res.status(201).json(supplier);
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi thêm nhà cung cấp" });
    }
};

const getSuppliers = async (req, res) => {
    try {
        const suppliers = await Supplier.find().sort({ createdAt: -1 });
        res.status(200).json(suppliers);
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi lấy danh sách nhà cung cấp" });
    }
};

const getSupplierById = async (req, res) => {
    try {
        const supplier = await Supplier.findById(req.params.id);
        if (!supplier) {
            return res.status(404).json({ error: "Không tìm thấy nhà cung cấp" });
        }
        res.status(200).json(supplier);
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi lấy thông tin nhà cung cấp" });
    }
};

const updateSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!supplier) {
            return res.status(404).json({ error: "Không tìm thấy nhà cung cấp" });
        }
        res.status(200).json(supplier);
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi cập nhật nhà cung cấp" });
    }
};

const deleteSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findByIdAndDelete(req.params.id);
        if (!supplier) {
            return res.status(404).json({ error: "Không tìm thấy nhà cung cấp" });
        }
        res.status(200).json({ message: "Xóa thành công" });
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi xóa nhà cung cấp" });
    }
};

export default {
    createSupplier,
    getSuppliers,
    getSupplierById,
    updateSupplier,
    deleteSupplier
};
