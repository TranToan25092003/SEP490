const nodemailer = require("nodemailer");
require("dotenv").config(); 

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS, 
  },
});


transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Lỗi kết nối email transporter:", error);
  } else {
    console.log("✅ Email transporter đã sẵn sàng để gửi tin nhắn.");
  }
});

module.exports = transporter;