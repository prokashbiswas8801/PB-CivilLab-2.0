/**
 * Public Verification Engine for CivilLab Official Office Documents
 * Generates unique, tamper-evident, URL-safe verification records for external stakeholders.
 */

export type OfficeDocType =
  | 'gate-pass'
  | 'work-order'
  | 'ra-bill-forwarding'
  | 'site-instruction-ncr'
  | 'completion-certificate';

export interface VerifiedOfficeDocRecord {
  docId: string;
  docType: OfficeDocType;
  docTypeTitle: string;
  docTypeTitleBn: string;
  memoNo: string;
  issueDate: string;
  projectName: string;
  projectCode: string;
  siteLocation: string;
  organization: string;
  clientName: string;
  contractorName: string;
  engineerName: string;
  engineerTitle: string;
  licenseNo: string;
  verificationHash: string;
  issuedAt: string;
  verificationUrl: string;
  language: 'en' | 'bn';
  summaryText: string;
  keyFields: Array<{ label: string; value: string | number; highlight?: boolean }>;
  tableData?: {
    headers: string[];
    rows: Array<Array<string | number>>;
  };
  clausesOrNotes?: string[];
  signatories: Array<{
    role: string;
    name: string;
    title: string;
    license?: string;
    verifiedStatus: string;
  }>;
}

const STORAGE_KEY = 'bd_civillab_verified_office_docs_v1';
const LEGACY_STORAGE_KEY = 'pb_civillab_verified_office_docs_v1';

/**
 * Generate a deterministic verification hash for the office document
 */
export function generateOfficeDocHash(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  const nowHex = Date.now().toString(16).slice(-6);
  return `VOD-${hex.toUpperCase()}-${nowHex.toUpperCase()}`;
}

/**
 * Encodes a VerifiedOfficeDocRecord into a URL-safe Base64 token
 */
export function encodeOfficeDocToken(record: VerifiedOfficeDocRecord): string {
  try {
    const jsonStr = JSON.stringify(record);
    const base64 = btoa(
      encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (_, p1) => {
        return String.fromCharCode(parseInt(p1, 16));
      })
    );
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (err) {
    console.warn('Failed to encode office doc token:', err);
    return '';
  }
}

/**
 * Decodes a URL-safe Base64 token back into VerifiedOfficeDocRecord
 */
export function decodeOfficeDocToken(token: string): VerifiedOfficeDocRecord | null {
  try {
    if (!token) return null;
    let base64 = token.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const binary = atob(base64);
    const jsonStr = decodeURIComponent(
      Array.prototype.map.call(binary, (c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    return JSON.parse(jsonStr) as VerifiedOfficeDocRecord;
  } catch (err) {
    console.warn('Failed to decode office doc token:', err);
    return null;
  }
}

/**
 * Constructs the public-facing verification URL for external stakeholders
 */
export function buildOfficeDocVerificationUrl(
  record: VerifiedOfficeDocRecord,
  origin?: string
): string {
  const currentOrigin =
    origin ||
    (typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://bdcivillab.app');
  const cleanOrigin = currentOrigin.replace(/\/+$/, '');
  const token = encodeOfficeDocToken(record);
  return `${cleanOrigin}/?verifyDoc=${encodeURIComponent(record.docId)}&docToken=${encodeURIComponent(token)}`;
}

/**
 * Persist verified office document to local storage registry
 */
export function saveVerifiedOfficeDoc(record: VerifiedOfficeDocRecord): void {
  try {
    if (typeof window === 'undefined') return;
    const existing = listVerifiedOfficeDocs();
    const updated = [record, ...existing.filter((item) => item.docId !== record.docId)].slice(0, 40);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to save verified office doc to storage:', err);
  }
}

/**
 * List all verified office documents in storage
 */
export function listVerifiedOfficeDocs(): VerifiedOfficeDocRecord[] {
  try {
    if (typeof window === 'undefined') return [];
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      raw = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (raw) {
        localStorage.setItem(STORAGE_KEY, raw);
      }
    }
    if (!raw) return [];
    return JSON.parse(raw) as VerifiedOfficeDocRecord[];
  } catch {
    return [];
  }
}

/**
 * Lookup a verified office document by its document ID
 */
export function getVerifiedOfficeDocById(docId: string): VerifiedOfficeDocRecord | null {
  const all = listVerifiedOfficeDocs();
  return (
    all.find(
      (item) => item.docId.toLowerCase().trim() === docId.toLowerCase().trim()
    ) || null
  );
}
