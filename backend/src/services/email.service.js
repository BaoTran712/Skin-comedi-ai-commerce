let nodemailer = null;
try {
    const module = await import("nodemailer");
    nodemailer = module.default;
} catch (e) {
    console.warn("Optional package 'nodemailer' is not installed. Email operations will use mock fallback mode.");
}

const getTransporter = () => {
    if (!nodemailer) return null;

    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT || 587;
    const user = process.env.SMTP_USER || process.env.EMAIL_USER;
    const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

    if (host) {
        return nodemailer.createTransport({
            host,
            port: Number(port),
            secure: Number(port) === 465,
            auth: { user, pass }
        });
    }

    if (user && pass) {
        return nodemailer.createTransport({
            service: "gmail",
            auth: { user, pass }
        });
    }

    return null;
};

const transporter = getTransporter();

class EmailService {
    async sendOTPEmail(email, otp, name = "Khách hàng") {
        try {
            const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || process.env.EMAIL_USER || "no-reply@skinmedi.com";
            const fromName = process.env.SMTP_FROM_NAME || "SkinMedi AI";
            const mailOptions = {
                from: `"${fromName}" <${fromEmail}>`,
                to: email,
                subject: "Mã xác thực tài khoản — SkinMedi AI",
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                        <h2 style="color: #0d9488; text-align: center;">Mã Xác Thực OTP</h2>
                        <p>Xin chào <strong>${name}</strong>,</p>
                        <p>Bạn vừa yêu cầu mã xác thực để đăng ký tài khoản tại hệ thống SkinMedi AI.</p>
                        <p>Mã xác thực của bạn là:</p>
                        <div style="text-align: center; margin: 20px 0;">
                            <span style="display: inline-block; padding: 15px 30px; font-size: 24px; font-weight: bold; background-color: #f3f4f6; color: #111; border-radius: 8px; letter-spacing: 5px;">
                                ${otp}
                            </span>
                        </div>
                        <p style="color: #ef4444; font-size: 14px;"><strong>Lưu ý:</strong> Mã này chỉ có hiệu lực trong 5 phút. KHÔNG chia sẻ mã này cho bất kỳ ai.</p>
                        <p>Trân trọng,<br/>Đội ngũ SkinMedi AI.</p>
                    </div>
                `
            };

            if (!transporter) {
                console.log(`[DEV OTP MOCK] Gửi tới ${email} - OTP: ${otp}`);
                return true;
            }
            const info = await transporter.sendMail(mailOptions);
            console.log("OTP Email sent: " + info.response);
            return true;
        } catch (error) {
            console.error("Lỗi gửi OTP Email:", error);
            // Trong môi trường dev nếu chưa cấu hình đúng smtp, ta in log ra màn hình
            console.log(`[DEV OTP MOCK] Gửi tới ${email} - OTP: ${otp}`);
            return false;
        }
    }

    async sendOrderConfirmation(order, user, populatedOrderDetails) {
        try {
            const formattedTotal = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total_amount);
            const mailOptions = {
                from: `"Testskin Store" <${process.env.EMAIL_USER}>`,
                to: user.email,
                subject: `Đặt hàng thành công #${order.order_code}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                        <h2 style="color: #0d9488;">Cảm ơn bạn đã đặt hàng!</h2>
                        <p>Xin chào <strong>${user.first_name} ${user.last_name}</strong>,</p>
                        <p>Đơn hàng <strong>#${order.order_code}</strong> của bạn đã được tiếp nhận và đang chờ xử lý.</p>
                        
                        <h3 style="border-bottom: 1px solid #ddd; padding-bottom: 5px;">Thông tin đơn hàng</h3>
                        <p><strong>Ngày đặt:</strong> ${new Date(order.order_date).toLocaleString('vi-VN')}</p>
                        <p><strong>Phương thức vận chuyển:</strong> ${order.shipping_method === 'express' ? 'Giao hàng nhanh' : 'Giao tiết kiệm'}</p>
                        <p><strong>Phương thức thanh toán:</strong> ${order.payment_method}</p>
                        
                        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                            <thead>
                                <tr style="background-color: #f9fafb; text-align: left;">
                                    <th style="padding: 10px; border: 1px solid #ddd;">Sản phẩm</th>
                                    <th style="padding: 10px; border: 1px solid #ddd;">SL</th>
                                    <th style="padding: 10px; border: 1px solid #ddd;">Giá</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style="padding: 10px; border: 1px solid #ddd;">${populatedOrderDetails.product_name}</td>
                                    <td style="padding: 10px; border: 1px solid #ddd;">${populatedOrderDetails.quantity}</td>
                                    <td style="padding: 10px; border: 1px solid #ddd;">
                                        ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(populatedOrderDetails.price)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        
                        <div style="text-align: right; margin-top: 20px;">
                            <p><strong>Tạm tính:</strong> ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.subtotal)}</p>
                            <p><strong>Phí vận chuyển:</strong> ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.shipping_fee)}</p>
                            <h3 style="color: #0d9488;">Tổng cộng: ${formattedTotal}</h3>
                        </div>
                    </div>
                `
            };
            const info = transporter ? await transporter.sendMail(mailOptions) : null;
            if (info) console.log("Order Confirmation Email sent: " + info.response);
            return true;
        } catch (error) {
            console.error("Lỗi gửi Order Confirmation Email:", error);
            return false;
        }
    }
    async sendPaymentConfirmation(order, user) {
        try {
            const formattedTotal = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total_amount);
            const mailOptions = {
                from: `"Testskin Store" <${process.env.EMAIL_USER}>`,
                to: user.email,
                subject: `Xác nhận thanh toán thành công #${order.order_code}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                        <h2 style="color: #0d9488;">Thanh toán thành công!</h2>
                        <p>Xin chào <strong>${user.first_name} ${user.last_name}</strong>,</p>
                        <p>Chúng tôi đã nhận được thanh toán cho đơn hàng <strong>#${order.order_code}</strong> của bạn.</p>
                        <p><strong>Số tiền đã thanh toán:</strong> <span style="color: #0d9488; font-weight: bold;">${formattedTotal}</span></p>
                        <p>Đơn hàng của bạn đang được chuyển qua bước xử lý tiếp theo.</p>
                        <p>Trân trọng,<br/>Đội ngũ Testskin.</p>
                    </div>
                `,
            };
            const info = transporter ? await transporter.sendMail(mailOptions) : null;
            if (info) console.log("Payment Confirmation Email sent: " + info.response);
            return true;
        } catch (error) {
            console.error("Lỗi gửi Payment Confirmation Email:", error);
            return false;
        }
    }
    async sendWelcomeEmail(email, name = "Khách hàng") {
        try {
            const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || process.env.EMAIL_USER || "no-reply@skinmedi.com";
            const fromName = process.env.SMTP_FROM_NAME || "SkinMedi AI";
            const mailOptions = {
                from: `"${fromName}" <${fromEmail}>`,
                to: email,
                subject: "Chào mừng bạn đến với SkinMedi AI!",
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                        <h2 style="color: #0d9488; text-align: center;">Chào Mừng Thành Viên Mới</h2>
                        <p>Xin chào <strong>${name}</strong>,</p>
                        <p>Chúc mừng bạn đã kích hoạt tài khoản thành công tại <strong>SkinMedi AI</strong>!</p>
                        <p>Kể từ bây giờ, bạn có thể đăng nhập để trải nghiệm đầy đủ các tính năng chăm sóc da chuyên sâu, chẩn đoán da AI tiên tiến, quản lý đơn hàng và tích lũy điểm thưởng SkinMedi Xu.</p>
                        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                        <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ bộ phận hỗ trợ của chúng tôi.</p>
                        <p>Trân trọng,<br/>Đội ngũ SkinMedi AI.</p>
                    </div>
                `
            };
            const info = transporter ? await transporter.sendMail(mailOptions) : null;
            if (info) console.log("Welcome Email sent: " + info.response);
            return true;
        } catch (error) {
            console.error("Lỗi gửi Welcome Email:", error);
            return false;
        }
    }
}

export default new EmailService();
