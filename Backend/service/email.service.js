const transporter = require("../config/email");

const sendMail = async (to, subject, htmlContent) => {
  try {
    const mailOptions = {
      from: `"MotorMate Support" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

const sendInvoiceEmail = async (userEmail) => {
  const subject = `Hóa đơn dịch vụ #123`;
  const html = `
      <h1>Hóa đơn thanh toán</h1>
      <p>Xin chào Huy,</p>
      <p>Cảm ơn bạn đã sử dụng dịch vụ của MotorMate. Dưới đây là chi tiết hóa đơn của bạn:</p>
      <table border="1" cellpadding="10" cellspacing="0">
        <thead>
            <tr>
                <th>Mô tả</th>
                <th>Thành tiền</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Cute</td>
                <td>100.000 VNĐ</td>
            </tr>
        </tbody>
        <tfoot>
            <tr>
                <td><strong>Tổng cộng</strong></td>
                <td><strong>100.000 VNĐ</strong></td>
            </tr>
        </tfoot>
      </table>
    `;
  return await sendMail(userEmail, subject, html);
};

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return "0 VNĐ";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

const formatDate = (date) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Gửi email xác nhận thanh toán thành công cho khách hàng
 */
const sendPaymentConfirmationEmail = async (
  invoiceData,
  customerEmail,
  customerName
) => {
  if (!customerEmail) {
    console.log("[Email] No email address for customer, skipping email");
    return;
  }

  const invoiceNumber = invoiceData.invoiceNumber || invoiceData.id || "N/A";
  const paidAmount = formatCurrency(
    invoiceData.paid_amount || invoiceData.amount || 0
  );
  const paymentMethod =
    invoiceData.payment_method === "cash"
      ? "Tiền mặt"
      : invoiceData.payment_method === "bank_transfer"
      ? "Chuyển khoản"
      : invoiceData.payment_method === "qr_code"
      ? "Quét QR"
      : "Không xác định";
  const paymentDate = formatDate(
    invoiceData.confirmed_at || invoiceData.updatedAt
  );
  const invoiceLink = `${
    process.env.FRONTEND_URL || "http://localhost:5173"
  }/invoices/${invoiceData.id}`;

  const subject = `Xác nhận thanh toán thành công - Hóa đơn ${invoiceNumber}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #DF1D01;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          background-color: #f9f9f9;
          padding: 20px;
          border: 1px solid #ddd;
        }
        .info-box {
          background-color: white;
          padding: 15px;
          margin: 15px 0;
          border-radius: 5px;
          border-left: 4px solid #DF1D01;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #eee;
        }
        .info-row:last-child {
          border-bottom: none;
        }
        .label {
          font-weight: bold;
          color: #666;
        }
        .value {
          color: #333;
        }
        .success-badge {
          background-color: #10b981;
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          display: inline-block;
          margin: 10px 0;
        }
        .button {
          display: inline-block;
          background-color: #DF1D01;
          color: #ffffff !important;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
          font-weight: 600;
        }
        .footer {
          text-align: center;
          padding: 20px;
          color: #666;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
        <div class="header">
          <h1>Xác nhận thanh toán thành công</h1>
        </div>
        <div class="content">
          <p>Xin chào <strong>${customerName || "Quý khách"}</strong>,</p>
        <p>Cảm ơn bạn đã sử dụng dịch vụ của MotorMate. Chúng tôi xác nhận đã nhận được thanh toán của bạn.</p>

        <div class="success-badge">✓ Thanh toán thành công</div>

        <div class="info-box">
          <h3 style="margin-top: 0; color: #DF1D01;">Thông tin thanh toán</h3>
          <div class="info-row">
            <span class="label">Số hóa đơn:</span>
            <span class="value"><strong>${invoiceNumber}</strong></span>
          </div>
          <div class="info-row">
            <span class="label">Số tiền thanh toán:</span>
            <span class="value"><strong>${paidAmount}</strong></span>
          </div>
          <div class="info-row">
            <span class="label">Phương thức thanh toán:</span>
            <span class="value">${paymentMethod}</span>
          </div>
          <div class="info-row">
            <span class="label">Thời gian thanh toán:</span>
            <span class="value">${paymentDate}</span>
          </div>
        </div>

        <p>Bạn có thể xem chi tiết hóa đơn bằng cách nhấn vào nút bên dưới:</p>
        <div style="text-align: center;">
          <a href="${invoiceLink}" class="button">Xem hóa đơn</a>
        </div>

        <p style="margin-top: 30px;">Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.</p>
        <p>Trân trọng,<br><strong>Đội ngũ MotorMate</strong></p>
      </div>
      <div class="footer">
        <p>Email này được gửi tự động từ hệ thống MotorMate.</p>
        <p>Vui lòng không trả lời email này.</p>
      </div>
    </body>
    </html>
  `;

  try {
    console.log(`[Email] Attempting to send payment confirmation email`);
    console.log(`[Email] To: ${customerEmail}`);
    console.log(`[Email] Invoice: ${invoiceNumber}`);
    console.log(`[Email] Amount: ${paidAmount}`);

    const result = await sendMail(customerEmail, subject, html);
    console.log(
      `[Email] ✅ Payment confirmation email sent successfully to ${customerEmail} for invoice ${invoiceNumber}`
    );
    console.log(`[Email] Message ID: ${result.messageId}`);
    return result;
  } catch (error) {
    console.error(
      `[Email] ❌ Failed to send payment confirmation email to ${customerEmail}:`,
      error.message
    );
    console.error(`[Email] Error details:`, error);
    // Không throw error để không làm gián đoạn flow thanh toán
  }
};

module.exports = {
  sendInvoiceEmail,
  sendPaymentConfirmationEmail,
};
