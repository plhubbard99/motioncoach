import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import RecordScreen from "@/screens/RecordScreen";

export type RootStackParamList = {
  MainTabs: undefined;
  RecordModal: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      <Stack.Screen
        name="RecordModal"
        component={RecordScreen}
        options={{
          presentation: "fullScreenModal",
          animation: "slide_from_bottom",
          contentStyle: {
            backgroundColor: "#000000",
          },
        }}
      />
    </Stack.Navigator>
  );
}
