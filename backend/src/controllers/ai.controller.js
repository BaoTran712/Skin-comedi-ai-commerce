import { predictSkinDisease } from '../services/ai.service.js';

const predict = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Vui lòng upload một file ảnh (tên field là "image").' });
        }

        const imageBuffer = req.file.buffer;
        const result = await predictSkinDisease(imageBuffer);

        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export default {
    predict
};
