import crypto from "crypto";
import dotenv from "dotenv";
import OrderService from "../services/order.service.js";
import Payment from "../models/payment.model.js";
import Order from "../models/order.model.js";
import NotificationService from "../services/notification.service.js";
import { creditPointsForOrder } from "../services/points.service.js";

dotenv.config();
const orderService = new OrderService();

// Sort object alphabetically by keys (single encode keys and values as required by VNPAY 2.1.0)
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
        let ipAddr = req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.connection.socket.remoteAddress ||
            '127.0.0.1';

        if (ipAddr === '::1' || ipAddr === '::ffff:127.0.0.1') {
            ipAddr = '127.0.0.1';
        }

        const tmnCode = process.env.VNP_TMN_CODE;
        const secretKey = process.env.VNP_HASH_SECRET;
        let vnpUrl = process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
        const returnUrl = process.env.VNP_RETURN_URL || 'http://localhost:3000/api/payment/vnpay-return';

        const { amount, order_id, bank_code, bankCode } = req.body;

        if (!amount || !order_id) {
            return res.status(400).json({ message: "Vui lòng cung cấp số tiền và mã đơn hàng" });
        }

        const date = new Date();
        const createDate = formatDate(date);

        let vnp_Params = {};
        vnp_Params['vnp_Version'] = '2.1.0';
        vnp_Params['vnp_Command'] = 'pay';
        vnp_Params['vnp_TmnCode'] = tmnCode;
        vnp_Params['vnp_Locale'] = 'vn';
        vnp_Params['vnp_CurrCode'] = 'VND';
        vnp_Params['vnp_TxnRef'] = String(order_id);
        vnp_Params['vnp_OrderInfo'] = 'Thanh toan don hang ' + order_id;
        vnp_Params['vnp_OrderType'] = 'other';
        vnp_Params['vnp_Amount'] = Math.round(Number(amount) * 100);
        vnp_Params['vnp_ReturnUrl'] = returnUrl;

        const selectedBankCode = bank_code || bankCode;
        if (selectedBankCode) {
            vnp_Params['vnp_BankCode'] = selectedBankCode;
        }
        vnp_Params['vnp_IpAddr'] = ipAddr;
        vnp_Params['vnp_CreateDate'] = createDate;

        const sorted = sortObject(vnp_Params);

        // Build raw querystring for HMAC signature calculation (single encoded)
        let signData = "";
        let queryStr = "";
        const keys = Object.keys(sorted);
        for (let i = 0; i < keys.length; i++) {
            const k = keys[i];
            const v = sorted[k];
            if (i > 0) {
                signData += "&";
                queryStr += "&";
            }
            signData += `${k}=${v}`;
            queryStr += `${k}=${v}`;
        }

        const hmac = crypto.createHmac("sha512", secretKey);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

        queryStr += `&vnp_SecureHash=${signed}`;
        const finalPaymentUrl = `${vnpUrl}?${queryStr}`;

        // Safe debug log (Section 4 requirement - NEVER log secretKey)
        console.log("\n[VNPAY DEBUG]");
        console.log(`- orderId: ${order_id}`);
        console.log(`- amount: ${amount} (vnp_Amount: ${vnp_Params['vnp_Amount']})`);
        console.log(`- tmnCode: ${tmnCode}`);
        console.log(`- returnUrl: ${returnUrl}`);
        console.log(`- environment: ${vnpUrl.includes('sandbox') ? 'VNPAY Sandbox' : 'VNPAY Production'}`);
        console.log(`- paymentUrl: ${finalPaymentUrl}\n`);

        return res.status(200).json({ payment_url: finalPaymentUrl });
    } catch (error) {
        console.error("Lỗi tạo URL VNPAY:", error);
        return res.status(500).json({ message: "Đã xảy ra lỗi khi tạo URL thanh toán" });
    }
}

