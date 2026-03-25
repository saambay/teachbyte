import { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../stores/authStore';
import api from '../../../services/api';

interface DashboardData {
  recentSessions: Array<{
    id: string;
    started_at: string;
    duration_seconds: number;
    teaching_score_overall: number | null;
    topic: { title: string } | null;
  }>;
  topicProgress: Array<{
    status: string;
    best_overall: number | null;
    topic: { title: string };
  }>;
  streakData: {
    currentStreak: number;
    longestStreak: number;
    streakStatus: string;
  };
  totalTimeThisWeekSeconds: number;
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View className="bg-gray-50 rounded-xl p-4 flex-1 mr-3 last:mr-0">
      <Text className="text-gray-500 text-xs mb-1">{label}</Text>
      <Text className="text-xl font-bold text-gray-900">{value}</Text>
      {sub && <Text className="text-xs text-gray-400 mt-1">{sub}</Text>}
    </View>
  );
}

function SessionItem({
  topic,
  date,
  score,
  duration,
}: {
  topic: string;
  date: string;
  score: number | null;
  duration: number;
}) {
  const minutes = Math.round(duration / 60);
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
      <View className="flex-1">
        <Text className="text-gray-800 font-medium">{topic}</Text>
        <Text className="text-xs text-gray-400">
          {formattedDate} · {minutes} min
        </Text>
      </View>
      {score !== null && (
        <View className="bg-primary-50 rounded-full px-3 py-1">
          <Text className="text-primary-700 font-semibold text-sm">
            {score.toFixed(1)}
          </Text>
        </View>
      )}
    </View>
  );
}

function TopicProgressItem({ title, status, score }: { title: string; status: string; score: number | null }) {
  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    mastered: { bg: 'bg-green-100', text: 'text-green-700', label: 'Mastered' },
    in_progress: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Learning' },
    not_started: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'New' },
  };
  const config = statusConfig[status] || statusConfig.not_started;

  return (
    <View className="flex-row items-center justify-between py-2">
      <Text className="text-gray-700 flex-1">{title}</Text>
      <View className={`${config.bg} rounded-full px-3 py-1`}>
        <Text className={`${config.text} text-xs font-medium`}>{config.label}</Text>
      </View>
    </View>
  );
}

export default function ParentDashboard() {
  const { studentId, studentName, parentName } = useAuthStore();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!studentId) return;
    try {
      const response = await api.get(`/api/parent/dashboard/${studentId}`);
      setData(response.data);
    } catch {
      // Dashboard data not critical for display
    }
  }, [studentId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const totalMinutes = data
    ? Math.round(data.totalTimeThisWeekSeconds / 60)
    : 0;
  const sessionsThisWeek = data?.recentSessions.length || 0;
  const topicsCount = data?.topicProgress.length || 0;

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerClassName="px-6 pt-16 pb-8"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View className="w-full max-w-2xl self-center">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="text-2xl font-bold text-gray-900">
              Parent Dashboard
            </Text>
            <Text className="text-gray-500">{studentName}'s Progress</Text>
          </View>
          <Pressable
            onPress={() => router.back()}
            className="bg-gray-100 rounded-full px-3 py-2"
          >
            <Text className="text-gray-600 text-sm">Back</Text>
          </Pressable>
        </View>

        {/* Stats row - on tablet, these will use the extra space */}
        <View className="flex-row mb-6">
          <StatCard
            label="This Week"
            value={`${sessionsThisWeek}`}
            sub="sessions"
          />
          <StatCard
            label="Time"
            value={`${totalMinutes}m`}
            sub="total this week"
          />
          <StatCard
            label="Streak"
            value={`${data?.streakData.currentStreak || 0}`}
            sub={`best: ${data?.streakData.longestStreak || 0}`}
          />
        </View>

        {/* Two-column layout on tablets */}
        <View className="md:flex-row md:gap-6">
          {/* Left column */}
          <View className="md:flex-1">
            {/* Recent Sessions */}
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Recent Sessions
            </Text>
            <View className="bg-gray-50 rounded-xl px-4 py-1 mb-6">
              {data?.recentSessions.length ? (
                data.recentSessions.map((session) => (
                  <SessionItem
                    key={session.id}
                    topic={session.topic?.title || 'Unknown Topic'}
                    date={session.started_at}
                    score={session.teaching_score_overall}
                    duration={session.duration_seconds}
                  />
                ))
              ) : (
                <Text className="text-gray-400 py-4 text-center">
                  No sessions yet
                </Text>
              )}
            </View>
          </View>

          {/* Right column */}
          <View className="md:flex-1">
            {/* Topic Progress */}
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Topic Progress
            </Text>
            <View className="bg-gray-50 rounded-xl px-4 py-2 mb-6">
              {data?.topicProgress.length ? (
                data.topicProgress.map((progress, i) => (
                  <TopicProgressItem
                    key={i}
                    title={progress.topic.title}
                    status={progress.status}
                    score={progress.best_overall}
                  />
                ))
              ) : (
                <Text className="text-gray-400 py-4 text-center">
                  No topics attempted yet
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Settings link */}
        <Pressable
          onPress={() => router.push('/(app)/parent/settings')}
          className="bg-gray-50 rounded-xl p-4 flex-row items-center justify-between"
        >
          <Text className="text-gray-700 font-medium">Settings</Text>
          <Text className="text-gray-400">→</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
