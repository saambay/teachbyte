import { View, Text } from 'react-native';

interface MicroLessonCardProps {
  topicTitle: string;
  explainerPoints: string[];
  funFacts: string[];
}

export function MicroLessonCard({
  topicTitle,
  explainerPoints,
  funFacts,
}: MicroLessonCardProps) {
  return (
    <View className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-3 max-w-[85%] self-start">
      <Text className="font-semibold text-emerald-800 text-base mb-2">
        Quick look at {topicTitle}
      </Text>

      {explainerPoints.map((point, i) => (
        <View key={i} className="flex-row mb-1">
          <Text className="text-emerald-600 mr-2">•</Text>
          <Text className="text-gray-700 text-sm flex-1 leading-5">
            {point}
          </Text>
        </View>
      ))}

      {funFacts.length > 0 && (
        <View className="mt-2 bg-emerald-100 rounded-xl p-3">
          {funFacts.map((fact, i) => (
            <Text key={i} className="text-emerald-800 text-sm leading-5">
              {fact}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}
