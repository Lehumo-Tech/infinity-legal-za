/**
 * Infinity Legal ZA - PayFast Success Return Handler
 * GET /api/payfast/success
 *
 * Handles user returning from a successful PayFast payment.
 * The actual payment confirmation is handled by the ITN notify endpoint.
 * This just shows a success response to the user.
 */

import { NextResponse } from 'next/server';

export async function GET() {
  // Return a simple HTML success page that redirects to the dashboard
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Payment Successful - Infinity Legal ZA</title>
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
          color: #c9a84c;
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
        <div class="icon">&#10003;</div>
        <h1>Payment Successful!</h1>
        <p>Thank you for your payment. Your subscription is being processed and will be activated shortly. You will receive a confirmation email once it is complete.</p>
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
