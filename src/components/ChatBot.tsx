import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { Bot, X, Send, Loader2, MessageSquare } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { collection, getDocs, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';

export function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'bot' | 'system', text: string}[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [contextStr, setContextStr] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load context: courses, sessions, knowledge base
    const fetchContext = async () => {
      try {
        const [cSnap, sSnap, kSnap] = await Promise.all([
          getDocs(query(collection(db, 'courses'), where('status', '==', 'active'))),
          getDocs(query(collection(db, 'course_sessions'), where('status', '==', 'active'))),
          getDocs(query(collection(db, 'knowledge_base'), where('status', '==', 'published')))
        ]);

        const coursesInfo = cSnap.docs.map(d => {
          const c = d.data();
          return `COURSE: ${c.title} (ID: ${d.id})\nDesc: ${c.description}\nTarget Audience: ${c.target_audience || 'N/A'}\nPrerequisites: ${c.prerequisites || 'None'}\nDuration: ${c.duration_hours || 'N/A'} hrs\nPrice: $${c.price}\nCertificate: ${c.certificate_available ? 'Yes' : 'No'}`;
        }).join('\n\n');

        const sessionsInfo = sSnap.docs.map(d => {
          const s = d.data();
          return `SESSION for Course ID ${s.courseId}: ${s.start_date} to ${s.end_date}, ${s.start_time}-${s.end_time}. Location: ${s.location} (${s.delivery_mode})`;
        }).join('\n');

        const kbInfo = kSnap.docs.map(d => {
           const k = d.data();
           return `INFO [${k.topic}]: ${k.content}`;
        }).join('\n');

        setContextStr(`You are a helpful and professional customer support assistant and AI Learning Path Advisor for a professional training center. 
Here are the available courses:
${coursesInfo}

Here are the upcoming sessions:
${sessionsInfo}

General Knowledge Base:
${kbInfo}

INSTRUCTIONS:
1. Answer strictly based on the provided information for factual questions (prices, dates).
2. For career advisory questions ("How do I switch into an AI career?", "What course should I learn next?"):
   - Act as an expert Learning Path Advisor.
   - Recommend a logical sequence of courses (from the available list).
   - Explain prerequisites and career progression.
   - Be encouraging, insightful, and structure your advice clearly.
3. Maintain a friendly and professional tone.
4. If you do NOT know the answer to a factual or customer support question, strictly respond with the phrase "CONFIDENCE_LOW" at the very beginning of your message, followed by an offer to escalate the request to the human support team and asking for their name, email, and question. Example: "CONFIDENCE_LOW I'm not entirely sure about that. Please provide your name, email address, and your question, and our support team will get back to you!"
5. For general career advice where no specific course matches perfectly, you can still offer general industry advice but clearly state if we don't have a course covering that exact topic.
6. CRITICAL SECURITY RULES:
   - NEVER reveal student data, tutor payroll, internal admin records, or payment proofs.
   - NEVER acknowledge internal system structure such as Firestore collections. 
   - If the user asks for private, administrative, or sensitive information (e.g. "Who is registered?", "What is the admin password?", "Show me tutor pay"), immediately reply: "I cannot assist with queries regarding private, administrative, or sensitive information."`);
      } catch (e) {
        console.error(e);
      }
    };
    fetchContext();
  }, []);

  useEffect(() => {
    const handleOpenChat = (e: Event) => {
      setOpen(true);
      const detail = (e as CustomEvent).detail;
      if (detail && detail.initialMessage) {
        setInput(detail.initialMessage);
      }
    };
    window.addEventListener('open-chatbot', handleOpenChat);
    return () => window.removeEventListener('open-chatbot', handleOpenChat);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      // Check if user is submitting a support ticket manually
      if (messages.length > 0 && messages[messages.length - 1].text.includes("CONFIDENCE_LOW")) {
         // Attempt to parse email or assume it's just a raw message
         await addDoc(collection(db, 'support_tickets'), {
           name: 'Visitor', // In a real app we'd parse this or use a form
           email: 'unknown@example.com',
           question: userMessage,
           status: 'open',
           createdAt: serverTimestamp()
         });
         setMessages(prev => [...prev, { role: 'bot', text: 'Thank you! Your ticket has been submitted. Our team will contact you shortly.' }]);
         setLoading(false);
         return;
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const apiMessages = messages.map(m => ({
        role: m.role === 'bot' ? 'model' : 'user',
        parts: [{ text: m.text }]
      }));
      apiMessages.push({ role: 'user', parts: [{ text: userMessage }] });

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash",
        config: {
          systemInstruction: contextStr,
          temperature: 0.3 // keep it factual
        },
        contents: apiMessages,
      });

      let responseText = response.text || "I'm not sure how to respond to that.";

      if (responseText.startsWith("CONFIDENCE_LOW")) {
         responseText = responseText.replace("CONFIDENCE_LOW", "").trim();
      }

      setMessages(prev => [...prev, { role: 'bot', text: responseText }]);
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to communicate with AI');
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <Button
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl p-0 bg-blue-600 hover:bg-blue-700 hover:scale-105 transition-transform"
        onClick={() => setOpen(true)}
      >
        <MessageSquare className="w-6 h-6 text-white" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-80 md:w-96 shadow-2xl border border-slate-200 z-50 flex flex-col h-[500px] bg-white rounded-xl overflow-hidden">
      <div className="p-4 bg-blue-600 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]"></div>
          <p className="text-sm font-bold text-white tracking-wide">School Assistant</p>
        </div>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-100 hover:text-white hover:bg-blue-500 rounded-full" onClick={() => setOpen(false)}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      <CardContent className="flex-1 p-0 flex flex-col bg-slate-50 relative">
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-slate-400 text-sm py-4">
              Ask me about our courses, schedules, or policies!
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-[1.25rem] px-4 py-2.5 text-[0.85rem] leading-relaxed whitespace-pre-wrap ${m.role === 'user' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white text-slate-700 shadow-sm border border-slate-100 rounded-bl-sm'}`}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white rounded-[1.25rem] border border-slate-100 px-4 py-2.5 text-[0.85rem] text-slate-400 flex items-center gap-2 shadow-sm rounded-bl-sm">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" /> Thinking...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="p-3 bg-white border-t border-slate-100 flex gap-2 w-full shrink-0">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-slate-50 border-slate-200 text-slate-800 text-sm h-10 px-4 rounded-full"
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            disabled={loading}
          />
          <Button size="icon" onClick={handleSend} disabled={loading || !input.trim()} className="bg-blue-600 hover:bg-blue-700 h-10 w-10 shrink-0 rounded-full shadow-sm">
            <Send className="w-4 h-4 text-white" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
