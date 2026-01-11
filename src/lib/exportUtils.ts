import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface CalculationExportData {
  productName: string;
  quantity: number;
  paperCost: number;
  inkCost: number;
  varnishCost: number;
  otherMaterialCost: number;
  laborCost: number;
  energyCost: number;
  equipmentCost: number;
  rentCost: number;
  otherOperationalCost: number;
  marginPercentage: number;
  fixedProfit: number | null;
  totalCost: number;
  profit: number;
  salePrice: number;
  unitPrice: number;
  createdAt: string;
}

const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

export const exportToPdf = async (data: CalculationExportData): Promise<void> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFillColor(20, 20, 20);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('PreciGraf', 14, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Calculadora de Precificação', 14, 33);
  
  // Product Name
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(data.productName, 14, 55);
  
  // Date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  const formattedDate = format(new Date(data.createdAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
  doc.text(`Data do cálculo: ${formattedDate}`, 14, 63);
  
  // Quantity
  doc.text(`Quantidade: ${data.quantity} unidades`, 14, 70);
  
  // Main Results Box
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(14, 78, pageWidth - 28, 35, 3, 3, 'F');
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Preço Final de Venda', 20, 90);
  doc.setFontSize(20);
  doc.text(formatCurrency(data.salePrice), 20, 102);
  
  doc.setFontSize(12);
  doc.text('Preço por Unidade', pageWidth / 2 + 10, 90);
  doc.setFontSize(20);
  doc.setTextColor(22, 163, 74);
  doc.text(formatCurrency(data.unitPrice), pageWidth / 2 + 10, 102);
  
  // Cost Breakdown Table
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Detalhamento de Custos', 14, 128);
  
  const rawMaterialsTotal = data.paperCost + data.inkCost + data.varnishCost + data.otherMaterialCost;
  const operationalTotal = data.laborCost + data.energyCost + data.equipmentCost + data.rentCost + data.otherOperationalCost;
  
  const costData = [
    ['MATÉRIA-PRIMA', ''],
    ['Papel', formatCurrency(data.paperCost * data.quantity)],
    ['Alça', formatCurrency(data.inkCost * data.quantity)],
    ['Tinta', formatCurrency(data.varnishCost * data.quantity)],
    ['Outros materiais', formatCurrency(data.otherMaterialCost * data.quantity)],
    ['Subtotal Matéria-prima', formatCurrency(rawMaterialsTotal * data.quantity)],
    ['', ''],
    ['CUSTOS OPERACIONAIS', ''],
    ['Mão de obra', formatCurrency(data.laborCost)],
    ['Energia', formatCurrency(data.energyCost)],
    ['Equipamentos', formatCurrency(data.equipmentCost)],
    ['Espaço', formatCurrency(data.rentCost)],
    ['Outros custos', formatCurrency(data.otherOperationalCost)],
    ['Subtotal Operacional', formatCurrency(operationalTotal)],
    ['', ''],
    ['CUSTO TOTAL DE PRODUÇÃO', formatCurrency(data.totalCost)],
    ['', ''],
    ['MARGEM DE LUCRO', data.fixedProfit ? `R$ ${data.fixedProfit.toFixed(2)} (fixo)` : `${data.marginPercentage}%`],
    ['LUCRO', formatCurrency(data.profit)],
  ];

  autoTable(doc, {
    startY: 135,
    head: [],
    body: costData,
    theme: 'plain',
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    columnStyles: {
      0: { fontStyle: 'normal', cellWidth: 100 },
      1: { halign: 'right', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      const text = data.cell.text[0];
      if (text.includes('MATÉRIA-PRIMA') || text.includes('CUSTOS OPERACIONAIS') || text.includes('CUSTO TOTAL') || text.includes('MARGEM') || text.includes('LUCRO')) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [240, 240, 240];
      }
      if (text.includes('Subtotal')) {
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Gerado por PreciGraf - Calculadora de Precificação', pageWidth / 2, pageHeight - 10, { align: 'center' });

  // Download
  const fileName = `precigraf-${data.productName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(fileName);
};

export const exportToExcel = async (data: CalculationExportData): Promise<void> => {
  const rawMaterialsTotal = data.paperCost + data.inkCost + data.varnishCost + data.otherMaterialCost;
  const operationalTotal = data.laborCost + data.energyCost + data.equipmentCost + data.rentCost + data.otherOperationalCost;
  
  const formattedDate = format(new Date(data.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR });
  
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PreciGraf';
  workbook.created = new Date();
  
  const worksheet = workbook.addWorksheet('Cálculo');
  
  // Set column widths
  worksheet.columns = [
    { width: 35 },
    { width: 25 },
  ];
  
  // Header styling
  const headerStyle: Partial<ExcelJS.Style> = {
    font: { bold: true, size: 14 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a1a1a' } },
  };
  
  const sectionStyle: Partial<ExcelJS.Style> = {
    font: { bold: true },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } },
  };
  
  // Title
  const titleRow = worksheet.addRow(['PreciGraf - Calculadora de Precificação']);
  titleRow.font = { bold: true, size: 16 };
  worksheet.mergeCells('A1:B1');
  
  worksheet.addRow([]);
  
  // Product Info Section
  const infoHeader = worksheet.addRow(['INFORMAÇÕES DO PRODUTO', '']);
  infoHeader.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
  });
  worksheet.addRow(['Produto', data.productName]);
  worksheet.addRow(['Quantidade', data.quantity]);
  worksheet.addRow(['Data do Cálculo', formattedDate]);
  
  worksheet.addRow([]);
  
  // Results Section
  const resultsHeader = worksheet.addRow(['RESULTADOS', '']);
  resultsHeader.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
  });
  const salePriceRow = worksheet.addRow(['Preço Final de Venda', data.salePrice]);
  salePriceRow.getCell(2).numFmt = '"R$" #,##0.00';
  const unitPriceRow = worksheet.addRow(['Preço por Unidade', data.unitPrice]);
  unitPriceRow.getCell(2).numFmt = '"R$" #,##0.00';
  
  worksheet.addRow([]);
  
  // Raw Materials Section
  const rawHeader = worksheet.addRow(['MATÉRIA-PRIMA (por unidade)', '']);
  rawHeader.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
  });
  
  const addCurrencyRow = (label: string, value: number) => {
    const row = worksheet.addRow([label, value]);
    row.getCell(2).numFmt = '"R$" #,##0.00';
    return row;
  };
  
  addCurrencyRow('Papel', data.paperCost);
  addCurrencyRow('Alça', data.inkCost);
  addCurrencyRow('Tinta', data.varnishCost);
  addCurrencyRow('Outros materiais', data.otherMaterialCost);
  const subtotalRaw = addCurrencyRow('Subtotal Matéria-prima (total)', rawMaterialsTotal * data.quantity);
  subtotalRaw.font = { bold: true };
  
  worksheet.addRow([]);
  
  // Operational Costs Section
  const opHeader = worksheet.addRow(['CUSTOS OPERACIONAIS (total do lote)', '']);
  opHeader.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
  });
  
  addCurrencyRow('Mão de obra', data.laborCost);
  addCurrencyRow('Energia', data.energyCost);
  addCurrencyRow('Equipamentos', data.equipmentCost);
  addCurrencyRow('Espaço', data.rentCost);
  addCurrencyRow('Outros custos', data.otherOperationalCost);
  const subtotalOp = addCurrencyRow('Subtotal Operacional', operationalTotal);
  subtotalOp.font = { bold: true };
  
  worksheet.addRow([]);
  
  // Summary Section
  const summaryHeader = worksheet.addRow(['RESUMO', '']);
  summaryHeader.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
  });
  
  addCurrencyRow('Custo Total de Produção', data.totalCost);
  worksheet.addRow(['Margem de Lucro', data.fixedProfit ? `R$ ${data.fixedProfit.toFixed(2)} (fixo)` : `${data.marginPercentage}%`]);
  addCurrencyRow('Lucro', data.profit);
  
  // Generate and download file
  const fileName = `precigraf-${data.productName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
