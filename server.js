const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const { check, validationResult } = require('express-validator');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware để xử lý dữ liệu form
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Phục vụ các tệp tĩnh từ thư mục public
app.use(express.static('public'));

// Route chính
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route sản phẩm
app.get('/products', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'products.html'));
});

// Route liên hệ
app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});

// API endpoint để xử lý form liên hệ
app.post('/api/contact', [
  // Validation
  check('name', 'Tên là bắt buộc').not().isEmpty(),
  check('email', 'Vui lòng nhập email hợp lệ').isEmail(),
  check('subject', 'Vui lòng nhập chủ đề').not().isEmpty(),
  check('message', 'Vui lòng nhập tin nhắn').not().isEmpty()
], async (req, res) => {
  // Kiểm tra lỗi validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { name, email, subject, message } = req.body;

  try {
    // Cấu hình transporter cho Nodemailer với Zoho Mail
    let transporter = nodemailer.createTransport({
      host: 'smtp.zoho.com',
      port: 465,
      secure: true, // Sử dụng SSL
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    // Cấu hình email
    let mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Website Liên hệ'}" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_RECEIVER || process.env.EMAIL_USER,
      subject: `Liên hệ mới: ${subject}`,
      html: `
        <h3>Thông tin liên hệ mới từ website:</h3>
        <p><strong>Tên:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Chủ đề:</strong> ${subject}</p>
        <p><strong>Tin nhắn:</strong></p>
        <p>${message}</p>
      `
    };

    // Gửi email
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: 'Email đã được gửi thành công!' });
  } catch (error) {
    console.error('Lỗi khi gửi email:', error);
    res.status(500).json({ success: false, message: 'Có lỗi xảy ra khi gửi email' });
  }
});

// Middleware xử lý lỗi HTTPS trên Railway
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect('https://' + req.headers.host + req.url);
  }
  next();
});

// Khởi động server
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});