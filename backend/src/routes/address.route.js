import express from 'express';
import { getAddresses, addAddress, updateAddress, setDefaultAddress, deleteAddress } from '../controllers/address.controller.js';
import auth from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(auth); // all routes require authentication

router.get('/', getAddresses);
router.post('/', addAddress);
router.put('/:id/default', setDefaultAddress);
router.put('/:id', updateAddress);
router.delete('/:id', deleteAddress);

export default router;
