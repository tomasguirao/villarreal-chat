'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

type Phase = 'chat' | 'consent_pending' | 'identified'

const TEXTO_CONSENTIMIENTO =
  'Autorizo al Villarreal CF a consultar mis datos de abonado (número de abonado y situación de asiento) con el fin exclusivo de informarme sobre la campaña de abonos 2025/26, conforme al Reglamento (UE) 2016/679 (RGPD).'

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Asistente de la campaña de abonos del Villarreal CF 26/27. ¿En qué puedo ayudarte?',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [phase, setPhase] = useState<Phase>('chat')
  const [numeroInput, setNumeroInput] = useState('')
  const [consentChecked, setConsentChecked] = useState(false)
  const [numeroAbonado, setNumeroAbonado] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, phase])

  async function sendMessage() {
    if (!input.trim() || loading) return

    const userMessage: Message = { role: 'user', content: input }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          numeroAbonado,
          consentGiven: phase === 'identified',
        }),
      })
      const data = await res.json()
      const rawMessage: string = data.message

      if (rawMessage.includes('[SOLICITAR_NUMERO]') && phase === 'chat') {
        const cleanMessage = rawMessage.replace('[SOLICITAR_NUMERO]', '').trim()
        setMessages([...updatedMessages, { role: 'assistant', content: cleanMessage }])
        setPhase('consent_pending')
      } else {
        setMessages([...updatedMessages, { role: 'assistant', content: rawMessage }])
      }
    } catch {
      setMessages([...updatedMessages, { role: 'assistant', content: 'Ha ocurrido un error. Por favor, inténtalo de nuevo.' }])
    } finally {
      setLoading(false)
    }
  }

  async function submitConsent() {
    if (!numeroInput.trim() || !consentChecked || loading) return
    setLoading(true)

    try {
      await fetch('/api/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numeroAbonado: numeroInput.trim(), aceptado: true }),
      })

      setNumeroAbonado(numeroInput.trim())
      setPhase('identified')

      const userMessage: Message = { role: 'user', content: `Mi número de abonado es ${numeroInput.trim()}` }
      const updatedMessages = [...messages, userMessage]
      setMessages(updatedMessages)

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          numeroAbonado: numeroInput.trim(),
          consentGiven: true,
        }),
      })
      const data = await res.json()
      setMessages([...updatedMessages, { role: 'assistant', content: data.message }])
    } catch {
      setMessages([...messages, { role: 'assistant', content: 'Ha ocurrido un error al verificar tu número. Inténtalo de nuevo.' }])
      setPhase('chat')
    } finally {
      setLoading(false)
      setNumeroInput('')
      setConsentChecked(false)
    }
  }

  async function declineConsent() {
    await fetch('/api/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numeroAbonado: numeroInput.trim() || 'desconocido', aceptado: false }),
    })
    setPhase('chat')
    setNumeroInput('')
    setConsentChecked(false)
    setMessages([...messages, {
      role: 'assistant',
      content: 'De acuerdo, no consultaré tus datos. Si tienes dudas sobre las fechas de la campaña, puedo informarte sin necesidad de identificarte.',
    }])
  }

  return (
    <main style={{ minHeight: '100vh', background: '#f0f4f8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '680px', background: 'white', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '80vh' }}>

        {/* Header */}
        <div style={{ background: '#005F9E', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 40, height: 40, background: '#FFD700', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#005F9E', fontSize: '1.1rem' }}>VCF</div>
          <div>
            <div style={{ color: 'white', fontWeight: '700', fontSize: '1rem' }}>Villarreal CF</div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem' }}>Campaña de abonos 2025/26</div>
          </div>
          {phase === 'identified' && (
            <div style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.15)', borderRadius: '20px', padding: '0.25rem 0.875rem', color: 'white', fontSize: '0.8rem' }}>
              Abonado #{numeroAbonado}
            </div>
          )}
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '75%',
                padding: '0.75rem 1rem',
                borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: msg.role === 'user' ? '#005F9E' : '#f1f5f9',
                color: msg.role === 'user' ? 'white' : '#1e293b',
                fontSize: '0.9rem',
                lineHeight: '1.5',
                whiteSpace: 'pre-wrap',
              }}>
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{ padding: '0.75rem 1rem', borderRadius: '16px 16px 16px 4px', background: '#f1f5f9', color: '#94a3b8', fontSize: '0.9rem' }}>
                Escribiendo...
              </div>
            </div>
          )}

          {/* Formulario de consentimiento */}
          {phase === 'consent_pending' && !loading && (
            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '1.25rem', border: '1px solid #e2e8f0' }}>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.875rem', lineHeight: '1.4' }}>
                Para consultar la situación de tu asiento necesito tu número de abonado.
              </p>
              <input
                value={numeroInput}
                onChange={e => setNumeroInput(e.target.value)}
                placeholder="Número de abonado"
                type="text"
                inputMode="numeric"
                style={{ width: '100%', padding: '0.65rem 0.875rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', marginBottom: '0.875rem', boxSizing: 'border-box', outline: 'none' }}
              />
              <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', cursor: 'pointer', marginBottom: '1rem' }}>
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={e => setConsentChecked(e.target.checked)}
                  style={{ marginTop: '3px', flexShrink: 0 }}
                />
                <span style={{ fontSize: '0.8rem', color: '#475569', lineHeight: '1.5' }}>
                  {TEXTO_CONSENTIMIENTO}
                </span>
              </label>
              <div style={{ display: 'flex', gap: '0.625rem' }}>
                <button
                  onClick={submitConsent}
                  disabled={!numeroInput.trim() || !consentChecked}
                  style={{ flex: 1, background: '#005F9E', color: 'white', border: 'none', borderRadius: '8px', padding: '0.65rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600', opacity: !numeroInput.trim() || !consentChecked ? 0.4 : 1 }}
                >
                  Acepto y consultar
                </button>
                <button
                  onClick={declineConsent}
                  style={{ flex: 1, background: 'white', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.65rem', cursor: 'pointer', fontSize: '0.875rem' }}
                >
                  No acepto
                </button>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        {phase !== 'consent_pending' && (
          <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '0.75rem' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Pregunta sobre renovación, fechas..."
              style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: '24px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.9rem', background: '#f8fafc' }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={{ background: '#005F9E', color: 'white', border: 'none', borderRadius: '24px', padding: '0.75rem 1.25rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600', opacity: loading || !input.trim() ? 0.5 : 1 }}
            >
              Enviar
            </button>
          </div>
        )}
      </div>
    </main>
  )
}

