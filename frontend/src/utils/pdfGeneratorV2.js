import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

/**
 * Generate Goods Receipt PDF matching Vietnamese official format
 * Based on: Form 01-VT issued according to Circular 133/2016/TT-BTC dated 26/08/2016
 */
export const generateGoodsReceiptPDF = async (receiptData) => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();

  // Fonts
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const black = rgb(0, 0, 0);
  const lightGray = rgb(0.7, 0.7, 0.7);

  // Normalize Vietnamese text for PDF rendering
  const normalize = (text) => {
    return text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .replace(/ư/g, "u")
      .replace(/Ư/g, "U")
      .replace(/ơ/g, "o")
      .replace(/Ở/g, "O");
  };

  const drawText = (text, x, y, options = {}) => {
    const {
      font: textFont = font,
      size = 10,
      color = black,
      maxWidth,
    } = options;
    const normalizedText = normalize(text);
    page.drawText(normalizedText, {
      x,
      y,
      size,
      font: textFont,
      color,
      maxWidth: maxWidth || width - x - 20,
    });
  };

  const drawCell = (text, x, y, width, height, options = {}) => {
    const { align = "left", bold = false } = options;

    // Draw border
    page.drawRectangle({
      x,
      y: y - height,
      width,
      height,
      borderColor: black,
      borderWidth: 0.5,
    });

    // Draw text based on alignment
    let textX = x + 2;
    if (align === "center") {
      const textWidth = (bold ? boldFont : font).widthOfTextAtSize(
        text,
        options.size || 9
      );
      textX = x + (width - textWidth) / 2;
    } else if (align === "right") {
      const textWidth = (bold ? boldFont : font).widthOfTextAtSize(
        text,
        options.size || 9
      );
      textX = x + width - textWidth - 2;
    }

    drawText(text, textX, y - height + 2, {
      size: options.size || 9,
      font: bold ? boldFont : font,
      ...options,
    });
  };

  // ===== HEADER SECTION =====

  // Company name (top-left)
  const companyName =
    receiptData.companyName || "CONG TY CO PHAN DAU TU VA CONG NGHE VIET HUNG";
  drawText(companyName, 50, height - 40, { font: boldFont, size: 11 });

  // Company address
  const companyAddress =
    receiptData.companyAddress ||
    "So 2, ngach 84/2 duong Tran Quang Dieu, Phuong O Cho Dua, Quan Dong da, Thanh pho Ha Noi, Viet Nam";
  drawText(companyAddress, 50, height - 55, { size: 9 });

  // Form number (top-right)
  drawText("Mau so: 01 - VT", width - 150, height - 40, {
    size: 10,
    font: boldFont,
  });

  // Footnote (centered)
  const footnote1 = "(Ban hanh theo Thong tu so 133/2016/TT-BTC";
  const footnote1Width = font.widthOfTextAtSize(footnote1, 8);
  drawText(footnote1, (width - footnote1Width) / 2, height - 55, {
    size: 8,
    color: lightGray,
  });

  const footnote2 = "Ngay 26/08/2016 cua Bo Tai chinh)";
  const footnote2Width = font.widthOfTextAtSize(footnote2, 8);
  drawText(footnote2, (width - footnote2Width) / 2, height - 67, {
    size: 8,
    color: lightGray,
  });

  // ===== TITLE SECTION =====

  // Main title - centered
  const title = "PHIEU NHAP KHO";
  const titleWidth = boldFont.widthOfTextAtSize(title, 16);
  drawText(title, (width - titleWidth) / 2, height - 100, {
    font: boldFont,
    size: 16,
  });

  // Date below title - centered
  const docDate = new Date(receiptData.documentDate || new Date());
  const day = String(docDate.getDate()).padStart(2, "0");
  const month = String(docDate.getMonth() + 1).padStart(2, "0");
  const year = docDate.getFullYear();
  const dateText = `Ngay ${day} thang ${month} nam ${year}`;
  const dateTextWidth = font.widthOfTextAtSize(dateText, 10);
  drawText(dateText, (width - dateTextWidth) / 2, height - 125, { size: 10 });

  // ===== DOCUMENT SPECIFICS =====

  // Nợ, Có (right-aligned)
  drawText("No: 156", width - 220, height - 150, { size: 10 });
  drawText("Co: 331", width - 170, height - 150, { size: 10 });

  // Số (positioned below)
  drawText(`So: ${receiptData.receiptNumber || "NK00012"}`, 430, height - 165, {
    size: 10,
  });

  // ===== RECIPIENT/SUPPLIER DETAILS =====

  const supplierName =
    receiptData.supplier?.name || "CONG TY TNHH THIET BI TAN AN PHAT";
  drawText(`- Ho va ten nguoi giao ${supplierName}`, 50, height - 190, {
    size: 10,
  });

  const invoiceNum = receiptData.invoiceNumber || "1379";
  const invoiceDate = receiptData.invoiceDate || "14 thang 07 nam 2022";
  drawText(
    `- Theo hoa don so ${invoiceNum} ngay ${invoiceDate} cua ${supplierName}`,
    50,
    height - 210,
    { size: 10 }
  );

  const warehouse = receiptData.warehouseLocation || "Kho NVL";
  drawText(`- Nhap tai kho: ${warehouse}`, 50, height - 230, { size: 10 });
  drawText("- Dia diem: ", 50, height - 250, { size: 10 });

  // ===== TABLE SECTION =====

  const tableStartY = height - 300;
  const rowHeight = 20;

  // Column widths (approximated from image)
  const colWidths = [30, 220, 70, 45, 55, 55, 75, 80];
  const colPositions = [50, 80, 300, 370, 415, 470, 525, 595];

  // Table header
  const headers = [
    "STT",
    "Ten, nhan hieu, quy cach, pham chat vat tu, dung cu san pham, hang hoa",
    "Ma so",
    "Don vi tinh",
    "So luong",
    "So luong",
    "Don gia",
    "Thanh tien",
  ];

  // Header row background
  page.drawRectangle({
    x: 50,
    y: tableStartY - rowHeight,
    width: width - 100,
    height: rowHeight,
    color: rgb(0.9, 0.9, 0.9),
  });

  // Draw header text
  headers.forEach((header, i) => {
    const align = i === 1 ? "left" : "center"; // Product name left-aligned
    const subHeaderY = i === 4 || i === 5 ? tableStartY - 8 : tableStartY - 15;
    drawCell(header, colPositions[i], subHeaderY, colWidths[i], rowHeight, {
      align,
      bold: true,
      size: 8,
    });
  });

  // Sub-headers for quantity columns
  drawText("Theo chung tu", 415, tableStartY - 8, { size: 7, font: boldFont });
  drawText("Thuc nhap", 470, tableStartY - 8, { size: 7, font: boldFont });

  // ===== TABLE BODY =====

  let currentY = tableStartY - rowHeight - 2;
  let totalAmount = 0;
  const items = receiptData.items || [];

  items.forEach((item, index) => {
    if (currentY < 100) {
      const newPage = pdfDoc.addPage([595.28, 841.89]);
      currentY = newPage.getSize().height - 50;
    }

    // Alternating row color
    if (index % 2 === 0) {
      page.drawRectangle({
        x: 50,
        y: currentY - rowHeight,
        width: width - 100,
        height: rowHeight,
        color: rgb(0.98, 0.98, 0.98),
      });
    }

    const rowData = [
      String(index + 1),
      item.partName || "N/A",
      item.partCode || "N/A",
      item.unit || "Cai",
      item.quantityOnDocument?.toString() || "0",
      item.quantityActuallyReceived?.toString() || "0",
      item.unitPrice?.toLocaleString("vi-VN") || "0",
      item.totalAmount?.toLocaleString("vi-VN") || "0",
    ];

    rowData.forEach((data, colIndex) => {
      const align =
        colIndex === 1 ? "left" : colIndex >= 4 ? "right" : "center";
      drawCell(
        data,
        colPositions[colIndex],
        currentY,
        colWidths[colIndex],
        rowHeight,
        { align, size: 9 }
      );
    });

    totalAmount += item.totalAmount || 0;
    currentY -= rowHeight;
  });

  // ===== TOTAL ROW =====

  currentY -= 5;
  page.drawRectangle({
    x: 50,
    y: currentY - rowHeight,
    width: colWidths.slice(0, -1).reduce((a, b) => a + b, 0) - 5,
    height: rowHeight,
    color: rgb(0.95, 0.95, 0.95),
  });

  // Merge cells for "Cộng" across multiple columns
  drawText("Cong", 50, currentY - 5, { font: boldFont, size: 10 });
  drawText(totalAmount.toLocaleString("vi-VN"), 595, currentY - 15, {
    font: boldFont,
    size: 10,
  });

  // Draw border for total row
  const totalRowWidth = width - 100;
  page.drawRectangle({
    x: 50,
    y: currentY - rowHeight,
    width: totalRowWidth,
    height: rowHeight,
    borderColor: black,
    borderWidth: 0.5,
  });

  // ===== SUMMARY SECTION =====

  currentY -= 35;
  drawText("Tong so tien (Viet bang chu):", 50, currentY, { size: 10 });
  drawText(
    receiptData.totalAmountInWords ||
      "Muoi hai trieu tam tram tam muoi lam nghin dong chan.",
    50,
    currentY - 15,
    { font: boldFont, size: 10 }
  );

  currentY -= 25;
  drawText("So chung tu goc kem theo:", 50, currentY, { size: 10 });

  // ===== SIGNATURE SECTION =====

  currentY -= 45;
  const sigY = currentY;
  const sigWidth = (width - 100) / 4;

  const signatures = [
    "Nguoi lap phieu",
    "Nguoi giao hang",
    "Thu kho",
    "Ke toan truong\n(Hoac bo phan co nhu cau nhap)",
  ];

  signatures.forEach((sig, i) => {
    const x = 50 + i * sigWidth;
    drawText(sig, x, sigY, { size: 9, maxWidth: sigWidth - 10 });
    drawText("(Ky, ho ten)", x, sigY - 25, {
      size: 8,
      color: lightGray,
      maxWidth: sigWidth - 10,
    });
    drawText(dateText, x, sigY - 45, {
      size: 8,
      color: lightGray,
      maxWidth: sigWidth - 10,
    });
  });

  // ===== GENERATE PDF =====

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
};
