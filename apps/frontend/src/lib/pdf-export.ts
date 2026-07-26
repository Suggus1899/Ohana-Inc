import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ExportData {
  title: string;
  subtitle: string;
  operatorName: string;
  stats: {
    total: number;
    approved: number;
    rejected: number;
  };
  headers: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rows: any[][];
  fileName: string;
}

export const exportToPDF = ({
  title,
  subtitle,
  operatorName,
  stats,
  headers,
  rows,
  fileName
}: ExportData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Color Palette
  const primaryColor = [16, 185, 129] as [number, number, number]; // Emerald 500 (Habitas primary)
  const secondaryColor = [71, 85, 105]; // Slate 600
  const lightGray = [241, 245, 249];

  // Header
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('Habitas', 14, 25);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('REPORTE DE OPERACIONES', pageWidth - 14, 15, { align: 'right' });
  doc.text(new Date().toLocaleString(), pageWidth - 14, 22, { align: 'right' });

  // Title & Subtitle
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 55);

  doc.setFontSize(11);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFont('helvetica', 'normal');
  doc.text(subtitle, 14, 62);

  // Operator Info
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Operador: ${operatorName}`, 14, 75);

  // Stats Box
  doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.roundedRect(14, 82, pageWidth - 28, 20, 2, 2, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('RESUMEN:', 20, 94);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Total: ${stats.total}`, 50, 94);
  doc.setTextColor(5, 150, 105);
  doc.text(`Aprobados: ${stats.approved}`, 85, 94);
  doc.setTextColor(220, 38, 38);
  doc.text(`Rechazados: ${stats.rejected}`, 130, 94);

  // Table
  autoTable(doc, {
    startY: 110,
    head: [headers],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [51, 65, 85],
      cellPadding: 4
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251]
    },
    margin: { left: 14, right: 14 }
  });

  // Footer on each page
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pageCount = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Página ${i} de ${pageCount} - Documento generado automáticamente por el sistema Habitas`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  doc.save(`${fileName}_${new Date().getTime()}.pdf`);
};
