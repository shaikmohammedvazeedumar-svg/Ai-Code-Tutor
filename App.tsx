import React, { useState, useCallback, useEffect, useRef } from 'react';
import { analyzeCodeError, AnalysisResult } from './services/geminiService';
import { GoogleGenAI, Chat } from "@google/genai";

// --- ICONS ---
const GoogleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48px" height="48px">
    <path fill="#4285F4" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
    <path fill="#FFC107" d="M3.064,24.305c0,1.429,0.224,2.809,0.616,4.125L8.291,24.48C8.102,24.328,8,24.167,8,24c0-0.161,0.102-0.322,0.291-0.479l-4.61-3.999C3.284,21.492,3.064,22.862,3.064,24.305z"/>
    <path fill="#34A853" d="M44.936,24.305c0-1.429-0.224-2.809-0.616-4.125L39.709,24.48c0.19,0.157,0.291,0.318,0.291,0.479s-0.102,0.322-0.291,0.479l4.61,3.999C44.716,27.138,44.936,25.768,44.936,24.305z"/>
    <path fill="#EA4335" d="M45.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l5.657,5.657C41.386,35.661,44,30.338,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
  </svg>
);
const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}> <path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.842 2.842l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.842 2.842l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.842-2.842l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813a3.75 3.75 0 0 0 2.842-2.842l.813-2.846A.75.75 0 0 1 9 4.5ZM19.5 9.75a.75.75 0 0 1 .721.544l.235.823a2.25 2.25 0 0 0 1.708 1.708l.823.235a.75.75 0 0 1 0 1.442l-.823.235a2.25 2.25 0 0 0-1.708 1.708l-.235.823a.75.75 0 0 1-1.442 0l-.235-.823a2.25 2.25 0 0 0-1.708-1.708l-.823-.235a.75.75 0 0 1 0-1.442l.823-.235a2.25 2.25 0 0 0 1.708-1.708l.235-.823A.75.75 0 0 1 19.5 9.75Z" clipRule="evenodd" /> </svg> );
const ClipboardIcon: React.FC<{ className?: string }> = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}> <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a2.25 2.25 0 0 1-2.25 2.25H9.75A2.25 2.25 0 0 1 7.5 4.5v0a2.25 2.25 0 0 1 2.25-2.25h3.879a2.25 2.25 0 0 1 2.121.75l2.121 2.121A2.25 2.25 0 0 1 18 8.414V18a2.25 2.25 0 0 1-2.25 2.25H8.25A2.25 2.25 0 0 1 6 18V6.75a2.25 2.25 0 0 1 2.25-2.25h3.879a2.25 2.25 0 0 1 2.121.75Z" /> </svg> );
const PaperAirplaneIcon: React.FC<{ className?: string }> = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}> <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" /> </svg> );

