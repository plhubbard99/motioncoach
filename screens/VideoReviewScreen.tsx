import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Pressable,
  FlatList,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useScreenInsets } from "@/hooks/useScreenInsets";
import Spacer from "@/components/Spacer";
import { useVideos } from "@/contexts/VideoContext";
import {
  extractFrames,
  analyzeVideo,
  hasApiKey,
} from "@/services/AnalysisService";

type VideoReviewStackParamList = {
  VideoReview: undefined;
  VideoPlayback: {
    videoId: string;
    uri?: string;
    title?: string;
    sport?: string;
  };
  AnalysisResult: { analysisId: string };
};

type VideoReviewScreenProps = {
  navigation: NativeStackNavigationProp<
    VideoReviewStackParamList,
    "VideoReview"
  >;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface VideoItemProps {
  id: string;
  title: string;
  date: string;
  duration: string;
  sport: string;
  thumbnail?: string;
  isAnalyzed: boolean;
  isAnalyzing: boolean;
  onPress: () => void;
  onAnalyze: () => void;
  onViewAnalysis: () => void;
}

function VideoItem({
  title,
  date,
  duration,
  sport,
  isAnalyzed,
  isAnalyzing,
  onPress,
  onAnalyze,
  onViewAnalysis,
}: VideoItemProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.98, { damping: 15 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15 });
      }}
      style={[
        styles.videoItem,
        { backgroundColor: theme.backgroundDefault },
        animatedStyle,
      ]}
    >
      <View
        style={[
          styles.videoThumbnail,
          { backgroundColor: theme.backgroundSecondary },
        ]}
      >
        <Feather name="play" size={24} color={theme.primary} />
        <View
          style={[styles.durationBadge, { backgroundColor: "rgba(0,0,0,0.7)" }]}
        >
          <ThemedText type="small" style={styles.durationText}>
            {duration}
          </ThemedText>
        </View>
      </View>
      <View style={styles.videoInfo}>
        <ThemedText type="body" style={styles.videoTitle} numberOfLines={1}>
          {title}
        </ThemedText>
        <ThemedText
          type="small"
          style={[styles.videoMeta, { color: theme.textSecondary }]}
        >
          {sport} - {date}
        </ThemedText>
        <View style={styles.statusRow}>
          {isAnalyzing ? (
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: theme.primary + "20" },
              ]}
            >
              <ActivityIndicator
                size="small"
                color={theme.primary}
                style={{ marginRight: 4 }}
              />
              <ThemedText
                type="small"
                style={[styles.statusText, { color: theme.primary }]}
              >
                Analyzing...
              </ThemedText>
            </View>
          ) : isAnalyzed ? (
            <Pressable
              onPress={onViewAnalysis}
              style={[
                styles.statusBadge,
                { backgroundColor: theme.success + "20" },
              ]}
            >
              <Feather name="check-circle" size={12} color={theme.success} />
              <ThemedText
                type="small"
                style={[styles.statusText, { color: theme.success }]}
              >
                View Analysis
              </ThemedText>
            </Pressable>
          ) : (
            <Pressable
              onPress={onAnalyze}
              style={[styles.analyzeButton, { backgroundColor: theme.primary }]}
            >
              <Feather name="cpu" size={12} color="#FFFFFF" />
              <ThemedText type="small" style={styles.analyzeButtonText}>
                Analyze
              </ThemedText>
            </Pressable>
          )}
        </View>
      </View>
      <Pressable
        style={({ pressed }) => [
          styles.menuButton,
          { opacity: pressed ? 0.5 : 1 },
        ]}
        hitSlop={8}
      >
        <Feather name="more-vertical" size={20} color={theme.textSecondary} />
      </Pressable>
    </AnimatedPressable>
  );
}

type FilterType = "all" | "analyzed" | "pending";

interface VideoDisplayItem {
  id: string;
  uri?: string;
  title: string;
  date: string;
  duration: string;
  sport: string;
  isAnalyzed: boolean;
}

const SAMPLE_VIDEOS: VideoDisplayItem[] = [
  {
    id: "sample_1",
    title: "Morning Practice Session",
    date: "Today",
    duration: "2:34",
    sport: "Basketball",
    isAnalyzed: true,
  },
  {
    id: "sample_2",
    title: "Swing Analysis Recording",
    date: "Yesterday",
    duration: "1:45",
    sport: "Golf",
    isAnalyzed: true,
  },
  {
    id: "sample_3",
    title: "Pitching Practice",
    date: "Dec 28",
    duration: "3:12",
    sport: "Softball",
    isAnalyzed: false,
  },
];

