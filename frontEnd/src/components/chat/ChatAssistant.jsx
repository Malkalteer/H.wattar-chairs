import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUp, Bot, MessageSquare, RotateCcw, Sparkles, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useSite } from '../../context/SiteContext';
import { getWhatsappNumber, whatsappLink } from '../../utils/format';

const SUGGESTIONS = [
  'ما هي أنواع المنتجات المتوفرة لديكم؟',
  'كم أسعار الكراسي تقريبًا؟',
  'ما هي ساعات العمل وطرق التواصل؟',
  'هل تقبلون تصنيع مقاسات خاصة؟',
];

const WELCOME = {
  id: 'welcome',
  role: 'assistant',
  text: 'مرحبًا بك في Wattar Chair 👋\nأنا مساعدك الذكي، يمكنني مساعدتك في معرفة المنتجات والأسعار وأوقات العمل وطرق التواصل.',
  animate: false,
};

let idCounter = 0;
const nextId = () => `m-${Date.now()}-${idCounter++}`;

// عرض نص بسيط: نقاط وخط عريض بدون استخدام HTML خام (آمن من XSS)
function renderInline(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') && part.length > 4 ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

function FormattedText({ text }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        const bullet = line.match(/^\s*[*\-•]\s+(.*)$/);
        if (bullet) {
          return (
            <div key={i} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
              <span>{renderInline(bullet[1])}</span>
            </div>
          );
        }
        if (!line.trim()) return <div key={i} className="h-1" />;
        return <p key={i}>{renderInline(line)}</p>;
      })}
    </div>
  );
}

