import express from 'express';
import { getAddresses, addAddress, updateAddress, deleteAddress } from '../controllers/address.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect); // all routes require authentication

router.get('/', getAddresses);
router.post('/', addAddress);
router.put('/:id', updateAddress);
router.delete('/:id', deleteAddress);

export default router;
