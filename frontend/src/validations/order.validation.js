import * as yup from "yup";

export const orderSchema = yup.object({
    shipping_address: yup.string().required("Vui lòng nhập địa chỉ giao hàng").min(5, "Địa chỉ quá ngắn"),
    phone_number: yup.string().required("Vui lòng nhập số điện thoại").matches(/^[0-9]{10}$/, "Số điện thoại không hợp lệ (10 chữ số)"),
});