function AssistantBubble({ message, onProgress }) {
  const [shown, setShown] = useState(message.animate ? '' : message.text);

  useEffect(() => {
    if (!message.animate) return undefined;
    let index = 0;
    const step = Math.max(2, Math.ceil(message.text.length / 120));
    const timer = setInterval(() => {
      index = Math.min(message.text.length, index + step);
      setShown(message.text.slice(0, index));
      onProgress?.();
      if (index >= message.text.length) clearInterval(timer);
    }, 18);
    return () => clearInterval(timer);
  }, [message.animate, message.text, onProgress]);

  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-800 text-white shadow-sm">
        <Sparkles size={15} />
      </div>
      <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-stone-100 px-4 py-3 text-[14px] leading-7 text-stone-800 dark:bg-stone-800 dark:text-stone-100">
        <FormattedText text={shown} />
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-800 text-white shadow-sm">
        <Sparkles size={15} />
      </div>
      <div className="flex items-center gap-1.5 rounded-2xl rounded-tr-sm bg-stone-100 px-4 py-4 dark:bg-stone-800" aria-label="المساعد يكتب">
        {[0, 1, 2].map((i) => (
          <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-brand-500" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );
}

export default function ChatAssistant() {
  const { user } = useAuth();
  const { siteSettings } = useSite();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    const openChat = () => setOpen(true);
    window.addEventListener('wattar:open-chat', openChat);
    return () => window.removeEventListener('wattar:open-chat', openChat);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, open, scrollToBottom]);

  useEffect(() => {
    if (open && user) inputRef.current?.focus();
  }, [open, user]);

  const resetChat = () => {
    setMessages([WELCOME]);
    setInput('');
  };

  const send = async (rawText) => {
    const text = (rawText ?? input).trim();
    if (!text || loading) return;

    const history = messages
      .filter((m) => m.id !== 'welcome' && !m.error)
      .map((m) => ({ role: m.role, text: m.text }));

    setMessages((prev) => [...prev.map((m) => ({ ...m, animate: false })), { id: nextId(), role: 'user', text }]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await api.post('/ai/chat', { message: text, history });
      setMessages((prev) => [...prev, { id: nextId(), role: 'assistant', text: data.reply, animate: true }]);
    } catch (error) {
      const errorText = error.response?.data?.message || 'حدث خطأ أثناء الاتصال بالمساعد. حاول مرة أخرى.';
      setMessages((prev) => [...prev, { id: nextId(), role: 'assistant', text: errorText, error: true, animate: false }]);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const showSuggestions = messages.length === 1 && !loading;

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-label="المساعد الذكي"
          className="fixed inset-x-3 bottom-24 z-[60] flex h-[72vh] max-h-[660px] flex-col overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-[0_30px_80px_rgba(30,20,15,0.28)] dark:border-stone-700 dark:bg-stone-900 sm:inset-x-auto sm:left-5 sm:w-[410px]"
        >
          <header className="flex items-center justify-between bg-gradient-to-l from-brand-800 to-brand-700 px-4 py-3.5 text-white">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
                <Bot size={20} />
                <span className="absolute -bottom-0.5 -left-0.5 h-3 w-3 rounded-full border-2 border-brand-800 bg-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-bold">مساعد وتار الذكي</p>
                <p className="text-[11px] text-brand-100">متصل • يجيب خلال ثوانٍ</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={resetChat} aria-label="محادثة جديدة" title="محادثة جديدة" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/15">
                <RotateCcw size={16} />
              </button>
              <button type="button" onClick={() => setOpen(false)} aria-label="إغلاق" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/15">
                <X size={18} />
              </button>
            </div>
          </header>

          {!user ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-200">
                <Sparkles size={28} />
              </div>
              <p className="text-lg font-bold text-stone-900 dark:text-stone-100">سجّل الدخول للتحدث مع المساعد</p>
              <p className="text-sm text-stone-500 dark:text-stone-400">اسأل عن المنتجات والأسعار وأوقات العمل بسهولة.</p>
              <Link to="/login" onClick={() => setOpen(false)} className="rounded-full bg-brand-700 px-6 py-3 text-sm font-medium text-white">
                تسجيل الدخول
              </Link>
            </div>
          ) : (
            <>
              <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
                {messages.map((m) =>
                  m.role === 'user' ? (
                    <div key={m.id} className="flex justify-start">
                      <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tl-sm bg-brand-700 px-4 py-3 text-[14px] leading-7 text-white shadow-sm">{m.text}</div>
                    </div>
                  ) : (
                    <AssistantBubble key={m.id} message={m} onProgress={scrollToBottom} />
                  )
                )}
                {loading && <TypingIndicator />}

                {showSuggestions && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {SUGGESTIONS.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => send(q)}
                        className="rounded-full border border-brand-200 bg-brand-50 px-3.5 py-2 text-right text-xs font-medium text-brand-800 transition hover:bg-brand-100 dark:border-brand-900/50 dark:bg-brand-900/20 dark:text-brand-100"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-stone-200 p-3 dark:border-stone-700">
                <div className="flex items-end gap-2 rounded-3xl border border-stone-200 bg-stone-50 px-3 py-2 focus-within:border-brand-500 dark:border-stone-700 dark:bg-stone-800">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={onKeyDown}
                    rows={1}
                    maxLength={1000}
                    placeholder="اكتب سؤالك هنا..."
                    className="max-h-28 min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 text-right text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => send()}
                    disabled={loading || !input.trim()}
                    aria-label="إرسال"
                    className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-700 text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ArrowUp size={18} />
                  </button>
                </div>
                <p className="mt-2 text-center text-[10px] text-stone-400">المساعد آلي وقد يخطئ. للتأكيد{' '}
                  <a href={whatsappLink(getWhatsappNumber(siteSettings.contact), 'السلام عليكم، لدي استفسار.')} target="_blank" rel="noreferrer" className="underline">تواصل معنا عبر واتساب</a>.
                </p>
              </div>
            </>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={open ? 'إغلاق المساعد' : 'فتح المساعد الذكي'}
        className="fixed bottom-5 left-5 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-800 text-white shadow-[0_16px_40px_rgba(95,52,38,0.45)] transition hover:scale-105"
      >
        {open ? <X size={24} /> : <MessageSquare size={24} />}
        {!open && <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 animate-pulse rounded-full border-2 border-white bg-emerald-400" />}
      </button>
    </>
  );
}
