import { View, Text } from 'react-native';

interface ChatBubbleProps {
  role: 'student' | 'agent';
  content: string;
  agentType?: string;
  timestamp?: Date;
}

export function ChatBubble({ role, content, agentType }: ChatBubbleProps) {
  const isAgent = role === 'agent';

  return (
    <View
      className={`max-w-[85%] mb-3 ${isAgent ? 'self-start' : 'self-end'}`}
    >
      {isAgent && agentType && (
        <Text className="text-xs text-gray-400 mb-1 ml-1">
          {agentType === 'coach' ? 'Coach' : 'Buddy'}
        </Text>
      )}
      <View
        className={`rounded-2xl px-4 py-3 ${
          isAgent
            ? 'bg-gray-100 rounded-tl-sm'
            : 'bg-primary-600 rounded-tr-sm'
        }`}
      >
        <Text
          className={`text-base leading-6 ${
            isAgent ? 'text-gray-800' : 'text-white'
          }`}
        >
          {content}
        </Text>
      </View>
    </View>
  );
}