export async function vnpayReturn(req, res, next) {
    try {
        let vnp_Params = { ...req.query };
        const secureHash = vnp_Params['vnp_SecureHash'];

        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        const sorted = sortObject(vnp_Params);

        let signData = "";
        const keys = Object.keys(sorted);
        for (let i = 0; i < keys.length; i++) {
            if (i > 0) signData += "&";
            signData += `${keys[i]}=${sorted[keys[i]]}`;
        }

        const secretKey = process.env.VNP_HASH_SECRET;
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3001";
        
        const hmac = crypto.createHmac("sha512", secretKey);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

        if (secureHash === signed) {
            const orderId = vnp_Params['vnp_TxnRef'];
            const rspCode = vnp_Params['vnp_ResponseCode'];
            
            if (rspCode === '00') {
                // Payment success: update order payment_status to 'paid' and status to 'confirmed'
                try {
                    if (orderId && orderId.includes('_')) {
                        const ids = orderId.split('_');
                        for (const id of ids) {
                            await orderService.update(id, { payment_status: 'paid', status: 'confirmed' });
                            await creditPointsForOrder(id);
                        }
                    } else {
                        await orderService.update(orderId, { payment_status: 'paid', status: 'confirmed' });
                        await creditPointsForOrder(orderId);
                    }
                    return res.redirect(`${frontendUrl}/payment/result?success=true&order_id=${orderId}`);
                } catch (error) {
                    console.error("Lỗi cập nhật trạng thái đơn hàng khi VNPAY return:", error);
                    return res.redirect(`${frontendUrl}/payment/result?success=false&error=update_failed`);
                }
            } else {
                // Payment cancelled or failed
                return res.redirect(`${frontendUrl}/payment/result?success=false&order_id=${orderId}`);
            }
        } else {
            console.error("VNPAY Return Signature Mismatch!");
            return res.redirect(`${frontendUrl}/payment/result?success=false&error=invalid_signature`);
        }
    } catch (error) {
        console.error("Lỗi xử lý VNPAY Return:", error);
        return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:3001"}/payment/result?success=false&error=server_error`);
    }
}

export async function vnpayIpn(req, res, next) {
    try {
        let vnp_Params = { ...req.query };
        const secureHash = vnp_Params['vnp_SecureHash'];

        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        const sorted = sortObject(vnp_Params);

        let signData = "";
        const keys = Object.keys(sorted);
        for (let i = 0; i < keys.length; i++) {
            if (i > 0) signData += "&";
            signData += `${keys[i]}=${sorted[keys[i]]}`;
        }

        const secretKey = process.env.VNP_HASH_SECRET;
        const hmac = crypto.createHmac("sha512", secretKey);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

        if (secureHash === signed) {
            const orderId = vnp_Params['vnp_TxnRef'];
            const rspCode = vnp_Params['vnp_ResponseCode'];
            
            const order = await orderService.findById(orderId);
            if (!order) {
                return res.status(200).json({ RspCode: '01', Message: 'Order not found' });
            }

            const vnpAmount = Number(vnp_Params['vnp_Amount']) / 100;
            if (Math.abs(order.total_amount - vnpAmount) > 1) {
                return res.status(200).json({ RspCode: '04', Message: 'Invalid amount' });
            }

            if (order.payment_status === 'paid') {
                return res.status(200).json({ RspCode: '02', Message: 'Order already confirmed' });
            }

            if (rspCode === '00') {
                await orderService.update(orderId, { payment_status: 'paid', status: 'confirmed' });
                return res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
            } else {
                await orderService.update(orderId, { payment_status: 'unpaid' });
                return res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
            }
        } else {
            return res.status(200).json({ RspCode: '97', Message: 'Invalid Checksum' });
        }
    } catch (error) {
        console.error("VNPAY IPN Error:", error);
        return res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
    }
}

/**
 * POST /api/payment/bank-transfer-request
 * Customer clicks "I have transferred". Sets payment to VERIFYING.
 * Does NOT set PAID – admin must confirm separately.
 */
export async function bankTransferRequest(req, res, next) {
    try {
        const { order_id } = req.body;
        if (!order_id) {
            return res.status(400).json({ message: "Thiếu mã đơn hàng" });
        }

        // Find payment for this order
        const payment = await Payment.findOne({ order_id });
        if (!payment) {
            return res.status(404).json({ message: "Không tìm thấy thông tin thanh toán" });
        }

        // Only allow if currently unpaid
        if (payment.payment_status === 'paid') {
            return res.status(400).json({ message: "Đơn hàng này đã được thanh toán" });
        }
        if (payment.payment_status === 'verifying') {
            return res.status(200).json({ 
                message: "Yêu cầu xác nhận đã được ghi nhận trước đó. Hệ thống đang kiểm tra.",
                payment_status: "verifying"
            });
        }

        // Update to verifying
        await Payment.findOneAndUpdate(
            { order_id },
            { 
                $set: { 
                    payment_status: "verifying",
                    customer_confirmed_at: new Date()
                } 
            }
        );

        // Notify user
        try {
            const order = await Order.findById(order_id);
            if (order) {
                const notificationService = new NotificationService();
                await notificationService.create({
                    user_id: order.user_id,
                    title: "Yêu cầu xác nhận thanh toán",
                    message: `Đã ghi nhận yêu cầu xác nhận chuyển khoản cho đơn hàng #${order.order_code || order_id}. Hệ thống đang kiểm tra.`,
                    type: "order"
                });
            }
        } catch (err) {
            console.error("Failed to create notification:", err);
        }

        return res.status(200).json({ 
            message: "Đã ghi nhận yêu cầu. Hệ thống đang kiểm tra giao dịch của bạn. Vui lòng chờ xác nhận.",
            payment_status: "verifying"
        });
    } catch (error) {
        console.error("BankTransferRequest Error:", error);
        return res.status(500).json({ message: "Đã xảy ra lỗi" });
    }
}

