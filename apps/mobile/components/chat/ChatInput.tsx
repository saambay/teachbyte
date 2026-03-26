import { useState } from 'react';
import { View, TextInput, Pressable, Text } from 'react-native';

const MAX_LENGTH = 500;

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, disabled, placeholder }: ChatInputProps) {
  const [text, setText] = useState('');

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
  };

  const nearLimit = text.length > MAX_LENGTH - 50;

  return (
    <View className="border-t border-gray-200 bg-white">
      {nearLimit && (
        <Text className={`text-xs text-right px-4 pt-1 ${text.length >= MAX_LENGTH ? 'text-red-500' : 'text-gray-400'}`}>
          {text.length}/{MAX_LENGTH}
        </Text>
      )}
      <View className="flex-row items-end px-4 py-3">
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={placeholder || 'Type your message...'}
          multiline
          maxLength={MAX_LENGTH}
          editable={!disabled}
          className="flex-1 bg-gray-50 rounded-2xl px-4 py-3 text-base max-h-24 text-gray-800"
          placeholderTextColor="#9CA3AF"
          onSubmitEditing={handleSend}
        />
        <Pressable
          onPress={handleSend}
          disabled={disabled || !text.trim()}
          className={`ml-2 rounded-full w-10 h-10 items-center justify-center ${
            text.trim() && !disabled
              ? 'bg-primary-600 active:bg-primary-700'
              : 'bg-gray-200'
          }`}
        >
          <Text className={`text-lg ${text.trim() && !disabled ? 'text-white' : 'text-gray-400'}`}>
            ↑
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
