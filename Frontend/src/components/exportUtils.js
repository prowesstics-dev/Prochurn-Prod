import htmlToImage from "html-to-image";
import jsPDF from "jspdf";
import pptxgen from "pptxgenjs";

// Utility: Hide elements by class
const hideElements = (classNames) => {
  classNames.forEach(className => {
    document.querySelectorAll(`.${className}`).forEach(el => {
      el.style.display = "none";
    });
  });
};

// Utility: Show elements again
const showElements = (classNames) => {
  classNames.forEach(className => {
    document.querySelectorAll(`.${className}`).forEach(el => {
      el.style.display = "";
    });
  });
};

export const exportAsImage = async (ignoredClasses = []) => {
    const node = document.querySelector("#exportArea");
    hideElements(ignoredClasses);
    const dataUrl = await htmlToImage.toPng(node);
    const link = document.createElement("a");
    link.download = "dashboard.png";
    link.href = dataUrl;
    link.click();
    showElements(ignoredClasses);
  };
  

export const exportAsPDF = async (ignoredClasses = []) => {
  const node = document.querySelector("#exportArea");
  hideElements(ignoredClasses);
  const dataUrl = await htmlToImage.toPng(node);
  const pdf = new jsPDF("landscape", "pt", "a4");
  const imgProps = pdf.getImageProperties(dataUrl);
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
  pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);
  pdf.save("dashboard.pdf");
  showElements(ignoredClasses);
};

export const exportAsPPT = async (ignoredClasses = []) => {
  const node = document.querySelector("#exportArea");
  hideElements(ignoredClasses);
  const dataUrl = await htmlToImage.toPng(node);
  const pptx = new pptxgen();
  const slide = pptx.addSlide();
  slide.addImage({ data: dataUrl, x: 0.5, y: 0.5, w: 8, h: 4.5 });
  pptx.writeFile("dashboard.pptx");
  showElements(ignoredClasses);
};
