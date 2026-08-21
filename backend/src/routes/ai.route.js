import express from 'express';
import multer from 'multer';
import aiController from '../controllers/ai.controller.js';

const router = express.Router();
// Sử dụng bộ nhớ RAM (Memory Storage) để giữ file ảnh tạm thời, tránh việc lưu ra đĩa rồi lại đọc lên
const upload = multer({ storage: multer.memoryStorage() });

// Route cho API phân tích ảnh
router.post('/predict', upload.single('image'), aiController.predict);

export default router;
