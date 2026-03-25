import { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';

const AGE_OPTIONS = [6, 7, 8, 9, 10, 11, 12];
const GRADE_OPTIONS = [1, 2, 3, 4, 5, 6, 7];

export default function OnboardScreen() {
  const { onboard, isLoading, error } = useAuthStore();
  const router = useRouter();

  const [name, setName] = useState('');
  const [age, setAge] = useState(9);
  const [gradeLevel, setGradeLevel] = useState(4);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    await onboard({ name: name.trim(), age, gradeLevel });
    router.replace('/(app)/home');
  };

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerClassName="items-center justify-center px-6 py-12"
    >
      <View className="w-full max-w-sm">
        <Text className="text-3xl font-bold text-primary-600 mb-2 text-center">
          Welcome!
        </Text>
        <Text className="text-gray-500 mb-8 text-center">
          Let's set up your child's profile
        </Text>

        {/* Name */}
        <Text className="text-gray-700 font-medium mb-2">Child's Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Enter name"
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-lg mb-6"
          autoCapitalize="words"
        />

        {/* Age */}
        <Text className="text-gray-700 font-medium mb-2">Age</Text>
        <View className="flex-row flex-wrap gap-2 mb-6">
          {AGE_OPTIONS.map((a) => (
            <Pressable
              key={a}
              onPress={() => setAge(a)}
              className={`px-4 py-2 rounded-lg ${
                age === a ? 'bg-primary-600' : 'bg-gray-100'
              }`}
            >
              <Text
                className={`font-medium ${
                  age === a ? 'text-white' : 'text-gray-700'
                }`}
              >
                {a}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Grade */}
        <Text className="text-gray-700 font-medium mb-2">Grade Level</Text>
        <View className="flex-row flex-wrap gap-2 mb-8">
          {GRADE_OPTIONS.map((g) => (
            <Pressable
              key={g}
              onPress={() => setGradeLevel(g)}
              className={`px-4 py-2 rounded-lg ${
                gradeLevel === g ? 'bg-primary-600' : 'bg-gray-100'
              }`}
            >
              <Text
                className={`font-medium ${
                  gradeLevel === g ? 'text-white' : 'text-gray-700'
                }`}
              >
                Grade {g}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={handleSubmit}
          disabled={isLoading || !name.trim()}
          className={`w-full rounded-xl py-4 items-center ${
            name.trim() ? 'bg-primary-600 active:bg-primary-700' : 'bg-gray-300'
          }`}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-lg font-semibold">
              Let's Go!
            </Text>
          )}
        </Pressable>

        {error && (
          <Text className="text-red-500 mt-4 text-center">{error}</Text>
        )}
      </View>
    </ScrollView>
  );
}
