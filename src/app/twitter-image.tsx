import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = "Infinity Legal — South Africa's Premier Legal Services Platform";
export const size = { width: 1200, height: 600 };
export const contentType = 'image/png';

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          padding: '80px',
          background: 'linear-gradient(135deg, #0c1e3c 0%, #1a3358 100%)',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '48px' }}>
          <div
            style={{
              width: '84px',
              height: '84px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #ddc06e, #c9a84c, #a88832)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '48px',
              fontWeight: 800,
              color: '#0c1e3c',
            }}
          >
            IL
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-0.02em' }}>
              INFINITY LEGAL
            </div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#c9a84c', letterSpacing: '0.3em', marginTop: '2px' }}>
              SOUTH AFRICA
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', fontSize: '68px', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.03em', marginBottom: '20px' }}>
          Your Rights, Reinforced.
        </div>
        <div style={{ display: 'flex', fontSize: '26px', color: '#a8b8d4', lineHeight: 1.4 }}>
          AI-powered legal practice management. POPIA-compliant.
        </div>

        <div style={{ display: 'flex', gap: '16px', marginTop: '40px' }}>
          <div style={{ display: 'flex', padding: '10px 18px', borderRadius: '999px', background: 'rgba(201, 168, 76, 0.15)', border: '1px solid rgba(201, 168, 76, 0.4)', fontSize: '16px', fontWeight: 600, color: '#c9a84c' }}>
            POPIA Compliant
          </div>
          <div style={{ display: 'flex', padding: '10px 18px', borderRadius: '999px', background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', fontSize: '16px', fontWeight: 600 }}>
            From R99/month
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
