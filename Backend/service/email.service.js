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

module.exports = {
    sendInvoiceEmail,
};