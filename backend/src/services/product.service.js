import Product from "../models/product.model.js";

class ProductService {
    async create(payload) {
        try {
            const bookData = {
                title: payload.title,
                name: payload.name || payload.title,
                slug: payload.slug,
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
                ingredient_tags: payload.ingredient_tags || [],
                skin_type_tags: payload.skin_type_tags || [],
                skin_conditions_supported: payload.skin_conditions_supported || [],
                main_ingredients: payload.main_ingredients || [],
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
            console.log("ProductService create error:", error);
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

        // Get old product details
        const oldProduct = await Product.findById(id);

        const result = await Product.findByIdAndUpdate(
            id, { $set: payload }, { new: true, runValidators: true }
        );

        // Compare and trigger notifications in the background
        if (oldProduct && result) {
            this.checkAndTriggerNotifications(oldProduct, result).catch(err => {
                console.error("Failed to check and trigger product notifications:", err);
            });
        }

        return result;
    }

    async checkAndTriggerNotifications(oldProduct, newProduct) {
        try {
            const Wishlist = (await import('../models/wishlist.model.js')).default;
            const Notification = (await import('../models/notification.model.js')).default;

            const wishlists = await Wishlist.find({ products: newProduct._id });
            const userIds = wishlists.map(w => w.user_id);
            if (userIds.length === 0) return;

            const notifications = [];

            // CASE 1: Price drop
            const oldPrice = oldProduct.flash_sale_price || oldProduct.price;
            const newPrice = newProduct.flash_sale_price || newProduct.price;

            if (newPrice < oldPrice) {
                const formattedOldPrice = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(oldPrice);
                const formattedNewPrice = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(newPrice);
                for (const userId of userIds) {
                    notifications.push({
                        user_id: userId,
                        title: "Sản phẩm yêu thích giảm giá! 🎉",
                        message: `Sản phẩm "${newProduct.title}" trong danh sách yêu thích của bạn vừa giảm giá từ ${formattedOldPrice} xuống ${formattedNewPrice}!`,
                        type: "PRICE_DROP",
                        link: `/product/${newProduct._id}`
                    });
                }
            }

            // CASE 2: Back in stock
            if (oldProduct.quantity === 0 && newProduct.quantity > 0) {
                for (const userId of userIds) {
                    notifications.push({
                        user_id: userId,
                        title: "Sản phẩm yêu thích đã có hàng lại! 📦",
                        message: `Sản phẩm "${newProduct.title}" bạn đang quan tâm đã được bổ sung thêm ${newProduct.quantity} sản phẩm vào kho.`,
                        type: "BACK_IN_STOCK",
                        link: `/product/${newProduct._id}`
                    });
                }
            }

            if (notifications.length > 0) {
                await Notification.insertMany(notifications);
            }
        } catch (err) {
            console.error("Error in checkAndTriggerNotifications:", err);
        }
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