/**
 * GET /api/payment/status/:orderId
 * Poll payment status for a given order. Used by frontend QR page.
 */
export async function getPaymentStatus(req, res, next) {
    try {
        const { orderId } = req.params;
        const payment = await Payment.findOne({ order_id: orderId });
        if (!payment) {
            return res.status(404).json({ message: "Không tìm thấy thông tin thanh toán" });
        }
        const order = await Order.findById(orderId).select('order_code status total_amount payment_method');
        return res.status(200).json({
            payment_status: payment.payment_status,
            payment_method: payment.payment_method,
            amount: payment.amount,
            customer_confirmed_at: payment.customer_confirmed_at,
            order_code: order?.order_code,
            order_status: order?.status,
        });
    } catch (error) {
        console.error("GetPaymentStatus Error:", error);
        return res.status(500).json({ message: "Đã xảy ra lỗi" });
    }
}

/**
 * POST /api/payment/admin-confirm/:orderId
 * Admin manually confirms bank transfer payment.
 * Sets payment_status = paid and order status = confirmed.
 * STAFF/ADMIN only — enforced in route via auth middleware.
 */
export async function adminConfirmPayment(req, res, next) {
    try {
        const { orderId } = req.params;
        const { transaction_id, note } = req.body;

        const payment = await Payment.findOne({ order_id: orderId });
        if (!payment) {
            return res.status(404).json({ message: "Không tìm thấy thông tin thanh toán" });
        }
        if (payment.payment_status === 'paid') {
            return res.status(400).json({ message: "Đơn hàng đã được xác nhận thanh toán trước đó" });
        }

        // Update payment to paid
        await Payment.findOneAndUpdate(
            { order_id: orderId },
            { 
                $set: { 
                    payment_status: "paid",
                    transaction_id: transaction_id || payment.transaction_id,
                    payment_note: note || "Admin xác nhận thủ công"
                } 
            }
        );

        // Trigger the order service update which handles notification + email
        await orderService.update(orderId, { payment_status: "paid" });
        await creditPointsForOrder(orderId);

        return res.status(200).json({ message: "Xác nhận thanh toán thành công. Đơn hàng đã được cập nhật." });
    } catch (error) {
        console.error("AdminConfirmPayment Error:", error);
        return res.status(500).json({ message: "Đã xảy ra lỗi khi xác nhận thanh toán" });
    }
}

// ── MOMO SANDBOX INTEGRATION ─────────────────────────────────

/**
 * POST /api/payment/momo-create
 * Create MoMo Test Payment URL
 */
