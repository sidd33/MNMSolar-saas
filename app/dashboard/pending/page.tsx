import { auth, currentUser } from '@clerk/nextjs/server';

export default async function PendingPage() {
  const user = await currentUser();

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#E9EEF6',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Montserrat, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '48px',
        maxWidth: '480px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 4px 24px rgba(28,51,132,0.08)'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          backgroundColor: '#FFC800',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          fontSize: '28px'
        }}>⏳</div>
        <h1 style={{ color: '#1C3384', fontSize: '24px', fontWeight: 700, marginBottom: '12px' }}>
          Account Pending
        </h1>
        <p style={{ color: '#6B7280', fontSize: '15px', lineHeight: 1.6, marginBottom: '24px' }}>
          Your account has been created successfully, but your role has not been assigned yet.
          Please contact your system administrator to get access.
        </p>
        <div style={{
          backgroundColor: '#E9EEF6',
          borderRadius: '8px',
          padding: '12px 16px',
          fontSize: '13px',
          color: '#1C3384',
          fontWeight: 600
        }}>
          {user?.emailAddresses[0]?.emailAddress}
        </div>
      </div>
    </div>
  );
}
