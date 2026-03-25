import { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSessionStore } from '../../../stores/sessionStore';
import { useProgressStore } from '../../../stores/progressStore';
import { useAuthStore } from '../../../stores/authStore';

function StarRating({ score, label }: { score: number; label: string }) {
  const filled = Math.round(score);
  return (
    <View className="items-center">
      <View className="flex-row mb-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <Text
            key={i}
            className={`text-2xl ${i <= filled ? '' : 'opacity-30'}`}
          >
            ⭐
          </Text>
        ))}
      </View>
      <Text className="text-sm text-gray-500">{label}</Text>
    </View>
  );
}

function AnimatedScore({ target }: { target: number }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let frame = 0;
    const total = 20;
    const interval = setInterval(() => {
      frame++;
      setCurrent(Math.min((frame / total) * target, target));
      if (frame >= total) clearInterval(interval);
    }, 50);
    return () => clearInterval(interval);
  }, [target]);

  return (
    <Text className="text-5xl font-bold text-primary-600">
      {current.toFixed(1)}
    </Text>
  );
}

export default function CompleteScreen() {
  const params = useLocalSearchParams<{ score: string; summary: string }>();
  const { reset } = useSessionStore();
  const { fetchStreak } = useProgressStore();
  const { studentId } = useAuthStore();
  const router = useRouter();
  const [showConfetti, setShowConfetti] = useState(false);

  const teachingScore = params.score ? JSON.parse(params.score) : null;
  const summary = params.summary || 'Great session!';

  useEffect(() => {
    // Refresh streak data
    if (studentId) {
      fetchStreak(studentId);
    }

    // Check for streak milestone (every 5 days)
    const streak = useProgressStore.getState().streak;
    if (streak && streak.currentStreak > 0 && streak.currentStreak % 5 === 0) {
      setShowConfetti(true);
    }
  }, []);

  const handleGoHome = () => {
    reset();
    router.replace('/(app)/home');
  };

  return (
    <View className="flex-1 bg-white items-center justify-center px-6">
      <View className="w-full max-w-sm items-center">
        {/* Confetti / celebration */}
        {showConfetti && (
          <Text className="text-4xl mb-2">🎉🎊🎉</Text>
        )}

        <Text className="text-3xl font-bold text-gray-900 mb-2">
          Amazing Job!
        </Text>
        <Text className="text-gray-500 text-center mb-8">
          {summary}
        </Text>

        {/* Overall Score */}
        {teachingScore && (
          <View className="items-center mb-8">
            <AnimatedScore target={teachingScore.overall} />
            <Text className="text-gray-400 text-sm mt-1">Overall Score</Text>
          </View>
        )}

        {/* Individual Scores */}
        {teachingScore && (
          <View className="flex-row justify-around w-full mb-8">
            <StarRating score={teachingScore.clarity} label="Clarity" />
            <StarRating score={teachingScore.completeness} label="Complete" />
            <StarRating score={teachingScore.engagement} label="Engaged" />
          </View>
        )}

        {/* Streak */}
        {useProgressStore.getState().streak && (
          <View className="bg-accent-50 rounded-xl px-6 py-4 items-center mb-8 w-full">
            <Text className="text-3xl mb-1">🔥</Text>
            <Text className="text-xl font-bold text-accent-600">
              {useProgressStore.getState().streak?.currentStreak || 0} Day Streak
            </Text>
            <Text className="text-sm text-gray-500 mt-1">
              Come back tomorrow to keep it going!
            </Text>
          </View>
        )}

        {/* Home Button */}
        <Pressable
          onPress={handleGoHome}
          className="bg-primary-600 rounded-xl py-4 px-8 w-full items-center active:bg-primary-700"
        >
          <Text className="text-white text-lg font-semibold">
            Back to Home
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
