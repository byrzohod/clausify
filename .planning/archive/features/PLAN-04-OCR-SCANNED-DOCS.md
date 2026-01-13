# OCR for Scanned Documents Plan

> Feature: Optical Character Recognition for scanned PDF contracts
> Priority: MEDIUM
> Effort: Medium (2-3 days)
> Status: Planning
> Depends On: PLAN-01-PRODUCTION-DEPLOY.md

---

## Executive Summary

Add OCR capability to extract text from scanned PDF documents (image-based PDFs). Currently, Clausify only handles text-based PDFs. Many legal documents are scanned copies, which our parser returns as empty text.

---

## Business Value

| Metric | Impact |
|--------|--------|
| Addressable Market | +30-40% (scanned docs are common) |
| User Satisfaction | Eliminates "no text found" errors |
| Conversion | Users with scanned docs can actually use product |
| Competitive Edge | Many competitors don't support OCR |

---

## Current State Analysis

### Problem
```typescript
// Current behavior in src/lib/parsers/pdf.ts
const result = await pdfParse(buffer);
if (!result.text || result.text.trim().length === 0) {
  // Returns empty - user sees "Unable to extract text"
  // Scanned PDFs have no text layer
}
```

### Detection
We can detect scanned PDFs by:
1. Text extraction returns empty/minimal text
2. PDF has images but no text objects
3. Specific PDF metadata indicators

---

## Technical Options Analysis

### Option 1: Tesseract.js (Client-Side)
```
Pros:
- Free, no API costs
- Runs in browser (no server load)
- Privacy (document stays local)

Cons:
- Large bundle size (~3MB)
- Slow (30-60s per page)
- Lower accuracy than cloud services
- Can't run in Node.js easily
```

### Option 2: Google Cloud Vision API
```
Pros:
- High accuracy
- Fast
- Handles complex layouts

Cons:
- Cost: $1.50 per 1,000 pages
- Data leaves your server
- Requires Google Cloud account
```

### Option 3: AWS Textract
```
Pros:
- Very high accuracy
- Table/form extraction
- AWS integration

Cons:
- Cost: $1.50 per 1,000 pages
- Complex pricing
- AWS account required
```

### Option 4: Azure Computer Vision
```
Pros:
- Good accuracy
- Competitive pricing
- Good for handwriting

Cons:
- Cost: $1.00 per 1,000 pages
- Microsoft account required
```

### Option 5: Tesseract (Server-Side via API)
```
Pros:
- Free
- Good accuracy with preprocessing
- Full control

Cons:
- Requires server resources
- Need to manage infrastructure
- Slower than cloud APIs
```

### Recommendation: Hybrid Approach

1. **Primary:** Tesseract.js for simple scans (free)
2. **Fallback:** Google Cloud Vision for complex documents (paid)
3. **Future:** Train custom model for legal documents

---

## Technical Architecture

### System Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    OCR Processing Flow                       │
│                                                             │
│  ┌───────────┐     ┌───────────────┐     ┌───────────────┐ │
│  │  Upload   │────▶│ Text Extract  │────▶│  Has Text?    │ │
│  │   PDF     │     │  (pdf-parse)  │     │               │ │
│  └───────────┘     └───────────────┘     └───────┬───────┘ │
│                                                   │         │
│                           ┌───────────────────────┴───┐     │
│                           │                           │     │
│                           ▼                           ▼     │
│                    ┌─────────────┐           ┌───────────┐  │
│                    │    YES      │           │    NO     │  │
│                    │ Continue to │           │ Run OCR   │  │
│                    │  Analysis   │           │           │  │
│                    └─────────────┘           └─────┬─────┘  │
│                                                    │        │
│                                          ┌─────────┴────┐   │
│                                          │              │   │
│                                          ▼              ▼   │
│                                   ┌──────────┐  ┌──────────┐│
│                                   │Tesseract │  │ Cloud    ││
│                                   │ (Free)   │  │ Vision   ││
│                                   │          │  │ (Paid)   ││
│                                   └────┬─────┘  └────┬─────┘│
│                                        │             │      │
│                                        └──────┬──────┘      │
│                                               ▼             │
│                                        ┌─────────────┐      │
│                                        │  Continue   │      │
│                                        │  Analysis   │      │
│                                        └─────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Detection & Infrastructure (4 hours)

#### Step 1.1: Install Dependencies
```bash
npm install tesseract.js pdf-to-img sharp
```

