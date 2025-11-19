
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { analyzeCodeError, AnalysisResult } from './services/geminiService';
import { GoogleGenAI, Chat, Modality } from "@google/genai";
// @ts-ignore
import prettier from "prettier";
// @ts-ignore
import parserBabel from "prettier/plugins/babel";
// @ts-ignore
import parserEstree from "prettier/plugins/estree";

// --- ICONS ---
const GoogleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48px" height="48px">
    <path fill="#4285F4" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
    <path fill="#FFC107" d="M3.064,24.305c0,1.429,0.224,2.809,0.616,4.125L8.291,24.48C8.102,24.328,8,24.167,8,24c0-0.161,0.102-0.322,0.291-0.479l-4.61-3.999C3.284,21.492,3.064,22.862,3.064,24.305z"/>
    <path fill="#34A853" d="M44.936,24.305c0-1.429-0.224-2.809-0.616-4.125L39.709,24.48c0.19,0.157,0.291,0.318,0.291,0.479s-0.102,0.322-0.291,0.479l4.61,3.999C44.716,27.138,44.936,25.768,44.936,24.305z"/>
    <path fill="#EA4335" d="M45.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l5.657,5.657C41.386,35.661,44,30.338,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
  </svg>
);
const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}> <path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.842 2.842l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.842 2.842l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.842-2.842l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813a3.75 3.75 0 0 0 2.842-2.842l.813-2.846A.75.75 0 0 1 9 4.5ZM19.5 9.75a.75.75 0 0 1 .721.544l.235.823a2.25 2.25 0 0 0 1.708 1.708l.823.235a.75.75 0 0 1 0 1.442l-.823.235a2.25 2.25 0 0 0-1.708 1.708l-.235.823a.75.75 0 0 1-1.442 0l-.235-.823a2.25 2.25 0 0 0-1.708 1.708l-.823-.235a.75.75 0 0 1 0-1.442l.823-.235a2.25 2.25 0 0 0 1.708-1.708l.235-.823A.75.75 0 0 1 19.5 9.75Z" clipRule="evenodd" /> </svg> );
const ClipboardIcon: React.FC<{ className?: string }> = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}> <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a2.25 2.25 0 0 1-2.25 2.25H9.75A2.25 2.25 0 0 1 7.5 4.5v0a2.25 2.25 0 0 1 2.25-2.25h3.879a2.25 2.25 0 0 1 2.121.75l2.121 2.121A2.25 2.25 0 0 1 18 8.414V18a2.25 2.25 0 0 1-2.25 2.25H8.25A2.25 2.25 0 0 1 6 18V6.75a2.25 2.25 0 0 1 2.25-2.25h3.879a2.25 2.25 0 0 1 2.121.75Z" /> </svg> );
const PaperAirplaneIcon: React.FC<{ className?: string }> = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}> <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" /> </svg> );
const SpeakerWaveIcon: React.FC<{ className?: string }> = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}> <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" /> </svg> );
const StopIcon: React.FC<{ className?: string }> = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}> <path fillRule="evenodd" d="M4.5 7.5a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v9a3 3 0 0 1-3-3h-9a3 3 0 0 1-3-3v-9Z" clipRule="evenodd" /> </svg> );
const BrainCircuitIcon: React.FC<{ className?: string }> = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}> <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 4.5A6.75 6.75 0 0 1 18 11.25a1.5 1.5 0 0 1-3 0A3.75 3.75 0 0 0 11.25 7.5a1.5 1.5 0 0 1-3 0A6.75 6.75 0 0 1 11.25 4.5ZM7.5 15.75A3.75 3.75 0 0 0 11.25 12a1.5 1.5 0 0 1 3 0A6.75 6.75 0 0 1 7.5 19.5a1.5 1.5 0 0 1 0-3Zm9-3.75a3.75 3.75 0 0 0 3.75-3.75a1.5 1.5 0 0 1 3 0A6.75 6.75 0 0 1 12.75 12a1.5 1.5 0 0 1 0 3A3.75 3.75 0 0 0 16.5 12Z" /> </svg> );
const MicrophoneIcon: React.FC<{ className?: string }> = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}> <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 0 1 6 0v8.25a3 3 0 0 1-3 3Z" /> </svg> );
const ArrowUpTrayIcon: React.FC<{ className?: string }> = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}> <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" /> </svg> );
const ArrowDownTrayIcon: React.FC<{ className?: string }> = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}> <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M12 3v13.5m0 0 4.5-4.5M12 16.5l-4.5-4.5" /> </svg> );
const WandIcon: React.FC<{ className?: string }> = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}> <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /> </svg> );