export async function createMomoUrl(req, res, next) {
    try {
        const { order_id } = req.body;
        if (!order_id) {
            return res.status(400).json({ message: "Vui lòng cung cấp mã đơn hàng (order_id)" });
        }

        // Environment variables check
        const partnerCode = process.env.MOMO_PARTNER_CODE;
        const accessKey = process.env.MOMO_ACCESS_KEY;
        const secretKey = process.env.MOMO_SECRET_KEY;
        const redirectUrl = process.env.MOMO_REDIRECT_URL || `${req.protocol}://${req.get('host')}/api/payment/momo-return`;
        const ipnUrl = process.env.MOMO_IPN_URL || `${req.protocol}://${req.get('host')}/api/payment/momo-ipn`;

        if (!partnerCode || !accessKey || !secretKey) {
            return res.status(400).json({ 
                message: "Chưa cấu hình thông tin kết nối MoMo Sandbox (MOMO_PARTNER_CODE, MOMO_ACCESS_KEY, MOMO_SECRET_KEY) trong .env" 
            });
        }

        // Fetch Order directly from Database (Do NOT trust amount from frontend)
        const order = await orderService.findById(order_id);
        if (!order) {
            return res.status(404).json({ message: "Đơn hàng không tồn tại" });
        }

        // Ownership check
        const userId = req.user?.id || req.userId;
        const isOwner = order.user_id && (
            (order.user_id._id && order.user_id._id.toString() === userId.toString()) ||
            (order.user_id.toString() === userId.toString())
        );
        const isStaffOrAdmin = req.user?.role === 'STAFF' || req.user?.role === 'ADMIN';
        if (!isOwner && !isStaffOrAdmin) {
            return res.status(403).json({ message: "Bạn không có quyền thanh toán đơn hàng này" });
        }

        if (order.payment_status === 'paid') {
            return res.status(400).json({ message: "Đơn hàng này đã được thanh toán trước đó" });
        }

        const amount = Math.round(Number(order.total_amount));
        const requestId = `${order_id}_${Date.now()}`;
        const momoOrderId = `${order_id}_${Date.now()}`;
        const orderInfo = `Thanh toan don hang ${order.order_code || order_id}`;
        const requestType = "captureWallet";
        const extraData = ""; // optional base64 encoded data

        // MoMo V2 Signature String
        const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${momoOrderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
        const signature = crypto.createHmac("sha256", secretKey).update(rawSignature).digest("hex");

        const requestBody = JSON.stringify({
            partnerCode,
            partnerName: "TestSkin",
            storeId: "TestSkinStore",
            requestId,
            amount,
            orderId: momoOrderId,
            orderInfo,
            redirectUrl,
            ipnUrl,
            lang: "vi",
            requestType,
            autoCapture: true,
            extraData,
            orderGroupId: "",
            signature
        });

        // Call MoMo TEST API Gateway
        const momoEndpoint = "https://test-payment.momo.vn/v2/gateway/api/create";
        const momoResponse = await fetch(momoEndpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(requestBody)
            },
            body: requestBody
        });

        const momoResult = await momoResponse.json();

        if (momoResult.resultCode === 0 && momoResult.payUrl) {
            // Upsert payment record
            await Payment.findOneAndUpdate(
                { order_id },
                {
                    $set: {
                        user_id: order.user_id._id || order.user_id,
                        payment_method: "MOMO",
                        payment_status: "unpaid",
                        amount: order.total_amount,
                        transaction_id: requestId,
                        payment_note: `MoMo URL generated: ${momoResult.payUrl}`
                    }
                },
                { upsert: true, new: true }
            );

            console.log(`[MoMo CREATE SUCCESS] order_id=${order_id}, payUrl=${momoResult.payUrl}`);
            return res.status(200).json({ payUrl: momoResult.payUrl, payment_url: momoResult.payUrl });
        } else {
            console.error("[MoMo CREATE FAILED]", momoResult);
            return res.status(400).json({ 
                message: momoResult.message || "Tạo thanh toán MoMo thất bại",
                resultCode: momoResult.resultCode
            });
        }
    } catch (error) {
        console.error("Lỗi tạo URL MoMo:", error);
        return res.status(500).json({ message: "Đã xảy ra lỗi khi kết nối cổng thanh toán MoMo" });
    }
}

/**
 * GET/POST /api/payment/momo-return
 * Trình duyệt redirect từ MoMo về TestSkin
 */
export async function momoReturn(req, res, next) {
    try {
        const params = { ...req.query, ...req.body };
        const secretKey = process.env.MOMO_SECRET_KEY;
        const accessKey = process.env.MOMO_ACCESS_KEY;
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3001";

        const {
            partnerCode,
            orderId: rawOrderId,
            requestId,
            amount,
            orderInfo,
            orderType,
            transId,
            resultCode,
            message,
            responseTime,
            extraData,
            signature
        } = params;

        // Parse order_id from rawOrderId (if formatted like id_timestamp)
        const orderId = rawOrderId ? rawOrderId.split('_')[0] : null;

        if (!secretKey) {
            return res.redirect(`${frontendUrl}/payment/result?success=false&error=missing_secret`);
        }

        // Reconstruct raw signature string for verification
        const rawSignature = `accessKey=${accessKey || ''}&amount=${amount || ''}&extraData=${extraData || ''}&message=${message || ''}&orderId=${rawOrderId || ''}&orderInfo=${orderInfo || ''}&orderType=${orderType || ''}&partnerCode=${partnerCode || ''}&requestId=${requestId || ''}&responseTime=${responseTime || ''}&resultCode=${resultCode || ''}&transId=${transId || ''}`;
        const calculatedSignature = crypto.createHmac("sha256", secretKey).update(rawSignature).digest("hex");

        if (signature !== calculatedSignature) {
            console.error("MoMo Return Signature Mismatch!");
            return res.redirect(`${frontendUrl}/payment/result?success=false&error=invalid_signature`);
        }

        if (String(resultCode) === '0') {
            // Payment success
            if (orderId) {
                const order = await orderService.findById(orderId);
                if (order && order.payment_status !== 'paid') {
                    await orderService.update(orderId, { payment_status: 'paid', status: 'confirmed' });
                    await creditPointsForOrder(orderId);

                    await Payment.findOneAndUpdate(
                        { order_id: orderId },
                        {
                            $set: {
                                payment_status: 'paid',
                                momo_trans_id: String(transId),
                                momo_result_code: Number(resultCode),
                                paid_at: new Date(),
                                transaction_id: String(transId || requestId)
                            }
                        }
                    );
                }
            }
            return res.redirect(`${frontendUrl}/payment/result?success=true&order_id=${orderId || rawOrderId}`);
        } else {
            // User cancelled or payment failed
            return res.redirect(`${frontendUrl}/payment/result?success=false&order_id=${orderId || rawOrderId}&error=cancelled`);
        }
    } catch (error) {
        console.error("Lỗi xử lý MoMo Return:", error);
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3001";
        return res.redirect(`${frontendUrl}/payment/result?success=false&error=server_error`);
    }
}

