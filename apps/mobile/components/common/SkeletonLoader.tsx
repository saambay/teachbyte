import { View } from 'react-native';

export function SkeletonLine({ width = 'w-full' }: { width?: string }) {
  return (
    <View className={`h-4 ${width} bg-gray-200 rounded-md mb-2`} />
  );
}

export function SkeletonCard() {
  return (
    <View className="bg-gray-50 rounded-xl p-4 mb-3">
      <SkeletonLine width="w-2/3" />
      <SkeletonLine width="w-full" />
      <SkeletonLine width="w-1/2" />
    </View>
  );
}

export function HomeScreenSkeleton() {
  return (
    <View className="px-6 pt-16">
      <SkeletonLine width="w-1/2" />
      <View className="h-2" />
      <SkeletonLine width="w-1/3" />
      <View className="h-6" />
      <View className="bg-gray-200 rounded-2xl h-20 mb-8" />
      <SkeletonLine width="w-1/3" />
      <View className="h-3" />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </View>
  );
}
