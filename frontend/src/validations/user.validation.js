import * as yup from "yup";

const birthdayValidate = new Date();
birthdayValidate.setFullYear(birthdayValidate.getFullYear() - 7);

export const userSchema = yup.object({
    first_name: yup.string().required("Vui lòng nhập tên").min(2, "Vui lòng nhập ít nhất 2 ký tự").max(30, "Tên người dùng tối đa 30 ký tự"),
    last_name: yup.string().required("Vui lòng nhập họ lót").min(2, "Vui lòng nhập ít nhất 2 ký tự").max(30, "Họ lót người dùng tối đa 30 ký tự"),
    username: yup.string().required("Vui lòng nhập email").email("Email không hợp lệ").max(50, "Email tối đa 50 ký tự"),
    password: yup.string()
        .required("Vui lòng nhập mật khẩu")
        .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
        .max(32, "Mật khẩu tối đa 32 ký tự")
        .matches(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/,
            "Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt (@, #, $, !, %, *...)"
        ),
    confirm_password: yup.string().required("Vui lòng xác nhận mật khẩu").oneOf([yup.ref('password'), null], 'Mật khẩu xác nhận không khớp'),
    birthday: yup.date().max(birthdayValidate, "Người dùng phải ít nhất từ 7 tuổi trở lên")
        .required("Vui lòng chọn ngày sinh").typeError("Vui lòng chọn ngày sinh"),
    gender: yup.boolean().required("Vui lòng chọn giới tính"),
    phone: yup.string().required("Vui lòng nhập số điện thoại").matches(/^(09|03|07|08|05)/, "Đầu số điện thoại phải bắt đầu bằng 09, 03, 07, 08, 05.")
        .min(10, "Số điện thoại phải có 10 chữ số").max(10, "Số điện thoại phải có 10 chữ số"),
});
