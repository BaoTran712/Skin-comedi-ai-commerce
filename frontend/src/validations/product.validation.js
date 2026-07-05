import * as yup from "yup";

export const productSchema = yup.object({
    title: yup.string().required("Vui lòng nhập tên sản phẩm").min(3, "Vui lòng nhập ít nhất 3 ký tự").max(100, "Tên sản phẩm tối đa 100 ký tự"),
    usage: yup.string().required("Vui lòng nhập công dụng").min(3, "Vui lòng nhập ít nhất 3 ký tự").max(200, "Công dụng tối đa 200 ký tự"),
    quantity: yup.number().required("Vui lòng nhập số lượng").min(1, "Số lượng tối thiểu là 1").max(5000, "Số lượng tối đa là 5000").typeError("Vui lòng nhập số lượng"),
    brand_id: yup.string().required("Vui lòng chọn thương hiệu"),
    price: yup.number().required("Vui lòng nhập đơn giá").min(0, "Đơn giá tối thiểu là 0đ").max(10000000, "Đơn giá tối đa là 10.000.000đ").typeError("Vui lòng nhập đơn giá"),
    expiry_date: yup.string().required("Vui lòng nhập hạn sử dụng").min(3, "Hạn sử dụng không hợp lệ"),
    skin_type: yup.string().nullable(),
    pathology: yup.string().nullable(),
    image: yup.string().url("Vui lòng nhập URL hình ảnh hợp lệ").nullable(),
    flash_sale_price: yup.number().nullable().min(0, "Giá flash sale không hợp lệ").lessThan(yup.ref('price'), "Giá flash sale phải nhỏ hơn giá gốc"),
    flash_sale_end_time: yup.date().nullable().min(new Date(), "Thời gian kết thúc phải ở tương lai")
});
