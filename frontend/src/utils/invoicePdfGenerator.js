import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

/**
 * Generate Invoice PDF using HTML/CSS to PDF conversion
 */
export const generateInvoicePDF = async (invoiceData) => {
  // Create a completely isolated container that won't affect the main page
  const tempDiv = document.createElement("div");

  // Position off-screen and out of view to prevent any layout shifts
  tempDiv.style.position = "fixed";
  tempDiv.style.top = "0";
  tempDiv.style.left = "-10000px";
  tempDiv.style.width = "794px"; // 210mm = 794px at 96dpi
  tempDiv.style.height = "auto";
  tempDiv.style.backgroundColor = "#ffffff";
  tempDiv.style.pointerEvents = "none";
  tempDiv.style.zIndex = "-1";
  tempDiv.style.overflow = "auto";

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderPaymentMethod = (method) => {
    if (!method) return "Chưa xác định";
    if (method === "cash") return "Tiền mặt";
    if (method === "qr_code") return "Quét QR";
    if (method === "bank_transfer") return "Chuyển khoản";
    return "Chưa xác định";
  };

  const renderStatus = (status) => {
    return status === "paid" ? "Đã thanh toán" : "Chưa thanh toán";
  };

  tempDiv.innerHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            width: 210mm;
            background-color: #ffffff;
            color: #000000;
          }

          .container {
            padding: 20px;
          }

          .header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            border-bottom: 2px solid #000;
            padding-bottom: 15px;
          }

          .company-info {
            flex: 1;
          }

          .company-name {
            font-weight: bold;
            font-size: 16pt;
            margin-bottom: 8px;
          }

          .company-address {
            font-size: 10pt;
            line-height: 1.4;
            color: #333;
          }

          .invoice-title {
            text-align: center;
            font-weight: bold;
            font-size: 20pt;
            margin: 20px 0;
            text-transform: uppercase;
          }

          .invoice-info {
            display: flex;
            justify-content: space-between;
            margin: 20px 0;
            padding: 15px;
            background-color: #ffffff;
            border: 1px solid #000;
          }

          .info-section {
            flex: 1;
          }

          .info-section-left {
            flex: 1;
            padding-right: 20px;
          }

          .info-section-right {
            flex: 1;
            padding-left: 20px;
            border-left: 4px solid #000;
          }

          .info-label {
            font-weight: bold;
            font-size: 10pt;
            margin-bottom: 5px;
            color: #000000;
          }

          .info-value {
            font-size: 11pt;
            margin-bottom: 10px;
          }

          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 0;
            font-size: 10pt;
            font-weight: bold;
            margin-top: 5px;
            background-color: #ffffff;
            color: #000000;
            border: none;
          }

          .table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 10pt;
          }

          .table th,
          .table td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
          }

          .table th {
            background-color: #ffffff;
            font-weight: bold;
            text-align: center;
          }

          .table td:nth-child(3),
          .table td:nth-child(4),
          .table td:nth-child(5),
          .table td:nth-child(6) {
            text-align: right;
          }

          .table td:nth-child(2) {
            text-align: center;
          }

          .table tr:nth-child(even) {
            background-color: #ffffff;
          }

          .summary {
            margin: 20px 0;
            padding: 15px;
            background-color: #ffffff;
            border: 1px solid #000;
          }

          .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 11pt;
          }

          .summary-row.total {
            font-weight: bold;
            font-size: 13pt;
            border-top: 2px solid #000;
            padding-top: 10px;
            margin-top: 10px;
          }

          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #000;
            font-size: 9pt;
            color: #000000;
            text-align: center;
          }

          .customer-info {
            margin: 0;
            padding: 0;
            background-color: #ffffff;
          }

          .customer-info h3 {
            margin: 0 0 10px 0;
            font-size: 12pt;
            font-weight: bold;
          }

          .customer-info p {
            margin: 5px 0;
            font-size: 10pt;
          }
        </style>
      </head>
      <body>
        <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="company-info">
            <div class="company-name">MOTORMATE</div>
            <div class="company-address">
              Khu Công Nghệ Cao Hòa Lạc<br>
               km 29, Đại lộ, Thăng Long<br>
              Thành phố Hà Nội, Việt Nam
            </div>
          </div>
        </div>

        <!-- Invoice Title -->
        <div class="invoice-title">HÓA ĐƠN BÁN HÀNG</div>

        <!-- Invoice Info -->
        <div class="invoice-info">
          <div class="info-section-left">
            <div class="info-label">Mã hóa đơn:</div>
            <div class="info-value" style="font-family: monospace; font-size: 12pt; font-weight: bold;">
              ${invoiceData.invoiceNumber || invoiceData.id || "—"}
            </div>
            <div class="info-label">Trạng thái:</div>
            <div class="info-value">
              <span class="status-badge">
                ${renderStatus(invoiceData.status)}
              </span>
            </div>
            <div class="info-label">Phương thức thanh toán:</div>
            <div class="info-value">${renderPaymentMethod(
              invoiceData.paymentMethod
            )}</div>
          </div>
          <div class="info-section-right">
            <div class="customer-info">
              <h3>Thông tin khách hàng</h3>
              <p><strong>Tên khách hàng:</strong> ${
                invoiceData.customerName || "—"
              }</p>
              <p><strong>Biển số xe:</strong> ${
                invoiceData.licensePlate || "—"
              }</p>
              <p><strong>Lệnh sửa chữa:</strong> ${
                invoiceData.serviceOrderNumber ||
                invoiceData.serviceOrderId ||
                "—"
              }</p>
              ${
                invoiceData.confirmedBy
                  ? `<p><strong>Xác nhận bởi:</strong> ${invoiceData.confirmedBy}</p>`
                  : ""
              }
              ${
                invoiceData.confirmedAt
                  ? `<p><strong>Thời gian xác nhận:</strong> ${formatDateTime(
                      invoiceData.confirmedAt
                    )}</p>`
                  : ""
              }
            </div>
          </div>
        </div>

        <!-- Items Table -->
        <table class="table">
          <thead>
            <tr>
              <th style="width: 40px;">STT</th>
              <th style="width: 200px;">Hạng mục</th>
              <th style="width: 80px;">Loại</th>
              <th style="width: 60px;">Số lượng</th>
              <th style="width: 120px;">Đơn giá</th>
              <th style="width: 140px;">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            ${
              invoiceData.items && invoiceData.items.length > 0
                ? invoiceData.items
                    .map(
                      (item, index) => `
                <tr>
                  <td style="text-align: center;">${index + 1}</td>
                  <td>${item.name || "—"}</td>
                  <td style="text-align: center;">${
                    item.type === "part" ? "Phụ tùng" : "Dịch vụ"
                  }</td>
                  <td style="text-align: right;">${item.quantity || 0}</td>
                  <td style="text-align: right;">${formatPrice(
                    item.price || 0
                  )}</td>
                  <td style="text-align: right;">${formatPrice(
                    item.lineTotal || 0
                  )}</td>
                </tr>
              `
                    )
                    .join("")
                : `
                <tr>
                  <td colspan="6" style="text-align: center; padding: 20px;">
                    Không có hạng mục nào trong hóa đơn này.
                  </td>
                </tr>
              `
            }
          </tbody>
        </table>

        <!-- Summary -->
        <div class="summary">
          <div class="summary-row">
            <span>Tạm tính:</span>
            <span>${formatPrice(invoiceData.subtotal || 0)}</span>
          </div>
          <div class="summary-row">
            <span>Thuế (10%):</span>
            <span>${formatPrice(invoiceData.tax || 0)}</span>
          </div>
          <div class="summary-row">
            <span>Tổng cộng:</span>
            <span>${formatPrice(invoiceData.totalAmount || 0)}</span>
          </div>
          ${
            invoiceData.voucherDiscount > 0
              ? `
            <div class="summary-row" style="color: #155724;">
              <span>Giảm giá bằng voucher:</span>
              <span>-${formatPrice(invoiceData.voucherDiscount)}</span>
            </div>
            <div class="summary-row total" style="color: #155724;">
              <span>SỐ TIỀN CẦN THANH TOÁN:</span>
              <span>${formatPrice(
                invoiceData.payableAmount || invoiceData.totalAmount || 0
              )}</span>
            </div>
          `
              : `
            <div class="summary-row total">
              <span>TỔNG CỘNG:</span>
              <span>${formatPrice(invoiceData.totalAmount || 0)}</span>
            </div>
          `
          }
        </div>

        <!-- Footer -->
        <div class="footer">
          <p>Hóa đơn được tạo tự động từ hệ thống MOTORMATE</p>
          <p>Ngày tải: ${formatDateTime(new Date())}</p>
        </div>
        </div>
      </body>
    </html>
  `;

  document.body.appendChild(tempDiv);

  try {
    // Wait a bit for the element to be properly rendered before capturing
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Convert HTML to canvas
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      allowTaint: false,
      removeContainer: true,
    });

    // Create PDF from canvas
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const imgRatio = imgWidth / imgHeight;

    let imgFinalWidth = pdfWidth;
    let imgFinalHeight = imgFinalWidth / imgRatio;

    // If content is taller than one page, split into multiple pages
    if (imgFinalHeight > pdfHeight) {
      const totalPages = Math.ceil(imgFinalHeight / pdfHeight);

      for (let i = 0; i < totalPages; i++) {
        if (i > 0) {
          pdf.addPage();
        }
        const targetY =
          i === 0 ? 0 : -((pdfHeight * i) / imgFinalHeight) * imgFinalHeight;

        pdf.addImage(
          imgData,
          "PNG",
          0,
          targetY,
          imgFinalWidth,
          imgFinalHeight,
          undefined,
          "FAST"
        );
      }
    } else {
      // Center image on page if it fits on one page
      const xOffset = (pdfWidth - imgFinalWidth) / 2;
      pdf.addImage(imgData, "PNG", xOffset, 0, imgFinalWidth, imgFinalHeight);
    }

    return new Blob([pdf.output("blob")], { type: "application/pdf" });
  } finally {
    document.body.removeChild(tempDiv);
  }
};
