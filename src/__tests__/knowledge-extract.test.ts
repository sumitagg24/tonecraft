/**
 * Knowledge PDF ingestion — regression test for the real pdf-parse path.
 *
 * Builds a minimal but valid single-page PDF in memory (with a correct xref
 * table) and asserts extractText() pulls the text layer out of it. This is the
 * path that was previously dead: PDFs were decoded as UTF-8 garbage (before
 * pdf-parse was installed) or silently produced empty text.
 */
import { extractText, PdfParseError, detectMimeType } from "@/lib/knowledge/extract";

/** Assemble a minimal PDF with correct xref byte offsets. */
function buildMinimalPdf(text: string): Buffer {
  const objects: string[] = [];
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push("<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  objects.push(
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>"
  );
  const stream = `BT /F1 24 Tf 72 720 Td (${text}) Tj ET`;
  objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  const chunks: Buffer[] = [Buffer.from("%PDF-1.4\n")];
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(Buffer.concat(chunks).length);
    chunks.push(Buffer.from(`${i + 1} 0 obj\n${body}\nendobj\n`));
  });
  const xrefStart = Buffer.concat(chunks).length;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) {
    xref += `${String(off).padStart(10, "0")} 00000 n \n`;
  }
  chunks.push(
    Buffer.from(`${xref}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`)
  );
  return Buffer.concat(chunks);
}

describe("knowledge PDF extraction (pdf-parse)", () => {
  it("detects .pdf files as application/pdf", () => {
    expect(detectMimeType("guide.pdf")).toBe("application/pdf");
  });

  it("extracts the text layer from a real PDF buffer", async () => {
    const pdf = buildMinimalPdf("Hello ToneCraft");
    const text = await extractText("application/pdf", pdf);
    expect(text).toContain("Hello ToneCraft");
  });

  it("preserves the caller's buffer (no worker detach)", async () => {
    const pdf = buildMinimalPdf("Buffer intact");
    const copy = Buffer.from(pdf);
    await extractText("application/pdf", pdf);
    expect(Buffer.compare(pdf, copy)).toBe(0);
  });

  it("throws PdfParseError for an unparseable PDF", async () => {
    const garbage = Buffer.from("%PDF-1.4\nnot a real pdf at all, just filler text here");
    await expect(extractText("application/pdf", garbage)).rejects.toBeInstanceOf(PdfParseError);
  });
});
