declare module 'pdf-parse' {
  interface PDFData {
    numpages: number;
    text: string;
    info?: {
      Title?: string;
      Author?: string;
      [key: string]: any;
    };
  }

  function pdfParse(buffer: Buffer): Promise<PDFData>;
  export = pdfParse;
}
