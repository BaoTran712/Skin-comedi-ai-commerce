import * as yup from "yup";

export const productSchema = yup.object({
    title: yup.string().required("Vui lòng nhập tên sản phẩm").min(3, "Vui lòng nhập ít nhất 3 ký tự").max(100, "Tên sản phẩm tối đa 100 ký tự"),
    usage: yup.string().required("Vui lòng nhập công dụng").min(3, "Vui lòng nhập ít nhất 3 ký tự").max(200, "Công dụng tối đa 200 ký tự"),
    quantity: yup.number().typeError("Số lượng phải là một chữ số").required("Vui lòng nhập số lượng").min(0, "Số lượng tồn kho tối thiểu là 0").max(1000000, "Số lượng tối đa là 1.000.000"),
    brand_id: yup.string().required("Vui lòng chọn thương hiệu"),
    price: yup.number().typeError("Đơn giá phải là một chữ số").required("Vui lòng nhập đơn giá").min(0, "Đơn giá tối thiểu là 0đ").max(100000000, "Đơn giá không hợp lệ"),
    expiry_date: yup.string().required("Vui lòng nhập hạn sử dụng").min(3, "Hạn sử dụng không hợp lệ"),
    skin_type: yup.string().nullable(),
    pathology: yup.string().nullable(),
    image: yup.string().nullable().transform((v, o) => (o === '' || o === null || o === undefined) ? null : v).url("Vui lòng nhập URL hình ảnh hợp lệ"),
    flash_sale_price: yup.number().nullable().transform((v, o) => (o === '' || o === null || o === undefined) ? null : v).min(0, "Giá flash sale không hợp lệ"),
    flash_sale_end_time: yup.date().nullable().transform((v, o) => (o === '' || o === null || o === undefined) ? null : v)
});

