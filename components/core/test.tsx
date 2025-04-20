
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

// Define tools (functions) metadata for OpenAI function calling
const tools = [
  {
    type: 'function',
    function: {
      name: 'openCameraClickUpload',
      description: 'Open the camera, take a photo, and upload as base64 string',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', description: 'Action to perform, expected "clickPhoto"' },
        },
        required: ['action'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'transcribeYoutubeVideo',
      description: 'Transcribe a YouTube video given the video URL',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'YouTube video URL to transcribe' },
        },
        required: ['url'],
      },
    },
  },
];

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

  // Play TTS audio from base64 blob
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
        setIsSpeaking(false);
      });

      audio.addEventListener('error', () => {
        setIsSpeaking(false);
      });

      audio.play();
    } catch (err) {
      console.error('TTS error:', err);
      setIsSpeaking(false);
    }
  };

  // Function implementations that correspond to OpenAI function calls

  // Simulate opening camera, taking photo, and uploading base64 string
  async function openCameraClickUpload({ action }: { action: string }): Promise<string> {
    console.log('Executing openCameraClickUpload with action:', action);
    if (action !== 'clickPhoto') {
      return JSON.stringify({ error: "Invalid action. Expected 'clickPhoto'." });
    }

    // Simulate camera open and photo capture and converting to base64
    // In real usage, you'd use getUserMedia and canvas to take photo, here we mock it
    const dummyBase64Photo = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...'; // Mock base64

    // Normally you would upload photo to an API here and return response, simulate success:
    return JSON.stringify({
      photoBase64: dummyBase64Photo,
      message: 'Photo captured and uploaded successfully (mock).',
    });
  }

  // Simulate transcribing YouTube video from a URL
  async function transcribeYoutubeVideo({ url }: { url: string }): Promise<string> {
    console.log('Executing transcribeYoutubeVideo for url:', url);
    if (!url || !url.startsWith('http')) {
      return JSON.stringify({ error: 'Invalid YouTube URL.' });
    }

    // Simulate transcription result
    const dummyTranscription = `Transcription of the video at ${url} (mock result)`;

    // You could also integrate with a real transcription API here
    return JSON.stringify({
      url,
      transcription: dummyTranscription,
    });
  }

  // Main function to send user message to text.pollinations.ai with function calling
  const sendUserMessage = async (text: string) => {
    const userMessage = { role: 'user', content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      // First API call to openai with tools (functions) info
      const payload = {
        model: 'openai', // must be a model supporting function calling
        messages: updatedMessages,
        tools: tools,
        tool_choice: 'auto',
      };

      const res = await fetch('https://text.pollinations.ai/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      const responseMessage = data?.choices?.[0]?.message;
      if (!responseMessage) throw new Error('No message from OpenAI');

      // Check if model requested a function call
      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        const toolCall = responseMessage.tool_calls[0];
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);

        let functionResponse = '';

        if (functionName === 'openCameraClickUpload') {
          functionResponse = await openCameraClickUpload(functionArgs);
        } else if (functionName === 'transcribeYoutubeVideo') {
          functionResponse = await transcribeYoutubeVideo(functionArgs);
        } else {
          functionResponse = JSON.stringify({ error: `Unknown function requested: ${functionName}` });
        }

        // Append assistant's message with tool call and the tool (function) response message
        const messagesWithToolResponse = [...updatedMessages, responseMessage, {
          tool_call_id: toolCall.id,
          role: 'tool',
          name: functionName,
          content: functionResponse,
        }];

        // Second API call with updated message history including function call response
        const secondPayload = {
          model: 'openai',
          messages: messagesWithToolResponse,
        };

        const secondRes = await fetch('https://text.pollinations.ai/openai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(secondPayload),
        });

        const finalResult = await secondRes.json();
        const assistantFinalMessage = finalResult?.choices?.[0]?.message;

        // Add final assistant response to the chat
        setMessages(prev => [...prev, responseMessage, {
          role: 'assistant',
          content: assistantFinalMessage?.content ?? 'Error: No content in final response',
        }]);

        // Play TTS for final message content
        if (assistantFinalMessage?.content) {
          playTTS(assistantFinalMessage.content).catch(console.error);
        }

      } else {
        // If no function call requested, just add assistant response normally
        setMessages(prev => [...prev, responseMessage]);
        playTTS(responseMessage.content).catch(console.error);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Failed to fetch response.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;

    const text = input;
    setInput(''); // Clear input immediately for snappy UI
    sendUserMessage(text); // Don't await for snappy UI
  };

  const handleAttachFile = () => {
    // Handle file attachment placeholder
  };

  const handleMicrophoneClick = () => {
    // Handle microphone click placeholder
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
