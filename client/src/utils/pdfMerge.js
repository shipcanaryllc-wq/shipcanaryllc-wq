/**
 * PDF Merge Utility
 * 
 * Merges multiple PDFs from URLs into a single PDF file.
 * Uses pdf-lib to fetch, load, and combine PDF documents.
 * 
 * Dependencies:
 * - pdf-lib: npm package for PDF manipulation
 * 
 * Usage:
 *   const mergedPdf = await mergePdfsFromUrls([url1, url2, url3]);
 *   downloadPdf(mergedPdf, 'labels-2024-01-15.pdf');
 */

import { PDFDocument } from 'pdf-lib';
import axios from 'axios';

/**
 * Merges multiple PDFs from URLs into a single PDF
 * Supports both direct URLs and authenticated endpoints
 * @param {string[]} urls - Array of PDF URLs to merge
 * @param {Object} options - Options for fetching PDFs
 * @param {string} options.authToken - Authorization token for authenticated requests
 * @returns {Promise<{pdf: Uint8Array, missingCount: number}>} Merged PDF and count of missing PDFs
 */
export async function mergePdfsFromUrls(urls, options = {}) {
  const mergedPdf = await PDFDocument.create();
  const { authToken } = options;
  let missingCount = 0;
  
  for (const url of urls) {
    try {
      let arrayBuffer;
      
      // Use axios for authenticated requests (handles blob responseType)
      if (authToken) {
        const response = await axios.get(url, {
          responseType: 'arraybuffer',
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        arrayBuffer = response.data;
      } else {
        // Use fetch for public URLs
        const response = await fetch(url);
        if (!response.ok) {
          console.warn(`Failed to fetch PDF from ${url}: ${response.statusText}`);
          missingCount++;
          continue;
        }
        arrayBuffer = await response.arrayBuffer();
      }
      
      // Load PDF document
      const pdf = await PDFDocument.load(arrayBuffer);
      
      // Copy all pages from this PDF into the merged PDF
      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      pages.forEach((page) => mergedPdf.addPage(page));
    } catch (error) {
      console.error(`Error merging PDF from ${url}:`, error);
      missingCount++;
      // Continue with other PDFs even if one fails
    }
  }
  
  // Generate merged PDF bytes
  const pdfBytes = await mergedPdf.save();
  return { pdf: pdfBytes, missingCount };
}

/**
 * Downloads a PDF blob as a file
 * @param {Uint8Array} pdfBytes - PDF bytes to download
 * @param {string} filename - Filename for the download
 */
export function downloadPdf(pdfBytes, filename) {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up blob URL after a delay
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

