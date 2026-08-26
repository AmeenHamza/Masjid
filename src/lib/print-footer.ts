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
// - Header: masjid name, then a fixed address + website line.
// - Footer: three signature lines (General Secretary, Khazin, Sadar) plus a
//   generated-on timestamp.
export const SIGNATURE_LABELS = ['General Secretary', 'Khazin', 'Sadar'] as const;

// Fixed contact line shown under the masjid name on every report, regardless
// of what's saved in Settings.
export const PRINT_HEADER_CONTACT_LINE = 'Korangi No. 1, Karachi | www.jamiamasjidnoorani.com';

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
  .sig-line { border-top: 1px solid #334155; margin: 0 12px 6px 12px; }
  .sig-label { font-size: 12px; font-weight: 600; color: #334155; }
  .generated-on { margin-top: 20px; text-align: center; font-size: 11px; color: #666; border-top: 1px solid #eee; padding-top: 8px; }
`;

/**
 * Draws the masjid name, then the fixed contact line, centered at the top
 * of the page. Returns the y-position to continue drawing from.
 */
export function drawPdfHeader(pdf: jsPDF, options: { siteTitle: string; pageWidth: number; startY: number }) {
  const { siteTitle, pageWidth, startY } = options;
  let y = startY;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.setTextColor(15, 118, 110);
  pdf.text(siteTitle, pageWidth / 2, y, { align: 'center' });
  y += 6;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(68, 68, 68);
  pdf.text(PRINT_HEADER_CONTACT_LINE, pageWidth / 2, y, { align: 'center' });
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

  pdf.setDrawColor(51, 65, 85);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(51, 65, 85);

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
