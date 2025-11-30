import React from 'react';
import { CalendarEvent } from '../types';

interface EventCardProps {
  event: CalendarEvent;
  onDelete: (id: string) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onDelete }) => {
  const startDate = new Date(event.start);
  const endDate = new Date(event.end);

  const dateStr = startDate.toLocaleDateString('da-DK', { 
    weekday: 'short', 
    day: 'numeric', 
    month: 'short' 
  });
  
  const timeStr = `${startDate.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}`;

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative group">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 font-medium text-sm mb-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="capitalize">{dateStr}</span>
          </div>
          <h3 className="text-slate-800 font-semibold text-lg">{event.summary}</h3>
          <p className="text-slate-500 text-sm mt-1">{timeStr}</p>
          {event.location && (
             <div className="flex items-center space-x-1 text-slate-400 text-xs mt-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{event.location}</span>
             </div>
          )}
        </div>
        
        <button 
          onClick={() => onDelete(event.id)}
          className="text-slate-300 hover:text-red-500 transition-colors p-1"
          title="Slet begivenhed"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
      {event.description && (
        <div className="mt-3 pt-3 border-t border-slate-50 text-slate-600 text-sm">
          {event.description}
        </div>
      )}
    </div>
  );
};