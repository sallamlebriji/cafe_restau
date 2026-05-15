import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export const exportElementToPdf = async (elementId, filename = "document.pdf") => {
  const element = document.getElementById(elementId);
  if (!element) return;
  const canvas = await html2canvas(element, { scale: 2, backgroundColor: "#ffffff" });
  const image = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "a4");
  const width = pdf.internal.pageSize.getWidth();
  const height = (canvas.height * width) / canvas.width;
  pdf.addImage(image, "PNG", 0, 0, width, height);
  pdf.save(filename);
};

export const exportRowsToCsv = (rows, filename = "export.csv") => {
  const csv = rows.map((row) => Object.values(row).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
