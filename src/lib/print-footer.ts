import type jsPDF from 'jspdf';

export type PaperSettings = {
  paperSize?: 'A4' | 'Letter' | 'Legal' | 'A5' | 'Custom' | string;
  paperWidth?: number;
  paperHeight?: number;
};

// Standard paper dimensions in mm, given in portrait terms (narrower side
// first). Custom paper uses the admin's saved width/height instead.
const PAPER_PRESETS_MM: Record<string, [number, number]> = {
  A4: [210, 297],
  Letter: [215.9, 279.4],
  Legal: [215.9, 355.6],
  A5: [148, 210]
};

/**
 * Resolves the site's configured report paper size (from Settings) into a
 * jsPDF-ready { format, orientation } pair, honoring a custom width/height
 * when the admin has picked "Custom". Every report on the site should build
 * its jsPDF instance through this helper so a single Settings change
 * auto-adjusts every report, everywhere.
 */
export function resolvePdfFormat(settings: PaperSettings | null | undefined, orientation: 'portrait' | 'landscape') {
  let base: [number, number];

  if (settings?.paperSize === 'Custom' && settings.paperWidth && settings.paperHeight) {
    base = [settings.paperWidth, settings.paperHeight];
  } else {
    base = PAPER_PRESETS_MM[settings?.paperSize || 'A4'] || PAPER_PRESETS_MM.A4;
  }

  // Normalize to portrait (narrower side first), then flip for landscape.
  const portrait: [number, number] = base[0] <= base[1] ? base : [base[1], base[0]];
  const format: [number, number] = orientation === 'landscape' ? [portrait[1], portrait[0]] : portrait;

  return { format, orientation };
}

/** CSS `@page { size: ... }` value matching the same resolved paper size, for browser-print HTML documents. */
export function resolvePageSizeCss(settings: PaperSettings | null | undefined, orientation: 'portrait' | 'landscape') {
  const { format } = resolvePdfFormat(settings, orientation);
  return `${format[0]}mm ${format[1]}mm`;
}

// Shared header/footer used on every printed/PDF document generated from the
// admin panel, so every report looks consistent:
// - Header: masjid name, then a fixed address line, then a fixed website +
//   email line.
// - Footer: three signature lines (General Secretary, Treasurer, President) plus a
//   generated-on timestamp.
export const SIGNATURE_LABELS = ['General Secretary', 'Treasurer', 'President'] as const;

// Fixed lines shown under the masjid name on every report, regardless of
// what's saved in Settings: address on its own line, then website + email
// together on the line below it.
export const PRINT_HEADER_ADDRESS_LINE = 'Korangi No. 1, Karachi';
export const PRINT_HEADER_WEBSITE_EMAIL_LINE = 'www.jamiamasjidnoorani.com | info@jamiamasjidnoorani.com';

// Used as the body font-family on every browser-print HTML document so any
// Urdu content (names, notes) shapes/joins correctly instead of falling
// back to whatever font the browser picks on its own.
export const PRINT_FONT_STACK = 'Arial, "Urdu Typesetting", "Jameel Noori Nastaleeq", "Noto Nastaliq Urdu", Tahoma, sans-serif';

// One brand green used for the header title and the whole footer (signature
// lines/labels) on every printed/PDF document, so both bookends of a report
// are consistently green while the body stays in neutral, professional
// grays. Hex for CSS, RGB tuple for jsPDF's setTextColor/setDrawColor.
export const PRINT_GREEN_HEX = '#065f46';
export const PRINT_GREEN_RGB: [number, number, number] = [6, 95, 70];

export function formatGeneratedOn(date: Date = new Date()) {
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export const PRINT_FOOTER_STYLES = `
  .signatures { margin-top: 40px; display: flex; justify-content: space-between; gap: 24px; }
  .sig-block { flex: 1; text-align: center; }
  .sig-line { border-top: 1px solid ${PRINT_GREEN_HEX}; margin: 0 12px 6px 12px; }
  .sig-label { font-size: 12px; font-weight: 600; color: ${PRINT_GREEN_HEX}; }
  .generated-on { margin-top: 20px; text-align: center; font-size: 11px; color: #666; border-top: 1px solid #eee; padding-top: 8px; }
`;

/**
 * Draws the masjid name, then the fixed address and website/email lines, centered at the top
 * of the page. Returns the y-position to continue drawing from.
 */
export function drawPdfHeader(pdf: jsPDF, options: { siteTitle: string; pageWidth: number; startY: number }) {
  const { siteTitle, pageWidth, startY } = options;
  let y = startY;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.setTextColor(...PRINT_GREEN_RGB);
  pdf.text(siteTitle, pageWidth / 2, y, { align: 'center' });
  y += 6;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(68, 68, 68);
  pdf.text(PRINT_HEADER_ADDRESS_LINE, pageWidth / 2, y, { align: 'center' });
  y += 5;
  pdf.text(PRINT_HEADER_WEBSITE_EMAIL_LINE, pageWidth / 2, y, { align: 'center' });
  pdf.setTextColor(0, 0, 0);
  y += 8;

  return y;
}

export function buildPrintFooterHtml() {
  return `
    <div class="signatures">
      ${SIGNATURE_LABELS.map((label) => `
        <div class="sig-block">
          <div class="sig-line">&nbsp;</div>
          <div class="sig-label">${label}</div>
        </div>
      `).join('')}
    </div>
    <div class="generated-on">Generated on ${formatGeneratedOn()}</div>
  `;
}

/**
 * Draws the three signature lines + generated-on timestamp at a fixed
 * position from the bottom of the current jsPDF page. Call this last, after
 * all other content, since it does not paginate around existing content.
 */
export function drawPdfFooter(pdf: jsPDF, options: { marginLeft: number; marginRight: number; pageWidth: number; pageHeight: number }) {
  const { marginLeft, marginRight, pageWidth, pageHeight } = options;
  const contentWidth = pageWidth - marginLeft - marginRight;
  const columnWidth = contentWidth / 3;
  const lineY = pageHeight - 28;
  const labelY = lineY + 5;

  pdf.setDrawColor(...PRINT_GREEN_RGB);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...PRINT_GREEN_RGB);

  SIGNATURE_LABELS.forEach((label, index) => {
    const columnStart = marginLeft + index * columnWidth;
    const lineStart = columnStart + 6;
    const lineEnd = columnStart + columnWidth - 6;
    pdf.line(lineStart, lineY, lineEnd, lineY);
    pdf.text(label, columnStart + columnWidth / 2, labelY, { align: 'center' });
  });

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'italic');
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Generated on ${formatGeneratedOn()}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
}