#### Step 1.2: Create OCR Module Structure
```
src/lib/ocr/
├── index.ts           # Main OCR interface
├── detector.ts        # Detect if OCR is needed
├── tesseract.ts       # Tesseract.js implementation
├── cloud-vision.ts    # Google Cloud Vision (optional)
└── preprocessor.ts    # Image preprocessing
```

#### Step 1.3: Implement Scanned Document Detection
```typescript
// src/lib/ocr/detector.ts
import pdfParse from 'pdf-parse';

export interface ScanDetectionResult {
  isScanned: boolean;
  confidence: number;
  pageCount: number;
  textLength: number;
  hasImages: boolean;
}

export async function detectScannedPDF(
  buffer: Buffer
): Promise<ScanDetectionResult> {
  const result = await pdfParse(buffer);

  const textLength = result.text?.trim().length || 0;
  const pageCount = result.numpages || 1;
  const charsPerPage = textLength / pageCount;

  // Heuristics for scanned document detection
  // A typical text page has 2000-3000 characters
  // Scanned PDFs usually have 0-100 characters (from metadata only)

  const isScanned = charsPerPage < 100;
  const confidence = isScanned
    ? Math.min(1, (100 - charsPerPage) / 100)
    : 0;

  return {
    isScanned,
    confidence,
    pageCount,
    textLength,
    hasImages: true, // Would need pdf.js for accurate detection
  };
}
```

### Phase 2: Tesseract.js Integration (6 hours)

#### Step 2.1: PDF to Image Conversion
```typescript
// src/lib/ocr/preprocessor.ts
import { pdf } from 'pdf-to-img';
import sharp from 'sharp';

export interface ProcessedPage {
  pageNumber: number;
  imageBuffer: Buffer;
}

export async function pdfToImages(
  pdfBuffer: Buffer,
  options: { dpi?: number; maxPages?: number } = {}
): Promise<ProcessedPage[]> {
  const { dpi = 300, maxPages = 50 } = options;

  const pages: ProcessedPage[] = [];
  let pageNumber = 0;

  for await (const image of pdf(pdfBuffer, { scale: dpi / 72 })) {
    pageNumber++;
    if (pageNumber > maxPages) break;

    // Preprocess for better OCR accuracy
    const processed = await sharp(image)
      .grayscale()
      .normalize()
      .sharpen()
      .toBuffer();

    pages.push({ pageNumber, imageBuffer: processed });
  }

  return pages;
}
```

#### Step 2.2: Tesseract OCR Implementation
```typescript
// src/lib/ocr/tesseract.ts
import Tesseract from 'tesseract.js';

export interface OCRResult {
  text: string;
  confidence: number;
  pageResults: PageOCRResult[];
}

export interface PageOCRResult {
  pageNumber: number;
  text: string;
  confidence: number;
}

export async function runTesseractOCR(
  images: { pageNumber: number; imageBuffer: Buffer }[],
  onProgress?: (progress: number) => void
): Promise<OCRResult> {
  const scheduler = Tesseract.createScheduler();

  // Create workers for parallel processing
  const workerCount = Math.min(4, images.length);
  const workers = await Promise.all(
    Array(workerCount).fill(0).map(async () => {
      const worker = await Tesseract.createWorker('eng');
      scheduler.addWorker(worker);
      return worker;
    })
  );

  try {
    const pageResults: PageOCRResult[] = [];
    let completed = 0;

    const results = await Promise.all(
      images.map(async ({ pageNumber, imageBuffer }) => {
        const result = await scheduler.addJob('recognize', imageBuffer);
        completed++;
        onProgress?.(completed / images.length);

        return {
          pageNumber,
          text: result.data.text,
          confidence: result.data.confidence,
        };
      })
    );

    pageResults.push(...results.sort((a, b) => a.pageNumber - b.pageNumber));

    const totalText = pageResults.map(p => p.text).join('\n\n');
    const avgConfidence = pageResults.reduce((sum, p) => sum + p.confidence, 0) / pageResults.length;

    return {
      text: totalText,
      confidence: avgConfidence,
      pageResults,
    };
  } finally {
    await scheduler.terminate();
  }
}
```

