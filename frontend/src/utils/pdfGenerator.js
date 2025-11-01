import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export const generateGoodsReceiptPDF = async (receiptData) => {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
  const { width, height } = page.getSize();

  // Load fonts - use TimesRoman for better Unicode support
  const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  // Colors
  const black = rgb(0, 0, 0);
  const lightGray = rgb(0.7, 0.7, 0.7);

  // Helper function to draw text
  const drawText = (text, x, y, options = {}) => {
    const {
      font: textFont = font,
      size = 10,
      color = black,
      maxWidth = width - x - 20,
    } = options;

    // Create a function to normalize Vietnamese text
    const normalizeVietnamese = (str) => {
      return str
        .normalize("NFD") // Decompose characters
        .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D");
    };

    // Try to draw text with original Vietnamese characters first
    try {
      page.drawText(text, {
        x,
        y,
        size,
        font: textFont,
        color,
        maxWidth,
      });
    } catch {
      // If Unicode fails, use normalized version
      const normalizedText = normalizeVietnamese(text);

      try {
        page.drawText(normalizedText, {
          x,
          y,
          size,
          font: textFont,
          color,
          maxWidth,
        });
      } catch {
        // Final fallback - remove all non-ASCII characters
        const asciiText = text.replace(/[^\x20-\x7E]/g, "");
        page.drawText(asciiText, {
          x,
          y,
          size,
          font: textFont,
          color,
          maxWidth,
        });
      }
    }
  };

  // Helper function to draw rectangle
  const drawRect = (x, y, width, height, options = {}) => {
    const { color = black, borderColor = black, borderWidth = 1 } = options;

    if (color !== black) {
      page.drawRectangle({
        x,
        y,
        width,
        height,
        color,
      });
    }

    if (borderWidth > 0) {
      page.drawRectangle({
        x,
        y,
        width,
        height,
        borderColor,
        borderWidth,
      });
    }
  };

  // Company header - according to image, it should be a full company name with address
  const companyName =
    receiptData.companyName || "CONG TY CO PHAN DAU TU VA CONG NGHE VIET HUNG";
  const companyAddress =
    receiptData.companyAddress ||
    "So 2, ngach 84/2 duong Tran Quang Dieu, Phuong O Cho Dua, Quan Dong da, Thanh pho Ha Noi, Viet Nam";

  // Company name - larger, bold font (10-11pt)
  drawText(companyName, 50, height - 50, {
    font: boldFont,
    size: 11,
  });

  // Company address lines (9pt, normal)
  drawText(companyAddress, 50, height - 65, { size: 9 });

  // Form reference - right-aligned with rightmost signature block
  drawText("Mau so: 01 - VT", width - 150, height - 50, {
    size: 10,
    font: boldFont,
  });

  // Footnote lines - centered horizontally, below "Mau so"
  const footnoteText1 = "(Ban hanh theo Thong tu so 133/2016/TT-BTC";
  const footnoteText1Width = font.widthOfTextAtSize(footnoteText1, 8);
  drawText(footnoteText1, (width - footnoteText1Width) / 2, height - 65, {
    size: 8,
    color: lightGray,
  });

  const footnoteText2 = "Ngay 26/08/2016 cua Bo Tai chinh)";
  const footnoteText2Width = font.widthOfTextAtSize(footnoteText2, 8);
  drawText(footnoteText2, (width - footnoteText2Width) / 2, height - 77, {
    size: 8,
    color: lightGray,
  });

  // Main title - "PHIẾU NHẬP KHO" centered, large bold (14-16pt)
  const titleText = "PHIEU NHAP KHO";
  const titleWidth = boldFont.widthOfTextAtSize(titleText, 16);
  drawText(titleText, (width - titleWidth) / 2, height - 110, {
    font: boldFont,
    size: 16,
  });

  // Date below title - centered, smaller (10pt)
  const titleDate = new Date(
    receiptData.documentDate || new Date()
  ).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const dateText = `Ngay ${titleDate.split("/")[0]} thang ${
    titleDate.split("/")[1]
  } nam ${titleDate.split("/")[2]}`;
  const dateTextWidth = font.widthOfTextAtSize(dateText, 10);
  drawText(dateText, (width - dateTextWidth) / 2, height - 135, {
    size: 10,
  });

  // Document specifics (Nợ, Có, Số) - according to image layout
  // Note: Nợ và Có are right-aligned with each other, Số is positioned below
  drawText(`No: 156`, width - 220, height - 165, { size: 10 });
  drawText(`Co: 331`, width - 170, height - 165, { size: 10 });
  drawText(`So: ${receiptData.receiptNumber || "NK00012"}`, 430, height - 180, {
    size: 10,
  });

  // Supplier information - using "-" prefix as shown in image
  const supplierName =
    receiptData.supplier?.name || "CONG TY TNHH THIET BI TAN AN PHAT";
  drawText(`- Ho va ten nguoi giao ${supplierName}`, 50, height - 200, {
    size: 10,
  });

  // Invoice reference - also using "-" prefix
  const invoiceNumber = receiptData.invoiceNumber || "1379";
  const invoiceDate = receiptData.invoiceDate || "14 thang 07 nam 2022";
  drawText(
    `- Theo hoa don so ${invoiceNumber} ngay ${invoiceDate} cua ${supplierName}`,
    50,
    height - 220,
    { size: 10 }
  );

  // Warehouse location - using "-" prefix
  const warehouseLocation = receiptData.warehouseLocation || "Kho NVL";
  drawText(`- Nhap tai kho: ${warehouseLocation}`, 50, height - 240, {
    size: 10,
  });

  // Location - "-" prefix with underline for input
  drawText("- Dia diem: ", 50, height - 260, { size: 10 });

  // Items table header
  const tableStartY = height - 320;
  const colWidths = [35, 140, 70, 50, 55, 55, 70, 75]; // Reduced widths: STT, Product Name (140), Code (70), Unit, Qty Doc, Qty Actual, Price, Total
  const colPositions = [50, 85, 225, 295, 345, 400, 455, 525];
  const totalTableWidth = colWidths.reduce((sum, w) => sum + w, 0);

  // Draw table borders for all cells
  const drawTableBorder = (startY, endY) => {
    // Vertical lines (columns)
    colPositions.forEach((x, index) => {
      page.drawLine({
        start: { x: x, y: startY },
        end: { x: x, y: endY },
        thickness: 0.5,
        color: black,
      });
    });
    // Rightmost border
    page.drawLine({
      start: { x: colPositions[7] + colWidths[7], y: startY },
      end: { x: colPositions[7] + colWidths[7], y: endY },
      thickness: 0.5,
      color: black,
    });

    // Horizontal lines
    page.drawLine({
      start: { x: 50, y: startY },
      end: { x: colPositions[7] + colWidths[7], y: startY },
      thickness: 0.5,
      color: black,
    });
    page.drawLine({
      start: { x: 50, y: endY },
      end: { x: colPositions[7] + colWidths[7], y: endY },
      thickness: 0.5,
      color: black,
    });
  };

  // Table header background
  drawRect(50, tableStartY - 20, totalTableWidth, 20, {
    color: rgb(0.9, 0.9, 0.9),
  });

  drawTableBorder(tableStartY, tableStartY - 20);

  // Table headers - shortened text
  const headers = [
    "STT",
    "Ten san pham",
    "Ma so",
    "Don vi tinh",
    "So luong",
    "So luong",
    "Don gia",
    "Thanh tien",
  ];
  headers.forEach((header, index) => {
    const align = index === 1 ? "left" : "center"; // Product name left-aligned
    drawText(header, colPositions[index], tableStartY - 15, {
      font: boldFont,
      size: 9,
      maxWidth: colWidths[index] - 5,
    });
  });

  // Sub-headers for quantity columns
  const subHeaderY = tableStartY - 5;
  const theoChungTuWidth = font.widthOfTextAtSize("Theo chung tu", 7);
  drawText(
    "Theo chung tu",
    colPositions[4] + (colWidths[4] - theoChungTuWidth) / 2,
    subHeaderY,
    { size: 7, font: boldFont }
  );

  const thucNhapWidth = font.widthOfTextAtSize("Thuc nhap", 7);
  drawText(
    "Thuc nhap",
    colPositions[5] + (colWidths[5] - thucNhapWidth) / 2,
    subHeaderY,
    { size: 7, font: boldFont }
  );

  // Table rows
  let currentY = tableStartY - 20;
  let totalAmount = 0;
  const rowHeight = 18; // Tighter row height
  const items = receiptData.items || [];

  items.forEach((item, index) => {
    if (currentY - rowHeight < 100) {
      const newPage = pdfDoc.addPage([595.28, 841.89]);
      currentY = newPage.getSize().height - 50;
    }

    currentY -= rowHeight;

    const rowData = [
      (index + 1).toString(),
      item.partName,
      item.partCode,
      item.unit,
      item.quantityOnDocument.toString(),
      item.quantityActuallyReceived.toString(),
      item.unitPrice.toLocaleString("vi-VN"),
      item.totalAmount.toLocaleString("vi-VN"),
    ];

    // Draw row background (alternating)
    if (index % 2 === 0) {
      drawRect(50, currentY - rowHeight, totalTableWidth, rowHeight, {
        color: rgb(0.98, 0.98, 0.98),
      });
    }

    // Draw cell borders for each cell in this row
    colPositions.forEach((x, colIndex) => {
      page.drawRectangle({
        x: x,
        y: currentY - rowHeight,
        width: colWidths[colIndex],
        height: rowHeight,
        borderColor: black,
        borderWidth: 0.5,
      });
    });

    // Draw row data with proper alignment
    rowData.forEach((data, colIndex) => {
      const align =
        colIndex === 1 ? "left" : colIndex >= 4 ? "right" : "center";

      let textX = colPositions[colIndex];
      if (align === "center") {
        const textWidth = font.widthOfTextAtSize(data, 8);
        textX = colPositions[colIndex] + (colWidths[colIndex] - textWidth) / 2;
      } else if (align === "right") {
        const textWidth = font.widthOfTextAtSize(data, 8);
        textX = colPositions[colIndex] + colWidths[colIndex] - textWidth - 2;
      }

      drawText(data, textX, currentY - rowHeight + 3, {
        size: 8,
        maxWidth: colWidths[colIndex] - 5,
      });
    });

    totalAmount += item.totalAmount;
  });

  // Total row
  currentY -= 10;
  drawRect(50, currentY - 15, totalTableWidth + 10, 20, {
    color: rgb(0.95, 0.95, 0.95),
  });
  drawText("Cong", 50, currentY - 10, { font: boldFont, size: 10 });

  // Right-align total amount in the last column
  const totalAmountText = totalAmount.toLocaleString("vi-VN");
  const totalAmountWidth = boldFont.widthOfTextAtSize(totalAmountText, 10);
  drawText(
    totalAmountText,
    colPositions[7] + colWidths[7] - totalAmountWidth - 2,
    currentY - 10,
    {
      font: boldFont,
      size: 10,
    }
  );

  // Total amount in words
  currentY -= 40;
  drawText("Tong so tien (Viet bang chu):", 50, currentY, { size: 10 });
  drawText(
    receiptData.totalAmountInWords ||
      "Muoi hai trieu tam tram tam muoi lam nghin dong chan.",
    50,
    currentY - 15,
    {
      font: boldFont,
      size: 10,
    }
  );

  // Attached documents
  currentY -= 25;
  drawText("So chung tu goc kem theo:", 50, currentY, { size: 10 });

  // Signature section
  currentY -= 60;
  const signatureY = currentY;
  const signatureWidth = (width - 100) / 4;

  const signatures = [
    "Người lập phiếu",
    "Người giao hàng",
    "Thủ kho",
    "Kế toán trưởng\n(Hoặc bộ phận có nhu cầu nhập)",
  ];

  signatures.forEach((signature, index) => {
    const x = 50 + index * signatureWidth;
    drawText(signature, x, signatureY, {
      size: 9,
      maxWidth: signatureWidth - 10,
    });
    drawText("(Ky, ho ten)", x, signatureY - 30, {
      size: 8,
      color: lightGray,
      maxWidth: signatureWidth - 10,
    });

    // Use documentDate variable that was defined earlier in the code
    const docDate = new Date(receiptData.documentDate || new Date());
    const day = String(docDate.getDate()).padStart(2, "0");
    const month = String(docDate.getMonth() + 1).padStart(2, "0");
    const year = docDate.getFullYear();
    const signatureDateText = `Ngay ${day} thang ${month} nam ${year}`;
    drawText(signatureDateText, x, signatureY - 50, {
      size: 8,
      color: lightGray,
      maxWidth: signatureWidth - 10,
    });
  });

  // Generate PDF bytes
  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
};
