import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

/**
 * Generate Goods Receipt PDF using HTML/CSS to PDF conversion
 * This approach allows flexible styling with CSS instead of manual positioning
 */
export const generateGoodsReceiptPDF = async (receiptData) => {
  // Create a completely isolated container that won't affect the main page
  const tempDiv = document.createElement("div");

  // Position off-screen and out of view to prevent any layout shifts
  tempDiv.style.position = "fixed";
  tempDiv.style.top = "0";
  tempDiv.style.left = "-10000px";
  tempDiv.style.width = "210mm";
  tempDiv.style.minHeight = "297mm";
  tempDiv.style.height = "auto";
  tempDiv.style.backgroundColor = "#ffffff";
  // Ensure element is renderable by html2canvas
  // tempDiv.style.visibility = "hidden"; // removed to allow rendering
  // tempDiv.style.opacity = "0"; // removed to allow rendering
  tempDiv.style.pointerEvents = "none";
  tempDiv.style.zIndex = "-1";
  tempDiv.style.overflow = "auto";
  const documentDateLabel = formatDate(receiptData.documentDate || new Date());
  const invoiceDateLabel = formatDate(
    receiptData.invoiceDate || receiptData.documentDate || new Date()
  );

  tempDiv.innerHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          @page {
            size: A4;
            margin: 0;
          }

          body {
            font-family: "Times New Roman", "DejaVu Sans", Arial, sans-serif;
            margin: 0;
            padding: 0;
            width: 210mm;
            min-height: 297mm;
            background-color: #ffffff;
            color: #000000;
            -webkit-font-smoothing: antialiased;
          }

          .page {
            width: 190mm;
            min-height: 277mm;
            margin: 10mm auto;
            padding: 12mm 10mm 18mm;
            box-sizing: border-box;
          }

          .header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
          }

          .company-info {
            flex: 1;
            text-transform: uppercase;
          }

          .company-name {
            font-weight: bold;
            font-size: 12pt;
            margin-bottom: 5px;
          }

          .company-address {
            font-size: 9pt;
            line-height: 1.3;
          }

          .form-reference {
            text-align: right;
            font-size: 10pt;
            font-weight: bold;
          }

          .footnote {
            text-align: center;
            color: #666666;
            font-size: 8pt;
            margin: 10px 0;
            line-height: 1.2;
          }

          .title {
            text-align: center;
            font-weight: bold;
            font-size: 16pt;
            margin: 30px 0 10px 0;
          }

          .title-date {
            text-align: center;
            font-size: 10pt;
            margin-bottom: 30px;
          }

          .document-details {
            margin: 20px 50px 20px 0;
            text-align: right;
          }

          .supplier-info {
            margin: 15px 0;
            line-height: 1.5;
          }

          .table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            font-size: 9pt;
          }

          .table th,
          .table td {
            border: 0.5px solid #000;
            padding: 5px;
            text-align: center;
          }

          .table th {
            background-color: #e5e5e5;
            font-weight: bold;
          }

          .table td:nth-child(2) {
            text-align: left;
            padding-left: 10px;
          }

          .table td:nth-child(n+5) {
            text-align: right;
            padding-right: 10px;
          }

          .table .sub-header {
            font-size: 7pt;
            background-color: transparent;
          }

          .table tr:nth-child(even) {
            background-color: #f9f9f9;
          }

          .total-row {
            background-color: #f0f0f0 !important;
            font-weight: bold;
          }

          .total-row td:first-child {
            text-align: left;
            padding-left: 10px;
          }

          .summary {
            margin: 20px 0;
            line-height: 1.5;
          }

          .signatures {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            margin-top: 50px;
            text-align: center;
          }

          .signature-block {
            flex: 1;
            max-width: 25%;
            min-height: 160px;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 0 6px;
          }

          .signature-title {
            font-weight: bold;
            margin-bottom: 8px;
            min-height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
          }

          .signature-space {
            flex: 1;
            width: 100%;
          }

          .signature-line {
            color: #666;
            font-size: 8pt;
            margin-top: 6px;
            margin-bottom: 2px;
          }

          .signature-date {
            color: #666;
            font-size: 8pt;
            margin-top: 2px;
          }
        </style>
      </head>
      <body>
        <div class="page">
          <!-- Header -->
          <div class="header">
            <div class="company-info">
              <div class="company-name">CỬA HÀNG MOTORMATE</div>
              <div class="company-address">
                Khu Công Nghệ Cao Hòa Lạc<br>
                Km 29, Đại lộ Thăng Long<br>
                Thành phố Hà Nội, Việt Nam
              </div>
            </div>
            <div class="form-reference">Mẫu số: 01 - VT</div>
          </div>
          <!-- Footnote -->
          <div class="footnote">
            (Ban hành theo Thông tư 133/2016/TT-BTC<br>
            Ngày 26/08/2016 của Bộ Tài chính)
          </div>

          <!-- Title -->
          <div class="title">PHIẾU NHẬP KHO</div>
          <div class="title-date">${documentDateLabel}</div>

          <!-- Document Details -->
          <div class="document-details">
            Hóa đơn số: ${receiptData.receiptNumber || "NK00012"}
          </div>

          <!-- Supplier Info -->
          <div class="supplier-info">
            <div>- Họ và tên người giao hàng: ${
              receiptData.supplier?.name || "CÔNG TY TNHH THIẾT BỊ TÂN AN PHÁT"
            }</div>
            <div>
              - Theo hóa đơn số ${
                receiptData.invoiceNumber || "1379"
              } ngày ${invoiceDateLabel} của ${
    receiptData.supplier?.name || "CÔNG TY TNHH THIẾT BỊ TÂN AN PHÁT"
  }
            </div>
            <div>- Nhập tại kho: ${
              receiptData.warehouseLocation || "Kho NVL"
            }</div>
            <div>- Địa điểm: Cửa hàng Motormate</div>
          </div>

          <!-- Table -->
          <table class="table">
            <thead>
              <tr>
                <th style="width: 35px;">STT</th>
                <th style="width: 140px;">Tên sản phẩm</th>
                <th style="width: 70px;">Mã số</th>
                <th style="width: 50px;">Đơn vị tính</th>
                <th colspan="2" style="width: 110px;">Số lượng</th>
                <th style="width: 70px;">Đơn giá</th>
                <th style="width: 75px;">Thành tiền</th>
              </tr>
              <tr class="sub-header">
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th style="width: 55px;">Theo chứng từ</th>
                <th style="width: 55px;">Thực nhập</th>
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${
                receiptData.items
                  ?.map(
                    (item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.partName || ""}</td>
                  <td>${item.partCode || ""}</td>
                  <td>${item.unit || ""}</td>
                  <td>${item.quantityOnDocument || 0}</td>
                  <td>${item.quantityActuallyReceived || 0}</td>
                  <td>${(item.unitPrice || 0).toLocaleString("vi-VN")}</td>
                  <td>${(item.totalAmount || 0).toLocaleString("vi-VN")}</td>
                </tr>
              `
                  )
                  .join("") || ""
              }
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td>Cộng</td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td>${
                  receiptData.items
                    ?.reduce((sum, item) => sum + (item.totalAmount || 0), 0)
                    .toLocaleString("vi-VN") || "0"
                }</td>
              </tr>
            </tfoot>
          </table>

          <!-- Summary -->
          <div class="summary">
            <div>Tổng số tiền (viết bằng chữ): ${
              receiptData.totalAmountInWords || ""
            }</div>
            <div style="margin-top: 10px;">
              Số chứng từ gốc kèm theo: ________________
            </div>
          </div>

          <!-- Signatures -->
          <div class="signatures">
            <div class="signature-block">
              <div class="signature-title">Người lập phiếu</div>
              <div class="signature-space"></div>
              <div class="signature-line">(Ký, ghi rõ họ tên)</div>
              <div class="signature-date">${documentDateLabel}</div>
            </div>
            <div class="signature-block">
              <div class="signature-title">Người giao hàng</div>
              <div class="signature-space"></div>
              <div class="signature-line">(Ký, ghi rõ họ tên)</div>
              <div class="signature-date">${documentDateLabel}</div>
            </div>
            <div class="signature-block">
              <div class="signature-title">Thủ kho</div>
              <div class="signature-space"></div>
              <div class="signature-line">(Ký, ghi rõ họ tên)</div>
              <div class="signature-date">${documentDateLabel}</div>
            </div>
            <div class="signature-block">
              <div class="signature-title">Kế toán trưởng</div>
              <div
                class="signature-title"
                style="font-size: 7pt; margin-top: -10px;"
              >
                (Hoặc bộ phận có nhu cầu nhập)
              </div>
              <div class="signature-space"></div>
              <div class="signature-line">(Ký, ghi rõ họ tên)</div>
              <div class="signature-date">${documentDateLabel}</div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  document.body.appendChild(tempDiv);

  try {
    // Wait a bit for the element to be properly rendered before capturing
    await new Promise((resolve) => setTimeout(resolve, 150));

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

    if (imgFinalHeight > pdfHeight) {
      imgFinalHeight = pdfHeight;
      imgFinalWidth = imgFinalHeight * imgRatio;
    }

    // Center image on page
    const xOffset = (pdfWidth - imgFinalWidth) / 2;
    pdf.addImage(imgData, "PNG", xOffset, 0, imgFinalWidth, imgFinalHeight);

    return new Blob([pdf.output("blob")], { type: "application/pdf" });
  } finally {
    document.body.removeChild(tempDiv);
  }
};

// Helper function to format date
function formatDate(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `Ngày ${day} tháng ${month} năm ${year}`;
}
