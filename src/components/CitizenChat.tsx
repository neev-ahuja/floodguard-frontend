import React, { useState, useRef, useEffect } from 'react';
import { Send, AlertTriangle, ShieldAlert } from 'lucide-react';
import type { EmergencyMessage } from '../types';

interface CitizenChatProps {
  messages: EmergencyMessage[];
  onSendMessage: (text: string) => Promise<any>;
}

export const CitizenChat: React.FC<CitizenChatProps> = ({ messages, onSendMessage }) => {
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;

    const message = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      await onSendMessage(message);
    } catch (err) {
      console.error('Failed to send message:', err);
      // Restore input text on error
      setInputText(message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
      {/* Chat header */}
      <div className="bg-slate-900 px-4 py-3 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="font-semibold text-sm text-slate-100">Emergency Dispatch Response Channel</span>
        </div>
        <span className="text-[10px] bg-slate-800 text-slate-400 font-mono px-2 py-0.5 rounded">
          Secure E2E Link
        </span>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-400">
            <ShieldAlert className="w-12 h-12 text-slate-300 mb-2" />
            <p className="font-medium text-sm">Emergency Chat Channel Connected</p>
            <p className="text-xs mt-1 max-w-xs">
              State your current situation, location coordinates, or medical needs. Dispatchers are active.
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const isCitizen = m.sender_type === 'CITIZEN';
            const isSystem = m.sender_type === 'SYSTEM';

            if (isSystem) {
              return (
                <div key={m.id} className="w-full flex justify-center my-1">
                  <div className="w-[90%] max-w-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 text-blue-900 dark:text-blue-200 p-3.5 rounded-xl text-xs flex items-start gap-3 shadow-sm shrink-0">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-blue-600 dark:text-blue-400" />
                    <div className="flex-1 min-w-0 text-left">
                      <span className="font-bold font-sans tracking-wide mr-1">SYSTEM UPDATE:</span>
                      <span className="break-words font-medium">{m.message}</span>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={m.id}
                className={`w-full flex ${isCitizen ? 'justify-end' : 'justify-start'} my-1`}
              >
                <div
                  className={`max-w-[80%] min-w-[260px] rounded-2xl p-3.5 text-xs shadow-sm shrink-0 ${
                    isCitizen
                      ? 'bg-slate-900 text-white rounded-br-none'
                      : 'bg-white text-slate-800 rounded-bl-none border border-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-center gap-4 mb-1.5 border-b border-current/10 pb-1">
                    <span className="text-[10px] font-bold tracking-wide uppercase opacity-75 font-sans">
                      {isCitizen ? 'You' : 'Dispatcher Command'}
                    </span>
                    <span className="text-[9px] opacity-60 font-mono">
                      {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="leading-relaxed whitespace-pre-wrap break-words">{m.message}</p>

                  {/* Render AI Classification for citizen's own verification or interest */}
                  {isCitizen && m.metadata?.ai_classification && (
                    <div className="mt-2 pt-1.5 border-t border-white/10 flex flex-wrap gap-1 items-center">
                      <span className="text-[8px] bg-white/15 text-white/90 px-1 py-0.5 rounded font-bold">
                        AI Intent: {m.metadata.ai_classification.intent}
                      </span>
                      <span className={`text-[8px] px-1 py-0.5 rounded font-bold ${
                        m.metadata.ai_classification.urgency === 'CRITICAL' || m.metadata.ai_classification.urgency === 'HIGH'
                          ? 'bg-red-500 text-white'
                          : 'bg-yellow-500 text-slate-950'
                      }`}>
                        Urgency: {m.metadata.ai_classification.urgency}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input controls */}
      <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-slate-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={sending}
            placeholder="Type your message to emergency dispatchers..."
            className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50 focus:bg-white transition-all disabled:opacity-70"
          />
          <button
            type="submit"
            disabled={sending || !inputText.trim()}
            className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white p-2.5 rounded-xl transition-all flex items-center justify-center flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default CitizenChat;
