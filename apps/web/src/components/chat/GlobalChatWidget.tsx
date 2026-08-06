"use client";

import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { client, databases, APPWRITE_DB_ID } from "../../lib/appwrite";
import { ID, Query, Models } from "appwrite";
import { useAuth } from "../../lib/auth-context";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

interface GlobalMessage extends Models.Document {
  senderId: string;
  senderName: string;
  content: string;
}

export function GlobalChatWidget() {
  const { user, isLoading: authLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<GlobalMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch initial messages when opened for the first time
  useEffect(() => {
    if (!isOpen || messages.length > 0) return;

    const fetchMessages = async () => {
      try {
        const response = await databases.listDocuments(
          APPWRITE_DB_ID,
          "global_messages",
          [
            Query.orderDesc("$createdAt"), // Get newest first
            Query.limit(50)
          ]
        );
        // Reverse so chronological order is top to bottom
        setMessages(response.documents.reverse() as unknown as GlobalMessage[]);
      } catch (error) {
        console.error("Error fetching global messages:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, [isOpen]);

  // Subscribe to real-time changes always (so we can show unread badge)
  useEffect(() => {
    const unsubscribe = client.subscribe(
      `databases.${APPWRITE_DB_ID}.collections.global_messages.documents`,
      (response) => {
        const payload = response.payload as GlobalMessage;
        
        if (response.events.some(e => e.includes("create"))) {
          setMessages((prev) => {
            if (prev.find(m => m.$id === payload.$id)) return prev;
            return [...prev, payload];
          });
          
          if (!isOpen) {
            setUnreadCount(prev => prev + 1);
          }
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    setSending(true);
    try {
      await databases.createDocument(
        APPWRITE_DB_ID,
        "global_messages",
        ID.unique(),
        {
          senderId: user.$id,
          senderName: user.name || 'Team Member',
          content: newMessage.trim(),
        },
        // In appwrite 1.4+ document permissions are optional if collection level users() is set, 
        // but it's safe to omit to let collection defaults take over.
      );
      setNewMessage("");
    } catch (error) {
      console.error("Error sending global message:", error);
    } finally {
      setSending(false);
    }
  };

  // Do not show widget if not logged in
  if (authLoading || !user) return null;

  return (
    <div className="fixed bottom-10 right-3 z-50 flex flex-col items-end sm:bottom-12 sm:right-6">
      {isOpen && (
        <div className="bg-white dark:bg-navy-900 border dark:border-navy-800 shadow-xl rounded-xl mb-4 w-[350px] max-w-[calc(100vw-32px)] h-[500px] max-h-[calc(100vh-120px)] flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-primary px-4 py-3 text-white flex justify-between items-center shadow-md z-10">
            <div>
              <h3 className="font-semibold text-sm">Team Chat</h3>
              <p className="text-primary-100 text-[10px]">Real-time workspace chat</p>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-primary-100 hover:text-white transition-colors p-1 rounded-full hover:bg-primary-dark"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto bg-slate-50 dark:bg-navy-950 flex flex-col space-y-4">
            {loading && messages.length === 0 ? (
              <div className="flex-1 flex justify-center items-center">
                <Loader2 className="animate-spin text-slate-400" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex-1 flex flex-col justify-center items-center text-center px-4 space-y-2 opacity-60">
                <MessageCircle className="h-10 w-10 text-slate-400" />
                <p className="text-sm text-slate-500 dark:text-slate-400">No messages yet. Say hello to the team!</p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isMe = user?.$id === msg.senderId;
                const showName = !isMe && (idx === 0 || messages[idx - 1].senderId !== msg.senderId);
                
                return (
                  <div
                    key={msg.$id}
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                  >
                    {showName && (
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 mb-1 px-1 font-medium">
                        {msg.senderName}
                      </span>
                    )}
                    <div
                      className={`px-3 py-2 rounded-2xl text-sm max-w-[85%] shadow-sm ${
                        isMe
                          ? "bg-primary text-white rounded-br-sm"
                          : "bg-white dark:bg-navy-800 text-slate-800 dark:text-slate-200 border dark:border-navy-700 rounded-bl-sm"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 bg-white dark:bg-navy-900 border-t dark:border-navy-800 flex items-center gap-2"
          >
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 rounded-full bg-slate-100 dark:bg-navy-950 border-transparent focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0"
              disabled={sending}
            />
            <Button 
              type="submit" 
              disabled={sending || !newMessage.trim()} 
              size="icon" 
              className="h-10 w-10 shrink-0 rounded-full bg-primary hover:bg-primary-dark shadow-md transition-transform active:scale-95"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Send className="h-4 w-4 text-white ml-0.5" />}
            </Button>
          </form>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-12 w-12 rounded-full bg-primary hover:bg-primary-dark text-white shadow-xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95 relative sm:h-14 sm:w-14"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
        
        {/* Unread Badge */}
        {!isOpen && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-navy-950 animate-in zoom-in">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}