export default function VideoReviewScreen({
  navigation,
}: VideoReviewScreenProps) {
  const { theme } = useTheme();
  const { paddingTop, paddingBottom } = useScreenInsets();
  const [filter, setFilter] = useState<FilterType>("all");
  const [analyzingIds, setAnalyzingIds] = useState<Set<string>>(new Set());
  const { videos, markAsAnalyzed } = useVideos();

  const recordedVideos: VideoDisplayItem[] = videos.map((v) => ({
    id: v.id,
    uri: v.uri,
    title: v.title,
    date: v.date,
    duration: v.duration,
    sport: v.sport,
    isAnalyzed: v.isAnalyzed,
  }));

  const allVideos = recordedVideos.length > 0 ? recordedVideos : SAMPLE_VIDEOS;

  const filteredVideos = allVideos.filter((video) => {
    if (filter === "all") return true;
    if (filter === "analyzed") return video.isAnalyzed;
    if (filter === "pending") return !video.isAnalyzed;
    return true;
  });

  const parseDuration = (durationStr: string): number => {
    const parts = durationStr.split(":").map(Number);
    if (parts.length === 2) {
      return (parts[0] * 60 + parts[1]) * 1000;
    }
    return 60000;
  };

  const showAlert = (
    title: string,
    message: string,
    buttons?: { text: string; onPress?: () => void }[],
  ) => {
    if (Platform.OS === "web") {
      if (buttons && buttons.length > 1) {
        const confirmed = window.confirm(
          `${title}\n\n${message}\n\nClick OK to ${buttons[1].text}`,
        );
        if (confirmed && buttons[1].onPress) {
          buttons[1].onPress();
        }
      } else {
        window.alert(`${title}\n\n${message}`);
      }
    } else {
      Alert.alert(title, message, buttons);
    }
  };

  const handleAnalyze = async (video: VideoDisplayItem) => {
    if (Platform.OS === "web") {
      showAlert(
        "Feature Unavailable",
        "Video analysis requires Expo Go on a mobile device. Please scan the QR code to test this feature.",
      );
      return;
    }

    const hasKey = await hasApiKey();
    if (!hasKey) {
      showAlert(
        "API Key Required",
        "Please configure your OpenAI API key in Settings to use video analysis.",
        [
          { text: "Cancel" },
          {
            text: "Go to Settings",
            onPress: () => {
              navigation
                .getParent()
                ?.navigate("ProfileTab", { screen: "Settings" });
            },
          },
        ],
      );
      return;
    }

    if (!video.uri) {
      showAlert("Error", "Video file not found");
      return;
    }

    setAnalyzingIds((prev) => new Set(prev).add(video.id));

    try {
      const durationMs = parseDuration(video.duration);
      const frames = await extractFrames(video.uri, durationMs);

      if (frames.length === 0) {
        throw new Error("Could not extract frames from video");
      }

      const result = await analyzeVideo(frames, video.sport);
      markAsAnalyzed(video.id, result);

      showAlert(
        "Analysis Complete",
        `Your ${video.sport} form scored ${result.overallScore}/100. Tap "View Analysis" to see detailed feedback.`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Analysis failed";
      showAlert("Analysis Failed", message);
    } finally {
      setAnalyzingIds((prev) => {
        const next = new Set(prev);
        next.delete(video.id);
        return next;
      });
    }
  };

  const handleViewAnalysis = (videoId: string) => {
    navigation.navigate("AnalysisResult", { analysisId: videoId, videoId });
  };

  const FilterButton = ({
    type,
    label,
  }: {
    type: FilterType;
    label: string;
  }) => (
    <Pressable
      onPress={() => setFilter(type)}
      style={[
        styles.filterButton,
        {
          backgroundColor:
            filter === type ? theme.primary : theme.backgroundSecondary,
        },
      ]}
    >
      <ThemedText
        type="small"
        style={[
          styles.filterText,
          { color: filter === type ? "#FFFFFF" : theme.text },
        ]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.header, { paddingTop: paddingTop + Spacing.md }]}>
        <ThemedText type="h3">My Videos</ThemedText>
        <Spacer height={Spacing.md} />
        <View style={styles.filterRow}>
          <FilterButton type="all" label="All" />
          <FilterButton type="analyzed" label="Analyzed" />
          <FilterButton type="pending" label="Pending" />
        </View>
      </View>

      <FlatList
        data={filteredVideos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: paddingBottom + Spacing.xl },
        ]}
        renderItem={({ item }) => (
          <VideoItem
            {...item}
            isAnalyzing={analyzingIds.has(item.id)}
            onPress={() => {
              navigation.navigate("VideoPlayback", {
                videoId: item.id,
                uri: item.uri,
                title: item.title,
                sport: item.sport,
              });
            }}
            onAnalyze={() => handleAnalyze(item)}
            onViewAnalysis={() => handleViewAnalysis(item.id)}
          />
        )}
        ItemSeparatorComponent={() => <Spacer height={Spacing.md} />}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Feather name="video" size={48} color={theme.textSecondary} />
            <Spacer height={Spacing.md} />
            <ThemedText
              type="body"
              style={{ color: theme.textSecondary, textAlign: "center" }}
            >
              No videos yet
            </ThemedText>
            <Spacer height={Spacing.sm} />
            <ThemedText
              type="small"
              style={{ color: theme.textSecondary, textAlign: "center" }}
            >
              Tap the record button to capture your first training session
            </ThemedText>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  filterRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  filterButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  filterText: {
    fontWeight: "500",
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  videoItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  videoThumbnail: {
    width: 80,
    height: 60,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  durationBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: "#FFFFFF",
    fontSize: 10,
  },
  videoInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  videoTitle: {
    fontWeight: "600",
    marginBottom: 2,
  },
  videoMeta: {
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: "row",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "500",
  },
  analyzeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  analyzeButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
  menuButton: {
    padding: Spacing.sm,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["4xl"],
  },
});
