import { View, Text } from 'react-native';

export function OfflineBanner() {
  return (
    <View className="bg-red-500 px-4 py-2 items-center">
      <Text className="text-white text-sm font-medium">
        No internet connection
      </Text>
    </View>
  );
}
