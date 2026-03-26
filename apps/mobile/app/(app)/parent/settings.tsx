import { useState, useEffect } from 'react';
import { View, Text, Switch, Pressable, TextInput, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../stores/authStore';
import api from '../../../services/api';

export default function ParentSettings() {
  const { studentId, studentName, logout } = useAuthStore();
  const router = useRouter();

  const [notifications, setNotifications] = useState(true);
  const [dailyReminder, setDailyReminder] = useState(false);
  const [reminderTime, setReminderTime] = useState('17:00');
  const [childName, setChildName] = useState(studentName || '');
  const [saving, setSaving] = useState(false);

  const saveSettings = async () => {
    setSaving(true);
    try {
      await api.put('/api/parent/settings', {
        notificationsEnabled: notifications,
        dailySessionReminder: dailyReminder,
        reminderTime,
      });
    } catch {
      // Settings save not critical
    }
    setSaving(false);
  };

  const updateChildProfile = async () => {
    if (!studentId || !childName.trim()) return;
    setSaving(true);
    try {
      await api.put(`/api/students/${studentId}`, {
        name: childName.trim(),
      });
    } catch {
      // Profile update not critical
    }
    setSaving(false);
  };

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerClassName="px-6 pt-16 pb-8"
    >
      <View className="w-full max-w-lg self-center">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-8">
          <Text className="text-2xl font-bold text-gray-900">Settings</Text>
          <Pressable
            onPress={() => router.back()}
            className="bg-gray-100 rounded-full px-3 py-2"
          >
            <Text className="text-gray-600 text-sm">Back</Text>
          </Pressable>
        </View>

        {/* Notifications */}
        <Text className="text-lg font-semibold text-gray-900 mb-4">
          Notifications
        </Text>
        <View className="bg-gray-50 rounded-xl px-4 py-2 mb-6">
          <View className="flex-row items-center justify-between py-3">
            <Text className="text-gray-700">Notifications</Text>
            <Switch
              value={notifications}
              onValueChange={(val) => {
                setNotifications(val);
                saveSettings();
              }}
              trackColor={{ true: '#4F46E5' }}
            />
          </View>
          <View className="flex-row items-center justify-between py-3 border-t border-gray-200">
            <Text className="text-gray-700">Daily Reminder</Text>
            <Switch
              value={dailyReminder}
              onValueChange={(val) => {
                setDailyReminder(val);
                saveSettings();
              }}
              trackColor={{ true: '#4F46E5' }}
            />
          </View>
          {dailyReminder && (
            <View className="flex-row items-center justify-between py-3 border-t border-gray-200">
              <Text className="text-gray-700">Reminder Time</Text>
              <TextInput
                value={reminderTime}
                onChangeText={setReminderTime}
                placeholder="HH:MM"
                className="text-primary-600 font-medium text-right"
                onBlur={saveSettings}
              />
            </View>
          )}
        </View>

        {/* Child Profile */}
        <Text className="text-lg font-semibold text-gray-900 mb-4">
          Child Profile
        </Text>
        <View className="bg-gray-50 rounded-xl px-4 py-4 mb-6">
          <Text className="text-gray-500 text-sm mb-2">Name</Text>
          <TextInput
            value={childName}
            onChangeText={setChildName}
            className="border border-gray-300 rounded-lg px-3 py-2 text-base mb-3"
            onBlur={updateChildProfile}
          />
        </View>

        {/* Sign Out */}
        <Pressable
          onPress={logout}
          className="border border-red-200 rounded-xl py-3 items-center"
        >
          <Text className="text-red-500 font-medium">Sign Out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
