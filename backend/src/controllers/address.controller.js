import User from '../models/user.model.js';
import ApiError from '../api-error.js';

// Get all addresses for the logged-in user
export async function getAddresses(req, res, next) {
  try {
    const user = await User.findById(req.userId).select('addresses');
    if (!user) return next(new ApiError(404, 'User not found'));
    return res.json(user.addresses);
  } catch (error) {
    console.error(error);
    return next(new ApiError(500, 'Error retrieving addresses'));
  }
}

// Add a new address
export async function addAddress(req, res, next) {
  const { label, recipientName, provinceCode, provinceName, districtCode, districtName, wardCode, wardName, addressDetail, phone, isDefault } = req.body;
  if (!provinceCode || !districtCode || !wardCode || !addressDetail || !phone) {
    return next(new ApiError(400, 'Province, District, Ward, Address Detail and phone are required'));
  }
  try {
    const user = await User.findById(req.userId);
    if (!user) return next(new ApiError(404, 'User not found'));
    
    const isFirst = user.addresses.length === 0;
    const setDef = isDefault || isFirst;

    if (setDef) {
      user.addresses.forEach(a => (a.isDefault = false));
    }
    user.addresses.push({ label, recipientName, provinceCode, provinceName, districtCode, districtName, wardCode, wardName, addressDetail, phone, isDefault: !!setDef });
    await user.save();
    return res.status(201).json(user.addresses);
  } catch (error) {
    console.error(error);
    return next(new ApiError(500, 'Error adding address'));
  }
}

// Update an address by its subdocument _id
export async function updateAddress(req, res, next) {
  const { id } = req.params;
  const { label, recipientName, provinceCode, provinceName, districtCode, districtName, wardCode, wardName, addressDetail, phone, isDefault } = req.body;
  try {
    const user = await User.findById(req.userId);
    if (!user) return next(new ApiError(404, 'User not found'));
    const addr = user.addresses.id(id);
    if (!addr) return next(new ApiError(404, 'Address not found'));
    if (label !== undefined) addr.label = label;
    if (recipientName !== undefined) addr.recipientName = recipientName;
    if (provinceCode !== undefined) addr.provinceCode = provinceCode;
    if (provinceName !== undefined) addr.provinceName = provinceName;
    if (districtCode !== undefined) addr.districtCode = districtCode;
    if (districtName !== undefined) addr.districtName = districtName;
    if (wardCode !== undefined) addr.wardCode = wardCode;
    if (wardName !== undefined) addr.wardName = wardName;
    if (addressDetail !== undefined) addr.addressDetail = addressDetail;
    if (phone !== undefined) addr.phone = phone;
    if (isDefault !== undefined) {
      if (isDefault) user.addresses.forEach(a => (a.isDefault = false));
      addr.isDefault = isDefault;
    }
    await user.save();
    return res.json(user.addresses);
  } catch (error) {
    console.error(error);
    return next(new ApiError(500, 'Error updating address'));
  }
}

// Set default address
export async function setDefaultAddress(req, res, next) {
  const { id } = req.params;
  try {
    const user = await User.findById(req.userId);
    if (!user) return next(new ApiError(404, 'User not found'));
    user.addresses.forEach(a => {
      a.isDefault = (a._id.toString() === id);
    });
    await user.save();
    return res.json(user.addresses);
  } catch (error) {
    console.error(error);
    return next(new ApiError(500, 'Error setting default address'));
  }
}

// Delete an address by its subdocument _id
export async function deleteAddress(req, res, next) {
  const { id } = req.params;
  try {
    const user = await User.findById(req.userId);
    if (!user) return next(new ApiError(404, 'User not found'));
    user.addresses = user.addresses.filter(a => a._id.toString() !== id);
    if (user.addresses.length > 0 && !user.addresses.some(a => a.isDefault)) {
      user.addresses[0].isDefault = true;
    }
    await user.save();
    return res.json({ message: 'Address deleted', addresses: user.addresses });
  } catch (error) {
    console.error(error);
    return next(new ApiError(500, 'Error deleting address'));
  }
}

export default { getAddresses, addAddress, updateAddress, setDefaultAddress, deleteAddress };
