import { View, Text } from 'react-native';

interface AgentHeaderProps {
  agentType: 'coach' | 'teaching_buddy';
}

const AGENT_INFO = {
  coach: {
    name: 'Coach',
    tagline: 'Your learning guide',
    avatar: '🎓',
    color: 'bg-primary-100',
  },
  teaching_buddy: {
    name: 'Buddy',
    tagline: 'Curious & confused — teach me!',
    avatar: '🤖',
    color: 'bg-accent-100',
  },
};

export function AgentHeader({ agentType }: AgentHeaderProps) {
  const info = AGENT_INFO[agentType] || AGENT_INFO.coach;

  return (
    <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
      <View className={`w-10 h-10 rounded-full ${info.color} items-center justify-center mr-3`}>
        <Text className="text-xl">{info.avatar}</Text>
      </View>
      <View>
        <Text className="font-semibold text-gray-900">{info.name}</Text>
        <Text className="text-xs text-gray-500">{info.tagline}</Text>
      </View>
    </View>
  );
}
