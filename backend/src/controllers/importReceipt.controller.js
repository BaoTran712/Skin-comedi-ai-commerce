import ImportReceipt from "../models/import_receipt.model.js";
import ImportReceiptDetail from "../models/import_receipt_detail.model.js";
import Product from "../models/product.model.js";

const createImportReceipt = async (req, res) => {
    try {
        const { staff_id, supplier_id, note, items } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ error: "Đơn nhập hàng phải có ít nhất một sản phẩm!" });
        }

        // Calculate total amount
        let total_amount = 0;
        for (const item of items) {
            total_amount += item.quantity * item.import_price;
        }

        // Create main import receipt
        const receipt = new ImportReceipt({
            staff_id,
            supplier_id,
            total_amount,
            note
        });
        await receipt.save();

        // Create details and update product inventory quantity
        for (const item of items) {
            const detail = new ImportReceiptDetail({
                import_receipt_id: receipt._id,
                product_id: item.product_id,
                quantity: item.quantity,
                import_price: item.import_price
            });
            await detail.save();

            // Increment product quantity in database
            await Product.findByIdAndUpdate(item.product_id, {
                $inc: { quantity: item.quantity }
            });
        }

        res.status(201).json(receipt);
    } catch (error) {
        console.error("Lỗi tạo đơn nhập kho:", error);
        res.status(500).json({ error: "Lỗi khi tạo đơn nhập kho" });
    }
};

const getImportReceipts = async (req, res) => {
    try {
        const receipts = await ImportReceipt.find()
            .populate("staff_id", "name username")
            .populate("supplier_id", "name")
            .sort({ createdAt: -1 });
        res.status(200).json(receipts);
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi lấy danh sách đơn nhập kho" });
    }
};

const getImportReceiptById = async (req, res) => {
    try {
        const receipt = await ImportReceipt.findById(req.params.id)
            .populate("staff_id", "name username")
            .populate("supplier_id", "name");
        
        if (!receipt) {
            return res.status(404).json({ error: "Không tìm thấy đơn nhập kho" });
        }

        const details = await ImportReceiptDetail.find({ import_receipt_id: receipt._id })
            .populate("product_id", "title image price");

        res.status(200).json({ receipt, details });
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi lấy chi tiết đơn nhập kho" });
    }
};

export default {
    createImportReceipt,
    getImportReceipts,
    getImportReceiptById
};