// --- SHARED UI COMPONENTS ---
const CodeBlock: React.FC<{ language: string; code: string }> = ({ language, code }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <div className="bg-slate-950 rounded-lg my-4 border border-slate-800">
            <div className="flex justify-between items-center px-4 py-2 bg-slate-900 rounded-t-lg border-b border-slate-800">
                <span className="text-xs font-sans text-slate-400">{language || 'code'}</span>
                <button onClick={handleCopy} className="flex items-center text-xs text-slate-400 hover:text-white transition-colors">
                    {copied ? 'Copied!' : <><ClipboardIcon className="w-4 h-4 mr-1" /><span>Copy code</span></>}
                </button>
            </div>
            <pre className="p-4 overflow-x-auto text-sm"><code className={`language-${language}`}>{code}</code></pre>
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
                    if (line.startsWith('### ')) return <h3 key={`${index}-${lineIndex}`} className="text-xl font-semibold mt-6 mb-2 text-slate-200">{line.substring(4)}</h3>;
                    if (line.startsWith('## ')) return <h2 key={`${index}-${lineIndex}`} className="text-2xl font-bold mt-8 mb-3 border-b border-slate-700 pb-2 text-white">{line.substring(3)}</h2>;
                    if (line.startsWith('* ') || line.startsWith('- ')) return <li key={`${index}-${lineIndex}`} className="ml-6 list-disc text-slate-300">{line.substring(2)}</li>;
                    if (/^\d+\.\s/.test(line)) return <li key={`${index}-${lineIndex}`} className="ml-6 list-decimal text-slate-300">{line.replace(/^\d+\.\s/, '')}</li>;
                    if (line.trim() === '') return <br key={`${index}-${lineIndex}`} />;
                    const boldedLine = line.split(/(\*\*.*?\*\*)/g).map((segment, i) => {
                        if (segment.startsWith('**') && segment.endsWith('**')) return <strong key={i} className="text-slate-100">{segment.slice(2, -2)}</strong>;
                        return segment;
                    });
                    return <p key={`${index}-${lineIndex}`} className="my-2 text-slate-300">{boldedLine}</p>;
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
  const [explanationCopied, setExplanationCopied] = useState(false);
  const [isThinkingMode, setIsThinkingMode] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  const handleAnalyze = useCallback(async () => {
    if (!userInput.trim()) { setError('Please enter some code or an error message.'); return; }
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await analyzeCodeError(userInput, { isThinkingMode });
      setResult(response);
    } catch (e) {
      setError(e instanceof Error ? `An error occurred: ${e.message}` : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [userInput, isThinkingMode]);

  const handleFormat = useCallback(async () => {
      if (!userInput.trim()) return;
      setIsFormatting(true);
      setError(null);
      try {
          const formatted = await prettier.format(userInput, {
              parser: "babel",
              plugins: [parserBabel, parserEstree],
              useTabs: false,
              semi: true,
              singleQuote: true
          });
          setUserInput(formatted);
      } catch (e) {
          console.error("Formatting failed", e);
          setError("Formatting failed. Your code might have syntax errors, or the language is not supported (JS/TS only).");
      } finally {
          setIsFormatting(false);
      }
  }, [userInput]);

  const handleCopyExplanation = useCallback(() => {
    if (!result?.text) return;
    navigator.clipboard.writeText(result.text);
    setExplanationCopied(true);
    setTimeout(() => setExplanationCopied(false), 2000);
  }, [result]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === 'string') {
        setUserInput(text);
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset so the same file can be selected again if needed
  };

  // Sync scroll between textarea and backdrop
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (backdropRef.current) {
      backdropRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  // Render text with highlights for backdrop
  const renderHighlights = (text: string) => {
    if (!text) return null;
    // Regex for common error keywords
    const regex = /\b(error|exception|typeerror|referenceerror|syntaxerror|fail|failed|undefined|null|nan|bug|fix|issue)\b/gi;
    const parts = text.split(regex);
    return parts.map((part, i) => {
        if (part.match(regex)) {
            // The text is transparent, we are only showing the background color
            return <span key={i} className="bg-rose-500/20 rounded-[2px] border-b-2 border-rose-500/40">{part}</span>;
        }
        return <span key={i}>{part}</span>;
    });
  };

  const downloadData = useMemo(() => {
    if (!result?.text) return null;
    const parts = result.text.split('## Corrected Code');
    if (parts.length < 2) return null;
    
    // Look for the first code block in the section after "## Corrected Code"
    const match = parts[1].match(/```(\w*)\n([\s\S]*?)```/);
    if (match) {
      return { language: match[1].trim() || 'txt', code: match[2] };
    }
    return null;
  }, [result]);

  const handleDownload = () => {
    if (!downloadData) return;
    
    const extensionMap: Record<string, string> = {
        javascript: 'js', js: 'js',
        typescript: 'ts', ts: 'ts',
        python: 'py', py: 'py',
        java: 'java',
        c: 'c',
        cpp: 'cpp',
        csharp: 'cs', cs: 'cs',
        go: 'go',
        rust: 'rs',
        html: 'html',
        css: 'css',
        json: 'json',
        sql: 'sql',
        bash: 'sh', sh: 'sh',
        text: 'txt',
        jsx: 'jsx',
        tsx: 'tsx'
    };
    
    const ext = extensionMap[downloadData.language.toLowerCase()] || 'txt';
    const blob = new Blob([downloadData.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `corrected_code.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="bg-slate-900 p-4 sm:p-6 rounded-xl shadow-2xl shadow-indigo-500/10 border border-slate-800">
        
        {/* Enhanced Input Area with Syntax Highlighting Overlay */}
        <div className="relative w-full h-80 mb-4 group rounded-lg border border-slate-700 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all duration-200 bg-slate-950">
            {/* Backdrop Layer (Highlights) */}
            <div 
                ref={backdropRef}
                className="absolute inset-0 p-4 font-mono text-sm leading-6 whitespace-pre-wrap break-words overflow-hidden pointer-events-none text-transparent"
                aria-hidden="true"
            >
                {renderHighlights(userInput)}
                {/* Extra break to ensure scrolling alignment at bottom */}
                {userInput.endsWith('\n') && <br />}
            </div>

            {/* Foreground Layer (Input) */}
            <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onScroll={handleScroll}
                placeholder="Paste your code and error message here..."
                className="absolute inset-0 w-full h-full p-4 bg-transparent text-slate-300 resize-none font-mono text-sm leading-6 focus:outline-none placeholder-slate-600"
                disabled={isLoading}
                spellCheck={false}
            />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
           <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full sm:w-auto">
               <label htmlFor="thinking-mode-toggle" className="flex items-center cursor-pointer select-none group">
                <div className="relative">
                  <input 
                    type="checkbox" 
                    id="thinking-mode-toggle" 
                    className="sr-only peer" 
                    checked={isThinkingMode}
                    onChange={() => setIsThinkingMode(!isThinkingMode)}
                    disabled={isLoading}
                  />
                  <div className="block bg-slate-700 peer-checked:bg-indigo-600 w-14 h-8 rounded-full transition group-hover:bg-slate-600 peer-checked:group-hover:bg-indigo-500"></div>
                  <div className="dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition transform peer-checked:translate-x-full shadow-sm"></div>
                </div>
                <div className="ml-3 text-slate-300 font-medium flex items-center gap-2">
                    <BrainCircuitIcon className="w-5 h-5 text-indigo-400"/>
                    Deeper Analysis <span className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors">(Slower)</span>
                </div>
              </label>
              
              <button 
                 onClick={() => fileInputRef.current?.click()}
                 className="flex items-center gap-2 bg-slate-800 text-slate-300 px-4 py-2 rounded-lg hover:bg-slate-700 hover:text-white transition-all duration-200 border border-slate-700 text-sm font-medium shadow-sm"
                 title="Upload a code file"
                 disabled={isLoading}
               >
                   <ArrowUpTrayIcon className="w-5 h-5" />
                   <span>Upload File</span>
               </button>
               <button 
                 onClick={handleFormat}
                 className="flex items-center gap-2 bg-slate-800 text-slate-300 px-4 py-2 rounded-lg hover:bg-slate-700 hover:text-white transition-all duration-200 border border-slate-700 text-sm font-medium shadow-sm"
                 title="Format Code (JS/TS)"
                 disabled={isLoading || isFormatting || !userInput.trim()}
               >
                   {isFormatting ? <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div> : <WandIcon className="w-5 h-5" />}
                   <span>Format Code</span>
               </button>
               <input 
                   type="file" 
                   ref={fileInputRef} 
                   onChange={handleFileUpload} 
                   className="hidden" 
               />
           </div>
          <button
            onClick={handleAnalyze}
            disabled={isLoading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500 shadow-lg shadow-indigo-500/20"
          >
            {isLoading ? ( <><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle> <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path> </svg> Analyzing...</> ) : ( <><SparklesIcon className="w-5 h-5"/><span>Analyze Code</span></> )}
          </button>
        </div>
      </div>
      {error && <div className="mt-8 bg-rose-950/30 border border-rose-900/50 text-rose-300 px-4 py-3 rounded-lg shadow-sm" role="alert"> <strong className="font-bold">Error: </strong> <span className="block sm:inline">{error}</span> </div>}
      {result && (
        <div className="mt-8 bg-slate-900/80 border border-slate-800 p-4 sm:p-6 rounded-xl max-w-none shadow-xl">
          <MarkdownRenderer content={result.text} />
          <div className="flex flex-wrap justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
            {downloadData && (
                <button
                    onClick={handleDownload}
                    className="inline-flex items-center gap-2 bg-slate-800 text-slate-300 font-medium py-2 px-4 rounded-lg hover:bg-slate-700 hover:text-white transition-all duration-200 text-sm border border-slate-700"
                >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    Download Fix
                </button>
            )}
            <button
              onClick={handleCopyExplanation}
              className="inline-flex items-center gap-2 bg-slate-800 text-slate-300 font-medium py-2 px-4 rounded-lg hover:bg-slate-700 hover:text-white transition-all duration-200 text-sm border border-slate-700"
              aria-label="Copy explanation text to clipboard"
            >
              <ClipboardIcon className="w-4 h-4" />
              {explanationCopied ? 'Copied!' : 'Copy Explanation'}
            </button>
          </div>
          {result.sources && result.sources.length > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-800">
              <h3 className="text-lg font-semibold text-slate-400 mb-3 flex items-center gap-2"><span className="w-1 h-5 bg-indigo-500 rounded-full inline-block"></span>Sources from Google Search:</h3>
              <div className="flex flex-wrap gap-2">
                {result.sources.map((source, index) => source.web?.uri && ( <a key={index} href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-sm bg-slate-800 text-indigo-300 hover:bg-slate-700 hover:text-indigo-200 px-3 py-1 rounded-full transition-colors no-underline border border-slate-700"> {source.web.title || new URL(source.web.uri).hostname} </a> ))}
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

// --- TTS Audio Helpers ---
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> {
  const sampleRate = 24000; // TTS model sample rate
  const numChannels = 1;
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const ChatbotView = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatRef = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    
    // TTS State
    const [playingMessageIndex, setPlayingMessageIndex] = useState<number | null>(null);
    const [isAudioLoadingFor, setIsAudioLoadingFor] = useState<number | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const audioCacheRef = useRef<Map<number, AudioBuffer>>(new Map());

    // Voice-to-text state
    const [isRecording, setIsRecording] = useState(false);
    const speechRecognitionRef = useRef<any | null>(null); 

    // Initialize AI and load chat history
    useEffect(() => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        chatRef.current = ai.chats.create({ model: 'gemini-2.5-flash-lite' });

        try {
            const savedHistory = localStorage.getItem('ai-coding-tutor-chat-history');
            if (savedHistory) {
                const parsedHistory = JSON.parse(savedHistory);
                if (Array.isArray(parsedHistory) && parsedHistory.length > 0) {
                    setMessages(parsedHistory);
                }
            }
        } catch (error) {
            console.error("Failed to load chat history:", error);
        }
    }, []);

    // Setup speech recognition
    useEffect(() => {
        const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognitionAPI) {
            console.warn("Speech recognition is not supported by this browser.");
            return;
        }

        const recognition = new SpeechRecognitionAPI();
        speechRecognitionRef.current = recognition;
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
            const transcript = event.results[event.results.length - 1][0].transcript;
            setInput(prevInput => (prevInput ? prevInput + ' ' : '') + transcript.trim());
        };

        recognition.onend = () => {
            setIsRecording(false);
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            setIsRecording(false);
        };

        return () => recognition.stop();
    }, []);
    
    // Save history on change
    useEffect(() => {
        if(messages.length > 0) {
            localStorage.setItem('ai-coding-tutor-chat-history', JSON.stringify(messages));
        }
    }, [messages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleStopAudio = useCallback(() => {
        if (audioSourceRef.current) {
            audioSourceRef.current.stop();
            audioSourceRef.current.disconnect();
            audioSourceRef.current = null;
        }
        setPlayingMessageIndex(null);
    }, []);

    const playAudioBuffer = useCallback((audioBuffer: AudioBuffer, index: number) => {
        if (!audioContextRef.current) return;
        // Resume context if suspended (browser policy)
        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }

        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => {
            setPlayingMessageIndex(null);
            audioSourceRef.current = null;
        };
        source.start();
        audioSourceRef.current = source;
        setPlayingMessageIndex(index);
    }, []);

    const handleToggleAudio = useCallback(async (text: string, index: number) => {
        if (playingMessageIndex === index) {
            handleStopAudio();
            return;
        }

        handleStopAudio(); // Stop any currently playing audio
        
        // Check Cache
        if (audioCacheRef.current.has(index)) {
             const audioBuffer = audioCacheRef.current.get(index);
             if (audioBuffer) {
                 if (!audioContextRef.current) {
                    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
                 }
                 playAudioBuffer(audioBuffer, index);
                 return;
             }
        }

        setIsAudioLoadingFor(index);

        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }

            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash-preview-tts",
                contents: [{ parts: [{ text }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: {
                          prebuiltVoiceConfig: { voiceName: 'Kore' }, 
                        },
                    },
                },
            });
            
            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
                const audioBuffer = await decodeAudioData(decode(base64Audio), audioContextRef.current);
                audioCacheRef.current.set(index, audioBuffer); // Cache it
                playAudioBuffer(audioBuffer, index);
            }
        } catch (error) {
            console.error("TTS generation failed:", error);
        } finally {
            setIsAudioLoadingFor(null);
        }
    }, [playingMessageIndex, handleStopAudio, playAudioBuffer]);

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading || !chatRef.current) return;

        const userMessage: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        const currentInput = input;
        setInput('');
        setIsLoading(true);

        try {
            const stream = await chatRef.current.sendMessageStream({ message: currentInput });
            let modelResponse = '';
            setMessages(prev => [...prev, { role: 'model', content: '' }]); 

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
                const lastMsg = newMessages[newMessages.length - 1];
                if (lastMsg.role === 'model' && lastMsg.content === '') {
                   newMessages[newMessages.length - 1] = errorMessage;
                } else {
                   newMessages.push(errorMessage)
                }
                return newMessages;
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleVoiceInput = () => {
        if (!speechRecognitionRef.current) return;
        if (isRecording) {
            speechRecognitionRef.current.stop();
        } else {
            speechRecognitionRef.current.start();
            setIsRecording(true);
        }
    };

    return (
        <div className="bg-slate-900 rounded-xl shadow-2xl shadow-indigo-500/10 flex flex-col h-[70vh] border border-slate-800">
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
                <div className="flex flex-col gap-4">
                    {messages.length === 0 && (
                        <div className="text-center text-slate-500 mt-10">
                             <p className="mb-2">Ask me anything about code or general topics.</p>
                        </div>
                    )}
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex gap-2 items-start ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'model' && (
                                <button
                                  onClick={() => handleToggleAudio(msg.content, index)}
                                  disabled={isAudioLoadingFor !== null && isAudioLoadingFor !== index}
                                  className="mt-1 p-1.5 rounded-full text-slate-500 hover:bg-slate-800 hover:text-indigo-400 disabled:opacity-50 transition-colors flex-shrink-0"
                                  aria-label={playingMessageIndex === index ? "Stop audio" : "Play audio"}
                                  title="Read aloud"
                                >
                                  {isAudioLoadingFor === index ? (
                                    <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                                  ) : playingMessageIndex === index ? (
                                    <StopIcon className="w-5 h-5"/>
                                  ) : (
                                    <SpeakerWaveIcon className="w-5 h-5"/>
                                  )}
                                </button>
                            )}
                            <div className={`rounded-lg px-4 py-2 max-w-lg shadow-md ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-200 border border-slate-700'}`}>
                                {msg.role === 'model' ? <MarkdownRenderer content={msg.content} /> : msg.content}
                                {isLoading && msg.role === 'model' && index === messages.length -1 && <div className="w-2.5 h-2.5 bg-slate-400 rounded-full animate-pulse ml-2 inline-block"></div>}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </div>
            <div className="p-4 sm:p-6 border-t border-slate-800 bg-slate-900/50 rounded-b-xl">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                        placeholder="Type your message..."
                        className="w-full p-3 bg-slate-950 text-slate-200 rounded-lg border border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 placeholder-slate-500 shadow-inner"
                        disabled={isLoading}
                    />
                    <button
                        type="button"
                        onClick={handleVoiceInput}
                        disabled={isLoading || !speechRecognitionRef.current}
                        className={`p-3 rounded-lg transition-all duration-200 border ${isRecording ? 'bg-rose-600 text-white border-rose-500 animate-pulse shadow-lg shadow-rose-500/30' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-white'} disabled:bg-slate-900 disabled:text-slate-600 disabled:border-slate-800 disabled:cursor-not-allowed`}
                        aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
                    >
                        <MicrophoneIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handleSendMessage}
                        disabled={isLoading || !input.trim()}
                        className="bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-indigo-500/20 transform active:scale-95"
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
      className={`px-6 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ${
        activeView === view ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex flex-col items-center p-4 sm:p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
      <main className="w-full max-w-4xl mx-auto">
        <header className="text-center my-8 sm:my-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="bg-slate-800 p-3 rounded-xl shadow-lg border border-slate-700">
                 <GoogleIcon className="w