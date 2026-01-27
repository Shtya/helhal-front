import { useTranslations } from 'next-intl';
import { useState, useRef, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

const BASE_URL = process.env.NEXT_PUBLIC_CHATBOT_API_URL || 'http://18.196.235.231:4001';
const WS_URL = process.env.NEXT_PUBLIC_CHATBOT_WS_URL || 'ws://18.196.235.231:4001/ws/live';

export const useChatbot = (personalData = null) => {
  const t = useTranslations('chatbot');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);

  const wsRef = useRef(null);
  const audioContextRef = useRef(null);
  const playbackContextRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const scriptProcessorRef = useRef(null);
  const messageIdRef = useRef(0);
  const audioQueueRef = useRef([]); // (FIX: Queue for smooth playback)
  const isPlayingRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // Send text message
  const sendTextMessage = useCallback(async (message) => {
    if (!message.trim()) return;

    const userMessage = {
      id: messageIdRef.current++,
      type: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          personalData,
          conversationId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();

      setConversationId(data.conversationId || conversationId);
      const botMessage = {
        id: messageIdRef.current++,
        type: 'bot',
        content: data.response || data.message || t('noResponse'),
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);

      const errorMessage = {
        id: messageIdRef.current++,
        type: 'error',
        content: t('errorMessage'),
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [personalData, conversationId, t]);

  // Clear server conversation
  const clearServerConversation = async (convId) => {
    if (!convId) return;
    try {
      const response = await fetch(`${BASE_URL}/api/chat/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: convId }),
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to clear conversation:', error);
    }
  };

  // Clear messages
  const clearMessages = useCallback(async () => {
    setMessages([]);
    setUnreadCount(0);
    if (conversationId) {
      setConversationId(null);
    }
  }, [conversationId]);

  // Convert Float32Array to 16-bit PCM (matching backend format)
  const floatTo16BitPCM = useCallback((float32Array) => {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);

    for (let i = 0; i < float32Array.length; i++) {
      let sample = Math.max(-1, Math.min(1, float32Array[i]));
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(i * 2, sample, true); // Little-endian
    }

    return new Uint8Array(buffer);
  }, []);

  const processAudioQueue = useCallback(async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return;

    isPlayingRef.current = true;
    if (isMountedRef.current) setIsSpeaking(true);

    const nextChunk = audioQueueRef.current.shift();

    try {
      // Initialize shared context if missing
      if (!playbackContextRef.current) {
        playbackContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      }

      const ctx = playbackContextRef.current;
      // Resume if suspended (browser policy)
      if (ctx.state === 'suspended') await ctx.resume();

      // Create buffer
      const audioBuffer = ctx.createBuffer(1, nextChunk.length, 16000);
      audioBuffer.getChannelData(0).set(nextChunk);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);

      source.onended = () => {
        isPlayingRef.current = false;
        // Process next chunk if available
        if (audioQueueRef.current.length > 0) {
          processAudioQueue();
        } else {
          if (isMountedRef.current) setIsSpeaking(false);
        }
      };

      source.start();
    } catch (error) {
      console.error('Audio playback error:', error);
      isPlayingRef.current = false;
      if (isMountedRef.current) setIsSpeaking(false);
    }
  }, []);

  const playAudioResponse = useCallback((base64Audio) => {
    try {
      // Decode Base64 to Float32 immediately
      const binaryString = atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);

      // Convert PCM (Int16) -> Float32 for Web Audio API
      const inputView = new DataView(bytes.buffer);
      const float32Data = new Float32Array(len / 2);

      for (let i = 0; i < float32Data.length; i++) {
        const int16 = inputView.getInt16(i * 2, true); // Little-endian
        float32Data[i] = int16 / (int16 < 0 ? 0x8000 : 0x7FFF);
      }

      // Add to queue and try to process
      audioQueueRef.current.push(float32Data);
      processAudioQueue();

    } catch (error) {
      console.error('Error decoding audio chunk:', error);
    }
  }, [processAudioQueue]);



  // Initialize WebSocket for voice
  const initializeVoiceConnection = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }
    setIsConnecting(true);
    return new Promise((resolve, reject) => {
      try {
        wsRef.current = new WebSocket(WS_URL);

        wsRef.current.onopen = () => {
          console.log('Voice WebSocket connected');
          if (isMountedRef.current) {
            setIsConnecting(false);
            setIsVoiceMode(true);
          }
          resolve();
        };

        wsRef.current.onmessage = async (event) => {
          try {
            // Try to parse as JSON first
            const data = JSON.parse(event.data);

            if (data.type === 'audio') {
              // Audio response in base64 PCM format
              playAudioResponse(data.data);

              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.type === 'bot' && last?.isVoice) return prev;
                return [...prev, {
                  id: messageIdRef.current++,
                  type: 'bot',
                  content: '[Audio response]',
                  timestamp: new Date().toISOString(),
                  isVoice: true,
                }];
              });

            } else if (data.error) {
              // Error from server
              console.error('Server error:', data.error);
            }
          } catch (error) {
            // If not JSON, might be binary data (though backend seems to send JSON)
            console.error('Error processing WebSocket message:', error);
          }
        };

        wsRef.current.onerror = (error) => {
          console.error('WebSocket error:', error);
          toast.error(t('voiceConnectionError'));
          if (isMountedRef.current) {
            setIsConnecting(false);
          }
          reject(error);
        };

        wsRef.current.onclose = () => {
          console.log('Voice WebSocket disconnected');
          if (isMountedRef.current) {
            setIsVoiceMode(false);
            setIsRecording(false);
          }
        };
      } catch (error) {
        if (isMountedRef.current) setIsConnecting(false);
        reject(error);
      }
    });
  }, [t, playAudioResponse]);

  // Start recording with proper PCM encoding
  const startRecording = useCallback(async () => {
    try {
      // Ensure WebSocket is connected
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        await initializeVoiceConnection();
        // Wait a bit for connection to establish
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      console.log('Requesting microphone access...');

      // Request microphone with specific constraints matching backend expectations
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      console.log('Microphone access granted');

      // Create audio context with 16kHz sample rate (matching backend)
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      const source = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);

      // Create script processor for audio processing
      scriptProcessorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

      scriptProcessorRef.current.onaudioprocess = (event) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          const input = event.inputBuffer.getChannelData(0);
          wsRef.current.send(floatTo16BitPCM(input).buffer);
        }
      };

      // Connect audio nodes
      source.connect(scriptProcessorRef.current);
      scriptProcessorRef.current.connect(audioContextRef.current.destination);

      setIsRecording(true);


      const userMessage = {
        id: messageIdRef.current++,
        type: 'user',
        content: t('voiceMessage'),
        timestamp: new Date().toISOString(),
        isVoice: true,
      };
      setMessages(prev => [...prev, userMessage]);

    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error(t('microphoneError'));
    }
  }, [initializeVoiceConnection, floatTo16BitPCM, t]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setIsRecording(false);
    console.log('Recording stopped');
  }, []);

  // Toggle voice mode
  const toggleVoiceMode = useCallback(async () => {
    if (isVoiceMode) {
      // Disconnect
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (isRecording) {
        stopRecording();
      }
      if (playbackContextRef.current) {
        playbackContextRef.current.close();
        playbackContextRef.current = null;
      }
      setIsVoiceMode(false);
    } else {
      // Connect
      await initializeVoiceConnection()
    }
  }, [isVoiceMode, isRecording, stopRecording, initializeVoiceConnection, t]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (conversationId) {
        clearServerConversation(conversationId);
      }
    };
  }, [conversationId]);

  useEffect(() => {
    return () => {
      // Cleanup WebSocket
      if (wsRef.current) {
        wsRef.current.close();
      }

      // Cleanup audio resources
      if (scriptProcessorRef.current) {
        scriptProcessorRef.current.disconnect();
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    messages,
    isLoading,
    isVoiceMode,
    isRecording,
    isSpeaking,
    unreadCount,
    isConnecting,
    setIsConnecting,
    setUnreadCount,
    sendTextMessage,
    startRecording,
    stopRecording,
    toggleVoiceMode,
    clearMessages,
  };
};