/**
 * POST /api/payment/momo-ipn
 * MoMo Webhook IPN (Server-to-Server)
 */
export async function momoIpn(req, res, next) {
    try {
        const body = req.body || {};
        const secretKey = process.env.MOMO_SECRET_KEY;
        const accessKey = process.env.MOMO_ACCESS_KEY;

        const {
            partnerCode,
            orderId: rawOrderId,
            requestId,
            amount,
            orderInfo,
            orderType,
            transId,
            resultCode,
            message,
            responseTime,
            extraData,
            signature
        } = body;

        const orderId = rawOrderId ? rawOrderId.split('_')[0] : null;

        if (!secretKey) {
            return res.status(200).json({ resultCode: 1001, message: "Missing MoMo Secret Key" });
        }

        // Verify Signature
        const rawSignature = `accessKey=${accessKey || ''}&amount=${amount || ''}&extraData=${extraData || ''}&message=${message || ''}&orderId=${rawOrderId || ''}&orderInfo=${orderInfo || ''}&orderType=${orderType || ''}&partnerCode=${partnerCode || ''}&requestId=${requestId || ''}&responseTime=${responseTime || ''}&resultCode=${resultCode || ''}&transId=${transId || ''}`;
        const calculatedSignature = crypto.createHmac("sha256", secretKey).update(rawSignature).digest("hex");

        if (signature !== calculatedSignature) {
            console.error("[MoMo IPN] Invalid Signature");
            return res.status(200).json({ resultCode: 97, message: "Invalid Checksum" });
        }

        const order = await orderService.findById(orderId);
        if (!order) {
            return res.status(200).json({ resultCode: 1000, message: "Order not found" });
        }

        // Verify Amount
        if (Math.abs(Number(order.total_amount) - Number(amount)) > 1) {
            console.error(`[MoMo IPN] Amount mismatch: Order=${order.total_amount}, MoMo=${amount}`);
            return res.status(200).json({ resultCode: 1004, message: "Amount mismatch" });
        }

        // Idempotency Check: If already paid, return 0 success to MoMo without double processing
        if (order.payment_status === 'paid') {
            return res.status(200).json({ resultCode: 0, message: "Order already confirmed" });
        }

        if (String(resultCode) === '0') {
            // Update order and payment status
            await orderService.update(orderId, { payment_status: 'paid', status: 'confirmed' });
            await creditPointsForOrder(orderId);

            await Payment.findOneAndUpdate(
                { order_id: orderId },
                {
                    $set: {
                        payment_status: 'paid',
                        momo_trans_id: String(transId),
                        momo_result_code: Number(resultCode),
                        paid_at: new Date(),
                        transaction_id: String(transId || requestId)
                    }
                }
            );

            console.log(`[MoMo IPN SUCCESS] Order ${orderId} marked as PAID`);
            return res.status(200).json({ resultCode: 0, message: "Success" });
        } else {
            await orderService.update(orderId, { payment_status: 'unpaid' });
            return res.status(200).json({ resultCode: 0, message: "Payment failed acknowledged" });
        }
    } catch (error) {
        console.error("MoMo IPN Error:", error);
        return res.status(200).json({ resultCode: 99, message: "Unknown error" });
    }
}

export default { createVnpayUrl, vnpayReturn, vnpayIpn, bankTransferRequest, getPaymentStatus, adminConfirmPayment, createMomoUrl, momoReturn, momoIpn };

