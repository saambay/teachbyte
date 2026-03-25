import { View, Text } from 'react-native';
import { useEffect, useState } from 'react';

export function TypingIndicator() {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <View className="self-start max-w-[85%] mb-3">
      <Text className="text-xs text-gray-400 mb-1 ml-1">Typing</Text>
      <View className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
        <Text className="text-gray-500 text-base">
          {dots || '.'}
        </Text>
      </View>
    </View>
  );
}
