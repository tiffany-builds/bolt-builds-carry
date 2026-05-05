const LOADING_MESSAGES = [
  "Good to have you back.",
  "What's on your mind?",
  "Say it out loud.",
  "What are you carrying today?",
  "Ready when you are.",
];

export function CarryLoadingScreen() {
  const message = LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)];
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#E8DDD0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <style>{`
        @keyframes carry-b1 { 0%,100%{transform:translateY(-55px)} 50%{transform:translateY(10px)} }
        @keyframes carry-b2 { 0%,100%{transform:translateY(10px)} 50%{transform:translateY(-50px)} }
        @keyframes carry-b3 { 0%,100%{transform:translateY(-25px)} 25%{transform:translateY(15px)} 75%{transform:translateY(-60px)} }
        @keyframes carry-b4 { 0%,100%{transform:translateY(5px)} 40%{transform:translateY(-45px)} }
        @keyframes carry-b5 { 0%,100%{transform:translateY(-45px)} 60%{transform:translateY(8px)} }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{
          fontFamily: "'Fraunces', Georgia, serif",
          fontStyle: 'italic',
          fontSize: '36px',
          color: '#C4714A',
          fontWeight: 300,
        }}>
          Carry.
        </div>

        <div style={{
          fontSize: '13px',
          color: '#888780',
          marginTop: '8px',
          letterSpacing: '0.02em',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {message}
        </div>

        <div style={{
          position: 'relative',
          width: '160px',
          height: '100px',
          marginTop: '12px',
        }}>
          <div style={{
            position: 'absolute', borderRadius: '50%',
            width: '22px', height: '22px', backgroundColor: '#C4714A',
            left: '60px', top: '60px',
            animation: 'carry-b1 1.4s ease-in-out infinite',
          }} />
          <div style={{
            position: 'absolute', borderRadius: '50%',
            width: '18px', height: '18px', backgroundColor: '#d4855f',
            left: '100px', top: '65px',
            animation: 'carry-b2 1.4s ease-in-out infinite 0.28s',
          }} />
          <div style={{
            position: 'absolute', borderRadius: '50%',
            width: '14px', height: '14px', backgroundColor: '#b85e3a',
            left: '80px', top: '68px',
            animation: 'carry-b3 1.4s ease-in-out infinite 0.14s',
          }} />
          <div style={{
            position: 'absolute', borderRadius: '50%',
            width: '16px', height: '16px', backgroundColor: '#e09878',
            left: '40px', top: '66px',
            animation: 'carry-b4 1.4s ease-in-out infinite 0.42s',
          }} />
          <div style={{
            position: 'absolute', borderRadius: '50%',
            width: '12px', height: '12px', backgroundColor: '#c97a55',
            left: '118px', top: '70px',
            animation: 'carry-b5 1.4s ease-in-out infinite 0.56s',
          }} />
        </div>
      </div>
    </div>
  );
}
