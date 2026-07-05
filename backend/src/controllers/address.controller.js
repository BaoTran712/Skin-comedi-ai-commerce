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
  const { label, address, phone, isDefault } = req.body;
  if (!address || !phone) {
    return next(new ApiError(400, 'Address and phone are required'));
  }
  try {
    const user = await User.findById(req.userId);
    if (!user) return next(new ApiError(404, 'User not found'));
    // If setting default, unset others
    if (isDefault) {
      user.addresses.forEach(a => (a.isDefault = false));
    }
    user.addresses.push({ label, address, phone, isDefault: !!isDefault });
    await user.save();
    return res.status(201).json(user.addresses);
  } catch (error) {
    console.error(error);
    return next(new ApiError(500, 'Error adding address'));
  }
}

// Update an address by its subdocument _id
export async function updateAddress(req, res, next) {
  const { id } = req.params; // address subdocument id
  const { label, address, phone, isDefault } = req.body;
  try {
    const user = await User.findById(req.userId);
    if (!user) return next(new ApiError(404, 'User not found'));
    const addr = user.addresses.id(id);
    if (!addr) return next(new ApiError(404, 'Address not found'));
    if (label !== undefined) addr.label = label;
    if (address !== undefined) addr.address = address;
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

// Delete an address by its subdocument _id
export async function deleteAddress(req, res, next) {
  const { id } = req.params;
  try {
    const user = await User.findById(req.userId);
    if (!user) return next(new ApiError(404, 'User not found'));
    const addr = user.addresses.id(id);
    if (!addr) return next(new ApiError(404, 'Address not found'));
    addr.remove();
    await user.save();
    return res.json({ message: 'Address deleted', addresses: user.addresses });
  } catch (error) {
    console.error(error);
    return next(new ApiError(500, 'Error deleting address'));
  }
}
