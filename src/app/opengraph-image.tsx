import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = "Infinity Legal — South Africa's Premier Legal Services Platform";
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '80px',
          background: 'linear-gradient(135deg, #0c1e3c 0%, #1a3358 100%)',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Logo / Brand mark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div
            style={{
              width: '88px',
              height: '88px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #ddc06e, #c9a84c, #a88832)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '52px',
              fontWeight: 800,
              color: '#0c1e3c',
              boxShadow: '0 8px 32px rgba(201, 168, 76, 0.3)',
            }}
          >
            IL
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '38px', fontWeight: 800, letterSpacing: '-0.02em' }}>
              INFINITY LEGAL
            </div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#c9a84c', letterSpacing: '0.3em', marginTop: '4px' }}>
              SOUTH AFRICA
            </div>
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ fontSize: '64px', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.03em' }}>
            Your Rights, Reinforced.
          </div>
          <div style={{ fontSize: '26px', color: '#a8b8d4', lineHeight: 1.4, maxWidth: '900px' }}>
            AI-powered legal practice management for South African law firms. POPIA-compliant case management, conveyancing, labour law & CCMA representation.
          </div>
        </div>

        {/* Footer badges */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 20px', borderRadius: '999px', background: 'rgba(201, 168, 76, 0.15)', border: '1px solid rgba(201, 168, 76, 0.4)', fontSize: '18px', fontWeight: 600, color: '#c9a84c' }}>
            POPIA Compliant
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 20px', borderRadius: '999px', background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', fontSize: '18px', fontWeight: 600 }}>
            256-bit Encryption
          </div>
          <div style={{ fontSize: '18px', color: '#8fa4c4', marginLeft: 'auto' }}>
            infinitylegal.org
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
