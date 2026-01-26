import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import VideoReviewScreen from "@/screens/VideoReviewScreen";
import VideoPlaybackScreen from "@/screens/VideoPlaybackScreen";
import AnalysisResultScreen from "@/screens/AnalysisResultScreen";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";

export type VideoReviewStackParamList = {
  VideoReview: undefined;
  VideoPlayback: {
    videoId: string;
    uri?: string;
    title?: string;
    sport?: string;
  };
  AnalysisResult: { analysisId: string };
};

const Stack = createNativeStackNavigator<VideoReviewStackParamList>();

export default function VideoReviewStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        ...getCommonScreenOptions({ theme, isDark }),
      }}
    >
      <Stack.Screen
        name="VideoReview"
        component={VideoReviewScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="VideoPlayback"
        component={VideoPlaybackScreen}
        options={{
          headerShown: false,
          presentation: "fullScreenModal",
          animation: "fade",
        }}
      />
      <Stack.Screen
        name="AnalysisResult"
        component={AnalysisResultScreen}
        options={{
          title: "Analysis",
        }}
      />
    </Stack.Navigator>
  );
}
