import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import jimp from 'jimp';
import * as ort from 'onnxruntime-node';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Đường dẫn tuyệt đối tới file best.onnx
const modelPath = path.resolve(__dirname, '../../../best.onnx');

async function processImage(imageBuffer, width = 224, height = 224) {
    const image = await jimp.read(imageBuffer);
    image.resize(width, height);

    const imageBufferData = image.bitmap.data;
    const float32Data = new Float32Array(3 * width * height);

    for (let i = 0; i < width * height; i++) {
        // Chuẩn hóa màu sắc (0-1)
        float32Data[i] = imageBufferData[i * 4] / 255.0; // R
        float32Data[width * height + i] = imageBufferData[i * 4 + 1] / 255.0; // G
        float32Data[2 * width * height + i] = imageBufferData[i * 4 + 2] / 255.0; // B
    }

    return new ort.Tensor('float32', float32Data, [1, 3, height, width]);
}

export const predictSkinDisease = async (imageBuffer) => {
    try {
        if (!fs.existsSync(modelPath)) {
            throw new Error(`Không tìm thấy file model ONNX tại: ${modelPath}`);
        }

        const session = await ort.InferenceSession.create(modelPath);
        
        // Tùy theo input model bạn train là 224 hay 640. Nếu bạn dùng YOLOv8 classify, hãy đổi thành 640
        const tensor = await processImage(imageBuffer, 224, 224);
        
        const inputName = session.inputNames[0];
        const feeds = {};
        feeds[inputName] = tensor;

        const results = await session.run(feeds);
        const outputName = session.outputNames[0];
        const outputData = results[outputName].data;

        return {
            success: true,
            data: Array.from(outputData), // Chuyển từ Float32Array sang mảng thường để trả JSON
        };

    } catch (error) {
        console.error("AI Service Error:", error);
        throw new Error("Lỗi khi chạy model ONNX: " + error.message);
    }
};
