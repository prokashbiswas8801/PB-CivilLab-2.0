/**
 * BD. CivilLab — Official Architectural CL Vector Brand Asset
 * Bespoke CAD-drafted monogram of "C" and "L" with precision millimeter scale tick marks and node caliper.
 */
export const BRAND_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <rect width="64" height="64" rx="14" fill="#141413" stroke="#2B2A27" stroke-width="1.2" />
  <path d="M14 20h36M14 32h36M14 44h36 M20 14v36M32 14v36M44 14v36" stroke="#252422" stroke-width="0.75" stroke-dasharray="1.5 2.5" />
  <path d="M12 16L16 12M48 52l4-4" stroke="#F59E0B" stroke-width="1.5" stroke-linecap="round" opacity="0.6" />
  <path d="M30 18H21.5L16.5 23.5V40.5L21.5 46H30" fill="none" stroke="#F8FAFC" stroke-width="5" stroke-linecap="square" stroke-linejoin="miter" />
  <path d="M35 18V46H48" fill="none" stroke="#F59E0B" stroke-width="5" stroke-linecap="square" stroke-linejoin="miter" />
  <path d="M31.5 23.5h2.5 M30 29h4 M31.5 34.5h2.5 M30 40h4" stroke="#F59E0B" stroke-width="1.2" stroke-linecap="round" />
  <circle cx="41.5" cy="27" r="2.2" fill="#F59E0B" />
  <circle cx="41.5" cy="27" r="0.9" fill="#141413" />
</svg>`;

export const BRAND_LOGO_SVG_DATA_URI = `data:image/svg+xml;utf8,${encodeURIComponent(BRAND_LOGO_SVG)}`;

/**
 * Clean Light Architectural Blueprint Vector Monogram for PDF & Print Submittals
 * Eliminates dark block fills and dashed grid speckles for crisp high-contrast printing.
 */
export const BRAND_LOGO_LIGHT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <rect x="1.5" y="1.5" width="61" height="61" rx="12" fill="#F8FAFC" stroke="#1E3A8A" stroke-width="2" />
  <rect x="5" y="5" width="54" height="54" rx="9" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="0.9" />
  <path d="M12 16L16 12M48 52l4-4" stroke="#1D4ED8" stroke-width="1.6" stroke-linecap="round" />
  <path d="M30 18H21.5L16.5 23.5V40.5L21.5 46H30" fill="none" stroke="#0F172A" stroke-width="5.2" stroke-linecap="square" stroke-linejoin="miter" />
  <path d="M35 18V46H48" fill="none" stroke="#1D4ED8" stroke-width="5.2" stroke-linecap="square" stroke-linejoin="miter" />
  <path d="M31.5 23.5h2.5 M30 29h4 M31.5 34.5h2.5 M30 40h4" stroke="#D97706" stroke-width="1.5" stroke-linecap="round" />
  <circle cx="41.5" cy="27" r="2.4" fill="#D97706" />
</svg>`;

export const BRAND_LOGO_LIGHT_SVG_DATA_URI = `data:image/svg+xml;utf8,${encodeURIComponent(BRAND_LOGO_LIGHT_SVG)}`;

/**
 * Universal PNG Data URI of the CL Vector Logo for jsPDF and high-resolution print engines (synchronous fallback).
 */
