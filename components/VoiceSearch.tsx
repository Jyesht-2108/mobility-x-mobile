import React, { useEffect, useRef, useState } from 'react';
import { Platform, View, Text, Button } from 'react-native';

type Props = {
  onResult: (text: string) => void;
};

export default function VoiceSearch({ onResult }: Props) {
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [listening, setListening] = useState(false);
  const [lastText, setLastText] = useState('');

  useEffect(() => {
    // Web Speech API support check (web only)
    if (Platform.OS === 'web') {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SR) {
        setSupported(true);
        const rec = new SR();
        rec.lang = 'en-US';
        rec.continuous = false;
        rec.interimResults = false;
        rec.onresult = (e: any) => {
          const text = e.results?.[0]?.[0]?.transcript ?? '';
          setLastText(text);
          onResult(text);
          setListening(false);
        };
        rec.onend = () => setListening(false);
        recognitionRef.current = rec;
      }
    }
  }, [onResult]);

  const start = () => {
    if (recognitionRef.current) {
      setListening(true);
      recognitionRef.current.start();
    }
  };

  if (!supported) {
    return (
      <View style={{ width: '100%', alignItems: 'flex-start' }}>
        <Text style={{ color: '#666' }}>Voice input available on web only (Web Speech API).</Text>
      </View>
    );
  }

  return (
    <View style={{ width: '100%', gap: 8 }}>
      <Button title={listening ? 'Listening…' : 'Speak'} onPress={start} disabled={listening} />
      {lastText ? <Text>Heard: {lastText}</Text> : null}
    </View>
  );
}



