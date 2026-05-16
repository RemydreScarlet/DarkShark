import { useState, KeyboardEvent, useEffect, useRef, memo } from 'react';
import { localInference, initializeInference } from './LocalInferenceProvider';

type Message = { role: 'user' | 'assistant'; content: string };

const MessageItem = memo(({ msg }: { msg: Message }) => (
  <div style={{ 
    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
    padding: '10px 15px',
    borderRadius: '15px',
    maxWidth: '70%',
    backgroundColor: msg.role === 'user' ? '#007bff' : '#f1f1f1',
    color: msg.role === 'user' ? '#fff' : '#000'
  }}>
    {msg.content}
  </div>
));

export const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I am DarkShark. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initProgress, setInitProgress] = useState<number | null>(null);
  const isInitializing = useRef(false);

  useEffect(() => {
    if (isInitializing.current) return;
    isInitializing.current = true;
    initializeInference((p) => setInitProgress(p)).then(() => setInitProgress(1));
  }, []);

  const streamBuffer = useRef('');
  const requestRef = useRef<number | null>(null);

  const handleSend = async () => {
    if (!input.trim() || initProgress !== 1) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    streamBuffer.current = '';

    // Placeholder for streaming assistant response
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      await localInference(input, (token) => {
        streamBuffer.current += token;
        if (!requestRef.current) {
          requestRef.current = requestAnimationFrame(() => {
            setMessages(prev => {
              const newMessages = [...prev];
              const lastIndex = newMessages.length - 1;
              if (newMessages[lastIndex]?.role === 'assistant') {
                newMessages[lastIndex] = { 
                  ...newMessages[lastIndex], 
                  content: streamBuffer.current
                };
              }
              return newMessages;
            });
            requestRef.current = null;
          });
        }
      });
    } catch (e) {
      setMessages(prev => [...prev.slice(0, -1), { role: 'assistant', content: 'Error during inference.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: '90vh' }}>
      {initProgress !== 1 && (
        <div style={{ padding: '10px', background: '#eee' }}>
          Loading Model: {initProgress ? Math.round(initProgress * 100) : 0}%
        </div>
      )}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {messages.map((msg, i) => (
          <MessageItem key={i} msg={msg} />
        ))}
      </div>
      <div style={{ padding: '20px', borderTop: '1px solid #ccc', display: 'flex' }}>
        <input 
          style={{ flex: 1, padding: '10px' }}
          value={input} 
          disabled={initProgress !== 1 || loading}
          onChange={(e) => setInput(e.target.value)} 
          onKeyPress={(e: KeyboardEvent) => e.key === 'Enter' && handleSend()}
        />
        <button style={{ padding: '10px 20px' }} onClick={handleSend} disabled={loading || initProgress !== 1}>Send</button>
      </div>
    </div>
  );
};
