'use client';

import { useState } from 'react';
import { X, Download, Printer, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

type ShopRecord = {
  _id: string;
  shopName: string;
  ownerName: string;
  contactNumber: string;
  buyDate: string | Date;
  buyRate: number;
  debtAmount: number;
  monthlyRent: number;
  monthsDue: number;
  paymentStatus: string;
  note: string;
};

interface ShopDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shopData: ShopRecord | null;
}

function formatDate(value: unknown) {
  if (!value) return '-';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

export function ShopDetailsModal({ open, onOpenChange, shopData }: ShopDetailsModalProps) {
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);

  if (!shopData) return null;

  async function generatePDF() {
    setIsLoadingPdf(true);
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const marginLeft = 15;
      const marginTop = 15;
      const marginRight = 15;
      const lineHeight = 7;

      let yPosition = marginTop;

      // Header
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Shop Record', marginLeft, yPosition);
      yPosition += 10;

      // Divider
      pdf.setDrawColor(0, 100, 0);
      pdf.line(marginLeft, yPosition, pageWidth - marginRight, yPosition);
      yPosition += 8;

      // Details Section
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');

      const details = [
        { label: 'Shop Name:', value: shopData!.shopName },
        { label: 'Owner Name:', value: shopData!.ownerName },
        { label: 'Contact Number:', value: shopData!.contactNumber || '-' },
        { label: 'Buy Date:', value: formatDate(shopData!.buyDate) },
        { label: 'Buy Rate:', value: formatCurrency(shopData!.buyRate) },
        { label: 'Debt Amount:', value: formatCurrency(shopData!.debtAmount) },
        { label: 'Monthly Rent:', value: formatCurrency(shopData!.monthlyRent) },
        { label: 'Rent Due After:', value: `${shopData!.monthsDue} months` },
        { label: 'Payment Status:', value: shopData!.paymentStatus },
        { label: 'Notes:', value: shopData!.note || '-' }
      ];

      details.forEach((detail) => {
        if (yPosition > pageHeight - marginTop - 10) {
          pdf.addPage();
          yPosition = marginTop;
        }

        pdf.setFont('helvetica', 'bold');
        pdf.text(detail.label, marginLeft, yPosition);
        
        pdf.setFont('helvetica', 'normal');
        const valueX = marginLeft + 50;
        const maxWidth = pageWidth - marginRight - valueX;
        
        const splitText = pdf.splitTextToSize(detail.value, maxWidth);
        pdf.text(splitText as string[], valueX, yPosition);
        
        yPosition += lineHeight * splitText.length + 2;
      });

      // Footer
      yPosition = pageHeight - marginTop - 5;
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(128, 128, 128);
      pdf.text(
        `Generated on ${new Date().toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}`,
        marginLeft,
        yPosition
      );

      // Download
      pdf.save(`shop-record-${shopData!.shopName.replace(/\s+/g, '-').toLowerCase()}.pdf`);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setIsLoadingPdf(false);
    }
  }

  function handlePrint() {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Shop Record - ${shopData!.shopName}</title>
        <style>
          @media print {
            body { margin: 0; padding: 20mm; }
            .no-print { display: none; }
          }
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: white;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 8px;
          }
          h1 {
            color: #166534;
            border-bottom: 2px solid #166534;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 20px;
          }
          .detail-item {
            break-inside: avoid;
          }
          .detail-label {
            font-weight: bold;
            color: #333;
            margin-bottom: 4px;
          }
          .detail-value {
            color: #666;
            padding-left: 10px;
            border-left: 2px solid #ddd;
          }
          .notes-section {
            grid-column: 1 / -1;
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid #ddd;
          }
          .footer {
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #999;
            text-align: right;
          }
          @media print {
            .container {
              border: none;
              box-shadow: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Shop Record</h1>
          <div class="details-grid">
            <div class="detail-item">
              <div class="detail-label">Shop Name</div>
              <div class="detail-value">${shopData!.shopName}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Owner Name</div>
              <div class="detail-value">${shopData!.ownerName}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Contact Number</div>
              <div class="detail-value">${shopData!.contactNumber || '-'}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Buy Date</div>
              <div class="detail-value">${formatDate(shopData!.buyDate)}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Buy Rate</div>
              <div class="detail-value">${formatCurrency(shopData!.buyRate)}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Debt Amount</div>
              <div class="detail-value">${formatCurrency(shopData!.debtAmount)}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Monthly Rent</div>
              <div class="detail-value">${formatCurrency(shopData!.monthlyRent)}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Rent Due After Months</div>
              <div class="detail-value">${shopData!.monthsDue}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Payment Status</div>
              <div class="detail-value">${shopData!.paymentStatus}</div>
            </div>
            <div class="notes-section">
              <div class="detail-label">Notes</div>
              <div class="detail-value">${shopData!.note || '-'}</div>
            </div>
          </div>
          <div class="footer">
            Generated on ${new Date().toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sticky top-0 bg-white z-10 pb-4">
          <DialogTitle className="text-2xl font-bold text-emerald-900">Shop Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pr-6">
          {/* Shop Information */}
          <Card className="p-6 border-emerald-200 bg-emerald-50">
            <h3 className="text-lg font-semibold text-emerald-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DetailField label="Shop Name" value={shopData.shopName} />
              <DetailField label="Owner Name" value={shopData.ownerName} />
              <DetailField label="Contact Number" value={shopData.contactNumber || '-'} />
            </div>
          </Card>

          {/* Financial Information */}
          <Card className="p-6 border-blue-200 bg-blue-50">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Financial Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DetailField label="Buy Date" value={formatDate(shopData.buyDate)} />
              <DetailField label="Buy Rate" value={formatCurrency(shopData.buyRate)} />
              <DetailField label="Debt Amount" value={formatCurrency(shopData.debtAmount)} />
              <DetailField label="Monthly Rent" value={formatCurrency(shopData.monthlyRent)} />
            </div>
          </Card>

          {/* Payment Information */}
          <Card className="p-6 border-purple-200 bg-purple-50">
            <h3 className="text-lg font-semibold text-purple-900 mb-4">Payment Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DetailField label="Rent Due After Months" value={`${shopData.monthsDue} months`} />
              <div>
                <label className="block text-sm font-medium text-purple-700 mb-1">Payment Status</label>
                <div className="mt-2">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                      shopData.paymentStatus === 'Clear'
                        ? 'bg-green-200 text-green-800'
                        : shopData.paymentStatus === 'Due'
                          ? 'bg-red-200 text-red-800'
                          : 'bg-yellow-200 text-yellow-800'
                    }`}
                  >
                    {shopData.paymentStatus}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Notes */}
          {shopData.note && (
            <Card className="p-6 border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{shopData.note}</p>
            </Card>
          )}
        </div>

        <DialogFooter className="sticky bottom-0 bg-white pt-4 mt-6 border-t gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            variant="outline"
            onClick={handlePrint}
            className="gap-2"
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button
            onClick={generatePDF}
            disabled={isLoadingPdf}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
          >
            {isLoadingPdf ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <p className="text-gray-900 font-medium">{value}</p>
    </div>
  );
}
