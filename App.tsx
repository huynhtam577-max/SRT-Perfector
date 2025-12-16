import React, { useState, useEffect, useRef } from 'react';
import { Sender, ChatMessage, AppState } from './types';
import { ChatBubble } from './components/ChatBubble';
import { generatePerfectSrt } from './services/geminiService';
import { Sparkles, RefreshCcw } from 'lucide-react';

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [appState, setAppState] = useState<AppState>(AppState.Idle);
  
  // Stored file contents
  const [contentFileText, setContentFileText] = useState<string | null>(null);
  const [srtFileText, setSrtFileText] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial greeting
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: '1',
          sender: Sender.Bot,
          text: "Chào bạn. Tôi là AI hỗ trợ xử lý phụ đề.\n\nĐầu tiên, cho tôi xin file Content gốc của bạn?",
          isFileRequest: true,
          fileType: 'content'
        }
      ]);
      setAppState(AppState.WaitingForContent);
    }
  }, [messages.length]);

  const handleFileUpload = async (file: File) => {
    const text = await file.text();
    
    // 1. User uploads content
    if (appState === AppState.WaitingForContent) {
      // Add user message
      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        sender: Sender.User,
        text: `Đã gửi file Content gốc.`,
        attachmentName: file.name
      };
      setMessages(prev => [...prev, userMsg]);
      setContentFileText(text);

      // Transition to next step after short delay
      setTimeout(() => {
        const botMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: Sender.Bot,
          text: "Ok. Tôi đã nhận được Content gốc.\n\nTiếp theo hãy cung cấp file SRT chưa hoàn thiện cho tôi.",
          isFileRequest: true,
          fileType: 'srt'
        };
        setMessages(prev => [...prev, botMsg]);
        setAppState(AppState.WaitingForSrt);
      }, 600);
    }
    
    // 2. User uploads SRT
    else if (appState === AppState.WaitingForSrt) {
      // Add user message
      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        sender: Sender.User,
        text: `Đã gửi file SRT chưa hoàn thiện.`,
        attachmentName: file.name
      };
      setMessages(prev => [...prev, userMsg]);
      setSrtFileText(text);

      // Start processing
      setTimeout(() => {
        setAppState(AppState.Processing);
        processFiles(contentFileText!, text);
      }, 600);
    }
  };

  const processFiles = async (content: string, srt: string) => {
    // Add processing message
    const processId = (Date.now() + 1).toString();
    const botAckMsg: ChatMessage = {
      id: processId,
      sender: Sender.Bot,
      text: "Ok, cảm ơn bạn, tôi đã nhận đủ Content gốc và SRT chưa hoàn thiện.\n\nBây giờ tôi sẽ tiến hành tạo SRT HOÀN THIỆN dựa vào text từ Content gốc...",
      isProcessing: true
    };
    setMessages(prev => [...prev, botAckMsg]);

    try {
      const result = await generatePerfectSrt(content, srt);
      
      // Update message to remove processing state and show result
      setMessages(prev => prev.map(msg => {
        if (msg.id === processId) {
          return {
            ...msg,
            isProcessing: false,
            text: "Ok, cảm ơn bạn, tôi đã nhận đủ Content gốc và SRT chưa hoàn thiện. Bây giờ tôi sẽ tiến hành tạo SRT HOÀN THIỆN dựa vào text từ Content gốc:\n\nYêu cầu: Khớp Content gốc vào SRT chưa hoàn thiện và hoàn thành lại SRT HOÀN THIỆN đúng timestamp từ file SRT chưa hoàn thiện.\n\nSRT HOÀN THIỆN:",
            result: result
          };
        }
        return msg;
      }));
      setAppState(AppState.Done);
    } catch (error) {
      setMessages(prev => prev.map(msg => {
        if (msg.id === processId) {
          return {
            ...msg,
            isProcessing: false,
            text: "Xin lỗi, đã có lỗi xảy ra trong quá trình xử lý với Gemini. Vui lòng thử lại."
          };
        }
        return msg;
      }));
      setAppState(AppState.Done); // Or error state
    }
  };

  const resetApp = () => {
    setMessages([]);
    setAppState(AppState.Idle);
    setContentFileText(null);
    setSrtFileText(null);
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-gray-900 border-x border-gray-800 shadow-2xl">
      {/* Header */}
      <header className="flex-shrink-0 h-16 bg-gray-900/90 backdrop-blur-md border-b border-gray-800 flex items-center justify-between px-6 z-10 sticky top-0">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">SRT Perfector</h1>
            <p className="text-xs text-gray-400">Powered by Gemini 2.5</p>
          </div>
        </div>
        
        {appState === AppState.Done && (
          <button 
            onClick={resetApp}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-md transition-colors"
          >
            <RefreshCcw size={14} />
            Start Over
          </button>
        )}
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-2">
        {messages.map((msg) => (
          <ChatBubble 
            key={msg.id} 
            message={msg} 
            onUpload={handleFileUpload} 
          />
        ))}
        <div ref={messagesEndRef} />
      </main>

      {/* Footer / Input placeholder (Visual only since interaction is file-based) */}
      <footer className="flex-shrink-0 p-4 bg-gray-900 border-t border-gray-800">
        <div className="relative">
          <input 
            type="text" 
            disabled 
            placeholder={
              appState === AppState.WaitingForContent ? "Please upload Content file..." :
              appState === AppState.WaitingForSrt ? "Please upload SRT file..." :
              appState === AppState.Processing ? "AI is thinking..." :
              "Processing complete."
            }
            className="w-full bg-gray-800 text-gray-400 rounded-xl py-3 px-4 border border-gray-700 focus:outline-none cursor-not-allowed opacity-70"
          />
        </div>
        <p className="text-center text-[10px] text-gray-600 mt-2">
          Gemini 2.5 Flash • React 18 • Tailwind CSS
        </p>
      </footer>
    </div>
  );
}