/**
 * QR Code Generator using QuickChart API
 * 
 * QuickChart is a free, open-source service for generating QR codes
 * API Documentation: https://quickchart.io/qr-codes/
 */

/**
 * Generate QR code URL for certificate verification
 * @param {string} certificateCode - The unique certificate code (e.g., CERT-A8B9C2D1)
 * @param {string} baseUrl - Base URL of the application (optional, defaults to production URL)
 * @returns {string} QR code image URL from QuickChart API
 */
const generateCertificateQRCode = (certificateCode, baseUrl = null) => {
  // Use verification UI base URL or default to frontend route in development
  const verificationBaseUrl = baseUrl || 
    process.env.CERTIFICATE_VERIFY_UI_BASE_URL ||
    process.env.FRONTEND_URL || 
    'http://localhost:5173/certificate-verify';

  const normalizedBase = verificationBaseUrl.endsWith('/')
    ? verificationBaseUrl.slice(0, -1)
    : verificationBaseUrl;
  
  // Create verification URL
  const verificationUrl = `${normalizedBase}/${certificateCode}`;
  
  // QuickChart QR API parameters
  const qrSize = 300; // 300x300 pixels
  const qrFormat = 'png';
  const qrMargin = 4; // Margin around QR code
  
  // Generate QuickChart API URL
  const qrCodeUrl = `https://quickchart.io/qr?text=${encodeURIComponent(verificationUrl)}&size=${qrSize}&format=${qrFormat}&margin=${qrMargin}`;
  
  return qrCodeUrl;
};

/**
 * Generate QR code URL with custom options
 * @param {string} text - Text to encode in QR code
 * @param {object} options - QR code options
 * @param {number} options.size - Size of QR code (default: 300)
 * @param {string} options.format - Image format: png, svg (default: png)
 * @param {number} options.margin - Margin around QR code (default: 4)
 * @param {string} options.backgroundColor - Background color (default: white)
 * @param {string} options.foregroundColor - Foreground color (default: black)
 * @returns {string} QR code image URL
 */
const generateQRCode = (text, options = {}) => {
  const {
    size = 300,
    format = 'png',
    margin = 4,
    backgroundColor = 'white',
    foregroundColor = 'black'
  } = options;
  
  // Build QuickChart API URL with parameters
  let qrCodeUrl = `https://quickchart.io/qr?text=${encodeURIComponent(text)}&size=${size}&format=${format}&margin=${margin}`;
  
  // Add colors if not default
  if (backgroundColor !== 'white') {
    qrCodeUrl += `&dark=${encodeURIComponent(backgroundColor)}`;
  }
  if (foregroundColor !== 'black') {
    qrCodeUrl += `&light=${encodeURIComponent(foregroundColor)}`;
  }
  
  return qrCodeUrl;
};

/**
 * Validate if QuickChart API is accessible (optional check)
 * @returns {Promise<boolean>} True if API is accessible
 */
const validateQuickChartAPI = async () => {
  try {
    const testUrl = 'https://quickchart.io/qr?text=test&size=100';
    const response = await fetch(testUrl);
    return response.ok;
  } catch (error) {
    console.error('QuickChart API validation failed:', error.message);
    return false;
  }
};

module.exports = {
  generateCertificateQRCode,
  generateQRCode,
  validateQuickChartAPI
};
