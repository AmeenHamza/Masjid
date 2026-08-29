import type jsPDF from 'jspdf';

// jsPDF's built-in fonts (Helvetica/Times/Courier) have zero Arabic/Urdu
// glyph coverage - any Urdu text drawn with pdf.text() comes out as blank
// boxes or garbled substitutions. There's no bundled Unicode font here to
// embed, so instead we rasterize Urdu text through the browser's own text
// engine (an offscreen <canvas>, which performs correct Arabic-script
// shaping/joining automatically) and drop the result into the PDF as an
// image. Plain Latin/number text is untouched and still drawn as real text.

// Arabic (U+0600-06FF), Arabic Supplement (U+0750-077F), Arabic Extended-A
// (U+08A0-08FF), Arabic Presentation Forms A/B (U+FB50-FDFF, U+FE70-FEFC) -
// covers the Urdu alphabet plus the joined presentation-form glyphs.
const ARABIC_SCRIPT_RE = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-ﻼ]/;

export function containsArabicScript(text: string) {
  return ARABIC_SCRIPT_RE.test(text);
}

// Windows ships "Urdu Typesetting" (proper Nastaliq) since Vista; the rest
// are common fallbacks so this still works cross-platform if that's absent.
const URDU_FONT_STACK = '"Urdu Typesetting","Jameel Noori Nastaleeq","Noto Nastaliq Urdu","Noto Naskh Arabic",Tahoma,Arial,sans-serif';

// A fixed rendering DPI ties canvas pixels to real-world mm consistently,
// independent of the font size being drawn - see widthMm/heightMm below.
const RENDER_DPI = 300;
const PX_PER_MM = RENDER_DPI / 25.4;
const PX_PER_PT = RENDER_DPI / 72;

function canvasContext2d() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');
  return { canvas, ctx };
}

function renderLineToPng(text: string, fontPx: number) {
  const { canvas, ctx } = canvasContext2d();
  ctx.font = `${fontPx}px ${URDU_FONT_STACK}`;
  const textWidth = Math.max(1, ctx.measureText(text).width);
  const paddingPx = fontPx * 0.15;
  canvas.width = Math.ceil(textWidth + paddingPx * 2);
  canvas.height = Math.ceil(fontPx * 1.5);

  // Resizing the canvas resets all context state, so font/alignment must be
  // set again after the width/height assignment above.
  ctx.font = `${fontPx}px ${URDU_FONT_STACK}`;
  ctx.direction = 'rtl';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#000000';
  ctx.fillText(text, canvas.width - paddingPx, canvas.height / 2);

  return { dataUrl: canvas.toDataURL('image/png'), widthPx: canvas.width, heightPx: canvas.height };
}

/**
 * Word-wraps Arabic/Urdu text to maxWidthMm using canvas-measured widths
 * (jsPDF's own splitTextToSize uses Helvetica metrics, which don't apply to
 * a script it can't even render). Exported so callers that need to know the
 * line count up front - e.g. to size a table row before drawing it - can
 * measure without drawing.
 */
export function wrapArabicText(text: string, fontSizePt: number, maxWidthMm: number): string[] {
  if (!text) return [''];
  const fontPx = fontSizePt * PX_PER_PT;
  const maxWidthPx = maxWidthMm * PX_PER_MM;
  const { ctx } = canvasContext2d();
  ctx.font = `${fontPx}px ${URDU_FONT_STACK}`;

  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidthPx && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [''];
}

export type PdfTextAlign = 'left' | 'center' | 'right';

/**
 * Draws text at (x, y) exactly like pdf.text(text, x, y, { align }) - but if
 * the text contains Arabic/Urdu script, it's embedded as a correctly-shaped
 * image instead of jsPDF's built-in (Arabic-incapable) font.
 */
export function drawPdfText(pdf: jsPDF, text: string, x: number, y: number, fontSizePt: number, align: PdfTextAlign = 'left') {
  if (!text) return;
  if (!containsArabicScript(text)) {
    pdf.text(text, x, y, { align });
    return;
  }

  const fontPx = fontSizePt * PX_PER_PT;
  const { dataUrl, widthPx, heightPx } = renderLineToPng(text, fontPx);
  const heightMm = heightPx / PX_PER_MM;
  const widthMm = widthPx / PX_PER_MM;
  const imageX = align === 'center' ? x - widthMm / 2 : align === 'right' ? x - widthMm : x;
  // pdf.text()'s y is a baseline; addImage's y is a top edge, so shift up to
  // land in roughly the same visual position.
  pdf.addImage(dataUrl, 'PNG', imageX, y - heightMm * 0.72, widthMm, heightMm);
}

/**
 * Same as drawPdfText, but word-wraps to maxWidthMm first (for longer note/
 * value fields) and draws one line per row, `lineHeightMm` apart. Returns
 * the number of lines drawn, so callers can advance their own y-cursor.
 */
export function drawWrappedPdfText(pdf: jsPDF, text: string, x: number, y: number, fontSizePt: number, maxWidthMm: number, lineHeightMm: number, align: PdfTextAlign = 'left'): number {
  if (!text) return 0;

  if (!containsArabicScript(text)) {
    const lines = pdf.splitTextToSize(text, maxWidthMm) as string[];
    pdf.text(lines, x, y, { align });
    return lines.length;
  }

  const lines = wrapArabicText(text, fontSizePt, maxWidthMm);
  lines.forEach((line, index) => {
    drawPdfText(pdf, line, x, y + index * lineHeightMm, fontSizePt, align);
  });

  return lines.length;
}
