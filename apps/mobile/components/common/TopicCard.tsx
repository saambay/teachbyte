import { View, Text, Pressable } from 'react-native';

interface TopicCardProps {
  title: string;
  description: string;
  onPress: () => void;
}

export function TopicCard({ title, description, onPress }: TopicCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="bg-primary-50 border border-primary-200 rounded-xl p-4 mb-3 active:bg-primary-100"
    >
      <Text className="text-primary-700 font-semibold text-base mb-1">
        {title}
      </Text>
      <Text className="text-gray-600 text-sm" numberOfLines={2}>
        {description}
      </Text>
    </Pressable>
  );
}
