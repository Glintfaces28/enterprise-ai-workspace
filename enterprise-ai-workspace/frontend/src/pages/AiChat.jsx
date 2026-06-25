import { useEffect, useRef, useState } from 'react';
import { Send, Bot, User, Loader2, FileText } from 'lucide-react';
import api from '../api/client';

function Message({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
        isUser ? 'bg-indigo-600' : 'bg-slate-700'
      }`}>
        {isUser ? <User size={14} className="text-white" /> : <Bot size={14} className="text-white" />}
      </div>
      <div className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-indigo-600 text-white rounded-tr-sm'
            : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
        }`}>
          {msg.content}
        </div>
        {msg.sources && msg.sources.length > 0 && (
          <div className="space-y-1 w-full">
            <p className="text-xs text-gray-400 px-1">Sources</p>
            {msg.sources.map((s, i) => (
              <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600">
                <p className="flex items-center gap-1 font-medium text-gray-700 mb-0.5">
                  <FileText size={11} /> {s.filename}
                </p>
                <p className="line-clamp-2">{s.passage}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AiChat() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! Ask me anything about your uploaded documents.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(e) {
    e.preventDefault();
    const question = input.trim();
    if (!question || loading) return;

    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', { question, max_results: 3 });
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: res.data.answer, sources: res.data.sources },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white shrink-0">
        <h1 className="text-xl font-bold text-gray-900">AI Chat</h1>
        <p className="text-gray-500 text-sm">Ask questions about your uploaded documents.</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto px-6 py-6 space-y-5">
        {messages.map((msg, i) => (
          <Message key={i} msg={msg} />
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
              <Bot size={14} className="text-white" />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3">
              <Loader2 size={16} className="animate-spin text-indigo-500" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={sendMessage}
        className="shrink-0 px-6 py-4 border-t border-gray-200 bg-white"
      >
        <div className="flex gap-3 max-w-3xl mx-auto">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your documents…"
            disabled={loading}
            className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            <Send size={16} />
            <span className="hidden sm:inline text-sm font-medium">Send</span>
          </button>
        </div>
      </form>
    </div>
  );
}
