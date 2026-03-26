import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, View, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import HomeStackNavigator from "@/navigation/HomeStackNavigator";
import LibraryStackNavigator from "@/navigation/LibraryStackNavigator";
import VideoReviewStackNavigator from "@/navigation/VideoReviewStackNavigator";
import ProfileStackNavigator from "@/navigation/ProfileStackNavigator";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";

export type MainTabParamList = {
  HomeTab: undefined;
  LibraryTab: undefined;
  RecordTab: undefined;
  VideoReviewTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function RecordButton({
  onPress,
  color,
}: {
  onPress: () => void;
  color: string;
}) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.9, { damping: 15 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15 });
      }}
      style={[
        styles.recordButton,
        { backgroundColor: theme.primary },
        animatedStyle,
      ]}
    >
      <View style={styles.recordButtonInner}>
        <Feather name="video" size={28} color="#FFFFFF" />
      </View>
    </AnimatedPressable>
  );
}

function EmptyScreen() {
  return null;
}

function RecordTabButton({ color }: { color: string }) {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.recordTabButton}>
      <RecordButton
        onPress={() => navigation.navigate("RecordModal")}
        color={color}
      />
    </View>
  );
}

export default function MainTabNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={{
        tabBarActiveTintColor: theme.tabIconSelected,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: Platform.select({
            ios: "transparent",
            android: theme.backgroundRoot,
          }),
          borderTopWidth: 0,
          elevation: 0,
          height: Platform.select({ ios: 88, android: 70 }),
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : null,
        headerShown: false,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="LibraryTab"
        component={LibraryStackNavigator}
        options={{
          title: "Library",
          tabBarIcon: ({ color, size }) => (
            <Feather name="play-circle" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="RecordTab"
        component={EmptyScreen}
        options={{
          title: "",
          tabBarIcon: () => null,
          tabBarButton: () => <RecordTabButton color={theme.primary} />,
        }}
      />
      <Tab.Screen
        name="VideoReviewTab"
        component={VideoReviewStackNavigator}
        options={{
          title: "My Videos",
          tabBarIcon: ({ color, size }) => (
            <Feather name="film" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  recordButton: {
    width: Spacing.fabSize,
    height: Spacing.fabSize,
    borderRadius: Spacing.fabSize / 2,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 4,
  },
  recordButtonInner: {
    alignItems: "center",
    justifyContent: "center",
  },
  recordTabButton: {
    top: -20,
    alignItems: "center",
    justifyContent: "center",
  },
});
