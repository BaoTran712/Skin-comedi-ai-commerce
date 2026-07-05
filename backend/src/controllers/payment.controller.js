import crypto from "crypto";
import dotenv from "dotenv";
import OrderService from "../services/order.service.js";

dotenv.config();
const orderService = new OrderService();

function sortObject(obj) {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            str.push(encodeURIComponent(key));
        }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
}

function formatDate(date) {
    const pad = (n) => (n < 10 ? '0' + n : n);
    return date.getFullYear().toString() +
           pad(date.getMonth() + 1) +
           pad(date.getDate()) +
           pad(date.getHours()) +
           pad(date.getMinutes()) +
           pad(date.getSeconds());
}

export async function createVnpayUrl(req, res, next) {
    try {
        const ipAddr = req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.connection.socket.remoteAddress;

        const tmnCode = process.env.VNP_TMN_CODE;
        const secretKey = process.env.VNP_HASH_SECRET;
        let vnpUrl = process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
        const returnUrl = process.env.VNP_RETURN_URL || 'http://localhost:3000/api/payment/vnpay-return';

        const { amount, order_id } = req.body;

        if (!amount || !order_id) {
            return res.status(400).json({ message: "Amount and Order ID are required" });
        }

        const date = new Date();
        const createDate = formatDate(date);

        let vnp_Params = {};
        vnp_Params['vnp_Version'] = '2.1.0';
        vnp_Params['vnp_Command'] = 'pay';
        vnp_Params['vnp_TmnCode'] = tmnCode;
        vnp_Params['vnp_Locale'] = 'vn';
        vnp_Params['vnp_CurrCode'] = 'VND';
        vnp_Params['vnp_TxnRef'] = order_id;
        vnp_Params['vnp_OrderInfo'] = 'Thanh toan cho ma GD: ' + order_id;
        vnp_Params['vnp_OrderType'] = 'other';
        vnp_Params['vnp_Amount'] = amount * 100;
        vnp_Params['vnp_ReturnUrl'] = returnUrl;
        vnp_Params['vnp_IpAddr'] = ipAddr;
        vnp_Params['vnp_CreateDate'] = createDate;

        vnp_Params = sortObject(vnp_Params);

        const signData = new URLSearchParams(vnp_Params).toString();
        const hmac = crypto.createHmac("sha512", secretKey);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex"); 
        
        vnp_Params['vnp_SecureHash'] = signed;
        
        vnpUrl += '?' + new URLSearchParams(vnp_Params).toString();
        
        return res.status(200).json({ payment_url: vnpUrl });
    } catch (error) {
        console.error("Lỗi tạo URL VNPay:", error);
        return res.status(500).json({ message: "Đã xảy ra lỗi khi tạo URL thanh toán" });
    }
}

export async function vnpayReturn(req, res, next) {
    let vnp_Params = req.query;

    const secureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = sortObject(vnp_Params);

    const secretKey = process.env.VNP_HASH_SECRET;
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3001";
    
    const signData = new URLSearchParams(vnp_Params).toString();
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

    if (secureHash === signed) {
        const orderId = vnp_Params['vnp_TxnRef'];
        const rspCode = vnp_Params['vnp_ResponseCode'];
        
        if (rspCode === '00') {
            // Thanh toán thành công, cập nhật trạng thái đơn hàng
            try {
                await orderService.update(orderId, { payment_status: 'paid' });
                return res.redirect(`${frontendUrl}/payment/result?success=true&order_id=${orderId}`);
            } catch (error) {
                console.error("Lỗi cập nhật đơn hàng:", error);
                return res.redirect(`${frontendUrl}/payment/result?success=false&error=update_failed`);
            }
        } else {
            // Thanh toán thất bại
            return res.redirect(`${frontendUrl}/payment/result?success=false&order_id=${orderId}`);
        }
    } else {
        return res.redirect(`${frontendUrl}/payment/result?success=false&error=invalid_signature`);
    }
}

export default { createVnpayUrl, vnpayReturn };
