/// <reference types="nativewind/types" />

// NativeWind adds className prop at runtime via babel transform.
// This augmentation ensures TypeScript recognizes it.
import "react-native";

declare module "react-native" {
  interface ViewProps {
    className?: string;
  }
  interface TextProps {
    className?: string;
  }
  interface TextInputProps {
    className?: string;
  }
  interface PressableProps {
    className?: string;
  }
  interface ImageProps {
    className?: string;
  }
  interface ScrollViewProps {
    className?: string;
    contentContainerClassName?: string;
  }
  interface SwitchProps {
    className?: string;
  }
}
