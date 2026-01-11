import { jsPDF } from 'jspdf';
import type { AnalysisResult } from '@/types';

export async function exportAnalysisToPdf(
  analysis: AnalysisResult,
  fileName: string = 'Contract Analysis'
): Promise<Blob> {
  const doc = new jsPDF();
  let yPos = 20;
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const maxWidth = pageWidth - margin * 2;
  const lineHeight = 7;

  const addText = (text: string, fontSize: number = 12, bold: boolean = false) => {
    doc.setFontSize(fontSize);
    if (bold) {
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setFont('helvetica', 'normal');
    }

    const lines = doc.splitTextToSize(text, maxWidth);
    lines.forEach((line: string) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(line, margin, yPos);
      yPos += lineHeight;
    });
  };

  const addSection = (title: string, content: string) => {
    yPos += 5;
    addText(title, 14, true);
    yPos += 2;
    addText(content, 11);
    yPos += 5;
  };

  // Header
  doc.setFillColor(37, 99, 235); // Primary blue
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Clausify', margin, 20);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('AI Contract Analysis Report', margin, 30);
  yPos = 50;

  // Reset text color
  doc.setTextColor(0, 0, 0);

  // Contract Info
  addText(`Contract: ${fileName}`, 14, true);
  addText(`Analysis Date: ${new Date().toLocaleDateString()}`, 11);
  addText(`Contract Type: ${analysis.contractType.replace('_', ' ')}`, 11);

  // Risk Score
  yPos += 5;
  const riskColors: Record<string, [number, number, number]> = {
    LOW: [34, 197, 94], // Green
    MEDIUM: [234, 179, 8], // Yellow
    HIGH: [239, 68, 68], // Red
  };
  const riskColor = riskColors[analysis.riskScore] || [100, 100, 100];
  doc.setFillColor(...riskColor);
  doc.roundedRect(margin, yPos - 5, 80, 15, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Risk Level: ${analysis.riskScore}`, margin + 5, yPos + 5);
  doc.setTextColor(0, 0, 0);
  yPos += 20;

  // Summary
  addSection('Summary', analysis.summary);

  // Red Flags
  if (analysis.redFlags.length > 0) {
    addText('Red Flags & Concerns', 14, true);
    yPos += 2;
    analysis.redFlags.forEach((flag, index) => {
      const severityLabel =
        flag.severity === 'high'
          ? '[HIGH]'
          : flag.severity === 'medium'
            ? '[MEDIUM]'
            : '[LOW]';
      addText(`${index + 1}. ${severityLabel} ${flag.title}`, 11, true);
      addText(flag.description, 10);
      if (flag.suggestion) {
        addText(`Suggestion: ${flag.suggestion}`, 10);
      }
      yPos += 3;
    });
    yPos += 5;
  }

  // Key Terms
  if (analysis.keyTerms.length > 0) {
    addText('Key Terms', 14, true);
    yPos += 2;
    analysis.keyTerms.forEach((term) => {
      addText(`${term.term}: ${term.value}`, 11);
      if (term.explanation) {
        addText(`  ${term.explanation}`, 10);
      }
    });
    yPos += 5;
  }

  // Obligations
  if (analysis.obligations.length > 0) {
    addText('Obligations', 14, true);
    yPos += 2;
    analysis.obligations.forEach((obligation) => {
      addText(`${obligation.party}:`, 11, true);
      addText(`  ${obligation.description}`, 10);
      if (obligation.deadline) {
        addText(`  Deadline: ${obligation.deadline}`, 10);
      }
    });
    yPos += 5;
  }

  // Parties
  if (analysis.parties.length > 0) {
    addText('Parties Involved', 14, true);
    yPos += 2;
    analysis.parties.forEach((party) => {
      addText(`${party.name} (${party.role})`, 11);
    });
    yPos += 5;
  }

  // Important Dates
  if (analysis.dates.length > 0) {
    addText('Important Dates', 14, true);
    yPos += 2;
    analysis.dates.forEach((date) => {
      addText(`${date.description}: ${date.date}`, 11);
    });
    yPos += 5;
  }

  // Financial Terms
  if (analysis.amounts.length > 0) {
    addText('Financial Terms', 14, true);
    yPos += 2;
    analysis.amounts.forEach((amount) => {
      addText(
        `${amount.description}: ${amount.amount}${amount.frequency ? ` (${amount.frequency})` : ''}`,
        11
      );
    });
    yPos += 5;
  }

  // Disclaimer
  doc.addPage();
  yPos = 20;
  addText('Disclaimer', 14, true);
  yPos += 2;
  addText(
    'This analysis is provided for informational purposes only and does not constitute legal advice. The AI-generated analysis may not identify all issues or accurately interpret all contract terms. We strongly recommend consulting with a qualified attorney before making any decisions based on this analysis.',
    10
  );

  // Footer on each page
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Generated by Clausify - Page ${i} of ${pageCount}`,
      margin,
      doc.internal.pageSize.getHeight() - 10
    );
  }

  return doc.output('blob');
}

export function downloadPdf(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName.replace(/\.[^/.]+$/, '')}_analysis.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
