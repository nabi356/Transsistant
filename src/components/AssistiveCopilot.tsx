import React, { useState } from 'react';
import { ShieldAlert, Volume2, VolumeX, Stethoscope, Utensils, Bus, ShoppingBag, Sparkles } from 'lucide-react';
import { AudioEngine } from '../services/audioEngine';
import { NebiusService } from '../services/nebiusService';
import type { EmergencyDispatch } from '../types';

export const AssistiveCopilot: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'emergency' | 'daily'>('emergency');
  const [isSirenOn, setIsSirenOn] = useState(false);
  const [isGeneratingDispatch, setIsGeneratingDispatch] = useState(false);
  const [selectedEmergencyType, setSelectedEmergencyType] = useState('Medical Emergency');
  const [customEmergencyNotes, setCustomEmergencyNotes] = useState('');

  const [dispatchReport, setDispatchReport] = useState<EmergencyDispatch>({
    urgency: 'CRITICAL',
    type: 'MEDICAL',
    headline: 'CRITICAL: DEAF CITIZEN REQUIRES IMMEDIATE MEDICAL ASSISTANCE',
    spokenScript: 'Attention emergency personnel. The person holding this device is deaf and non-verbal. Please examine this screen immediately for critical information.',
    smsMessage: '911 SOS: Deaf citizen at scene requires medical response. Visual communication required.',
    vitalDetails: [
      'User is Deaf & Non-Verbal (Cannot hear or speak)',
      'Primary Communication: Written text & visual display',
      'Please do not attempt to speak from behind; face the patient directly'
    ],
    timestamp: new Date().toLocaleTimeString()
  });

  // Daily presets
  const [activePresetCategory, setActivePresetCategory] = useState<'Medical' | 'Dining' | 'Transit' | 'Shopping'>('Medical');
  const [customDailyMessage, setCustomDailyMessage] = useState('');

  const toggleSiren = () => {
    if (isSirenOn) {
      AudioEngine.stopEmergencySiren();
      setIsSirenOn(false);
    } else {
      AudioEngine.startEmergencySiren();
      setIsSirenOn(true);
    }
  };

  const speakEmergencyScript = () => {
    AudioEngine.speak(dispatchReport.spokenScript, 1.0, 1.1);
  };

  const handleGenerateDispatch = async () => {
    setIsGeneratingDispatch(true);
    try {
      const report = await NebiusService.generateEmergencyDispatchReport(
        selectedEmergencyType,
        customEmergencyNotes
      );
      setDispatchReport(report);
      // Auto-speak emergency alert
      AudioEngine.speak(report.spokenScript);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingDispatch(false);
    }
  };

  const DAILY_PRESETS = {
    Medical: [
      { label: 'I am deaf, please write down instructions', text: 'I am deaf and non-verbal. Please write down any instructions or questions, or show me on this screen.' },
      { label: 'I have severe pain here', text: 'I am experiencing severe pain in this area. Please examine it carefully.' },
      { label: 'What is this medication for?', text: 'Could you please explain what this medication is for and the dosage instructions?' },
      { label: 'Please call an ASL interpreter', text: 'I have the legal right to an ASL (American Sign Language) interpreter. Please request one.' }
    ],
    Dining: [
      { label: 'Can I see the printed menu?', text: 'Hello! I am deaf. Could I please see the menu or point to what I would like to order?' },
      { label: 'Does this food contain allergens?', text: 'Does this dish contain any allergens like nuts, dairy, or gluten?' },
      { label: 'Please bring the bill / check', text: 'Could you please bring me the check when you have a moment? Thank you!' }
    ],
    Transit: [
      { label: 'Which platform for airport train?', text: 'Excuse me, which track or platform does the airport train depart from?' },
      { label: 'Please alert me when arriving at stop', text: 'I cannot hear audio announcements. Could you please tap my shoulder when we arrive at my stop?' },
      { label: 'Driver: drop me off at this address', text: 'Hello driver, please drop me off at the destination address shown on this screen.' }
    ],
    Shopping: [
      { label: 'Where can I find this item?', text: 'Excuse me, could you point me to the aisle where this item is located?' },
      { label: 'How much does this item cost?', text: 'Could you please tell me the price of this item or enter it on the calculator?' },
      { label: 'I would like to return this item', text: 'Hello, I have the receipt and would like to process an exchange or return for this item.' }
    ]
  };

  return (
    <div style={{ padding: '0 20px 20px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Sub tabs: Emergency SOS vs Daily Scenarios */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
        <button
          onClick={() => setActiveSubTab('emergency')}
          className={`btn ${activeSubTab === 'emergency' ? 'btn-danger' : 'btn-secondary'}`}
          style={{ padding: '10px 24px', fontSize: '0.95rem' }}
          id="btn-subtab-emergency"
        >
          <ShieldAlert size={18} />
          <span>Emergency SOS & First Responder Dispatch</span>
        </button>

        <button
          onClick={() => setActiveSubTab('daily')}
          className={`btn ${activeSubTab === 'daily' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '10px 24px', fontSize: '0.95rem' }}
          id="btn-subtab-daily"
        >
          <Stethoscope size={18} />
          <span>Everyday Assistive Communication Pads</span>
        </button>
      </div>

      {activeSubTab === 'emergency' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
          {/* Left Column: First Responder High-Visibility Card */}
          <div
            className="glass-panel"
            style={{
              padding: '24px',
              border: '2px solid #ff0054',
              boxShadow: '0 0 35px rgba(255, 0, 84, 0.35)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              background: 'linear-gradient(135deg, rgba(30, 10, 20, 0.9) 0%, rgba(18, 24, 40, 0.9) 100%)'
            }}
          >
            {/* Header with siren button */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="pulse-dot" style={{ background: '#ff0054', width: 12, height: 12 }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ff4d6d', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  ACTIVE FIRST RESPONDER DISPLAY
                </span>
              </div>

              <button
                onClick={toggleSiren}
                className={`btn ${isSirenOn ? 'btn-danger' : 'btn-secondary'}`}
                style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                id="btn-toggle-siren"
              >
                {isSirenOn ? <VolumeX size={16} /> : <Volume2 size={16} />}
                <span>{isSirenOn ? 'Mute Siren' : 'Loud Audio Siren'}</span>
              </button>
            </div>

            {/* Giant High-Visibility Headline */}
            <div style={{ background: '#ff0054', color: '#ffffff', padding: '16px 20px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 900, textTransform: 'uppercase', margin: 0, letterSpacing: '0.02em' }}>
                {dispatchReport.headline}
              </h2>
            </div>

            {/* Vital Responder Details */}
            <div style={{ background: 'rgba(5, 8, 15, 0.8)', borderRadius: 'var(--radius-md)', padding: '16px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <span style={{ fontSize: '0.78rem', color: '#ffb703', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                Vital Responder Notes
              </span>
              <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', color: '#f1f5f9', fontSize: '0.92rem' }}>
                {dispatchReport.vitalDetails.map((detail, idx) => (
                  <li key={idx} style={{ fontWeight: 600 }}>{detail}</li>
                ))}
              </ul>
            </div>

            {/* Spoken Audio Script */}
            <div style={{ background: 'rgba(255, 255, 255, 0.04)', borderRadius: 'var(--radius-md)', padding: '14px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  Automated Voice Announcement (Nemotron Ultra)
                </span>
                <button
                  onClick={speakEmergencyScript}
                  className="btn btn-secondary btn-icon"
                  style={{ width: 28, height: 28 }}
                  title="Speak Announcement"
                >
                  <Volume2 size={14} color="#ff0054" />
                </button>
              </div>
              <p style={{ fontSize: '0.88rem', color: '#cbd5e1', margin: 0, fontStyle: 'italic' }}>
                &ldquo;{dispatchReport.spokenScript}&rdquo;
              </p>
            </div>

            {/* Broadcast action button */}
            <button
              onClick={speakEmergencyScript}
              className="btn btn-danger"
              style={{ padding: '14px', fontSize: '1rem', marginTop: 'auto' }}
              id="btn-broadcast-voice"
            >
              <Volume2 size={20} />
              <span>Broadcast Voice Alert Aloud</span>
            </button>
          </div>

          {/* Right Column: Emergency Config & Custom Report Generator */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '4px' }}>
                Emergency Configuration & Dispatch
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                Powered by NVIDIA Nemotron 3 Ultra on Nebius Token Factory. Formats structured crisis dispatches.
              </p>
            </div>

            {/* Emergency Type Selector */}
            <div>
              <label style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                Emergency Category
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {['Medical Emergency', 'Fire / Rescue', 'Police / Safety', 'Lost / Trapped'].map(type => (
                  <button
                    key={type}
                    onClick={() => setSelectedEmergencyType(type)}
                    style={{
                      background: selectedEmergencyType === type ? 'rgba(255, 0, 84, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      border: selectedEmergencyType === type ? '1px solid #ff0054' : '1px solid var(--border-subtle)',
                      color: selectedEmergencyType === type ? '#ff4d6d' : '#ffffff',
                      borderRadius: 'var(--radius-sm)',
                      padding: '10px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Notes input */}
            <div>
              <label style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                Custom Details / Symptoms (Optional)
              </label>
              <textarea
                value={customEmergencyNotes}
                onChange={e => setCustomEmergencyNotes(e.target.value)}
                placeholder="E.g. Chest pain, diabetic, need immediate wheelchair assistance..."
                rows={3}
                style={{
                  width: '100%',
                  background: 'rgba(5, 8, 15, 0.8)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  outline: 'none',
                  resize: 'none'
                }}
              />
            </div>

            {/* Generate Report Button */}
            <button
              onClick={handleGenerateDispatch}
              disabled={isGeneratingDispatch}
              className="btn btn-primary"
              style={{ padding: '12px' }}
              id="btn-generate-sos-dispatch"
            >
              <Sparkles size={16} />
              <span>{isGeneratingDispatch ? 'Nemotron Reasoning...' : 'Update SOS Dispatch with Nemotron'}</span>
            </button>

            {/* SMS Dispatcher preview */}
            <div style={{ background: 'rgba(5, 8, 15, 0.7)', borderRadius: 'var(--radius-md)', padding: '14px', border: '1px solid var(--border-subtle)', marginTop: 'auto' }}>
              <span style={{ fontSize: '0.72rem', color: '#38bdf8', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                Prepared 911 Text / SMS Dispatch
              </span>
              <p style={{ fontSize: '0.82rem', color: '#e2e8f0', margin: 0, fontFamily: 'var(--font-mono)' }}>
                {dispatchReport.smsMessage}
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Daily Assistive Communication Pads */
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1.2fr) minmax(300px, 1fr)', gap: '20px' }}>
          {/* Left Column: Preset Categories & Cards */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Category tabs */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['Medical', 'Dining', 'Transit', 'Shopping'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setActivePresetCategory(cat)}
                  className={`btn ${activePresetCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '8px 16px', fontSize: '0.84rem' }}
                >
                  {cat === 'Medical' && <Stethoscope size={15} />}
                  {cat === 'Dining' && <Utensils size={15} />}
                  {cat === 'Transit' && <Bus size={15} />}
                  {cat === 'Shopping' && <ShoppingBag size={15} />}
                  <span>{cat}</span>
                </button>
              ))}
            </div>

            {/* Preset Action Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {DAILY_PRESETS[activePresetCategory].map((preset, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(10, 15, 28, 0.7)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div>
                    <h4 style={{ fontSize: '0.9rem', color: '#00ffa3', marginBottom: '2px' }}>
                      {preset.label}
                    </h4>
                    <p style={{ fontSize: '0.82rem', color: '#cbd5e1', margin: 0 }}>
                      &ldquo;{preset.text}&rdquo;
                    </p>
                  </div>
                  <button
                    onClick={() => AudioEngine.speak(preset.text)}
                    className="btn btn-secondary btn-icon"
                    style={{ flexShrink: 0 }}
                    title="Speak Aloud"
                  >
                    <Volume2 size={16} color="#00f0ff" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Custom Message Quick-Speaker */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '4px' }}>
                Instant Non-Verbal Voice Pad
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                Type whatever you wish to say, and Transsistant speaks it aloud instantly with natural cadence.
              </p>
            </div>

            <textarea
              value={customDailyMessage}
              onChange={e => setCustomDailyMessage(e.target.value)}
              placeholder="Type your message to show and speak aloud..."
              rows={6}
              style={{
                width: '100%',
                background: 'rgba(5, 8, 15, 0.8)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '14px',
                color: '#ffffff',
                fontSize: '0.95rem',
                outline: 'none',
                resize: 'none'
              }}
            />

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  if (customDailyMessage.trim()) {
                    AudioEngine.speak(customDailyMessage);
                  }
                }}
                disabled={!customDailyMessage.trim()}
                className="btn btn-primary"
                style={{ flex: 1, padding: '12px' }}
                id="btn-speak-custom-voice"
              >
                <Volume2 size={18} />
                <span>Speak Aloud</span>
              </button>
              <button
                onClick={() => setCustomDailyMessage('')}
                className="btn btn-secondary"
                style={{ padding: '12px 18px' }}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
