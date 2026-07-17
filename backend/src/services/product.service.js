import Product from "../models/product.model.js";

class ProductService {
    async create(payload) {
        try {
            const bookData = {
                title: payload.title,
                price: payload.price,
                quantity: payload.quantity,
                expiry_date: payload.expiry_date,
                brand_id: payload.brand_id,
                usage: payload.usage,
                flash_sale_price: payload.flash_sale_price || null,
                flash_sale_end_time: payload.flash_sale_end_time || null,
                has_variants: payload.has_variants || false,
                prescription_required: payload.prescription_required || false,
                origin_country: payload.origin_country || "Việt Nam",
                contraindications: payload.contraindications || "",
                side_effects: payload.side_effects || "",
                warnings: payload.warnings || "",
                pregnancy_warning: payload.pregnancy_warning || "",
                children_warning: payload.children_warning || "",
                batch_number: payload.batch_number || "BCH-001",
                skin_type: payload.skin_type || [],
                pathology: payload.pathology || [],
                image: payload.image || "",
                images: payload.images || [],
            };
            Object.keys(bookData).forEach(key => {
                if (bookData[key] === undefined) {
                    delete bookData[key];
                }
            });
            const product = new Product(bookData);
            return await product.save();
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async find(filter) {
        return await Product.find(filter).populate("brand_id");
    }

    async findById(id) {
        return await Product.findOne({ _id: id }).populate("brand_id");
    }

    async findByName(name) {
        return await Product.find({
            title: { $regex: name, $options: "i" }
        }).populate("brand_id");
    }

    async update(id, payload) {
        Object.keys(payload).forEach(key => {
            if (payload[key] === undefined || payload[key] === "") {
                delete payload[key];
            }
        });

        const result = await Product.findByIdAndUpdate(
            id, { $set: payload }, { new: true, runValidators: true }
        );
        return result;
    }

    async delete(id) {
        const result = await Product.findByIdAndDelete(id);
        return result;
    }

    async deleteAll() {
        const result = await Product.deleteMany({});
        return result.deletedCount;
    }

    async getRecommendationsByTraits(skinType, pathology) {
        try {
            return await Product.find({
                $or: [
                    { skin_type: { $in: [skinType] } },
                    { pathology: { $in: [pathology] } }
                ]
            }).limit(4).populate("brand_id");
        } catch (error) {
            console.error("Error fetching recommendations:", error);
            throw error;
        }
    }
}

export default ProductService;
