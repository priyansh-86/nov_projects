import { PDFDocument, degrees, rgb, StandardFonts } from "pdf-lib";
import download from "downloadjs";

const readFileAsync = (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

// 1. ROTATE
export const rotatePDF = async (file: File, rotationAngle: number = 90) => {
  try {
    const fileBuffer = await readFileAsync(file);
    const pdfDoc = await PDFDocument.load(fileBuffer);
    const pages = pdfDoc.getPages();
    pages.forEach((page) => {
      const currentRotation = page.getRotation().angle;
      page.setRotation(degrees(currentRotation + rotationAngle));
    });
    const pdfBytes = await pdfDoc.save();
    download(pdfBytes, `rotated-${file.name}`, "application/pdf");
    return true;
  } catch (error) {
    console.error("Error rotating PDF:", error);
    return false;
  }
};

// 2. MERGE
export const mergePDFs = async (files: File[]) => {
  try {
    const mergedPdf = await PDFDocument.create();
    for (const file of files) {
      const fileBuffer = await readFileAsync(file);
      const pdf = await PDFDocument.load(fileBuffer);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }
    const pdfBytes = await mergedPdf.save();
    download(pdfBytes, `merged-document.pdf`, "application/pdf");
    return true;
  } catch (error) {
    console.error("Error merging PDFs:", error);
    return false;
  }
};

// 3. SPLIT
export const splitPDF = async (file: File, range: string) => {
  try {
    const fileBuffer = await readFileAsync(file);
    const srcDoc = await PDFDocument.load(fileBuffer);
    const newDoc = await PDFDocument.create();
    const totalPages = srcDoc.getPageCount();
    const pageIndices: number[] = [];
    const parts = range.split(",").map((p) => p.trim());

    for (const part of parts) {
      if (part.includes("-")) {
        const [start, end] = part.split("-").map((n) => parseInt(n));
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = start; i <= end; i++) {
            if (i >= 1 && i <= totalPages) pageIndices.push(i - 1);
          }
        }
      } else {
        const pageNum = parseInt(part);
        if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
          pageIndices.push(pageNum - 1);
        }
      }
    }
    const uniqueIndices = [...new Set(pageIndices)].sort((a, b) => a - b);
    if (uniqueIndices.length === 0) {
      alert("Invalid page range!");
      return false;
    }
    const copiedPages = await newDoc.copyPages(srcDoc, uniqueIndices);
    copiedPages.forEach((page) => newDoc.addPage(page));
    const pdfBytes = await newDoc.save();
    download(pdfBytes, `split-${file.name}`, "application/pdf");
    return true;
  } catch (error) {
    console.error("Error splitting PDF:", error);
    return false;
  }
};

// 4. PROTECT
export const protectPDF = async (file: File, password: string) => {
  try {
    const fileBuffer = await readFileAsync(file);
    const pdfDoc = await PDFDocument.load(fileBuffer);
    // @ts-ignore
    if (typeof pdfDoc.encrypt !== 'function') {
      alert("Please update pdf-lib to v1.17.1+");
      return false;
    }
    // @ts-ignore
    pdfDoc.encrypt({ userPassword: password, ownerPassword: password, permissions: { printing: "highResolution", modifying: false, copying: false } });
    const pdfBytes = await pdfDoc.save();
    download(pdfBytes, `protected-${file.name}`, "application/pdf");
    return true;
  } catch (error) {
    console.error("Error protecting PDF:", error);
    return false;
  }
};

// 5. COMPRESS
export const compressPDF = async (file: File) => {
  try {
    const fileBuffer = await readFileAsync(file);
    const pdfDoc = await PDFDocument.load(fileBuffer);
    const pdfBytes = await pdfDoc.save({ useObjectStreams: false }); 
    download(pdfBytes, `compressed-${file.name}`, "application/pdf");
    return true;
  } catch (error) {
    console.error("Error compressing PDF:", error);
    return false;
  }
};

// 6. IMAGE TO PDF
export const imagesToPDF = async (files: File[]) => {
  try {
    const pdfDoc = await PDFDocument.create();
    for (const file of files) {
      const fileBuffer = await readFileAsync(file);
      const img = file.type === "image/png" 
        ? await pdfDoc.embedPng(fileBuffer) 
        : await pdfDoc.embedJpg(fileBuffer);
      const page = pdfDoc.addPage([img.width, img.height]);
      page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
    }
    const pdfBytes = await pdfDoc.save();
    download(pdfBytes, "images-converted.pdf", "application/pdf");
    return true;
  } catch (error) {
    console.error("Error converting images:", error);
    return false;
  }
};

// ==============================
// 7. WATERMARK (NEW) 💧
// ==============================
export const addWatermark = async (file: File, text: string) => {
  try {
    const fileBuffer = await readFileAsync(file);
    const pdfDoc = await PDFDocument.load(fileBuffer);
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pages = pdfDoc.getPages();

    pages.forEach((page) => {
      const { width, height } = page.getSize();
      const fontSize = 50;
      const textWidth = font.widthOfTextAtSize(text, fontSize);
      const textHeight = font.heightAtSize(fontSize);

      // Draw text diagonally in center
      page.drawText(text, {
        x: width / 2 - textWidth / 2,
        y: height / 2 - textHeight / 2,
        size: fontSize,
        font: font,
        color: rgb(0.75, 0.75, 0.75), // Light Gray
        opacity: 0.5,
        rotate: degrees(45),
      });
    });

    const pdfBytes = await pdfDoc.save();
    download(pdfBytes, `watermarked-${file.name}`, "application/pdf");
    return true;
  } catch (error) {
    console.error("Error adding watermark:", error);
    return false;
  }
};

// ==============================
// 8. PAGE NUMBERS (NEW) 🔢
// ==============================
export const addPageNumbers = async (file: File) => {
  try {
    const fileBuffer = await readFileAsync(file);
    const pdfDoc = await PDFDocument.load(fileBuffer);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pages = pdfDoc.getPages();
    const totalPages = pages.length;

    pages.forEach((page, idx) => {
      const { width } = page.getSize();
      const text = `${idx + 1} of ${totalPages}`;
      const fontSize = 12;
      const textWidth = font.widthOfTextAtSize(text, fontSize);

      page.drawText(text, {
        x: width / 2 - textWidth / 2, // Center Bottom
        y: 20,
        size: fontSize,
        font: font,
        color: rgb(0, 0, 0),
      });
    });

    const pdfBytes = await pdfDoc.save();
    download(pdfBytes, `numbered-${file.name}`, "application/pdf");
    return true;
  } catch (error) {
    console.error("Error adding page numbers:", error);
    return false;
  }
};