import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { AUTH_MODE } from '../../constants/config';

export default function LoginScreen() {
  const { devLogin, isLoading, error } = useAuthStore();
  const router = useRouter();

  const handleDevLogin = async () => {
    await devLogin();
  };

  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <View className="w-full max-w-sm items-center">
        <Text className="text-4xl font-bold text-primary-600 mb-2">
          TeachByte
        </Text>
        <Text className="text-lg text-gray-500 mb-12 text-center">
          Learn by teaching AI characters
        </Text>

        {AUTH_MODE === 'dev' ? (
          <Pressable
            onPress={handleDevLogin}
            disabled={isLoading}
            className="w-full bg-primary-600 rounded-xl py-4 items-center active:bg-primary-700"
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-lg font-semibold">
                Dev Login
              </Text>
            )}
          </Pressable>
        ) : (
          <View className="w-full">
            <Text className="text-gray-500 text-center mb-4">
              Firebase auth not configured yet
            </Text>
          </View>
        )}

        {error && (
          <Text className="text-red-500 mt-4 text-center">{error}</Text>
        )}

        <Text className="text-gray-400 text-sm mt-8 text-center">
          Parents: sign in to manage your child's learning
        </Text>
      </View>
    </View>
  );
}
