import React, { useState, useEffect, useRef } from 'react';
import { EventCard } from './components/EventCard';
import { ChatBubble } from './components/ChatBubble';
import { CalendarEvent, ChatMessage } from './types';
import { INITIAL_EVENTS } from './constants';
import { GeminiService } from './services/geminiService';

const App: React.FC = () => {
  // --- State ---
  // We use a Ref for the events to act as the "Source of Truth" for the API callbacks.
  // This ensures the API always sees and modifies the absolute latest state, 
  // preventing stale closure issues during multi-step tool calls.
  const eventsRef = useRef<CalendarEvent[]>(INITIAL_EVENTS);
  const [events, setEvents] = useState<CalendarEvent[]>(INITIAL_EVENTS);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'Hej! Jeg er din FamiliePrivatApp assistent. Hvad skal vi planlægge?',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Refs for scrolling and service
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const geminiServiceRef = useRef<GeminiService | null>(null);

  // --- Helpers for Gemini Service ---
  
  const updateEvents = (newEvents: CalendarEvent[]) => {
    eventsRef.current = newEvents;
    setEvents(newEvents);
  };

  const handleListEvents = () => {
    return eventsRef.current;
  };

  const handleCreateEvent = (evt: Omit<CalendarEvent, 'id'>) => {
    const newId = `evt_${Date.now()}`;
    const newEvent: CalendarEvent = { ...evt, id: newId };
    const newEvents = [...eventsRef.current, newEvent].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    updateEvents(newEvents);
    return newId;
  };

  const handleUpdateEvent = (id: string, updates: Partial<CalendarEvent>) => {
    const currentEvents = eventsRef.current;
    const index = currentEvents.findIndex(e => e.id === id);
    if (index === -1) return false;

    const updatedEvent = { ...currentEvents[index], ...updates };
    const newEvents = [...currentEvents];
    newEvents[index] = updatedEvent;
    
    // Re-sort after update as date might have changed
    newEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    updateEvents(newEvents);
    return true;
  };

  const handleDeleteEvent = (id: string) => {
    const currentEvents = eventsRef.current;
    const exists = currentEvents.some(e => e.id === id);
    if (exists) {
      const newEvents = currentEvents.filter(e => e.id !== id);
      updateEvents(newEvents);
      return true;
    }
    return false;
  };

  // --- Initialization ---

  useEffect(() => {
    // Initialize service once. Handlers will access current state via eventsRef.
    geminiServiceRef.current = new GeminiService(
      handleListEvents,
      handleCreateEvent,
      handleUpdateEvent,
      handleDeleteEvent
    );
  }, []);

  // --- Event Handlers ---

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputText.trim() || !geminiServiceRef.current || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const responseText = await geminiServiceRef.current.sendMessage(userMsg.text);
      
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);

    } catch (err) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: 'Beklager, jeg mistede forbindelsen til kalender-hjernen.',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // --- Render ---

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-50 overflow-hidden text-slate-900">
      
      {/* Left Sidebar: Calendar View */}
      <div className="w-full md:w-1/3 lg:w-96 bg-slate-100 border-r border-slate-200 flex flex-col h-1/3 md:h-full">
        <div className="p-6 bg-white border-b border-slate-200 sticky top-0 z-10">
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xs">📅</span>
            FamiliePrivatApp
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {events.length} kommende aftaler
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {events.length === 0 ? (
            <div className="text-center p-8 text-slate-400 text-sm">
              Ingen planlagte begivenheder.
            </div>
          ) : (
            events.map(evt => (
              <EventCard 
                key={evt.id} 
                event={evt} 
                onDelete={(id) => handleDeleteEvent(id)} 
              />
            ))
          )}
        </div>
      </div>

      {/* Right Area: Chat Interface */}
      <div className="flex-1 flex flex-col h-2/3 md:h-full relative bg-white">
        
        {/* Chat Header */}
        <div className="h-16 border-b border-slate-100 flex items-center justify-between px-6 bg-white/80 backdrop-blur-md absolute w-full top-0 z-10">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}></div>
            <span className="text-sm font-medium text-slate-600">
              {isLoading ? 'Arbejder...' : 'Klar til hjælp'}
            </span>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 pt-20 pb-24 space-y-2">
          {messages.map(msg => (
            <ChatBubble key={msg.id} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 w-full p-4 bg-white border-t border-slate-100">
          <div className="relative flex items-center max-w-4xl mx-auto">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="F.eks. 'Tilføj fødselsdag for mor på søndag kl 14'..."
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-full py-4 pl-6 pr-14 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !inputText.trim()}
              className={`absolute right-2 p-2 rounded-full transition-colors ${
                isLoading || !inputText.trim() 
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </button>
          </div>
          <div className="text-center mt-2">
             <p className="text-[10px] text-slate-400 uppercase tracking-wider">Kun adgang til familie kalenderen</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;