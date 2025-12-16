import React from 'react';
import { Sender, ChatMessage } from '../types';
import { User, Bot, FileText, Loader2, Download, Copy, Check } from 'lucide-react';

interface ChatBubbleProps {
  message: ChatMessage;
  onUpload?: (file: File) => void;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, onUpload }) => {
  const isBot = message.sender === Sender.Bot;
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    if (message.result) {
      await navigator.clipboard.writeText(message.result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (message.result) {
      const blob = new Blob([message.result], { type: 'text/srt' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'perfected_subtitle.srt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && onUpload) {
      onUpload(e.target.files[0]);
    }
  };

  return (
    <div className={`flex w-full mb-6 ${isBot ? 'justify-start' : 'justify-end'}`}>
      <div className={`flex max-w-[85%] md:max-w-[70%] ${isBot ? 'flex-row' : 'flex-row-reverse'}`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${isBot ? 'bg-indigo-600 mr-3' : 'bg-emerald-600 ml-3'}`}>
          {isBot ? <Bot size={20} className="text-white" /> : <User size={20} className="text-white" />}
        </div>

        {/* Bubble */}
        <div className={`flex flex-col p-4 rounded-2xl shadow-md ${
          isBot 
            ? 'bg-gray-800 text-gray-100 rounded-tl-none border border-gray-700' 
            : 'bg-emerald-700 text-white rounded-tr-none'
        }`}>
          
          <p className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">
            {message.text}
          </p>

          {/* Attachment Indicator */}
          {message.attachmentName && (
            <div className="mt-3 flex items-center p-2 bg-black/20 rounded-lg text-sm">
              <FileText size={16} className="mr-2 opacity-70" />
              <span className="truncate max-w-[200px]">{message.attachmentName}</span>
            </div>
          )}

          {/* File Upload Action */}
          {message.isFileRequest && onUpload && !message.attachmentName && (
            <div className="mt-4">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept={message.fileType === 'srt' ? ".srt,.txt" : ".txt,.md,.doc,.docx"} 
                onChange={handleFileChange}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <FileText size={16} />
                Select {message.fileType === 'srt' ? 'Unfinished SRT' : 'Source Content'} File
              </button>
            </div>
          )}

          {/* Processing Spinner */}
          {message.isProcessing && (
            <div className="mt-3 flex items-center text-indigo-400 gap-2 text-sm animate-pulse">
              <Loader2 size={16} className="animate-spin" />
              Processing with Gemini AI...
            </div>
          )}

          {/* Result View */}
          {message.result && (
            <div className="mt-4 w-full">
              <div className="bg-gray-950 rounded-lg border border-gray-700 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 bg-gray-900 border-b border-gray-800">
                  <span className="text-xs font-mono text-gray-400">SRT Output</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleCopy} 
                      className="p-1.5 hover:bg-gray-800 rounded text-gray-400 hover:text-white transition"
                      title="Copy to clipboard"
                    >
                      {copied ? <Check size={14} className="text-green-500"/> : <Copy size={14} />}
                    </button>
                    <button 
                      onClick={handleDownload} 
                      className="p-1.5 hover:bg-gray-800 rounded text-gray-400 hover:text-white transition"
                      title="Download SRT"
                    >
                      <Download size={14} />
                    </button>
                  </div>
                </div>
                <div className="p-3 max-h-60 overflow-y-auto font-mono text-xs md:text-sm text-green-400 whitespace-pre">
                  {message.result}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};