#### Step 2.3: Main OCR Interface
```typescript
// src/lib/ocr/index.ts
import { detectScannedPDF } from './detector';
import { pdfToImages } from './preprocessor';
import { runTesseractOCR } from './tesseract';

export interface OCROptions {
  maxPages?: number;
  dpi?: number;
  onProgress?: (progress: number) => void;
}

export async function extractTextWithOCR(
  pdfBuffer: Buffer,
  options: OCROptions = {}
): Promise<{
  text: string;
  usedOCR: boolean;
  confidence?: number;
}> {
  // First, try regular text extraction
  const detection = await detectScannedPDF(pdfBuffer);

  if (!detection.isScanned) {
    // Regular PDF with text layer
    const pdfParse = (await import('pdf-parse')).default;
    const result = await pdfParse(pdfBuffer);
    return {
      text: result.text,
      usedOCR: false,
    };
  }

  // Scanned PDF - run OCR
  console.log('[OCR] Detected scanned document, running OCR...');

  const images = await pdfToImages(pdfBuffer, {
    dpi: options.dpi,
    maxPages: options.maxPages,
  });

  const ocrResult = await runTesseractOCR(images, options.onProgress);

  return {
    text: ocrResult.text,
    usedOCR: true,
    confidence: ocrResult.confidence,
  };
}
```

### Phase 3: Integration with Parser (2 hours)

#### Step 3.1: Update PDF Parser
```typescript
// src/lib/parsers/pdf.ts
import { extractTextWithOCR } from '@/lib/ocr';

export async function parsePdf(
  buffer: Buffer,
  options?: { enableOCR?: boolean; onProgress?: (progress: number) => void }
): Promise<ParseResult> {
  const { enableOCR = true, onProgress } = options || {};

  try {
    if (enableOCR) {
      const result = await extractTextWithOCR(buffer, { onProgress });

      if (result.usedOCR) {
        console.log(`[PDF] OCR completed with ${result.confidence}% confidence`);
      }

      if (!result.text || result.text.trim().length < 50) {
        throw new ParseError(
          'Unable to extract text from document. ' +
          (result.usedOCR
            ? 'OCR could not recognize text - document may be too blurry or damaged.'
            : 'Document appears to be empty.')
        );
      }

      return {
        text: result.text,
        metadata: {
          usedOCR: result.usedOCR,
          ocrConfidence: result.confidence,
        },
      };
    }

    // Original non-OCR path
    const pdfParse = (await import('pdf-parse')).default;
    const result = await pdfParse(buffer);
    return { text: result.text };
  } catch (error) {
    if (error instanceof ParseError) throw error;
    throw new ParseError(`Failed to parse PDF: ${error}`);
  }
}
```

### Phase 4: UI Updates (2 hours)

#### Step 4.1: Progress Indicator for OCR
```typescript
// Update file upload component to show OCR progress
const [ocrProgress, setOcrProgress] = useState<number | null>(null);

// In upload handler
if (response.ocrInProgress) {
  setOcrProgress(0);
  // Poll for progress or use websocket
}
```

#### Step 4.2: OCR Status in Analysis
```typescript
// Show OCR notice in analysis results
{analysis.metadata?.usedOCR && (
  <Alert variant="info">
    <InfoIcon />
    <AlertDescription>
      This document was processed using OCR (Optical Character Recognition).
      Confidence: {analysis.metadata.ocrConfidence}%
    </AlertDescription>
  </Alert>
)}
```

### Phase 5: Cloud Vision Fallback (Optional, 4 hours)

#### Step 5.1: Google Cloud Vision Setup
```bash
npm install @google-cloud/vision
```

#### Step 5.2: Cloud Vision Implementation
```typescript
// src/lib/ocr/cloud-vision.ts
import { ImageAnnotatorClient } from '@google-cloud/vision';

const client = new ImageAnnotatorClient();

export async function runCloudVisionOCR(
  imageBuffer: Buffer
): Promise<{ text: string; confidence: number }> {
  const [result] = await client.textDetection({
    image: { content: imageBuffer.toString('base64') },
  });

  const text = result.fullTextAnnotation?.text || '';
  const confidence = result.textAnnotations?.[0]?.confidence || 0;

  return { text, confidence };
}
```

#### Step 5.3: Hybrid Strategy
```typescript
// Use Tesseract first, fallback to Cloud Vision if confidence is low
const tesseractResult = await runTesseractOCR(images);

if (tesseractResult.confidence < 70 && process.env.GOOGLE_CLOUD_VISION_KEY) {
  console.log('[OCR] Low confidence, trying Cloud Vision...');
  const cloudResult = await runCloudVisionOCR(/* combined image */);
  if (cloudResult.confidence > tesseractResult.confidence) {
    return cloudResult;
  }
}

return tesseractResult;
```

---

## Testing Strategy

