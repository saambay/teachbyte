import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { AUTH_MODE } from '../../constants/config';

export default function LoginScreen() {
  const { devLogin, isLoading, error } = useAuthStore();
  const router = useRouter();

  const handleDevLogin = async () => {
    console.log('Dev login pressed, AUTH_MODE:', AUTH_MODE);
    try {
      await devLogin();
      console.log('Dev login complete');
    } catch (e) {
      console.error('Dev login error:', e);
    }
  };

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'white', paddingHorizontal: 24 }}>
      <View style={{ width: '100%', maxWidth: 384, alignItems: 'center' }}>
        <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#4F46E5', marginBottom: 8 }}>
          TeachByte
        </Text>
        <Text style={{ fontSize: 18, color: '#6B7280', marginBottom: 48, textAlign: 'center' }}>
          Learn by teaching AI characters
        </Text>

        <TouchableOpacity
          onPress={handleDevLogin}
          disabled={isLoading}
          style={{
            width: '100%',
            backgroundColor: isLoading ? '#818CF8' : '#4F46E5',
            borderRadius: 12,
            paddingVertical: 16,
            alignItems: 'center',
          }}
          activeOpacity={0.7}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>
              Dev Login
            </Text>
          )}
        </TouchableOpacity>

        {error && (
          <Text style={{ color: '#EF4444', marginTop: 16, textAlign: 'center' }}>{error}</Text>
        )}

        <Text style={{ color: '#9CA3AF', fontSize: 14, marginTop: 32, textAlign: 'center' }}>
          Parents: sign in to manage your child's learning
        </Text>
      </View>
    </View>
  );
}
