import { useState, useEffect, useRef } from "react";
import { client, databases, APPWRITE_DB_ID } from "../../lib/appwrite";
import { ID, Query, Models } from "appwrite";
import { useAuth } from "../../lib/auth-context";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Send, Loader2 } from "lucide-react";

interface TaskMessage extends Models.Document {
  taskId: string;
  senderId: string;
  senderName: string;
  content: string;
}

export function TaskChat({ taskId }: { taskId: string }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<TaskMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial fetch
    const fetchMessages = async () => {
      try {
        const response = await databases.listDocuments(
          APPWRITE_DB_ID,
          "task_messages",
          [
            Query.equal("taskId", taskId),
            Query.orderAsc("$createdAt"),
            Query.limit(100)
          ]
        );
        setMessages(response.documents as unknown as TaskMessage[]);
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();

    // Subscribe to realtime changes
    const unsubscribe = client.subscribe(
      `databases.${APPWRITE_DB_ID}.collections.task_messages.documents`,
      (response) => {
        const payload = response.payload as TaskMessage;
        
        // Only process events for this specific task
        if (payload.taskId !== taskId) return;

        if (response.events.some(e => e.includes("create"))) {
          setMessages((prev) => {
            // Prevent duplicates (Realtime might fire twice or we already added it locally)
            if (prev.find(m => m.$id === payload.$id)) return prev;
            return [...prev, payload];
          });
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [taskId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    setSending(true);
    try {
      await databases.createDocument(
        APPWRITE_DB_ID,
        "task_messages",
        ID.unique(),
        {
          taskId,
          senderId: user.$id,
          senderName: user.name || 'Unknown',
          content: newMessage.trim(),
        }
      );
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full border rounded-md bg-slate-50 overflow-hidden">
      <div className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[350px]">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="animate-spin text-slate-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-sm text-slate-500 my-10">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = user?.$id === msg.senderId;
            return (
              <div
                key={msg.$id}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                <span className="text-[10px] text-slate-500 mb-1 px-1">
                  {msg.senderName}
                </span>
                <div
                  className={`px-3 py-2 rounded-xl text-sm max-w-[85%] ${
                    isMe
                      ? "bg-primary text-white rounded-tr-sm"
                      : "bg-white border shadow-sm text-slate-800 rounded-tl-sm"
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

      <form
        onSubmit={handleSendMessage}
        className="p-3 bg-white border-t flex items-center gap-2"
      >
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1"
          disabled={sending || !user}
        />
        <Button type="submit" disabled={sending || !newMessage.trim() || !user} size="icon" className="h-10 w-10 shrink-0">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}
