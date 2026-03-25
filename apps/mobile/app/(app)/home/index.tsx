import { useEffect, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../stores/authStore';
import { useProgressStore } from '../../../stores/progressStore';
import { useSessionStore } from '../../../stores/sessionStore';
import { useState } from 'react';

function StreakBadge({ streak, status }: { streak: number; status: string }) {
  const isActive = status === 'active';
  const isPaused = status === 'paused';

  return (
    <View className="flex-row items-center bg-accent-50 rounded-xl px-4 py-3">
      <Text className="text-2xl mr-2">{isActive ? '🔥' : isPaused ? '⏸️' : '💤'}</Text>
      <View>
        <Text className="text-lg font-bold text-accent-600">
          {streak} day{streak !== 1 ? 's' : ''}
        </Text>
        <Text className="text-xs text-gray-500">
          {isActive
            ? 'Streak active!'
            : isPaused
              ? "Let's keep it going!"
              : "Let's get back on track!"}
        </Text>
      </View>
    </View>
  );
}

function RecentTopicItem({ title, status }: { title: string; status: string }) {
  const statusColors: Record<string, string> = {
    mastered: 'bg-green-100 text-green-700',
    in_progress: 'bg-yellow-100 text-yellow-700',
    not_started: 'bg-gray-100 text-gray-500',
  };
  const colorClass = statusColors[status] || statusColors.not_started;
  const label = status === 'mastered' ? 'Mastered' : status === 'in_progress' ? 'Learning' : 'New';

  return (
    <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
      <Text className="text-gray-800 text-base flex-1">{title}</Text>
      <View className={`px-3 py-1 rounded-full ${colorClass.split(' ')[0]}`}>
        <Text className={`text-xs font-medium ${colorClass.split(' ')[1]}`}>{label}</Text>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const { studentName, studentId, logout } = useAuthStore();
  const { progress, streak, fetchProgress, fetchStreak } = useProgressStore();
  const { startSession, isLoading: sessionLoading } = useSessionStore();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!studentId) return;
    await Promise.all([fetchProgress(studentId), fetchStreak(studentId)]);
  }, [studentId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleStartSession = async () => {
    if (!studentId) return;
    await startSession(studentId);
    router.push('/(app)/session/chat');
  };

  const recentTopics = progress.slice(0, 5);

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerClassName="px-6 pt-16 pb-8"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View className="w-full max-w-lg self-center">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="text-2xl font-bold text-gray-900">
              Hey, {studentName || 'there'}!
            </Text>
            <Text className="text-gray-500 mt-1">Ready to teach today?</Text>
          </View>
          <Pressable
            onPress={() => router.push('/(app)/parent/dashboard')}
            className="bg-gray-100 rounded-full px-3 py-2"
          >
            <Text className="text-gray-600 text-sm">Parent</Text>
          </Pressable>
        </View>

        {/* Streak */}
        {streak && (
          <View className="mb-6">
            <StreakBadge
              streak={streak.currentStreak}
              status={streak.streakStatus}
            />
          </View>
        )}

        {/* Start Session Button */}
        <Pressable
          onPress={handleStartSession}
          disabled={sessionLoading}
          className="bg-primary-600 rounded-2xl py-5 items-center mb-8 active:bg-primary-700"
        >
          <Text className="text-white text-xl font-bold">
            {sessionLoading ? 'Starting...' : "Start Today's Session"}
          </Text>
          <Text className="text-primary-200 text-sm mt-1">
            10-15 minutes of learning magic
          </Text>
        </Pressable>

        {/* Recent Topics */}
        {recentTopics.length > 0 && (
          <View>
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Recent Topics
            </Text>
            <View className="bg-gray-50 rounded-xl px-4 py-1">
              {recentTopics.map((topic) => (
                <RecentTopicItem
                  key={topic.topicId}
                  title={topic.topicTitle}
                  status={topic.status}
                />
              ))}
            </View>
          </View>
        )}

        {/* Logout */}
        <Pressable onPress={logout} className="mt-8 items-center">
          <Text className="text-gray-400 text-sm">Sign Out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
