export function LoadingScreen() {
  return (
    <div style={{
      background: '#E8DDD0',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '16px'
    }}>
      <div style={{
        fontFamily: 'Fraunces, serif',
        fontSize: '48px',
        fontWeight: 200,
        fontStyle: 'italic',
        color: '#C4714A'
      }}>
        Carry
      </div>
      <div style={{
        fontSize: '13px',
        color: '#9E8E80',
        fontFamily: 'DM Sans, sans-serif',
        fontWeight: 300
      }}>
        Just a moment...
      </div>
    </div>
  );
}
