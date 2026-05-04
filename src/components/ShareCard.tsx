import { useRef, useState } from 'react';
import { X, Share } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface ShareCardProps {
  onClose: () => void;
}

export function ShareCard({ onClose }: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    if (!cardRef.current) return;
    setIsSharing(true);

    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#E8DDD0',
        scale: 3,
        useCORS: true,
        logging: false,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], 'carry-share.png', { type: 'image/png' });

        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Carry — Mental Load Assistant',
          });
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'carry-share.png';
          a.click();
          URL.revokeObjectURL(url);
        }
        setIsSharing(false);
      }, 'image/png');
    } catch (err) {
      setIsSharing(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      padding: '24px',
    }}>
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '24px',
          right: '24px',
          background: 'rgba(255,255,255,0.2)',
          border: 'none',
          borderRadius: '50%',
          width: '36px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'white',
        }}
      >
        <X size={18} />
      </button>

      <div
        ref={cardRef}
        style={{
          backgroundColor: '#E8DDD0',
          borderRadius: '20px',
          padding: '28px 24px',
          width: '280px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{
            fontSize: '10px',
            color: '#888780',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            fontFamily: "'DM Sans', sans-serif",
          }}>
            I use this for my mental load
          </div>
          <div style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontStyle: 'italic',
            fontSize: '36px',
            color: '#C4714A',
            lineHeight: 1,
            fontWeight: 300,
          }}>
            Carry.
          </div>
        </div>

        <div style={{
          width: '100%',
          height: '1px',
          backgroundColor: 'rgba(196,113,74,0.2)',
        }} />

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          width: '100%',
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '8px',
            flexShrink: 0,
          }}>
            <QRCodeSVG
              value="https://carry-the-app.com"
              size={90}
              fgColor="#C4714A"
              bgColor="white"
              level="M"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{
              fontSize: '11px',
              color: '#6b6460',
              lineHeight: 1.5,
              fontFamily: "'DM Sans', sans-serif",
            }}>
              Scan to download free on iPhone
            </div>
            <div style={{
              fontSize: '10px',
              color: '#b0a99a',
              fontFamily: "'DM Sans', sans-serif",
            }}>
              carry-the-app.com
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={handleShare}
        disabled={isSharing}
        style={{
          marginTop: '24px',
          backgroundColor: '#C4714A',
          color: 'white',
          border: 'none',
          borderRadius: '14px',
          padding: '14px 32px',
          fontSize: '15px',
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 500,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          opacity: isSharing ? 0.7 : 1,
        }}
      >
        <Share size={16} />
        {isSharing ? 'Preparing...' : 'Share Carry'}
      </button>

      <p style={{
        marginTop: '12px',
        fontSize: '12px',
        color: 'rgba(255,255,255,0.6)',
        fontFamily: "'DM Sans', sans-serif",
      }}>
        Share via Messages, WhatsApp, AirDrop and more
      </p>
    </div>
  );
}
