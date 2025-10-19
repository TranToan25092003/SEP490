import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export const generateGoodsReceiptPDF = async (receiptData) => {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
  const { width, height } = page.getSize();

  // Load fonts
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

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

    page.drawText(text, {
      x,
      y,
      size,
      font: textFont,
      color,
      maxWidth,
    });
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

  // Company header
  drawText("CÔNG TY CỔ PHẦN ĐẦU TƯ VÀ CÔNG NGHỆ VIỆT HƯNG", 50, height - 50, {
    font: boldFont,
    size: 14,
  });

  drawText(
    "Số 2, ngách 84/2 đường Trần Quang Diệu, Phường Ô Chợ Dừa, Quận Đống đa, Thành phố Hà Nội, Việt Nam",
    50,
    height - 70,
    { size: 9 }
  );

  // Form reference
  drawText("Mẫu số: 01 - VT", width - 150, height - 50, { size: 9 });
  drawText(
    "(Ban hành theo Thông tư số 133/2016/TT-BTC Ngày 26/08/2016 của Bộ Tài chính)",
    width - 200,
    height - 65,
    { size: 8, color: lightGray }
  );

  // Main title
  drawText("PHIẾU NHẬP KHO", width / 2 - 60, height - 120, {
    font: boldFont,
    size: 16,
  });

  // Document info
  const documentDate = new Date(receiptData.documentDate).toLocaleDateString(
    "vi-VN"
  );
  drawText(`Ngày ${documentDate}`, 50, height - 150, { size: 10 });
  drawText(`Số: ${receiptData.receiptNumber}`, width - 150, height - 150, {
    size: 10,
  });

  // Debit/Credit accounts
  drawText("Nợ: 156", width - 100, height - 170, { size: 10 });
  drawText("Có: 331", width - 50, height - 170, { size: 10 });

  // Supplier information
  drawText("Họ và tên người giao:", 50, height - 200, { size: 10 });
  drawText(receiptData.supplier.name, 200, height - 200, {
    font: boldFont,
    size: 10,
  });

  // Invoice reference
  drawText(
    "Theo hóa đơn số 1379 ngày 14 tháng 07 năm 2022 của",
    50,
    height - 220,
    { size: 10 }
  );
  drawText(receiptData.supplier.name, 50, height - 235, {
    font: boldFont,
    size: 10,
  });

  // Warehouse location
  drawText("Nhập tại kho:", 50, height - 260, { size: 10 });
  drawText(receiptData.warehouseLocation, 150, height - 260, {
    font: boldFont,
    size: 10,
  });

  drawText("Địa điểm:", 50, height - 280, { size: 10 });

  // Items table header
  const tableStartY = height - 320;
  const colWidths = [30, 200, 80, 40, 60, 60, 60, 60]; // Column widths
  const colPositions = [50, 80, 280, 360, 400, 460, 520, 580];

  // Table header background
  drawRect(50, tableStartY - 20, width - 100, 20, {
    color: rgb(0.9, 0.9, 0.9),
  });

  // Table headers
  const headers = [
    "STT",
    "Tên, nhãn hiệu, quy cách, phẩm chất vật tư, dụng cụ sản phẩm, hàng hóa",
    "Mã số",
    "Đơn vị tính",
    "Số lượng",
    "Số lượng",
    "Đơn giá",
    "Thành tiền",
  ];
  headers.forEach((header, index) => {
    drawText(header, colPositions[index], tableStartY - 15, {
      font: boldFont,
      size: 8,
      maxWidth: colWidths[index] - 5,
    });
  });

  // Sub-headers for quantity columns
  drawText("Theo chứng từ", 400, tableStartY - 5, { size: 7 });
  drawText("Thực nhập", 460, tableStartY - 5, { size: 7 });

  // Table rows
  let currentY = tableStartY - 40;
  let totalAmount = 0;

  receiptData.items.forEach((item, index) => {
    if (currentY < 100) {
      // Add new page if needed
      const newPage = pdfDoc.addPage([595.28, 841.89]);
      currentY = newPage.getSize().height - 50;
    }

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
      drawRect(50, currentY - 15, width - 100, 20, {
        color: rgb(0.98, 0.98, 0.98),
      });
    }

    // Draw row data
    rowData.forEach((data, colIndex) => {
      drawText(data, colPositions[colIndex], currentY - 10, {
        size: 8,
        maxWidth: colWidths[colIndex] - 5,
      });
    });

    totalAmount += item.totalAmount;
    currentY -= 20;
  });

  // Total row
  currentY -= 10;
  drawRect(50, currentY - 15, width - 100, 20, {
    color: rgb(0.95, 0.95, 0.95),
  });
  drawText("Cộng", 50, currentY - 10, { font: boldFont, size: 10 });
  drawText(totalAmount.toLocaleString("vi-VN"), 580, currentY - 10, {
    font: boldFont,
    size: 10,
  });

  // Total amount in words
  currentY -= 40;
  drawText("Tổng số tiền (Viết bằng chữ):", 50, currentY, { size: 10 });
  drawText(receiptData.totalAmountInWords, 50, currentY - 15, {
    font: boldFont,
    size: 10,
  });

  // Attached documents
  currentY -= 40;
  drawText("Số chứng từ gốc kèm theo:", 50, currentY, { size: 10 });

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
    drawText("(Ký, họ tên)", x, signatureY - 30, {
      size: 8,
      color: lightGray,
      maxWidth: signatureWidth - 10,
    });
    drawText(documentDate, x, signatureY - 50, {
      size: 8,
      color: lightGray,
      maxWidth: signatureWidth - 10,
    });
  });

  // Generate PDF bytes
  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
};
