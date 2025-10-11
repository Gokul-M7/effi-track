import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const AIChat = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your EFFI-TRACK AI assistant. I can help you with questions about managing employees, projects, tasks, and the reward system. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-chat", {
        body: {
          messages: [...messages, userMessage],
        },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        role: "assistant",
        content: data.response,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to get response from AI",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          AI Assistant
        </h1>
        <p className="text-muted-foreground mt-2">
          Chat with our AI to get help with managing your workspace
        </p>
      </div>

      <Card className="flex-1 flex flex-col border-2 border-primary/20 shadow-xl bg-gradient-to-br from-card to-card/50">
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  } animate-slide-up`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {message.role === "assistant" && (
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg">
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] rounded-2xl px-5 py-3 shadow-md ${
                      message.role === "user"
                        ? "bg-primary text-white"
                        : "bg-muted border border-border"
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>
                  {message.role === "user" && (
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-info flex items-center justify-center shadow-lg">
                      <User className="h-5 w-5 text-white" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3 justify-start animate-slide-up">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div className="bg-muted border border-border rounded-2xl px-5 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0s" }} />
                      <div className="w-2 h-2 rounded-full bg-primary/70 animate-bounce" style={{ animationDelay: "0.2s" }} />
                      <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "0.4s" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="p-6 border-t bg-gradient-to-r from-background to-muted/20">
            <div className="flex gap-3">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                disabled={isLoading}
                className="flex-1 border-2 border-primary/20 focus:border-primary transition-colors"
              />
              <Button 
                onClick={sendMessage} 
                disabled={isLoading || !input.trim()}
                size="lg"
                className="bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIChat;
