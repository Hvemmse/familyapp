import { GoogleGenAI, FunctionDeclaration, Type, Chat, Part } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { CalendarEvent } from "../types";

// --- Tool Definitions ---

const listEventsTool: FunctionDeclaration = {
  name: 'listEvents',
  description: 'Hent en liste over begivenheder i kalenderen inden for en given periode.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      start: { type: Type.STRING, description: 'Start dato (ISO 8601 string) e.g., 2023-10-27T10:00:00' },
      end: { type: Type.STRING, description: 'Slut dato (ISO 8601 string)' }
    },
    required: ['start']
  }
};

const createEventTool: FunctionDeclaration = {
  name: 'createEvent',
  description: 'Opret en ny begivenhed i kalenderen.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      summary: { type: Type.STRING, description: 'Titlen på begivenheden' },
      start: { type: Type.STRING, description: 'Starttidspunkt (ISO 8601)' },
      end: { type: Type.STRING, description: 'Sluttidspunkt (ISO 8601)' },
      description: { type: Type.STRING, description: 'Valgfri beskrivelse eller noter' },
      location: { type: Type.STRING, description: 'Valgfri lokation' }
    },
    required: ['summary', 'start', 'end']
  }
};

const updateEventTool: FunctionDeclaration = {
  name: 'updateEvent',
  description: 'Opdater en eksisterende begivenhed. Angiv ID og de felter der skal ændres.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, description: 'ID på begivenheden der skal ændres' },
      summary: { type: Type.STRING, description: 'Ny titel (valgfri)' },
      start: { type: Type.STRING, description: 'Ny starttidspunkt (valgfri)' },
      end: { type: Type.STRING, description: 'Ny sluttidspunkt (valgfri)' },
      description: { type: Type.STRING, description: 'Ny beskrivelse (valgfri)' },
      location: { type: Type.STRING, description: 'Ny lokation (valgfri)' }
    },
    required: ['id']
  }
};

const deleteEventTool: FunctionDeclaration = {
  name: 'deleteEvent',
  description: 'Slet en begivenhed baseret på ID. Brug listEvents først for at finde ID, hvis du kun kender titlen.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, description: 'ID på begivenheden der skal slettes' }
    },
    required: ['id']
  }
};

// --- Service Class ---

export class GeminiService {
  private ai: GoogleGenAI;
  private chatSession: Chat | null = null;
  
  // Callbacks to interact with the React App state
  private onListEvents: () => CalendarEvent[];
  private onCreateEvent: (evt: Omit<CalendarEvent, 'id'>) => string;
  private onUpdateEvent: (id: string, updates: Partial<CalendarEvent>) => boolean;
  private onDeleteEvent: (id: string) => boolean;

  constructor(
    onList: () => CalendarEvent[],
    onCreate: (evt: Omit<CalendarEvent, 'id'>) => string,
    onUpdate: (id: string, updates: Partial<CalendarEvent>) => boolean,
    onDelete: (id: string) => boolean
  ) {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    this.onListEvents = onList;
    this.onCreateEvent = onCreate;
    this.onUpdateEvent = onUpdate;
    this.onDeleteEvent = onDelete;
  }

  public async startChat() {
    this.chatSession = this.ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{
          functionDeclarations: [listEventsTool, createEventTool, updateEventTool, deleteEventTool]
        }],
      }
    });
  }

  public async sendMessage(message: string): Promise<string> {
    if (!this.chatSession) await this.startChat();

    try {
      // 1. Send message to model
      let result = await this.chatSession!.sendMessage({ message });
      
      // 2. Handle Tool Calls (Loop until no more function calls)
      while (result.candidates?.[0]?.content?.parts?.some(p => p.functionCall)) {
        const parts = result.candidates[0].content.parts;
        const toolResponses: Part[] = [];

        for (const part of parts) {
          if (part.functionCall) {
            const { name, args, id } = part.functionCall;
            console.log(`[Gemini] Calling tool: ${name}`, args);

            let functionResult: any = { error: "Unknown function" };

            if (name === 'listEvents') {
              const events = this.onListEvents();
              functionResult = { events: events };
            } else if (name === 'createEvent') {
              const newId = this.onCreateEvent({
                summary: args.summary as string,
                start: args.start as string,
                end: args.end as string,
                description: args.description as string,
                location: args.location as string
              });
              functionResult = { status: 'created', id: newId };
            } else if (name === 'updateEvent') {
              const { id: eventId, ...updates } = args as any;
              const success = this.onUpdateEvent(eventId, updates);
              functionResult = { status: success ? 'updated' : 'not_found' };
            } else if (name === 'deleteEvent') {
              const success = this.onDeleteEvent(args.id as string);
              functionResult = { status: success ? 'deleted' : 'not_found' };
            }

            // Construct the response part strictly
            toolResponses.push({
              functionResponse: {
                name,
                id: id, // Pass the ID back if it exists
                response: functionResult
              }
            });
          }
        }

        // 3. Send tool results back to model
        if (toolResponses.length > 0) {
           // We pass the array of parts as 'message' to satisfy the Chat interface
           result = await this.chatSession!.sendMessage({ message: toolResponses });
        }
      }

      // 4. Return final text
      return result.text || "Jeg har udført handlingen.";

    } catch (error) {
      console.error("Gemini Error:", error);
      return "Beklager, der opstod en fejl i kommunikationen med kalenderen. Prøv igen.";
    }
  }
}