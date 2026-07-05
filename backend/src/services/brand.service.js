import Brand from "../models/brand.model.js";

class BrandService {
    async create(payload) {
        const brand = new Brand({
            name: payload.name,
            address: payload.address
        });
        return await brand.save();
    }

    async find(filter) {
        return await Brand.find(filter);
    }

    async findByName(name) {
        return await Brand.find({
            name: { $regex: new RegExp(name, "i") },
        });
    }

    async findById(id) {
        return await Brand.findById(id);
    }

    async update(id, payload) {
        Object.keys(payload).forEach(key => {
            if (payload[key] === undefined || payload[key] === "" || payload[key] === null) {
                delete payload[key];
            }
        });

        const result = await Brand.findByIdAndUpdate(
            id, { $set: payload }, { new: true, runValidators: true }
        );
        return result;
    }

    async delete(id) {
        const result = await Brand.findByIdAndDelete(id);
        return result;
    }

    async deleteAll() {
        const result = await Brand.deleteMany({});
        return result.deletedCount;
    }
}

export default BrandService;
