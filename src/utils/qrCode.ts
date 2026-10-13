import QRCode from 'qrcode';

export interface ReportVerificationPayload {
  documentId: string;
  projectCode: string;
  projectName: string;
  moduleId: string;
  moduleName: string;
  codeStandard: string;
  siteLocation: string;
  engineerOfRecord: string;
  organization: string;
  licenseNumber?: string;
  status: 'nominal' | 'warning' | 'critical' | 'valid';
  timestamp: string;
  verificationHash: string;
}

/**
 * Generate a short verification URL or encoded data URI for the report
 */
export function buildReportVerificationString(payload: ReportVerificationPayload): string {
  // Construct a compact, scannable verification record
  return JSON.stringify({
    app: 'PB CivilLab',
    id: payload.documentId,
    proj: payload.projectCode,
    mod: payload.moduleId,
    code: payload.codeStandard,
    eor: payload.engineerOfRecord,
    org: payload.organization,
    ts: payload.timestamp,
    status: payload.status,
    vHash: payload.verificationHash,
  });
}

/**
 * Generate an SVG string or DataURL for vector QR Code rendering
 */
export async function generateQrCodeSvg(text: string): Promise<string> {
  try {
    const svgString = await QRCode.toString(text, {
      type: 'svg',
      margin: 1,
      color: {
        dark: '#1e293b',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
    return svgString;
  } catch (err) {
    console.error('Failed to generate QR code SVG:', err);
    return '';
  }
}

/**
 * Generate a high-DPI Data URL for standard <img> tags
 */
export async function generateQrCodeDataUrl(text: string): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      width: 256,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
    return dataUrl;
  } catch (err) {
    console.error('Failed to generate QR code DataURL:', err);
    return '';
  }
}

/**
 * Generate a deterministic verification hash for document tamper-evidence
 */
export function generateVerificationHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  return `VER-${hex}-${input.length}`;
}
