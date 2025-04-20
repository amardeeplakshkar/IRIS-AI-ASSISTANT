'use client'

import React, { useState } from 'react';
import { ChatMessageList } from '../ui/chat-message-list';
import { ChatBubble, ChatBubbleAvatar, ChatBubbleMessage } from '../ui/chat-bubble';
import { Paperclip, Mic, CornerDownLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { ChatInput } from '../ui/chat-input';
import { systemInstructions } from '@/constants';
import { useSpeechContext } from '../context/SpeechProvider';
import { ResponseStream } from '../ui/response-stream';


const ChatComponent = () => {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: 'system',
            content: systemInstructions,
        },
    ]);
    const { setIsSpeaking } = useSpeechContext();

    const playTTS = async (text: string) => {
        try {
            const res = await fetch('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text }),
            });

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            setIsSpeaking(true);

            audio.addEventListener('ended', () => {
                setIsSpeaking(false)
            });

            audio.addEventListener('error', () => {
                setIsSpeaking(false)
            });

            audio.play();
        } catch (err) {
            console.error('TTS error:', err);
            setIsSpeaking(false)
        }
    };
    const sendUserMessage = async (text: string) => {
        const userMessage = { role: 'user', content: text };
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setIsLoading(true);

        try {
            const res = await fetch('https://text.pollinations.ai/openai', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: updatedMessages,
                }),
            });

            const data = await res.json();
            const responseContent = data?.choices?.[0]?.message?.content;

            const assistantMessage = {
                role: 'assistant',
                content: responseContent || 'Something went wrong with the response.',
            };

            setMessages((prev) => [...prev, assistantMessage]);
            playTTS(assistantMessage.content).catch(console.error);
        } catch (err) {
            console.error('Fetch error:', err);
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: 'Failed to fetch response.' },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSend = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!input.trim()) return;

        const text = input;
        setInput(''); // Clear input immediately for snappy UI
        sendUserMessage(text); // No await for faster experience
    };

    const handleAttachFile = () => {
        // Handle file attachment
    };

    const handleMicrophoneClick = () => {
        // Handle microphone click event
    };

    return (
        <div className="h-[50dvh] border bg-background rounded-lg flex flex-col">
            <div className="flex-1 overflow-hidden max-w-md w-[calc(100dvw-1rem)] mx-auto">
                <ChatMessageList>
                    {messages.slice(1).map((msg, i) => (
                        <ChatBubble
                            key={i}
                            variant={msg.role === 'user' ? 'sent' : 'received'}
                        >
                            <ChatBubbleAvatar
                                className="h-8 w-8 shrink-0"
                                src={
                                    msg.role === 'user'
                                        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&q=80&crop=faces&fit=crop'
                                        : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&q=80&crop=faces&fit=crop'
                                }
                                fallback={msg.role === 'user' ? 'US' : 'AI'}
                            />
                            <ChatBubbleMessage
                                variant={msg.role === 'user' ? 'sent' : 'received'}
                            >
                                <ResponseStream mode="fade"
                                    className="text-sm" textStream={msg.content} speed={500} />
                            </ChatBubbleMessage>
                        </ChatBubble>
                    ))}
                    {isLoading && (
                        <ChatBubble variant="received">
                            <ChatBubbleAvatar
                                className="h-8 w-8 shrink-0"
                                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&q=80&crop=faces&fit=crop"
                                fallback="AI"
                            />
                            <ChatBubbleMessage isLoading />
                        </ChatBubble>
                    )}
                </ChatMessageList>
            </div>
            <div className="p-4 border-t">
                <form
                    onSubmit={handleSend}
                    className="relative rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring p-1"
                >
                    <ChatInput
                        disabled={isLoading}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message..."
                        className="min-h-12 resize-none rounded-lg bg-background border-0 p-3 shadow-none focus-visible:ring-0"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                    />
                    <div className="flex items-center p-3 pt-0 justify-between">
                        <div className="flex">
                            <Button
                                variant="ghost"
                                size="icon"
                                type="button"
                                onClick={handleAttachFile}
                            >
                                <Paperclip className="size-4" />
                            </Button>

                            <Button
                                variant="ghost"
                                size="icon"
                                type="button"
                                onClick={handleMicrophoneClick}
                            >
                                <Mic className="size-4" />
                            </Button>
                        </div>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            size="sm"
                            className="ml-auto gap-1.5"
                        >
                            Send Message
                            <CornerDownLeft className="size-3.5" />
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChatComponent;
