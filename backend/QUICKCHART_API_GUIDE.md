# QuickChart API Guide - Certificate QR Code Generation

Complete guide to understanding and using QuickChart API for QR code generation in SafeBuild.

---

## 📋 Table of Contents

1. [What is QuickChart API?](#what-is-quickchart-api)
2. [Why Use QuickChart?](#why-use-quickchart)
3. [How QuickChart Works](#how-quickchart-works)
4. [QR Code Generation](#qr-code-generation)
5. [API Parameters](#api-parameters)
6. [SafeBuild Implementation](#safebuild-implementation)
7. [Usage Examples](#usage-examples)
8. [Pricing & Limits](#pricing--limits)
9. [Best Practices](#best-practices)

---

## What is QuickChart API?

**QuickChart** is a **free, open-source web service** that generates chart images and QR codes on-the-fly.

### Key Features:
- ✅ **No API Key Required** - Use immediately without registration
- ✅ **Free & Open Source** - No cost for reasonable use
- ✅ **Fast & Reliable** - CDN-backed for global performance
- ✅ **Multiple Formats** - PNG, SVG, WebP support
- ✅ **Customizable** - Size, colors, margins, error correction
- ✅ **REST API** - Simple GET requests, no SDK needed

### Official Resources:
- **Website**: https://quickchart.io
- **QR Code Docs**: https://quickchart.io/qr-codes/
- **GitHub**: https://github.com/typpo/quickchart

---

## Why Use QuickChart?

### Traditional QR Code Generation (❌ Complex)
```javascript
// Requires installing libraries
npm install qrcode

// Generate QR code image
const QRCode = require('qrcode');
const fs = require('fs');

QRCode.toFile('qr.png', 'https://example.com', (err) => {
  // Need to store file, serve it, handle cleanup
});
```

**Problems:**
- Requires npm package installation
- Need to generate and store image files
- File storage management required
- Serving static files complexity
- Cleanup of old QR codes

### QuickChart API (✅ Simple)
```javascript
// No installation needed - just create URL
const qrUrl = `https://quickchart.io/qr?text=https://example.com`;

// That's it! URL directly displays QR code
```

**Benefits:**
- Zero dependencies
- No file storage needed
- No cleanup required
- Works immediately
- Scales automatically

---

## How QuickChart Works

### Architecture Overview

```
┌─────────────────┐
│  Your Backend   │
│   (Node.js)     │
└────────┬────────┘
         │ 1. Generate URL
         ▼
    https://quickchart.io/qr?text=YOUR_DATA
         │
         │ 2. User/Browser requests QR code
         ▼
┌─────────────────┐
│  QuickChart     │
│   CDN Servers   │
└────────┬────────┘
         │ 3. Returns image
         ▼
    ┌─────────┐
    │ QR Code │
    │  Image  │
    └─────────┘
```

### Request Flow

1. **Backend generates URL**
   ```javascript
   const qrUrl = `https://quickchart.io/qr?text=https://safebuild.com/verify/CERT-12345`;
   ```

2. **URL stored in database**
   ```javascript
   certificate.qrCodeUrl = qrUrl;
   ```

3. **Client fetches QR code**
   ```html
   <img src="https://quickchart.io/qr?text=..." />
   ```

4. **QuickChart generates image on-the-fly**
   - Receives request
   - Generates QR code
   - Returns PNG/SVG image
   - Caches result for performance

---

## QR Code Generation

### Basic QR Code

**Simplest Form:**
```
https://quickchart.io/qr?text=Hello World
```

**What it does:**
- Encodes "Hello World" in QR code
- Returns 150x150 PNG (default size)
- Black & white (default colors)

**Try it:** Open this URL in your browser to see the QR code!

### Encoding Data Types

**1. Plain Text**
```
https://quickchart.io/qr?text=SafeBuild Certificate
```

**2. URLs (Most Common)**
```
https://quickchart.io/qr?text=https://safebuild.com
```

**3. Email Addresses**
```
https://quickchart.io/qr?text=mailto:admin@safebuild.com
```

**4. Phone Numbers**
```
https://quickchart.io/qr?text=tel:+1234567890
```

**5. WiFi Credentials**
```
https://quickchart.io/qr?text=WIFI:S:NetworkName;T:WPA;P:Password;;
```

**6. Contact Info (vCard)**
```
https://quickchart.io/qr?text=BEGIN:VCARD%0AVERSION:3.0%0AFN:John Doe%0ATEL:+1234567890%0AEND:VCARD
```

---

## API Parameters

### Core Parameters

#### `text` (Required)
- **Description:** Data to encode in QR code
- **Type:** String
- **Example:** `text=https://safebuild.com`
- **Note:** URL encode special characters

#### `size` (Optional)
- **Description:** Image dimensions (width = height)
- **Type:** Integer (50-3000)
- **Default:** 150
- **Example:** `size=300` → 300x300 pixels

#### `format` (Optional)
- **Description:** Image output format
- **Type:** String
- **Options:** `png`, `svg`, `webp`
- **Default:** `png`
- **Example:** `format=svg`

#### `margin` (Optional)
- **Description:** Margin/border around QR code (in modules)
- **Type:** Integer (0-10)
- **Default:** 4
- **Example:** `margin=2`

#### `dark` (Optional)
- **Description:** Foreground color (QR code color)
- **Type:** Hex color
- **Default:** `000000` (black)
- **Example:** `dark=0066CC` (blue)

#### `light` (Optional)
- **Description:** Background color
- **Type:** Hex color
- **Default:** `ffffff` (white)
- **Example:** `light=FFFF00` (yellow)

#### `ecLevel` (Optional)
- **Description:** Error correction level
- **Type:** String
- **Options:** `L` (7%), `M` (15%), `Q` (25%), `H` (30%)
- **Default:** `M`
- **Example:** `ecLevel=H` (most reliable)

### Error Correction Levels

| Level | Correction | Use Case |
|-------|-----------|----------|
| L | 7% | Clean environment, digital display |
| M | 15% | **Normal use (default)** |
| Q | 25% | Outdoor posters, printed materials |
| H | 30% | Damaged/dirty surfaces |

---

## SafeBuild Implementation

### Our QR Code Function

**Location:** `backend/utils/qrCodeGenerator.js`

```javascript
const generateCertificateQRCode = (certificateCode, baseUrl = null) => {
  // 1. Build verification URL
  const verificationBaseUrl = baseUrl || 
    process.env.FRONTEND_URL || 
    'http://localhost:5001/api/certificates/verify';
  
  const verificationUrl = `${verificationBaseUrl}/${certificateCode}`;
  // Example: http://localhost:5001/api/certificates/verify/CERT-A8B9C2D1
  
  // 2. Configure QR code settings
  const qrSize = 300;      // 300x300 pixels (good for mobile screens)
  const qrFormat = 'png';  // PNG format (universal support)
  const qrMargin = 4;      // 4 modules margin (standard)
  
  // 3. Generate QuickChart URL
  const qrCodeUrl = `https://quickchart.io/qr?text=${encodeURIComponent(verificationUrl)}&size=${qrSize}&format=${qrFormat}&margin=${qrMargin}`;
  
  // 4. Return URL (not the image itself)
  return qrCodeUrl;
};
```

### What This Function Does

**Step 1: Build Verification URL**
```
Input:  certificateCode = "CERT-A8B9C2D1"
Output: verificationUrl = "http://localhost:5001/api/certificates/verify/CERT-A8B9C2D1"
```

**Step 2: Encode URL for QR**
```
verificationUrl → URL encode → text parameter
```

**Step 3: Build QuickChart URL**
```
Output: https://quickchart.io/qr?text=http%3A%2F%2Flocalhost%3A5001%2Fapi%2Fcertificates%2Fverify%2FCERT-A8B9C2D1&size=300&format=png&margin=4
```

**Step 4: Store URL in Database**
```javascript
certificate.qrCodeUrl = qrCodeUrl;
```

### When It's Called

**Auto-generation on Quiz Pass:**

```javascript
// In quizAttemptController.js
if (passed) {
  // 1. Generate certificate code
  const certificateCode = await Certificate.generateCertificateCode();
  // "CERT-A8B9C2D1"
  
  // 2. Generate QR code URL
  const qrCodeUrl = generateCertificateQRCode(certificateCode);
  
  // 3. Create certificate with QR URL
  await Certificate.create({
    certificateCode,
    qrCodeUrl,  // ← Stored in database
    // ... other fields
  });
}
```

---

## Usage Examples

### Example 1: Basic SafeBuild Certificate

**Input:**
```javascript
certificateCode = "CERT-A8B9C2D1"
```

**Generated QR URL:**
```
https://quickchart.io/qr?text=http%3A%2F%2Flocalhost%3A5001%2Fapi%2Fcertificates%2Fverify%2FCERT-A8B9C2D1&size=300&format=png&margin=4
```

**When scanned, opens:**
```
http://localhost:5001/api/certificates/verify/CERT-A8B9C2D1
```

**API Response:**
```json
{
  "success": true,
  "message": "Certificate is valid",
  "data": {
    "isValid": true,
    "certificate": {
      "userName": "Bob Worker",
      "quizTitle": "Workplace Safety",
      "percentage": 88
    }
  }
}
```

### Example 2: Custom Size QR Code

**Large QR Code (500x500):**
```javascript
const largeQR = `https://quickchart.io/qr?text=${encodeURIComponent(url)}&size=500`;
```

**Small QR Code (150x150):**
```javascript
const smallQR = `https://quickchart.io/qr?text=${encodeURIComponent(url)}&size=150`;
```

### Example 3: Colored QR Code

**Blue QR on Yellow Background:**
```javascript
const coloredQR = `https://quickchart.io/qr?text=${encodeURIComponent(url)}&size=300&dark=0066CC&light=FFFF00`;
```

### Example 4: High Error Correction

**For Printed Certificates:**
```javascript
const printQR = `https://quickchart.io/qr?text=${encodeURIComponent(url)}&size=400&ecLevel=H`;
```

### Example 5: SVG Format

**Scalable Vector Graphics:**
```javascript
const svgQR = `https://quickchart.io/qr?text=${encodeURIComponent(url)}&format=svg`;
```

---

## Pricing & Limits

### Free Tier ✅

**What's Included:**
- ✅ Unlimited QR code generation
- ✅ No API key required
- ✅ No request limits for reasonable use
- ✅ CDN-backed delivery
- ✅ PNG, SVG, WebP formats
- ✅ Commercial use allowed

**"Reasonable Use" Definition:**
- Individual projects: Unlimited
- Small/medium apps: No limits
- High-traffic apps: Contact for enterprise options

### Rate Limits

**Default:**
- No hard limits enforced
- Fair use policy applies
- CDN caching prevents abuse

**High Volume (>1M requests/month):**
- Contact QuickChart for enterprise plan
- Custom rate limits
- Priority support

### Self-Hosting Option

**Open Source:**
- https://github.com/typpo/quickchart
- Docker image available
- Host your own instance
- Full control over limits

---

## Best Practices

### 1. URL Encoding ✅

**Always encode the text parameter:**

```javascript
// ❌ WRONG - Special characters break URL
const badUrl = `https://quickchart.io/qr?text=http://site.com?id=1&name=Bob`;

// ✅ CORRECT - Properly encoded
const goodUrl = `https://quickchart.io/qr?text=${encodeURIComponent('http://site.com?id=1&name=Bob')}`;
```

### 2. Appropriate Size

**Choose size based on use case:**

| Use Case | Recommended Size |
|----------|------------------|
| Mobile screen | 200-300px |
| Desktop display | 300-400px |
| Print (business card) | 400-600px |
| Large poster | 800-1000px |
| Email | 250-350px |

### 3. Error Correction Level

**Choose based on environment:**

```javascript
// Digital display (clean) - Use L or M
const digitalQR = `...&ecLevel=M`;

// Printed certificate - Use Q or H
const printQR = `...&ecLevel=H`;

// Outdoor poster - Use H
const outdoorQR = `...&ecLevel=H`;
```

### 4. Format Selection

**PNG (Default):**
- ✅ Universal browser support
- ✅ Good for web display
- ✅ Fixed resolution
- Use for: Web, mobile, email

**SVG:**
- ✅ Scalable to any size
- ✅ Smaller file size
- ✅ Perfect for print
- Use for: Print materials, responsive design

**WebP:**
- ✅ Smaller file size than PNG
- ⚠️ Limited browser support
- Use for: Modern web apps

### 5. Caching Strategy

**QuickChart automatically caches:**
- Same URL = cached result
- Fast subsequent loads
- No extra work needed

**Your backend:**
```javascript
// ✅ Store QR URL in database
certificate.qrCodeUrl = qrUrl;

// ❌ Don't regenerate on every request
// This is automatically cached by QuickChart
```

### 6. Testing QR Codes

**Always test with real devices:**

```bash
# 1. Generate QR code
POST /api/quiz-attempts

# 2. Open QR URL in browser
GET https://quickchart.io/qr?text=...

# 3. Scan with phone camera
- iOS Camera app
- Android Camera app
- QR scanner app

# 4. Verify destination opens
- Should open verification URL
- Check response is correct
```

### 7. Production Configuration

**Use environment variable for base URL:**

```javascript
// Development
FRONTEND_URL=http://localhost:5001/api/certificates/verify

// Production
FRONTEND_URL=https://safebuild.com/api/certificates/verify
```

**Generated QR URLs will automatically adapt:**
- Dev: QR points to localhost
- Prod: QR points to safebuild.com

---

## Common Use Cases in SafeBuild

### 1. Digital Certificate Display ✅ IMPLEMENTED

**Flow:**
1. Worker passes quiz
2. Certificate generated with QR code
3. Worker opens certificate on phone
4. Displays certificate + QR code
5. Employer scans to verify

**Endpoint:**
```http
GET /api/certificates/my-certificates
```

### 2. Printed Certificate ✅ IMPLEMENTED

**Flow:**
1. Certificate generated
2. Print certificate with QR code
3. Physical copy given to worker
4. Anyone scans to verify online
5. Real-time validation

### 3. Email Certificate ⏳ FUTURE (SendGrid)

**Flow:**
1. Worker passes quiz
2. Email sent with certificate
3. Email includes QR code image
4. Recipient scans to verify
5. No login required

### 4. Certificate Verification Station ⏳ FUTURE

**Flow:**
1. Workers arrive at job site
2. Security scans QR codes
3. Tablet shows verification status
4. Only valid certificates allow entry
5. Audit trail logged

---

## Troubleshooting

### QR Code Not Displaying

**Check URL encoding:**
```javascript
// Make sure text parameter is encoded
const qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(verificationUrl)}`;
```

**Check URL is accessible:**
```bash
# Test in browser
open "https://quickchart.io/qr?text=test"
```

### QR Code Not Scanning

**Increase size:**
```javascript
// Try larger size
const qrUrl = `...&size=400`;
```

**Increase error correction:**
```javascript
// More reliable scanning
const qrUrl = `...&ecLevel=H`;
```

**Check phone camera:**
- Some old phones don't auto-detect QR
- Use dedicated QR scanner app

### Verification Fails After Scan

**Check verification URL:**
```bash
# Test verification endpoint
curl http://localhost:5001/api/certificates/verify/CERT-A8B9C2D1
```

**Check certificate is valid:**
- Not revoked
- Not expired
- Certificate exists

---

## Comparison: QuickChart vs Alternatives

| Feature | QuickChart | qrcode (npm) | ZXing | Custom Service |
|---------|-----------|--------------|-------|----------------|
| Setup | ✅ None | ⚠️ npm install | ⚠️ Complex | ❌ Build it |
| Cost | ✅ Free | ✅ Free | ✅ Free | ❌ $ Hosting |
| File Storage | ✅ No | ❌ Yes | ❌ Yes | ❌ Yes |
| Maintenance | ✅ None | ⚠️ Updates | ⚠️ Updates | ❌ Full |
| Performance | ✅ CDN | ⚠️ Local | ⚠️ Local | ⚠️ Varies |
| Scalability | ✅ Auto | ⚠️ Limited | ⚠️ Limited | ⚠️ Manual |

**Verdict:** QuickChart is the best choice for most web applications.

---

## Summary

### What QuickChart Does:
✅ Generates QR codes on-demand via simple URLs  
✅ Returns image files (PNG/SVG) for immediate use  
✅ Handles caching and performance automatically  
✅ Requires zero setup or API keys  

### Why SafeBuild Uses It:
✅ No dependencies to install  
✅ No file storage needed  
✅ Scales automatically with traffic  
✅ Free for unlimited use  
✅ Works globally via CDN  

### Key Takeaway:
Instead of generating and storing QR code images, we generate **URLs** that point to QuickChart, which dynamically creates and serves the QR codes. It's simpler, faster, and more scalable.

---

## Additional Resources

**Official Documentation:**
- https://quickchart.io/documentation/
- https://quickchart.io/qr-codes/

**SafeBuild Files:**
- `backend/utils/qrCodeGenerator.js` - QR generation utility
- `backend/CERTIFICATE_POSTMAN_GUIDE.md` - Testing guide

**API Support:**
- GitHub Issues: https://github.com/typpo/quickchart/issues
- Email: support@quickchart.io

---

**Happy QR Coding! 📱**
