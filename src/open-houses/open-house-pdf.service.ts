import { Injectable, NotFoundException } from '@nestjs/common';
import PDFDocument from 'pdfkit';

import { OpenHousesService } from './open-houses.service';

import * as QRCode from 'qrcode';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OpenHousePdfService {
  constructor(
    private readonly openHousesService: OpenHousesService,
    private readonly configService: ConfigService,
  ) {}

  async generateFeedbackForm(
    agentId: string,
    openHouseId: string,
  ): Promise<Buffer> {
    const openHouse = await this.openHousesService.findOpenHouseDetail(
      agentId,
      openHouseId,
    );

    if (!openHouse) {
      throw new NotFoundException('Open house not found.');
    }

    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'LETTER',
        margin: 48,
        autoFirstPage: true,
      });

      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const primaryColor = openHouse.agent.primaryColor ?? '#111820';
      const secondaryColor = openHouse.agent.secondaryColor ?? '#7f1d1d';

      const pageLeft = 48;
      const pageRight = 564;
      const pageWidth = pageRight - pageLeft;

      const columnGap = 38;
      const columnWidth = (pageWidth - columnGap) / 2;
      const rightColumnX = pageLeft + columnWidth + columnGap;

      const propertyAddress = [
        openHouse.property.street,
        openHouse.property.street2,
        `${openHouse.property.city}, ${openHouse.property.state} ${openHouse.property.zip}`,
      ]
        .filter(Boolean)
        .join(', ');

      const printableQuestions = openHouse.openHouseFeedbackQuestions
        .filter((selection) => selection.printable)
        .slice()
        .sort(
          (a, b) =>
            (a.printableSortOrder ?? a.sortOrder) -
            (b.printableSortOrder ?? b.sortOrder),
        );

      // =====================================================
      // HEADER
      // =====================================================

      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor(secondaryColor)
        .text('OPEN HOUSE', pageLeft, 44, {
          characterSpacing: 1.4,
        });

      doc
        .font('Helvetica-Bold')
        .fontSize(23)
        .fillColor(primaryColor)
        .text('Property Feedback', pageLeft, 58);

      doc
        .font('Helvetica')
        .fontSize(9.5)
        .fillColor('#555d64')
        .text(propertyAddress, pageLeft, 88, {
          width: 335,
        });

      if (openHouse.agent.brokerageName) {
        doc
          .font('Helvetica-Bold')
          .fontSize(10)
          .fillColor(primaryColor)
          .text(openHouse.agent.brokerageName, 390, 59, {
            width: pageRight - 390,
            align: 'right',
          });
      }

      doc
        .strokeColor(primaryColor)
        .lineWidth(2.5)
        .moveTo(pageLeft, 112)
        .lineTo(pageRight, 112)
        .stroke();

      // =====================================================
      // VISITOR INFORMATION
      // =====================================================

      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor(secondaryColor)
        .text('VISITOR INFORMATION', pageLeft, 128, {
          characterSpacing: 1,
        });

      this.drawWriteField(doc, 'First Name', pageLeft, 151, columnWidth);

      this.drawWriteField(doc, 'Last Name', rightColumnX, 151, columnWidth);

      this.drawWriteField(doc, 'Email', pageLeft, 178, columnWidth);

      this.drawWriteField(doc, 'Phone', rightColumnX, 178, columnWidth);

      doc
        .strokeColor('#cfd3d6')
        .lineWidth(0.75)
        .moveTo(pageLeft, 202)
        .lineTo(pageRight, 202)
        .stroke();

      // =====================================================
      // QUESTIONS
      // =====================================================

      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor(secondaryColor)
        .text('YOUR FEEDBACK', pageLeft, 219, {
          characterSpacing: 1,
        });

      const numberedQuestions = printableQuestions.map((selection, index) => ({
        selection,
        number: index + 1,
      }));

      const { left, right } = this.splitQuestions(numberedQuestions);

      this.drawQuestionColumn(
        doc,
        left,
        pageLeft,
        245,
        columnWidth,
        primaryColor,
      );

      this.drawQuestionColumn(
        doc,
        right,
        rightColumnX,
        245,
        columnWidth,
        primaryColor,
      );

      // =====================================================
      // FOOTER
      // =====================================================

      const footerY = 690;

      doc
        .strokeColor(primaryColor)
        .lineWidth(2)
        .moveTo(pageLeft, footerY)
        .lineTo(pageRight, footerY)
        .stroke();

      const agentName = `${openHouse.agent.firstName} ${openHouse.agent.lastName}`;

      doc
        .font('Helvetica-Bold')
        .fontSize(9.5)
        .fillColor(primaryColor)
        .text(agentName, pageLeft, footerY + 9);

      if (openHouse.agent.brokerageName) {
        doc
          .font('Helvetica')
          .fontSize(8.5)
          .fillColor('#697077')
          .text(openHouse.agent.brokerageName, pageLeft, footerY + 23);
      }

      doc.end();
    });
  }

  // =====================================================
  // VISITOR WRITE FIELDS
  // =====================================================

  private drawWriteField(
    doc: PDFKit.PDFDocument,
    label: string,
    x: number,
    y: number,
    width: number,
  ): void {
    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor('#333a40')
      .text(label, x, y);

    const labelWidth = doc.widthOfString(label);

    doc
      .strokeColor('#60676d')
      .lineWidth(0.7)
      .moveTo(x + labelWidth + 9, y + 10)
      .lineTo(x + width, y + 10)
      .stroke();
  }

  // =====================================================
  // QUESTION COLUMN BALANCING
  // =====================================================

  private splitQuestions(
    questions: Array<{
      selection: any;
      number: number;
    }>,
  ) {
    if (questions.length <= 1) {
      return {
        left: questions,
        right: [],
      };
    }

    const totalCost = questions.reduce(
      (total, item) => total + this.getPrintableCost(item.selection),
      0,
    );

    const targetCost = totalCost / 2;

    let runningCost = 0;
    let splitIndex = 1;
    let smallestDifference = Number.POSITIVE_INFINITY;

    for (let index = 0; index < questions.length - 1; index++) {
      runningCost += this.getPrintableCost(questions[index].selection);

      const difference = Math.abs(targetCost - runningCost);

      if (difference < smallestDifference) {
        smallestDifference = difference;
        splitIndex = index + 1;
      }
    }

    return {
      left: questions.slice(0, splitIndex),
      right: questions.slice(splitIndex),
    };
  }

  // =====================================================
  // QUESTIONS
  // =====================================================

  private drawQuestionColumn(
    doc: PDFKit.PDFDocument,
    questions: Array<{
      selection: any;
      number: number;
    }>,
    x: number,
    startY: number,
    width: number,
    primaryColor: string,
  ): void {
    let y = startY;

    for (const item of questions) {
      const selection = item.selection;
      const question = selection.question;

      const numberWidth = 18;
      const labelX = x + numberWidth;
      const labelWidth = width - numberWidth;

      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor(primaryColor)
        .text(`${item.number}.`, x, y, {
          width: numberWidth,
        });

      doc.font('Helvetica-Bold').fontSize(10);

      const labelHeight = doc.heightOfString(question.label, {
        width: labelWidth,
        lineGap: 0,
      });

      doc.fillColor('#171c20').text(question.label, labelX, y, {
        width: labelWidth,
        lineGap: 0,
      });

      y += Math.max(19, labelHeight + 6);

      if (this.isRatingQuestion(selection)) {
        y = this.drawRating(doc, labelX, y, x + width);
      } else if (this.isBooleanQuestion(question)) {
        y = this.drawOptions(doc, ['Yes', 'No'], labelX, y, false, x + width);
      } else if (this.isSingleSelectQuestion(question)) {
        y = this.drawOptions(
          doc,
          question.options.map((option: any) => option.label),
          labelX,
          y,
          false,
          x + width,
        );
      } else if (this.isMultiSelectQuestion(question)) {
        y = this.drawOptions(
          doc,
          question.options.map((option: any) => option.label),
          labelX,
          y,
          true,
          x + width,
        );
      } else if (question.type === 'TEXTAREA') {
        y = this.drawTextArea(doc, labelX, y, x + width);
      } else {
        y = this.drawTextLine(doc, labelX, y, x + width);
      }

      doc
        .strokeColor('#e1e3e5')
        .lineWidth(0.5)
        .moveTo(x, y)
        .lineTo(x + width, y)
        .stroke();

      y += 9;
    }
  }

  // =====================================================
  // TEXT RESPONSES
  // =====================================================

  private drawTextLine(
    doc: PDFKit.PDFDocument,
    x: number,
    y: number,
    maxX: number,
  ): number {
    doc
      .strokeColor('#858b90')
      .lineWidth(0.7)
      .moveTo(x, y + 11)
      .lineTo(maxX, y + 11)
      .stroke();

    return y + 23;
  }

  private drawTextArea(
    doc: PDFKit.PDFDocument,
    x: number,
    y: number,
    maxX: number,
  ): number {
    doc
      .strokeColor('#858b90')
      .lineWidth(0.7)
      .moveTo(x, y + 11)
      .lineTo(maxX, y + 11)
      .stroke();

    doc
      .strokeColor('#858b90')
      .lineWidth(0.7)
      .moveTo(x, y + 27)
      .lineTo(maxX, y + 27)
      .stroke();

    return y + 39;
  }

  // =====================================================
  // RATING
  // =====================================================

  private drawRating(
    doc: PDFKit.PDFDocument,
    x: number,
    y: number,
    maxX: number,
  ): number {
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#171c20')
      .text('Poor', x, y + 1);

    let currentX = x + 34;

    for (let rating = 1; rating <= 5; rating++) {
      doc
        .circle(currentX + 3.5, y + 4.5, 3.5)
        .strokeColor('#111820')
        .lineWidth(0.8)
        .stroke();

      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor('#171c20')
        .text(String(rating), currentX + 10, y);

      currentX += 27;
    }

    const greatX = Math.min(currentX, maxX - 30);

    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#171c20')
      .text('Great', greatX, y);

    return y + 20;
  }

  // =====================================================
  // SELECT / BOOLEAN OPTIONS
  // =====================================================

  private drawOptions(
    doc: PDFKit.PDFDocument,
    options: string[],
    x: number,
    y: number,
    square: boolean,
    maxX: number,
  ): number {
    let currentX = x;
    let currentY = y;

    doc.font('Helvetica').fontSize(8);

    for (const option of options) {
      const optionWidth = doc.widthOfString(option) + 21;

      if (currentX !== x && currentX + optionWidth > maxX) {
        currentX = x;
        currentY += 16;
      }

      if (square) {
        doc
          .rect(currentX, currentY + 1, 7, 7)
          .strokeColor('#111820')
          .lineWidth(0.8)
          .stroke();
      } else {
        doc
          .circle(currentX + 3.5, currentY + 4.5, 3.5)
          .strokeColor('#111820')
          .lineWidth(0.8)
          .stroke();
      }

      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor('#171c20')
        .text(option, currentX + 11, currentY);

      currentX += optionWidth;
    }

    return currentY + 20;
  }

  // =====================================================
  // QUESTION TYPES
  // =====================================================

  private isRatingQuestion(selection: any): boolean {
    return (
      selection.question.type === 'RATING' ||
      selection.question.key.toLowerCase().includes('rating')
    );
  }

  private isBooleanQuestion(question: any): boolean {
    return ['BOOLEAN', 'YES_NO'].includes(question.type);
  }

  private isMultiSelectQuestion(question: any): boolean {
    return ['MULTI_SELECT', 'CHECKBOX', 'CHECKBOXES'].includes(question.type);
  }

  private isSingleSelectQuestion(question: any): boolean {
    return ['SINGLE_SELECT', 'RADIO'].includes(question.type);
  }

  // =====================================================
  // PRINTABLE WEIGHT
  // =====================================================

  private getPrintableCost(selection: any): number {
    const question = selection.question;

    switch (question.type) {
      case 'RATING':
        return 1;

      case 'TEXT':
        return 1.25;

      case 'TEXTAREA':
        return 1.75;

      case 'SINGLE_SELECT':
        if (question.options.length <= 3) {
          return 1;
        }

        if (question.options.length <= 5) {
          return 1.25;
        }

        if (question.options.length <= 7) {
          return 1.5;
        }

        return 1.75;

      default:
        return 1.25;
    }
  }

  async generateFlyer(agentId: string, openHouseId: string): Promise<Buffer> {
    const openHouse = await this.openHousesService.findOpenHouseDetail(
      agentId,
      openHouseId,
    );

    if (!openHouse) {
      throw new NotFoundException('Open house not found.');
    }

    const publicBaseUrl =
      this.configService.getOrThrow<string>('PUBLIC_BASE_URL');

    const publicUrl =
      `${publicBaseUrl}/${openHouse.agent.slug}` +
      `/open-house/${openHouse.publicCode}`;

    const qrUrl = `${publicUrl}?source=qr`;

    const qrBuffer = await QRCode.toBuffer(qrUrl, {
      type: 'png',
      width: 500,
      margin: 1,
    });

    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'LETTER',
        margin: 0,
        autoFirstPage: true,
      });

      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const primaryColor = openHouse.agent.primaryColor ?? '#111820';

      const secondaryColor = openHouse.agent.secondaryColor ?? '#7f1d1d';

      const pageWidth = 612;
      const pageHeight = 792;

      // =====================================================
      // HEADER
      // =====================================================

      doc.rect(0, 0, pageWidth, 92).fill(primaryColor);

      if (openHouse.agent.brokerageName) {
        doc
          .font('Helvetica-Bold')
          .fontSize(12)
          .fillColor('#ffffff')
          .text(openHouse.agent.brokerageName, 42, 38, {
            width: 250,
          });
      }

      doc
        .font('Helvetica-Bold')
        .fontSize(21)
        .fillColor('#ffffff')
        .text('OPEN HOUSE', 330, 33, {
          width: 240,
          align: 'right',
          characterSpacing: 2.5,
        });

      // =====================================================
      // PROPERTY
      // =====================================================

      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor(secondaryColor)
        .text('WELCOME', 0, 126, {
          width: pageWidth,
          align: 'center',
          characterSpacing: 2,
        });

      doc
        .font('Helvetica-Bold')
        .fontSize(34)
        .fillColor(primaryColor)
        .text(openHouse.property.street, 48, 147, {
          width: pageWidth - 96,
          align: 'center',
        });

      let propertyY = 190;

      if (openHouse.property.street2) {
        doc
          .font('Helvetica-Bold')
          .fontSize(14)
          .fillColor(primaryColor)
          .text(openHouse.property.street2, 48, propertyY, {
            width: pageWidth - 96,
            align: 'center',
          });

        propertyY += 22;
      }

      doc
        .font('Helvetica')
        .fontSize(15)
        .fillColor('#525960')
        .text(
          `${openHouse.property.city}, ` +
            `${openHouse.property.state} ` +
            `${openHouse.property.zip}`,
          48,
          propertyY,
          {
            width: pageWidth - 96,
            align: 'center',
          },
        );

      propertyY += 28;

      const startsAt = new Date(openHouse.startsAt);
      const endsAt = new Date(openHouse.endsAt);

      const dateText = startsAt.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });

      const startTime = startsAt.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });

      const endTime = endsAt.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });

      doc
        .font('Helvetica-Bold')
        .fontSize(13)
        .fillColor(primaryColor)
        .text(`${dateText}  •  ${startTime} – ${endTime}`, 48, propertyY, {
          width: pageWidth - 96,
          align: 'center',
        });

      // =====================================================
      // QR
      // =====================================================

      const qrSize = 190;
      const qrX = (pageWidth - qrSize) / 2;
      const qrY = 292;

      doc
        .roundedRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20, 6)
        .lineWidth(4)
        .strokeColor(primaryColor)
        .stroke();

      doc.image(qrBuffer, qrX, qrY, {
        width: qrSize,
        height: qrSize,
      });

      doc
        .font('Helvetica-Bold')
        .fontSize(22)
        .fillColor(primaryColor)
        .text('Scan to Sign In', 48, 510, {
          width: pageWidth - 96,
          align: 'center',
        });

      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#626970')
        .text(
          'Scan the QR code with your phone to sign in and provide feedback.',
          120,
          541,
          {
            width: pageWidth - 240,
            align: 'center',
            lineGap: 2,
          },
        );

      // =====================================================
      // AGENT FOOTER
      // =====================================================

      const footerY = 640;
      const footerHeight = pageHeight - footerY;

      doc.rect(0, footerY, pageWidth, footerHeight).fill(primaryColor);

      doc.rect(0, footerY, pageWidth, 6).fill(secondaryColor);

      const agentName = `${openHouse.agent.firstName} ${openHouse.agent.lastName}`;

      doc
        .font('Helvetica-Bold')
        .fontSize(8)
        .fillColor('#ffffff')
        .opacity(0.7)
        .text('HOSTED BY', 42, footerY + 31, {
          characterSpacing: 1.5,
        });

      doc
        .opacity(1)
        .font('Helvetica-Bold')
        .fontSize(17)
        .fillColor('#ffffff')
        .text(agentName, 42, footerY + 47, {
          width: 280,
        });

      let agentY = footerY + 70;

      if (openHouse.agent.brokerageName) {
        doc
          .font('Helvetica-Bold')
          .fontSize(10)
          .fillColor('#ffffff')
          .text(openHouse.agent.brokerageName, 42, agentY);

        agentY += 16;
      }

      if (openHouse.agent.phone) {
        doc
          .font('Helvetica')
          .fontSize(9)
          .fillColor('#ffffff')
          .opacity(0.85)
          .text(this.formatPhone(openHouse.agent.phone), 42, agentY);

        agentY += 14;
      }

      if (openHouse.agent.email) {
        doc
          .font('Helvetica')
          .fontSize(9)
          .fillColor('#ffffff')
          .opacity(0.85)
          .text(openHouse.agent.email, 42, agentY, {
            width: 280,
          });
      }

      doc.opacity(1);

      // =====================================================
      // PROPERTY REFERENCE
      // =====================================================

      doc
        .font('Helvetica-Bold')
        .fontSize(8)
        .fillColor('#ffffff')
        .opacity(0.6)
        .text('PROPERTY', 350, footerY + 31, {
          width: 220,
          align: 'right',
          characterSpacing: 1.4,
        });

      doc
        .opacity(1)
        .font('Helvetica-Bold')
        .fontSize(12)
        .fillColor('#ffffff')
        .text(openHouse.property.street, 350, footerY + 49, {
          width: 220,
          align: 'right',
        });

      doc
        .font('Courier')
        .fontSize(9)
        .fillColor('#ffffff')
        .opacity(0.55)
        .text(openHouse.publicCode, 350, footerY + 69, {
          width: 220,
          align: 'right',
        });

      doc.opacity(1);

      doc.end();
    });
  }

  private formatPhone(phone: string | null | undefined): string {
    if (!phone) {
      return '';
    }

    const digits = phone.replace(/\D/g, '');

    const normalized =
      digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;

    if (normalized.length !== 10) {
      return phone;
    }

    return `(${normalized.slice(0, 3)}) ${normalized.slice(3, 6)}-${normalized.slice(6)}`;
  }
}
