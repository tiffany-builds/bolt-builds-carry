import { useRef, useState } from 'react';
import { X, Share } from 'lucide-react';

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
        backgroundColor: '#FDF9F4',
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
            text: "I use this app to manage my mental load — it's free on iPhone:",
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

      {/* The shareable card */}
      <div
        ref={cardRef}
        style={{
          backgroundColor: '#FDF9F4',
          borderRadius: '20px',
          padding: '28px 24px',
          width: '280px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {/* Header */}
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

        {/* Divider */}
        <div style={{ width: '100%', height: '1px', backgroundColor: 'rgba(196,113,74,0.2)' }} />

        {/* Content row: text + phone mockup */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>

          {/* Left: text */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
            <div style={{
              fontSize: '11px',
              color: '#6b6460',
              lineHeight: 1.6,
              fontFamily: "'DM Sans', sans-serif",
            }}>
              The app for everything you're holding in your head.
            </div>
            <div style={{
              fontSize: '10px',
              color: '#C4714A',
              fontFamily: "'DM Sans', sans-serif",
              letterSpacing: '0.02em',
              marginTop: '4px',
            }}>
              carry-the-app.com
            </div>
          </div>

          {/* Right: phone mockup */}
          <div style={{
            width: '72px',
            height: '122px',
            borderRadius: '14px',
            border: '3px solid #2c2c2a',
            backgroundColor: '#E8DDD0',
            flexShrink: 0,
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Notch */}
            <div style={{
              position: 'absolute',
              top: '5px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '24px',
              height: '5px',
              backgroundColor: '#2c2c2a',
              borderRadius: '4px',
            }} />

            {/* Screen content */}
            <div style={{ padding: '16px 5px 5px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{
                fontFamily: "'Fraunces', Georgia, serif",
                fontStyle: 'italic',
                fontSize: '7px',
                color: '#C4714A',
                lineHeight: 1.3,
              }}>
                Friday looks<br />good, <em>Tiffany.</em>
              </div>
              <div style={{ height: '2px', background: 'rgba(196,113,74,0.2)', borderRadius: '2px', width: '90%', marginTop: '3px' }} />
              <div style={{ height: '2px', background: 'rgba(196,113,74,0.1)', borderRadius: '2px', width: '65%' }} />
              <div style={{ marginTop: '5px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px' }}>
                {[['🫶', '3'], ['🏠', '2'], ['❤️', '1'], ['🛒', '4']].map(([emoji, count]) => (
                  <div key={emoji} style={{
                    background: '#FDF9F4',
                    borderRadius: '4px',
                    padding: '3px 2px',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '8px' }}>{emoji}</div>
                    <div style={{ fontSize: '5px', color: '#C4714A' }}>{count}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Share button */}
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
        textAlign: 'center',
      }}>
        Share via Messages, WhatsApp, AirDrop and more
      </p>
    </div>
  );
}
