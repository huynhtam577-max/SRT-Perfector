export enum Sender {
  Bot = 'bot',
  User = 'user'
}

export interface ChatMessage {
  id: string;
  sender: Sender;
  text: string;
  isFileRequest?: boolean;
  fileType?: 'content' | 'srt';
  attachmentName?: string;
  isProcessing?: boolean;
  result?: string; // If the message contains the final SRT
}

export enum AppState {
  Idle = 'idle',
  WaitingForContent = 'waiting_content',
  WaitingForSrt = 'waiting_srt',
  Processing = 'processing',
  Done = 'done'
}