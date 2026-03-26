import { View, Text, Pressable } from 'react-native';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <View className="bg-red-50 rounded-xl p-4 items-center">
      <Text className="text-red-600 text-center mb-2">{message}</Text>
      {onRetry && (
        <Pressable
          onPress={onRetry}
          className="bg-red-100 rounded-lg px-4 py-2"
        >
          <Text className="text-red-700 font-medium">Try Again</Text>
        </Pressable>
      )}
    </View>
  );
}