### Unit Tests
```typescript
// tests/unit/lib/ocr/detector.test.ts
describe('Scanned Document Detector', () => {
  it('should detect scanned PDF', async () => {
    const scannedPdf = await readFile('tests/fixtures/scanned.pdf');
    const result = await detectScannedPDF(scannedPdf);
    expect(result.isScanned).toBe(true);
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  it('should detect text-based PDF', async () => {
    const textPdf = await readFile('tests/fixtures/text-based.pdf');
    const result = await detectScannedPDF(textPdf);
    expect(result.isScanned).toBe(false);
  });
});

// tests/unit/lib/ocr/tesseract.test.ts
describe('Tesseract OCR', () => {
  it('should extract text from image', async () => {
    const image = await readFile('tests/fixtures/contract-page.png');
    const result = await runTesseractOCR([{ pageNumber: 1, imageBuffer: image }]);
    expect(result.text).toContain('Agreement');
    expect(result.confidence).toBeGreaterThan(80);
  });

  it('should handle multi-page documents', async () => {
    // Test with multi-page scanned PDF
  });
});
```

### Integration Tests
```typescript
// tests/integration/ocr-pipeline.test.ts
describe('OCR Pipeline', () => {
  it('should process scanned PDF end-to-end', async () => {
    const scannedPdf = await readFile('tests/fixtures/scanned-contract.pdf');
    const result = await extractTextWithOCR(scannedPdf);

    expect(result.usedOCR).toBe(true);
    expect(result.text.length).toBeGreaterThan(1000);
    expect(result.confidence).toBeGreaterThan(70);
  });
});
```

### Test Fixtures Required
- `tests/fixtures/scanned-contract.pdf` - Clean scanned document
- `tests/fixtures/blurry-scan.pdf` - Low quality scan
- `tests/fixtures/mixed-content.pdf` - PDF with both text and images
- `tests/fixtures/handwritten.pdf` - Handwritten document

### Manual Testing
- [ ] Clear scanned PDF extracts text correctly
- [ ] Blurry scan shows appropriate warning
- [ ] Multi-page scanned document works
- [ ] Progress indicator shows during OCR
- [ ] OCR notice appears in analysis results
- [ ] Performance is acceptable (<60s for 10 pages)

---

## Performance Considerations

### Processing Time Estimates
| Pages | Tesseract (300 DPI) | Cloud Vision |
|-------|---------------------|--------------|
| 1 | 5-10s | 1-2s |
| 5 | 20-30s | 5-10s |
| 10 | 40-60s | 10-15s |
| 50 | 3-5 min | 1-2 min |

### Optimization Strategies
1. **Parallel Processing:** Use multiple Tesseract workers
2. **Lower DPI:** Reduce to 200 DPI for faster processing (trade-off: accuracy)
3. **Page Limit:** Limit to first 50 pages for free tier
4. **Caching:** Cache OCR results for re-analysis
5. **Background Processing:** Run OCR async, notify when complete

---

## Cost Estimate

### Tesseract (Free)
- No API costs
- Server CPU costs only
- Railway: ~$0.01 per OCR job (CPU time)

### Google Cloud Vision (If Used)
| Usage | Cost |
|-------|------|
| 1,000 pages/month | $1.50 |
| 10,000 pages/month | $15.00 |
| 100,000 pages/month | $150.00 |

### Recommendation
Start with Tesseract only. Add Cloud Vision as premium feature for Pro users if accuracy complaints arise.

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Detection Accuracy | > 95% (correctly identify scanned vs text) |
| OCR Accuracy | > 85% (readable text extraction) |
| Processing Time | < 60s for 10 pages |
| User Satisfaction | < 5% "can't read" complaints |

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Poor OCR quality | Medium | High | Cloud Vision fallback, quality warnings |
| Slow processing | High | Medium | Progress indicator, async processing |
| High CPU usage | Medium | Medium | Rate limiting, worker queues |
| Large file memory | Medium | Medium | Streaming, page-by-page processing |
| Non-English docs | Medium | Low | Language detection, multi-language support |

---

## Future Enhancements

1. **Language Detection:** Automatically detect document language
2. **Multi-Language OCR:** Support non-English contracts
3. **Handwriting Recognition:** Better support for signed documents
4. **Table Extraction:** Extract tabular data accurately
5. **Form Recognition:** Identify and extract form fields
6. **Custom Training:** Fine-tune model for legal documents

---

## Deliverables Checklist

- [ ] Scanned document detector
- [ ] PDF to image converter
- [ ] Tesseract.js integration
- [ ] Parser integration
- [ ] Progress indicator UI
- [ ] OCR status in results
- [ ] Unit tests
- [ ] Integration tests
- [ ] Test fixtures
- [ ] Documentation
