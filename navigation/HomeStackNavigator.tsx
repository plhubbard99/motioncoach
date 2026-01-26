import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "@/screens/HomeScreen";
import AnalysisResultScreen from "@/screens/AnalysisResultScreen";
import DrillDetailScreen from "@/screens/DrillDetailScreen";
import { HeaderTitle } from "@/components/HeaderTitle";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";

export type HomeStackParamList = {
  Home: undefined;
  AnalysisResult: { analysisId: string; videoId?: string; sport?: string };
  DrillDetail: { drillId: string; title?: string; focus?: string };
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        ...getCommonScreenOptions({ theme, isDark }),
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerTitle: () => <HeaderTitle title="Pocket Coach" />,
        }}
      />
      <Stack.Screen
        name="AnalysisResult"
        component={AnalysisResultScreen}
        options={{ headerTitle: "Analysis" }}
      />
      <Stack.Screen
        name="DrillDetail"
        component={DrillDetailScreen}
        options={({ route }) => ({
          headerTitle: route.params?.title || "Drill Details",
        })}
      />
    </Stack.Navigator>
  );
}
