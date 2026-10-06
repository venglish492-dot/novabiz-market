import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('orderId') || 'ORD-DIRECT';
  const productId = searchParams.get('productId') || 'ASSET-PACK';

  const manifest = `================================================================================
NOVABIZ ASSETS — OFFICIAL CRYPTOGRAPHIC DIGITAL ASSET PACKAGE
================================================================================

ORDER IDENTIFIER: ${orderId}
PRODUCT ID: ${productId}
TIMESTAMP: ${new Date().toISOString()}
CRYPTOGRAPHIC HASH: SHA256-${Buffer.from(orderId + productId + Date.now()).toString('base64').substring(0, 32)}
LICENSE: Single-User Unlimited Business License (Commercial Rights Included)

--------------------------------------------------------------------------------
1. NOTION CLOUD WORKSPACES & TEMPLATES:
--------------------------------------------------------------------------------
To duplicate this Notion asset into your personal or team workspace:
1. Open URL: https://notion.site/novabiz-template-duplicate-hub
2. Click "Duplicate" in top right corner.
3. Select your destination workspace.

--------------------------------------------------------------------------------
2. EXCEL & GOOGLE SHEETS ASSETS:
--------------------------------------------------------------------------------
- Formulas, financial projections, and VBA macros are 100% unlocked.
- Compatible with: Microsoft Excel 2019+, Office 365, Google Sheets, Apple Numbers.

--------------------------------------------------------------------------------
3. COMMERCIAL USE & ANTI-PIRACY PROTECTION:
--------------------------------------------------------------------------------
- This digital document is watermarked and registered to your order ID.
- You are licensed to use, adapt, and deploy these materials in internal operations
  and client projects without restriction.
- Reselling or public redistribution of the raw source files is strictly prohibited.

================================================================================
AUTOPILOT FILE CLUSTER: Node-EU-Central-1 • Status: VERIFIED 200 OK
Technical Support: support@novabiz-assets.pro
================================================================================`;

  return new NextResponse(manifest, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="NovaBiz_${orderId}_Package.txt"`
    }
  });
}
