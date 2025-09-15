import PDFDocument from "pdfkit";
import fs from "fs";

export function generatePDF(text, filepath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40 });
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    text.split("\n").forEach((line) => doc.text(line));
    doc.end();

    stream.on("finish", resolve);
    stream.on("error", reject);
  });
}
