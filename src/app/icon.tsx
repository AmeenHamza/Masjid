import { ImageResponse } from 'next/og';

export const size = {
  width: 32,
  height: 32
};

export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(180deg, #0f766e 0%, #134e4a 100%)',
          color: '#f8fafc',
          fontSize: 20,
          fontWeight: 800,
          borderRadius: 8
        }}
      >
        M
      </div>
    ),
    size
  );
}