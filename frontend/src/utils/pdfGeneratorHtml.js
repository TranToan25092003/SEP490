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
  tempDiv.style.width = "794px"; // 210mm = 794px at 96dpi
  tempDiv.style.height = "auto";
  tempDiv.style.backgroundColor = "#ffffff";
  // Ensure element is renderable by html2canvas
  // tempDiv.style.visibility = "hidden"; // removed to allow rendering
  // tempDiv.style.opacity = "0"; // removed to allow rendering
  tempDiv.style.pointerEvents = "none";
  tempDiv.style.zIndex = "-1";
  tempDiv.style.overflow = "auto";
  tempDiv.innerHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            width: 210mm;
            background-color: #ffffff;
            color: #000000;
          }

          .header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
          }

          .company-info {
            flex: 1;
          }

          .company-name {
            font-weight: bold;
            font-size: 11pt;
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
            margin-top: 40px;
            text-align: center;
          }

          .signature-block {
            flex: 1;
            max-width: 25%;
          }

          .signature-title {
            font-weight: bold;
            margin-bottom: 30px;
          }

          .signature-line {
            color: #666;
            font-size: 8pt;
          }

          .signature-date {
            color: #666;
            font-size: 8pt;
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        <!-- Header -->
        <div class="header">
          <div class="company-info">
            <div class="company-name">CONG TY CO PHAN DAU TU VA CONG NGHE VIET HUNG</div>
            <div class="company-address">So 2, ngach 84/2 duong Tran Quang Dieu, Phuong O Cho Dua, Quan Dong da, Thanh pho Ha Noi, Viet Nam</div>
          </div>
          <div class="form-reference">Mau so: 01 - VT</div>
        </div>

        <!-- Footnote -->
        <div class="footnote">
          (Ban hanh theo Thong tu so 133/2016/TT-BTC<br>
          Ngay 26/08/2016 cua Bo Tai chinh)
        </div>

        <!-- Title -->
        <div class="title">PHIEU NHAP KHO</div>
        <div class="title-date">${formatDate(
          receiptData.documentDate || new Date()
        )}</div>

        <!-- Document Details -->
        <div class="document-details">
          No: 156&nbsp;&nbsp;&nbsp;&nbsp;Co: 331<br>
          So: ${receiptData.receiptNumber || "NK00012"}
        </div>

        <!-- Supplier Info -->
        <div class="supplier-info">
          <div>- Ho va ten nguoi giao: ${
            receiptData.supplier?.name || "CONG TY TNHH THIET BI TAN AN PHAT"
          }</div>
          <div>- Theo hoa don so ${receiptData.invoiceNumber || "1379"} ngay ${
    receiptData.invoiceDate || "14 thang 07 nam 2022"
  } cua ${
    receiptData.supplier?.name || "CONG TY TNHH THIET BI TAN AN PHAT"
  }</div>
          <div>- Nhap tai kho: ${
            receiptData.warehouseLocation || "Kho NVL"
          }</div>
          <div>- Dia diem: _____________</div>
        </div>

        <!-- Table -->
        <table class="table">
          <thead>
            <tr>
              <th style="width: 35px;">STT</th>
              <th style="width: 140px;">Ten san pham</th>
              <th style="width: 70px;">Ma so</th>
              <th style="width: 50px;">Don vi tinh</th>
              <th colspan="2" style="width: 110px;">So luong</th>
              <th style="width: 70px;">Don gia</th>
              <th style="width: 75px;">Thanh tien</th>
            </tr>
            <tr class="sub-header">
              <th></th>
              <th></th>
              <th></th>
              <th></th>
              <th style="width: 55px;">Theo chung tu</th>
              <th style="width: 55px;">Thuc nhap</th>
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
              <td>Cong</td>
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
          <div>Tong so tien (Viet bang chu): ${
            receiptData.totalAmountInWords || ""
          }</div>
          <div style="margin-top: 10px;">So chung tu goc kem theo: ________________</div>
        </div>

        <!-- Signatures -->
        <div class="signatures">
          <div class="signature-block">
            <div class="signature-title">Nguoi lap phieu</div>
            <div class="signature-line">(Ky, ho ten)</div>
            <div class="signature-date">${formatDate(
              receiptData.documentDate || new Date()
            )}</div>
          </div>
          <div class="signature-block">
            <div class="signature-title">Nguoi giao hang</div>
            <div class="signature-line">(Ky, ho ten)</div>
            <div class="signature-date">${formatDate(
              receiptData.documentDate || new Date()
            )}</div>
          </div>
          <div class="signature-block">
            <div class="signature-title">Thu kho</div>
            <div class="signature-line">(Ky, ho ten)</div>
            <div class="signature-date">${formatDate(
              receiptData.documentDate || new Date()
            )}</div>
          </div>
          <div class="signature-block">
            <div class="signature-title">Ke toan truong</div>
            <div class="signature-title" style="font-size: 7pt; margin-top: -10px;">(Hoac bo phan co nhu cau nhap)</div>
            <div class="signature-line">(Ky, ho ten)</div>
            <div class="signature-date">${formatDate(
              receiptData.documentDate || new Date()
            )}</div>
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
    const pdfRatio = pdfWidth / pdfHeight;

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
  return `Ngay ${day} thang ${month} nam ${year}`;
}
