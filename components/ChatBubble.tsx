import React from 'react';
import { ChatMessage } from '../types';

interface ChatBubbleProps {
  message: ChatMessage;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`
        max-w-[80%] rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-sm
        ${isUser 
          ? 'bg-indigo-600 text-white rounded-br-none' 
          : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'
        }
      `}>
        {message.text}
      </div>
    </div>
  );
};