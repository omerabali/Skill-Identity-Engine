import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Set the worker source using bundled worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

// Extract text from PDF pages
async function extractTextContent(pdf: pdfjsLib.PDFDocumentProxy): Promise<string> {
  let fullText = '';
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += pageText + '\n\n';
  }
  
  return fullText.trim();
}

// Render page to canvas and extract image for OCR
async function renderPageToImage(page: pdfjsLib.PDFPageProxy): Promise<Blob> {
  const scale = 2; // Higher scale for better OCR quality
  const viewport = page.getViewport({ scale });
  
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d')!;
  canvas.height = viewport.height;
  canvas.width = viewport.width;
  
  await page.render({
    canvasContext: context,
    viewport: viewport
  }).promise;
  
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob!);
    }, 'image/png');
  });
}

// OCR using Lovable AI vision model
async function performOCR(imageBlobs: Blob[]): Promise<string> {
  // Convert blobs to base64
  const base64Images = await Promise.all(
    imageBlobs.map(async (blob) => {
      const buffer = await blob.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      return `data:image/png;base64,${base64}`;
    })
  );

  // Call the OCR edge function
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ocr-pdf`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ images: base64Images }),
  });

  if (!response.ok) {
    throw new Error('OCR işlemi başarısız');
  }

  const { text } = await response.json();
  return text;
}

export async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  // First try normal text extraction
  const textContent = await extractTextContent(pdf);
  
  // If text is sufficient (more than 100 chars), return it
  if (textContent.length >= 100) {
    return textContent;
  }
  
  // Otherwise, use OCR for image-based PDFs
  console.log('Text extraction insufficient, using OCR...');
  
  const imageBlobs: Blob[] = [];
  const maxPages = Math.min(pdf.numPages, 10); // Limit to 10 pages for OCR
  
  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    const blob = await renderPageToImage(page);
    imageBlobs.push(blob);
  }
  
  const ocrText = await performOCR(imageBlobs);
  return ocrText;
}