export const BRAND_LOGO_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAADKklEQVR4nO3d3WoTURSG4Z57aK9AFEHv2bsURIRKDhqSdCezM7P2+vnWO/CeBDpJs55OliG1Ly/Ox88f39/oft7zWHJEP4mqRc/14XH5QF9fP9OCUmJg6LEYGHzzQiAw+Hy5IOCnPndLrwYMvk7mCBh+vcwQMPy6HUbA8Ou3GwHD12kXAgDo9DQAhq/XNAKGr9sUAgDotgmA4ev3EAEA9LsLgOH3aYgAAH0CQPM+AGD4/bpCAIB+AaB5AGgeAJoHgOYBoHlnAHzSt2fnTxADoGdhAL59/cL5A88PgObnB0Dz84cDoBwBoHkAaF7JHeDP338mzdzX71+fpsvy/EgDsBo+AAoCsBw+AIIBRA8/OwCvwgGcpL937/YVwz+1db9HAMx8XzO3ywPYatXwuQIEA5iRvnL42QHI7wBb3+Dq4QMgMQCP4QMgGED08LMD8CoVAM/hA6A4AMv7fWbIADBq9BpnCcDqNZQdAAAAAMBzACwwyAMYFbUDWAGouBcAYAGA26+LHjIAHAGMvjZ6yCkBKO8AFgjkdwBFAJZXAAAUBWC1A8gDGKWwA/CvgIIAjg55xfsAACh4BYgeZikAijvA6ucHAAAAAABEAIxiB/AvHMDez/8f/bz97O17AfB7ATviCuAfO0BSAPI7AAAAAIDOAEapvBVcKQAY4ogeJgAAUAcAO4DP4wcAAAAAgIQARrED+AcAAAAAAOwA6QDI7wAAAEAaABnfCpYHMIodwL+yACyyBpDpClISgDcCACTbAbwRZAYgvwMo/k+hADAE4IEAAAl3AE8EmQF4FQ5A6e8FHK397wU8iiuAGADFvxnEDrAYgDUCABQEYIkAAIV2AAIAAYBkAKx+jeP8AOD8AOD8aQFQjs4ATgcA+nUePgB6BoDmAaB5AGgeAJoHgOZdAQBBrz4MHwC9AkDzhgBA0KO7wwdAjx4CAIF2m8MHgHZTAECg2fTwQaDX08MHgFa7AIBAo93DB0H9Dg8fBHUzGz4I6mU+/EsEQMjb1Sd9Vx4gyJfL4G8RACE+t596IOQqfPC3x/sDAsP6oaca/Oi4fKBkV/RcTY7oJzF73vP4D4U4mrBMhR34AAAAAElFTkSuQmCC';

const pngLogoCache = new Map<number, string>();
const pngLightLogoCache = new Map<number, string>();

/**
 * Renders the vector CL monogram (`BRAND_LOGO_SVG_DATA_URI`) onto an offscreen HTML5 <canvas>
 * and returns a crisp PNG Data URI for jsPDF exports. Falls back to `BRAND_LOGO_BASE64` if unavailable.
 */
export async function getBrandLogoPngDataUrl(size = 256): Promise<string> {
  const normalizedSize = Number.isFinite(size) && size > 0 ? Math.round(size) : 256;
  const cached = pngLogoCache.get(normalizedSize);
  if (cached) return cached;

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return BRAND_LOGO_BASE64;
  }

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = (err) => reject(err);
      image.src = BRAND_LOGO_SVG_DATA_URI;
    });

    const canvas = document.createElement('canvas');
    canvas.width = normalizedSize;
    canvas.height = normalizedSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return BRAND_LOGO_BASE64;

    ctx.clearRect(0, 0, normalizedSize, normalizedSize);
    ctx.drawImage(img, 0, 0, normalizedSize, normalizedSize);
    const pngDataUrl = canvas.toDataURL('image/png');
    if (pngDataUrl && pngDataUrl.startsWith('data:image/png')) {
      pngLogoCache.set(normalizedSize, pngDataUrl);
      return pngDataUrl;
    }
    return BRAND_LOGO_BASE64;
  } catch {
    return BRAND_LOGO_BASE64;
  }
}

/**
 * Renders the clean light architectural CL monogram (`BRAND_LOGO_LIGHT_SVG_DATA_URI`) onto an offscreen
 * HTML5 <canvas> and returns a crisp PNG Data URI with zero dark block fills.
 */
export async function getBrandLogoLightPngDataUrl(size = 256): Promise<string> {
  const normalizedSize = Number.isFinite(size) && size > 0 ? Math.round(size) : 256;
  const cached = pngLightLogoCache.get(normalizedSize);
  if (cached) return cached;

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return BRAND_LOGO_BASE64;
  }

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = (err) => reject(err);
      image.src = BRAND_LOGO_LIGHT_SVG_DATA_URI;
    });

    const canvas = document.createElement('canvas');
    canvas.width = normalizedSize;
    canvas.height = normalizedSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return BRAND_LOGO_BASE64;

    ctx.clearRect(0, 0, normalizedSize, normalizedSize);
    ctx.drawImage(img, 0, 0, normalizedSize, normalizedSize);
    const pngDataUrl = canvas.toDataURL('image/png');
    if (pngDataUrl && pngDataUrl.startsWith('data:image/png')) {
      pngLightLogoCache.set(normalizedSize, pngDataUrl);
      return pngDataUrl;
    }
    return getBrandLogoPngDataUrl(normalizedSize);
  } catch {
    return getBrandLogoPngDataUrl(normalizedSize);
  }
}
