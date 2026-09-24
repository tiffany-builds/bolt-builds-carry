interface CaptureCardProps {
  isProcessing: boolean;
  liveTranscript?: string;
  processingTranscript?: string;
  onStop: () => void;
}

export function CaptureCard({ isProcessing, liveTranscript, processingTranscript, onStop }: CaptureCardProps) {
  return (
    <div
      onClick={onStop}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '500px',
        background: 'rgba(245,235,225,0.60)',
        backdropFilter: 'blur(8px)',
        borderRadius: '22px',
        cursor: 'pointer',
        border: '1px solid rgba(212,196,180,0.4)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '14px',
        boxShadow: '0 4px 32px rgba(44,36,32,0.06)',
        animation: 'cardEntrance 0.32s cubic-bezier(0.34, 1.56, 0.64, 1) forwards, borderBreath 3s ease-in-out infinite',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{
          fontSize: '14px',
          fontWeight: 400,
          color: '#C4714A',
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
        }}>
          {isProcessing ? '✦ Got it — sorting now' : 'Go ahead...'}
        </span>
        {!isProcessing && (
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            {[0, 0.15, 0.3].map((delay, i) => (
              <div key={i} style={{
                width: '5px', height: '5px', borderRadius: '50%',
                background: '#C4714A',
                animation: `pdotPulse 1.2s ease-in-out ${delay}s infinite`,
              }} />
            ))}
          </div>
        )}
      </div>

      {/* Transcript */}
      {liveTranscript && !isProcessing && (
        <div style={{
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
          fontSize: '14px',
          color: '#2C2420',
          lineHeight: 1.6,
          textAlign: 'center',
          opacity: 1,
        }}>
          "{liveTranscript}"
        </div>
      )}
      {isProcessing && processingTranscript && (
        <div style={{
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
          fontSize: '13px',
          color: '#2C2420',
          lineHeight: 1.6,
          textAlign: 'center',
          opacity: 0.5,
        }}>
          "{processingTranscript}{processingTranscript.length >= 80 ? '...' : ''}"
        </div>
      )}

      {/* Pulsing circle OR processing dots */}
      {isProcessing ? (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', margin: '4px 0' }}>
          {[
            { bg: '#C4714A', delay: '0s' },
            { bg: '#D4C4B4', delay: '0.15s' },
            { bg: '#D4A96A', delay: '0.3s' },
          ].map((d, i) => (
            <div key={i} style={{
              width: '10px', height: '10px', borderRadius: '50%',
              background: d.bg,
              animation: `pdotPulse 1s ease-in-out ${d.delay} infinite`,
            }} />
          ))}
        </div>
      ) : (
        <div style={{ position: 'relative', width: '90px', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Orbit ring */}
          <div style={{ position: 'absolute', width: '90px', height: '90px', borderRadius: '50%', border: '1px solid rgba(196,113,74,0.12)' }} />
          {/* Dot 1 - terra cotta, fast */}
          <div style={{
            position: 'absolute', width: '8px', height: '8px',
            borderRadius: '50%', background: '#C4714A',
            top: '50%', left: '50%',
            marginTop: '-4px', marginLeft: '-4px',
            transformOrigin: '0 0',
            animation: 'orbit1 4s linear infinite',
            opacity: 0.9,
          }} />
          {/* Dot 2 - warm gold, medium */}
          <div style={{
            position: 'absolute', width: '6px', height: '6px',
            borderRadius: '50%', background: '#D4A96A',
            top: '50%', left: '50%',
            marginTop: '-3px', marginLeft: '-3px',
            transformOrigin: '0 0',
            animation: 'orbit2 6s linear infinite',
            opacity: 0.7,
          }} />
          {/* Dot 3 - sand, slow */}
          <div style={{
            position: 'absolute', width: '5px', height: '5px',
            borderRadius: '50%', background: '#D4C4B4',
            top: '50%', left: '50%',
            marginTop: '-2.5px', marginLeft: '-2.5px',
            transformOrigin: '0 0',
            animation: 'orbit3 9s linear infinite',
            opacity: 0.6,
          }} />
          {/* Centre core */}
          <div style={{
            width: '16px', height: '16px',
            borderRadius: '50%',
            background: '#C4714A',
            position: 'relative', zIndex: 2,
            animation: 'colourFlow 4s ease-in-out infinite',
          }} />
        </div>
      )}

      {/* Stop button — only when listening, not processing */}
      {!isProcessing && (
        <div
          style={{
            fontSize: '11px',
            color: '#6B5C52',
            border: '1px solid #D4C4B4',
            borderRadius: '12px',
            padding: '5px 16px',
            background: '#E8DDD0',
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          Tap to stop
        </div>
      )}

      {/* Processing message */}
      {isProcessing && (
        <div style={{
          fontSize: '11px',
          color: '#6B5C52',
          fontStyle: 'italic',
          fontFamily: 'DM Sans, sans-serif',
        }}>
          Just a moment...
        </div>
      )}
    </div>
  );
}
