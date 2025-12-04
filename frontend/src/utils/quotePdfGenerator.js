import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export const generateQuotePDF = async (quoteData = {}) => {
  const tempDiv = document.createElement("div");
  tempDiv.style.position = "fixed";
  tempDiv.style.top = "0";
  tempDiv.style.left = "-10000px";
  tempDiv.style.width = "794px";
  tempDiv.style.backgroundColor = "#ffffff";
  tempDiv.style.pointerEvents = "none";
  tempDiv.style.zIndex = "-1";
  tempDiv.style.overflow = "auto";

  const formatPrice = (price = 0) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);

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

  const itemsHtml =
    quoteData.items && quoteData.items.length
      ? quoteData.items
          .map(
            (item, index) => `
        <tr>
          <td style="text-align: center;">${index + 1}</td>
          <td>${item.name || "—"}</td>
          <td style="text-align: center;">${
            item.type === "part" ? "Phụ tùng" : "Dịch vụ"
          }</td>
          <td style="text-align: right;">${item.quantity || 1}</td>
          <td style="text-align: right;">${formatPrice(item.price || 0)}</td>
          <td style="text-align: right;">${formatPrice(
            (item.price || 0) * (item.quantity || 1)
          )}</td>
        </tr>
      `
          )
          .join("")
      : `
      <tr>
        <td colspan="6" style="text-align: center; padding: 20px;">
          Chưa có hạng mục nào trong báo giá này.
        </td>
      </tr>
    `;

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
            padding: 24px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 24px;
            border-bottom: 2px solid #000;
            padding-bottom: 12px;
          }
          .company-name {
            font-weight: bold;
            font-size: 18pt;
            margin-bottom: 4px;
          }
          .quote-title {
            text-align: center;
            font-weight: bold;
            font-size: 20pt;
            margin: 20px 0;
            text-transform: uppercase;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 16px;
            margin-bottom: 24px;
          }
          .info-card {
            border: 1px solid #000;
            padding: 12px 16px;
          }
          .info-label {
            font-size: 10pt;
            text-transform: uppercase;
            color: #555;
            margin-bottom: 4px;
          }
          .info-value {
            font-size: 12pt;
            font-weight: bold;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 24px 0;
            font-size: 10pt;
          }
          th, td {
            border: 1px solid #000;
            padding: 8px;
          }
          th {
            background-color: #f5f5f5;
            text-align: center;
          }
          .summary {
            margin-top: 16px;
            border: 1px solid #000;
            padding: 16px;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 12pt;
          }
          .summary-row.total {
            font-weight: bold;
            font-size: 14pt;
            border-top: 2px solid #000;
            padding-top: 10px;
            margin-top: 10px;
          }
          .footer {
            margin-top: 32px;
            text-align: center;
            font-size: 10pt;
            color: #555;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div>
              <div class="company-name">MOTORMATE</div>
              <div>Km 29 Đại lộ Thăng Long, Hòa Lạc, Hà Nội</div>
            </div>
          </div>

          <div class="quote-title">BÁO GIÁ DỊCH VỤ</div>

          <div class="info-grid">
            <div class="info-card">
              <div class="info-label">Mã báo giá</div>
              <div class="info-value" style="font-family: monospace;">${
                quoteData.quoteNumber || quoteData.id || "—"
              }</div>
              <div class="info-label">Ngày tạo</div>
              <div>${formatDateTime(quoteData.createdAt)}</div>
              <div class="info-label">Trạng thái</div>
              <div>${quoteData.status || "pending"}</div>
            </div>
            <div class="info-card">
              <div class="info-label">Tên khách hàng</div>
              <div class="info-value">${
                quoteData.customerName || "Khách hàng"
              }</div>
              <div class="info-label">Biển số xe</div>
              <div>${quoteData.licensePlate || "—"}</div>
              <div class="info-label">Lệnh sửa chữa</div>
              <div>${quoteData.serviceOrderNumber || "—"}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 50px;">STT</th>
                <th style="width: 220px;">Hạng mục</th>
                <th style="width: 80px;">Loại</th>
                <th style="width: 70px;">Số lượng</th>
                <th style="width: 120px;">Đơn giá</th>
                <th style="width: 140px;">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="summary">
            <div class="summary-row">
              <span>Tạm tính:</span>
              <span>${formatPrice(quoteData.subtotal || 0)}</span>
            </div>
            <div class="summary-row">
              <span>Thuế VAT (10%):</span>
              <span>${formatPrice(quoteData.tax || 0)}</span>
            </div>
            <div class="summary-row total">
              <span>TỔNG CỘNG:</span>
              <span>${formatPrice(quoteData.grandTotal || quoteData.subtotal || 0)}</span>
            </div>
          </div>

          <div class="footer">
            Báo giá được tạo tự động từ hệ thống MOTORMATE • ${formatDateTime(
              new Date().toISOString()
            )}
          </div>
        </div>
      </body>
    </html>
  `;

  document.body.appendChild(tempDiv);

  try {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = imgWidth / imgHeight;
    let imgFinalWidth = pdfWidth;
    let imgFinalHeight = imgFinalWidth / ratio;

    if (imgFinalHeight > pdfHeight) {
      const totalPages = Math.ceil(imgFinalHeight / pdfHeight);
      for (let i = 0; i < totalPages; i++) {
        if (i > 0) pdf.addPage();
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
      pdf.addImage(imgData, "PNG", 0, 0, imgFinalWidth, imgFinalHeight);
    }

    return new Blob([pdf.output("blob")], { type: "application/pdf" });
  } finally {
    document.body.removeChild(tempDiv);
  }
};

