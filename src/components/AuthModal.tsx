import React, { useState } from 'react';
import { LogIn, UserPlus, Shield, User, Mail, Lock, CheckCircle2, Sparkles, X } from 'lucide-react';
import type { UserProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onLoginSuccess: (user: UserProfile) => void;
  currentUser: UserProfile | null;
  forcedMode?: boolean; // When true, modal cannot be dismissed without logging in
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  forcedMode = false
}) => {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('maya.student@deafedu.org');
  const [loginPassword, setLoginPassword] = useState('password123');
  const [rememberMe, setRememberMe] = useState(true);

  // Signup form state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupRole, setSignupRole] = useState<UserProfile['role']>('student');
  const [signupLang, setSignupLang] = useState<UserProfile['preferredSignLang']>('ASL');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setErrorMsg('Please enter both your email/username and password');
      return;
    }

    // Generate authenticated profile
    const user: UserProfile = {
      id: `usr-${Date.now()}`,
      name: loginEmail.includes('maya') ? 'Maya Lin' : loginEmail.includes('sarah') ? 'Prof. Sarah Jenkins' : loginEmail.includes('alex') ? 'Alex Rivera' : loginEmail.split('@')[0],
      email: loginEmail,
      role: loginEmail.includes('sarah') ? 'teacher' : loginEmail.includes('alex') ? 'interpreter' : 'student',
      preferredSignLang: 'ASL',
      avatar: loginEmail.includes('maya') ? 'ML' : loginEmail.includes('sarah') ? 'SJ' : loginEmail.includes('alex') ? 'AR' : 'TU'
    };

    if (rememberMe) {
      localStorage.setItem('transisstant_user', JSON.stringify(user));
    }
    setErrorMsg(null);
    onLoginSuccess(user);
    if (onClose) onClose();
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName.trim() || !signupEmail.trim() || !signupPassword.trim()) {
      setErrorMsg('Please complete all required fields to register');
      return;
    }

    const initials = signupName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';

    const user: UserProfile = {
      id: `usr-${Date.now()}`,
      name: signupName,
      email: signupEmail,
      role: signupRole,
      preferredSignLang: signupLang,
      avatar: initials
    };

    localStorage.setItem('transisstant_user', JSON.stringify(user));
    setErrorMsg(null);
    onLoginSuccess(user);
    if (onClose) onClose();
  };

  const quickLoginAs = (preset: { name: string; email: string; role: UserProfile['role']; avatar: string }) => {
    const user: UserProfile = {
      id: `usr-${Date.now()}`,
      name: preset.name,
      email: preset.email,
      role: preset.role,
      preferredSignLang: 'ASL',
      avatar: preset.avatar
    };
    localStorage.setItem('transisstant_user', JSON.stringify(user));
    setErrorMsg(null);
    onLoginSuccess(user);
    if (onClose) onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(5, 8, 15, 0.85)',
        backdropFilter: 'blur(12px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '520px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-accent)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-card)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0, 240, 255, 0.03)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-emerald))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#050a12',
                fontWeight: 700
              }}
            >
              <Shield size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', margin: 0, fontWeight: 700 }}>
                {tab === 'login' ? 'Classroom Sign In' : 'Join Transisstant'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Authentication required before entering live sign session
              </p>
            </div>
          </div>

          {!forcedMode && onClose && (
            <button
              onClick={onClose}
              className="btn btn-secondary btn-icon"
              style={{ width: 32, height: 32 }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Tab Toggle */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'rgba(0, 0, 0, 0.15)'
          }}
        >
          <button
            onClick={() => { setTab('login'); setErrorMsg(null); }}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              background: tab === 'login' ? 'rgba(0, 240, 255, 0.1)' : 'transparent',
              color: tab === 'login' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              borderBottom: tab === 'login' ? '2px solid var(--accent-cyan)' : '2px solid transparent',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <LogIn size={15} />
            <span>Login Credentials</span>
          </button>
          <button
            onClick={() => { setTab('signup'); setErrorMsg(null); }}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              background: tab === 'signup' ? 'rgba(0, 255, 163, 0.1)' : 'transparent',
              color: tab === 'signup' ? 'var(--accent-emerald)' : 'var(--text-secondary)',
              borderBottom: tab === 'signup' ? '2px solid var(--accent-emerald)' : '2px solid transparent',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <UserPlus size={15} />
            <span>Sign Up (New Users)</span>
          </button>
        </div>

        {/* Form Body */}
        <div style={{ padding: '24px' }}>
          {errorMsg && (
            <div
              style={{
                marginBottom: '16px',
                padding: '10px 14px',
                background: 'rgba(255, 0, 84, 0.1)',
                border: '1px solid rgba(255, 0, 84, 0.3)',
                borderRadius: 'var(--radius-sm)',
                color: '#ff4d6d',
                fontSize: '0.82rem'
              }}
            >
              {errorMsg}
            </div>
          )}

          {tab === 'login' ? (
            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Email Address or Username
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: 12, top: 12 }} />
                  <input
                    type="text"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    placeholder="e.g. student@deafedu.org"
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 38px',
                      background: 'rgba(0, 0, 0, 0.2)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: 12, top: 12 }} />
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 38px',
                      background: 'rgba(0, 0, 0, 0.2)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                  />
                  <span>Remember my session</span>
                </label>
                <span style={{ color: 'var(--accent-cyan)', cursor: 'pointer' }}>Demo Access Enabled</span>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '6px', padding: '12px' }}
              >
                <LogIn size={16} />
                <span>Enter Classroom / Live Meet</span>
              </button>

              {/* Quick Demo Logins */}
              <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                  <Sparkles size={12} color="var(--accent-cyan)" />
                  <span>Or 1-Click Instant Login as:</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => quickLoginAs({ name: 'Maya Lin', email: 'maya.student@deafedu.org', role: 'student', avatar: 'ML' })}
                    className="btn btn-secondary"
                    style={{ padding: '8px 6px', fontSize: '0.74rem', display: 'flex', flexDirection: 'column', gap: '3px', textAlign: 'center' }}
                  >
                    <span style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>Maya Lin</span>
                    <span style={{ fontSize: '0.66rem', color: 'var(--text-secondary)' }}>Deaf Student</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => quickLoginAs({ name: 'Prof. Sarah Jenkins', email: 's.jenkins@stanford.edu', role: 'teacher', avatar: 'SJ' })}
                    className="btn btn-secondary"
                    style={{ padding: '8px 6px', fontSize: '0.74rem', display: 'flex', flexDirection: 'column', gap: '3px', textAlign: 'center' }}
                  >
                    <span style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>Prof. Sarah</span>
                    <span style={{ fontSize: '0.66rem', color: 'var(--text-secondary)' }}>Host / Teacher</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => quickLoginAs({ name: 'Alex Rivera', email: 'alex.rivera@asl-pro.org', role: 'interpreter', avatar: 'AR' })}
                    className="btn btn-secondary"
                    style={{ padding: '8px 6px', fontSize: '0.74rem', display: 'flex', flexDirection: 'column', gap: '3px', textAlign: 'center' }}
                  >
                    <span style={{ fontWeight: 700, color: 'var(--accent-purple)' }}>Alex Rivera</span>
                    <span style={{ fontSize: '0.66rem', color: 'var(--text-secondary)' }}>Interpreter</span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Full Legal Name
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: 12, top: 12 }} />
                  <input
                    type="text"
                    value={signupName}
                    onChange={e => setSignupName(e.target.value)}
                    placeholder="e.g. Jordan Lee"
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 38px',
                      background: 'rgba(0, 0, 0, 0.2)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: 12, top: 12 }} />
                  <input
                    type="email"
                    value={signupEmail}
                    onChange={e => setSignupEmail(e.target.value)}
                    placeholder="jordan.lee@example.edu"
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 38px',
                      background: 'rgba(0, 0, 0, 0.2)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: 12, top: 12 }} />
                  <input
                    type="password"
                    value={signupPassword}
                    onChange={e => setSignupPassword(e.target.value)}
                    placeholder="Create a secure password"
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 38px',
                      background: 'rgba(0, 0, 0, 0.2)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Role in Meet
                  </label>
                  <select
                    value={signupRole}
                    onChange={e => setSignupRole(e.target.value as UserProfile['role'])}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem'
                    }}
                  >
                    <option value="student">Student / Signer</option>
                    <option value="teacher">Professor / Host</option>
                    <option value="interpreter">Sign Interpreter</option>
                    <option value="guest">Guest Observer</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Preferred Language
                  </label>
                  <select
                    value={signupLang}
                    onChange={e => setSignupLang(e.target.value as UserProfile['preferredSignLang'])}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem'
                    }}
                  >
                    <option value="ASL">ASL (American Sign)</option>
                    <option value="BSL">BSL (British Sign)</option>
                    <option value="ISL">ISL (International)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '8px', padding: '12px' }}
              >
                <CheckCircle2 size={16} />
                <span>Create Account & Join Session</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
