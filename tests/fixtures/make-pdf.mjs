// Builds the small PDFs the viewer tests read. Run: node tests/fixtures/make-pdf.mjs
import { writeFileSync } from 'node:fs';

/** Assembles objects into a PDF with a correct xref table. */
function pdf(objects, rootIndex) {
  let out = '%PDF-1.7\n';
  const offsets = [0];
  objects.forEach((body, index) => {
    offsets.push(out.length);
    out += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });
  const start = out.length;
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let index = 1; index <= objects.length; index++)
    out += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
  out += `trailer\n<< /Size ${objects.length + 1} /Root ${rootIndex} 0 R >>\nstartxref\n${start}\n%%EOF\n`;
  return Buffer.from(out, 'latin1');
}
const stream = (text) =>
  `<< /Length ${text.length} >>\nstream\n${text}\nendstream`;
const page = (title, body) =>
  `BT /F1 24 Tf 72 720 Td (${title}) Tj ET\nBT /F1 12 Tf 72 680 Td (${body}) Tj ET`;

writeFileSync(
  new URL('./sample.pdf', import.meta.url),
  pdf(
    [
      '<< /Type /Catalog /Pages 2 0 R >>',
      '<< /Type /Pages /Kids [3 0 R 5 0 R] /Count 2 >>',
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 7 0 R >> >> /Contents 4 0 R >>',
      stream(
        page('Mega UI Report', 'Quarterly summary for the design system team.'),
      ),
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 7 0 R >> >> /Contents 6 0 R >>',
      stream(
        page('Appendix', 'Signature and approval records live on this page.'),
      ),
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    ],
    1,
  ),
);
writeFileSync(
  new URL('./form.pdf', import.meta.url),
  pdf(
    [
      '<< /Type /Catalog /Pages 2 0 R /AcroForm << /Fields [5 0 R 6 0 R] /DA (/Helv 0 Tf 0 g) /DR << /Font << /Helv 7 0 R >> >> >> >>',
      '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 7 0 R /Helv 7 0 R >> >> /Contents 4 0 R /Annots [5 0 R 6 0 R] >>',
      stream(page('Request Form', 'Fill in the reviewer name and sign below.')),
      '<< /Type /Annot /Subtype /Widget /FT /Tx /T (reviewer) /V () /Rect [72 600 372 630] /DA (/Helv 12 Tf 0 g) /F 4 /P 3 0 R >>',
      '<< /Type /Annot /Subtype /Widget /FT /Sig /T (approval) /Rect [72 520 372 560] /F 4 /P 3 0 R >>',
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    ],
    1,
  ),
);
writeFileSync(
  new URL('./broken.pdf', import.meta.url),
  Buffer.from('%PDF-1.7\nnot a pdf at all\n'),
);
console.log('wrote sample.pdf, form.pdf, broken.pdf');

// A small red stamp image for the "도장 넣기" tool.
import { deflateSync } from 'node:zlib';
const size = 64;
const pixels = Buffer.alloc(size * (size * 4 + 1));
for (let y = 0; y < size; y++) {
  const row = y * (size * 4 + 1);
  pixels[row] = 0;
  for (let x = 0; x < size; x++) {
    const distance = Math.hypot(x - size / 2, y - size / 2);
    const ring = distance < size / 2 - 1 && distance > size / 2 - 7;
    const bar = Math.abs(y - size / 2) < 5 && distance < size / 2 - 9;
    const on = ring || bar;
    pixels.set(
      [on ? 211 : 255, on ? 47 : 255, on ? 47 : 255, on ? 255 : 0],
      row + 1 + x * 4,
    );
  }
}
const chunk = (type, body) => {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(body.length);
  const payload = Buffer.concat([Buffer.from(type, 'latin1'), body]);
  const crc = Buffer.alloc(4);
  let value = 0xffffffff;
  for (const byte of payload) {
    value ^= byte;
    for (let bit = 0; bit < 8; bit++)
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  crc.writeUInt32BE((value ^ 0xffffffff) >>> 0);
  return Buffer.concat([length, payload, crc]);
};
const header = Buffer.alloc(13);
header.writeUInt32BE(size, 0);
header.writeUInt32BE(size, 4);
header[8] = 8;
header[9] = 6;
writeFileSync(
  new URL('./stamp.png', import.meta.url),
  Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(pixels)),
    chunk('IEND', Buffer.alloc(0)),
  ]),
);
console.log('wrote stamp.png');