// --- SHARED UI COMPONENTS ---
const CodeBlock: React.FC<{ language: string; code: string }> = ({ language, code }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <div className="bg-gray-800 rounded-lg my-4">
            <div className="flex justify-between items-center px-4 py-2 bg-gray-700 rounded-t-lg">
                <span className="text-xs font-sans text-gray-400">{language || 'code'}</span>
                <button onClick={handleCopy} className="flex items-center text-xs text-gray-400 hover:text-white transition-colors">
                    {copied ? 'Copied!' : <><ClipboardIcon className="w-4 h-4 mr-1" /><span>Copy code</span></>}
                </button>
            </div>
            <pre className="p-4 overflow-x-auto"><code className={`language-${language}`}>{code}</code></pre>
        </div>
    );
};

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    const parts = content.split(/(\`\`\`[\s\S]*?\`\`\`)/g);
    return (
        <div>
            {parts.map((part, index) => {
                const codeBlockMatch = part.match(/\`\`\`(.*?)\n([\s\S]*?)\`\`\`/);
                if (codeBlockMatch) {
                    const [, language, code] = codeBlockMatch;
                    return <CodeBlock key={index} language={language.trim()} code={code.trim()} />;
                }
                
                return part.split('\n').map((line, lineIndex) => {
                    if (line.startsWith('### ')) return <h3 key={`${index}-${lineIndex}`} className="text-xl font-semibold mt-6 mb-2">{line.substring(4)}</h3>;
                    if (line.startsWith('## ')) return <h2 key={`${index}-${lineIndex}`} className="text-2xl font-bold mt-8 mb-3 border-b border-gray-600 pb-2">{line.substring(3)}</h2>;
                    if (line.startsWith('* ') || line.startsWith('- ')) return <li key={`${index}-${lineIndex}`} className="ml-6 list-disc">{line.substring(2)}</li>;
                    if (/^\d+\.\s/.test(line)) return <li key={`${index}-${lineIndex}`} className="ml-6 list-decimal">{line.replace(/^\d+\.\s/, '')}</li>;
                    if (line.trim() === '') return <br key={`${index}-${lineIndex}`} />;
                    const boldedLine = line.split(/(\*\*.*?\*\*)/g).map((segment, i) => {
                        if (segment.startsWith('**') && segment.endsWith('**')) return <strong key={i}>{segment.slice(2, -2)}</strong>;
                        return segment;
                    });
                    return <p key={`${index}-${lineIndex}`} className="my-2">{boldedLine}</p>;
                });
            })}
        </div>
    );
};

// --- FEATURE: CODE TUTOR ---
const TutorView = () => {
  const [userInput, setUserInput] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = useCallback(async () => {
    if (!userInput.trim()) { setError('Please enter some code or an error message.'); return; }
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await analyzeCodeError(userInput);
      setResult(response);
    } catch (e) {
      setError(e instanceof Error ? `An error occurred: ${e.message}` : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [userInput]);

  return (
    <>
      <div className="bg-gray-800 p-4 sm:p-6 rounded-xl shadow-2xl shadow-blue-500/10">
        <textarea
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Paste your code and error message here..."
          className="w-full h-60 p-4 bg-gray-900 text-gray-300 rounded-lg border-2 border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 resize-y font-mono text-sm"
          disabled={isLoading}
        />
        <button
          onClick={handleAnalyze}
          disabled={isLoading}
          className="mt-4 w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:scale-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500"
        >
          {isLoading ? ( <><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle> <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path> </svg> Analyzing...</> ) : ( <><SparklesIcon className="w-5 h-5"/><span>Analyze Code</span></> )}
        </button>
      </div>
      {error && <div className="mt-8 bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg" role="alert"> <strong className="font-bold">Error: </strong> <span className="block sm:inline">{error}</span> </div>}
      {result && (
        <div className="mt-8 bg-gray-800/50 p-4 sm:p-6 rounded-xl prose prose-invert prose-pre:bg-gray-800 max-w-none">
          <MarkdownRenderer content={result.text} />
          {result.sources && result.sources.length > 0 && (
            <div className="mt-8 pt-4 border-t border-gray-700">
              <h3 className="text-lg font-semibold text-gray-400 mb-3">Sources from Google Search:</h3>
              <div className="flex flex-wrap gap-2">
                {result.sources.map((source, index) => source.web?.uri && ( <a key={index} href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-sm bg-gray-700 text-blue-300 hover:bg-gray-600 hover:text-blue-200 px-3 py-1 rounded-full transition-colors no-underline"> {source.web.title || new URL(source.web.uri).hostname} </a> ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

// --- FEATURE: CHATBOT ---
interface Message {
  role: 'user' | 'model';
  content: string;
}

const ChatbotView = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatRef = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        chatRef.current = ai.chats.create({ model: 'gemini-2.5-flash' });
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading || !chatRef.current) return;

        const userMessage: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const stream = await chatRef.current.sendMessageStream({ message: input });
            let modelResponse = '';
            setMessages(prev => [...prev, { role: 'model', content: '' }]); // Placeholder for model response

            for await (const chunk of stream) {
                modelResponse += chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1].content = modelResponse;
                    return newMessages;
                });
            }
        } catch (e) {
            const errorMessage = { role: 'model' as const, content: 'Sorry, something went wrong. Please try again.' };
            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = errorMessage;
                return newMessages;
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-gray-800 rounded-xl shadow-2xl shadow-blue-500/10 flex flex-col h-[70vh]">
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
                <div className="flex flex-col gap-4">
                    {messages.length === 0 && (
                        <div className="text-center text-gray-400">Ask me anything...</div>
                    )}
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`rounded-lg px-4 py-2 max-w-lg ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                                {msg.role === 'model' ? <MarkdownRenderer content={msg.content} /> : msg.content}
                                {isLoading && msg.role === 'model' && index === messages.length -1 && <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse ml-2 inline-block"></div>}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </div>
            <div className="p-4 sm:p-6 border-t border-gray-700">
                <div className="flex items-center gap-4">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                        placeholder="Type your message..."
                        className="w-full p-2 bg-gray-900 text-gray-300 rounded-lg border-2 border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={isLoading || !input.trim()}
                        className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                        aria-label="Send message"
                    >
                       {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <PaperAirplaneIcon className="w-5 h-5"/>}
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- MAIN APP SHELL ---
export default function App() {
  const [activeView, setActiveView] = useState<'tutor' | 'chat'>('tutor');

  const TabButton: React.FC<{ view: 'tutor' | 'chat'; children: React.ReactNode }> = ({ view, children }) => (
    <button
      onClick={() => setActiveView(view)}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
        activeView === view ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans flex flex-col items-center p-4 sm:p-6">
      <main className="w-full max-w-4xl mx-auto">
        <header className="text-center my-8">
          <div className="flex items-center justify-center gap-4">
            <GoogleIcon className="w-10 h-10 sm:w-12 sm:h-12"/>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              AI Coding Assistant
            </h1>
          </div>
          <p className="text-gray-400 mt-2">
            Use the Code Tutor for bug analysis or the Chatbot for general questions.
          </p>
        </header>

        <div className="flex justify-center mb-6 border-b border-gray-700">
          <div className="flex space-x-2 bg-gray-800 p-1 rounded-lg">
            <TabButton view="tutor">Code Tutor</TabButton>
            <TabButton view="chat">Chatbot</TabButton>
          </div>
        </div>
        
        {activeView === 'tutor' ? <TutorView /> : <ChatbotView />}

      </main>
    </div>
  );
}