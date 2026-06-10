/**
 * Infinity Legal ZA - PayFast Cancel Return Handler
 * GET /api/payfast/cancel
 *
 * Handles user returning from a cancelled PayFast payment.
 */

import { NextResponse } from 'next/server';

export async function GET() {
  // Return a simple HTML cancel page that redirects back to the dashboard
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Payment Cancelled - Infinity Legal ZA</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #1a3358 0%, #0d1b2a 100%);
          color: #ffffff;
        }
        .container {
          text-align: center;
          padding: 2rem;
          max-width: 500px;
        }
        .icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }
        h1 {
          font-size: 1.75rem;
          margin-bottom: 0.5rem;
          color: #e74c3c;
        }
        p {
          font-size: 1rem;
          opacity: 0.85;
          margin-bottom: 1.5rem;
          line-height: 1.5;
        }
        .btn {
          display: inline-block;
          padding: 0.75rem 2rem;
          background: #c9a84c;
          color: #1a3358;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
        }
        .btn:hover {
          background: #d4b65a;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">&#10005;</div>
        <h1>Payment Cancelled</h1>
        <p>Your payment was cancelled and you have not been charged. If this was a mistake, you can try again from your dashboard.</p>
        <a class="btn" href="/">Return to Dashboard</a>
      </div>
    </body>
    </html>
  `;

  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html' },
  });
}
