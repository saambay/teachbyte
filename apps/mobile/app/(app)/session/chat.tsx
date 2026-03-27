import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSessionStore } from '../../../stores/sessionStore';
import { ChatBubble } from '../../../components/chat/ChatBubble';
import { ChatInput } from '../../../components/chat/ChatInput';
import { TypingIndicator } from '../../../components/chat/TypingIndicator';
import { AgentHeader } from '../../../components/chat/AgentHeader';
import { TopicCard } from '../../../components/common/TopicCard';

export default function ChatScreen() {
  const {
    messages,
    sessionStatus,
    topicOptions,
    isLoading,
    error,
    sendMessage,
    completeSession,
  } = useSessionStore();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Auto-scroll to bottom on new messages
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages.length, isLoading]);

  const handleSend = (content: string) => {
    sendMessage(content);
  };

  const handleTopicSelect = (topic: { id: string; title: string }) => {
    sendMessage(topic.title);
  };

  const handleComplete = async () => {
    const result = await completeSession();
    if (result) {
      router.replace({
        pathname: '/(app)/session/complete',
        params: {
          score: JSON.stringify(result.teachingScore),
          summary: result.summary,
        },
      });
    }
  };

  // Determine current agent
  const currentAgent =
    sessionStatus === 'teaching'
      ? 'teaching_buddy'
      : sessionStatus === 'exploring'
        ? 'explorer'
        : sessionStatus === 'challenging'
          ? 'challenger'
          : 'coach';

  const showTopicSelection =
    sessionStatus === 'topic_selection' && topicOptions.length > 0;

  const showComplete = sessionStatus === 'coach_summary';

  const inputDisabled =
    isLoading || sessionStatus === 'completed' || showTopicSelection;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Agent Header */}
      <View className="pt-12">
        <AgentHeader agentType={currentAgent as 'coach' | 'teaching_buddy' | 'explorer' | 'challenger'} />
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        className="flex-1 px-4 pt-4"
        contentContainerClassName="max-w-[672px] w-full self-center"
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            role={msg.role}
            content={msg.content}
            agentType={msg.agentType}
          />
        ))}

        {/* Topic selection cards */}
        {showTopicSelection && (
          <View className="my-3">
            <Text className="text-sm text-gray-500 mb-2 ml-1">
              Pick a topic to teach:
            </Text>
            {topicOptions.map((topic) => (
              <TopicCard
                key={topic.id}
                title={topic.title}
                description={topic.description}
                onPress={() => handleTopicSelect(topic)}
              />
            ))}
          </View>
        )}

        {/* Error message */}
        {error && (
          <View className="bg-red-50 rounded-xl p-3 mb-3 self-start max-w-[85%]">
            <Text className="text-red-600 text-sm">{error}</Text>
          </View>
        )}

        {/* Typing indicator */}
        {isLoading && <TypingIndicator />}

        {/* Session complete button */}
        {showComplete && !isLoading && (
          <View className="my-4 items-center">
            <Pressable
              onPress={handleComplete}
              className="bg-green-500 rounded-xl px-8 py-4 active:bg-green-600"
            >
              <Text className="text-white font-bold text-lg">
                Session Complete!
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      {!showComplete && (
        <ChatInput
          onSend={handleSend}
          disabled={inputDisabled}
          placeholder={
            showTopicSelection
              ? 'Tap a topic above...'
              : sessionStatus === 'exploring'
                ? 'What do you think? Ready to teach?'
                : sessionStatus === 'challenging'
                  ? 'Think about it and share your answer...'
                  : 'Explain it in your own words...'
          }
        />
      )}
    </KeyboardAvoidingView>
  );
}
