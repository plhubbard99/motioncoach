import React, { useState } from "react";
import { StyleSheet, View, Pressable, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import {
  RouteProp,
  useNavigation as useRootNavigation,
  NavigationProp,
  ParamListBase,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  FadeIn,
} from "react-native-reanimated";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import Spacer from "@/components/Spacer";
import type { HomeStackParamList } from "@/navigation/HomeStackNavigator";
import { useVideos } from "@/contexts/VideoContext";
import type { BiomechanicsMetric } from "@/services/AnalysisService";
import { SkeletonOverlay } from "@/components/SkeletonOverlay";

type AnalysisResultScreenProps = {
  route: RouteProp<HomeStackParamList, "AnalysisResult">;
  navigation: NativeStackNavigationProp<HomeStackParamList, "AnalysisResult">;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface StillImageProps {
  timestamp: string;
  label: string;
  description: string;
  isKeyPoint: boolean;
  onPress: () => void;
}

function StillImage({
  timestamp,
  label,
  description,
  isKeyPoint,
  onPress,
}: StillImageProps) {
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
        styles.stillImage,
        { backgroundColor: theme.backgroundSecondary },
        isKeyPoint && { borderColor: theme.warning, borderWidth: 2 },
        animatedStyle,
      ]}
    >
      <View style={styles.stillImageContent}>
        <Feather name="image" size={24} color={theme.textSecondary} />
      </View>
      <View
        style={[styles.timestampBadge, { backgroundColor: "rgba(0,0,0,0.7)" }]}
      >
        <ThemedText type="small" style={styles.timestampText}>
          {timestamp}
        </ThemedText>
      </View>
      {isKeyPoint ? (
        <View
          style={[styles.keyPointBadge, { backgroundColor: theme.warning }]}
        >
          <Feather name="alert-circle" size={10} color="#FFFFFF" />
        </View>
      ) : null}
      <View style={styles.stillImageInfo}>
        <ThemedText
          type="small"
          style={{ fontWeight: "600" }}
          numberOfLines={1}
        >
          {label}
        </ThemedText>
        <ThemedText
          type="small"
          style={{ color: theme.textSecondary, fontSize: 11 }}
          numberOfLines={1}
        >
          {description}
        </ThemedText>
      </View>
    </AnimatedPressable>
  );
}

interface BiomechanicsCardProps {
  label: string;
  value: string;
  target: string;
  status: "good" | "warning" | "needs_work";
  focusArea?: string;
  icon: keyof typeof Feather.glyphMap;
}

function BiomechanicsCard({
  label,
  value,
  target,
  status,
  focusArea,
  icon,
}: BiomechanicsCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const getStatusColor = () => {
    switch (status) {
      case "good":
        return theme.success;
      case "warning":
        return "#FFB800";
      case "needs_work":
        return theme.warning;
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case "good":
        return "Excellent";
      case "warning":
        return "Needs Focus";
      case "needs_work":
        return "Priority Area";
    }
  };

  const statusColor = getStatusColor();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPressIn={() => {
        scale.value = withSpring(0.98, { damping: 15 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15 });
      }}
      style={[
        styles.biomechanicsCard,
        { backgroundColor: theme.backgroundDefault },
        animatedStyle,
      ]}
    >
      <View style={styles.biomechanicsHeader}>
        <View
          style={[
            styles.biomechanicsIcon,
            { backgroundColor: statusColor + "20" },
          ]}
        >
          <Feather name={icon} size={18} color={statusColor} />
        </View>
        <View style={styles.biomechanicsHeaderText}>
          <ThemedText type="body" style={styles.biomechanicsLabel}>
            {label}
          </ThemedText>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusColor + "20" },
            ]}
          >
            <ThemedText
              type="small"
              style={[styles.statusText, { color: statusColor }]}
            >
              {getStatusLabel()}
            </ThemedText>
          </View>
        </View>
      </View>
      <View style={styles.biomechanicsValues}>
        <View style={styles.valueColumn}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Current
          </ThemedText>
          <ThemedText type="h4" style={{ color: statusColor }}>
            {value}
          </ThemedText>
        </View>
        <View style={styles.valueColumn}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Target
          </ThemedText>
          <ThemedText type="h4">{target}</ThemedText>
        </View>
      </View>
      {focusArea ? (
        <View
          style={[styles.focusAreaContainer, { borderTopColor: theme.border }]}
        >
          <Feather name="target" size={12} color={statusColor} />
          <ThemedText
            type="small"
            style={{ color: theme.textSecondary, marginLeft: Spacing.xs }}
          >
            {focusArea}
          </ThemedText>
        </View>
      ) : null}
    </AnimatedPressable>
  );
}

interface InjuryAlertProps {
  bodyPart: string;
  riskLevel: "high" | "moderate" | "low";
  issue: string;
  prevention: string;
}

function InjuryAlert({
  bodyPart,
  riskLevel,
  issue,
  prevention,
}: InjuryAlertProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const getRiskColor = () => {
    switch (riskLevel) {
      case "high":
        return "#FF4444";
      case "moderate":
        return "#FFB800";
      case "low":
        return theme.success;
    }
  };

  const getRiskIcon = (): keyof typeof Feather.glyphMap => {
    switch (riskLevel) {
      case "high":
        return "alert-triangle";
      case "moderate":
        return "alert-circle";
      case "low":
        return "check-circle";
    }
  };

  const riskColor = getRiskColor();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.injuryAlertCard,
        {
          backgroundColor: theme.backgroundDefault,
          borderLeftColor: riskColor,
        },
        animatedStyle,
      ]}
    >
      <View style={styles.injuryAlertHeader}>
        <View
          style={[
            styles.injuryAlertIcon,
            { backgroundColor: riskColor + "20" },
          ]}
        >
          <Feather name={getRiskIcon()} size={18} color={riskColor} />
        </View>
        <View style={styles.injuryAlertHeaderText}>
          <ThemedText type="body" style={{ fontWeight: "600" }}>
            {bodyPart}
          </ThemedText>
          <View
            style={[styles.riskBadge, { backgroundColor: riskColor + "20" }]}
          >
            <ThemedText
              type="small"
              style={{
                color: riskColor,
                fontWeight: "600",
                textTransform: "uppercase",
              }}
            >
              {riskLevel} Risk
            </ThemedText>
          </View>
        </View>
      </View>
      <View style={styles.injuryAlertContent}>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          {issue}
        </ThemedText>
        <View
          style={[
            styles.preventionTip,
            { backgroundColor: theme.success + "10" },
          ]}
        >
          <Feather name="shield" size={14} color={theme.success} />
          <ThemedText
            type="small"
            style={{ color: theme.success, marginLeft: Spacing.xs, flex: 1 }}
          >
            {prevention}
          </ThemedText>
        </View>
      </View>
    </Animated.View>
  );
}

interface FeedbackCardProps {
  title: string;
  shortDescription: string;
  fullDescription: string;
  priority: "high" | "medium" | "low";
  expanded: boolean;
  linkedDrill?: {
    name: string;
    duration: string;
  };
  onToggle: () => void;
  onDrillPress?: () => void;
}

function FeedbackCard({
  title,
  shortDescription,
  fullDescription,
  priority,
  expanded,
  linkedDrill,
  onToggle,
  onDrillPress,
}: FeedbackCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const rotation = useSharedValue(expanded ? 1 : 0);

  const getPriorityColor = () => {
    switch (priority) {
      case "high":
        return theme.warning;
      case "medium":
        return "#FFB800";
      case "low":
        return theme.success;
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value * 180}deg` }],
  }));

  const handleToggle = () => {
    rotation.value = withTiming(expanded ? 0 : 1, { duration: 200 });
    onToggle();
  };

  return (
    <AnimatedPressable
      onPress={handleToggle}
      onPressIn={() => {
        scale.value = withSpring(0.98, { damping: 15 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15 });
      }}
      style={[
        styles.feedbackCard,
        { backgroundColor: theme.backgroundDefault },
        animatedStyle,
      ]}
    >
      <View style={styles.feedbackHeader}>
        <View
          style={[styles.priorityDot, { backgroundColor: getPriorityColor() }]}
        />
        <View style={styles.feedbackTitleContainer}>
          <ThemedText type="body" style={styles.feedbackTitle}>
            {title}
          </ThemedText>
          {!expanded ? (
            <ThemedText
              type="small"
              style={{ color: theme.textSecondary }}
              numberOfLines={1}
            >
              {shortDescription}
            </ThemedText>
          ) : null}
        </View>
        <Animated.View style={iconStyle}>
          <Feather name="chevron-down" size={20} color={theme.textSecondary} />
        </Animated.View>
      </View>
      {expanded ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          style={styles.feedbackContent}
        >
          <ThemedText
            type="small"
            style={{ color: theme.textSecondary, lineHeight: 20 }}
          >
            {fullDescription}
          </ThemedText>
          {linkedDrill ? (
            <Pressable
              onPress={onDrillPress}
              style={[
                styles.linkedDrill,
                { backgroundColor: theme.primary + "10" },
              ]}
            >
              <View
                style={[
                  styles.linkedDrillIcon,
                  { backgroundColor: theme.primary + "20" },
                ]}
              >
                <Feather name="play-circle" size={16} color={theme.primary} />
              </View>
              <View style={styles.linkedDrillInfo}>
                <ThemedText
                  type="small"
                  style={{ fontWeight: "600", color: theme.primary }}
                >
                  {linkedDrill.name}
                </ThemedText>
                <ThemedText
                  type="small"
                  style={{ color: theme.textSecondary, fontSize: 11 }}
                >
                  {linkedDrill.duration} - Recommended Drill
                </ThemedText>
              </View>
              <Feather name="arrow-right" size={16} color={theme.primary} />
            </Pressable>
          ) : null}
        </Animated.View>
      ) : null}
    </AnimatedPressable>
  );
}

const PLAYBACK_SPEEDS = ["1x", "0.5x", "0.25x"];

const MOCK_STILL_IMAGES = [
  {
    id: "1",
    timestamp: "0:02",
    label: "Setup Position",
    description: "Initial stance",
    isKeyPoint: false,
  },
  {
    id: "2",
    timestamp: "0:05",
    label: "Load Phase",
    description: "Weight transfer",
    isKeyPoint: true,
  },
  {
    id: "3",
    timestamp: "0:08",
    label: "Release Point",
    description: "Arm extension",
    isKeyPoint: true,
  },
  {
    id: "4",
    timestamp: "0:11",
    label: "Follow Through",
    description: "Completion",
    isKeyPoint: false,
  },
];

const MOCK_BIOMECHANICS = [
  {
    label: "Hip Angle",
    value: "42°",
    target: "45°",
    status: "good" as const,
    icon: "activity" as const,
    focusArea: null,
  },
  {
    label: "Knee Flexion",
    value: "85°",
    target: "90°",
    status: "warning" as const,
    icon: "maximize-2" as const,
    focusArea: "Lower body strength needed",
  },
  {
    label: "Shoulder Alignment",
    value: "12°",
    target: "0°",
    status: "needs_work" as const,
    icon: "align-center" as const,
    focusArea: "Priority exposure area",
  },
  {
    label: "Follow Through",
    value: "78%",
    target: "85%",
    status: "warning" as const,
    icon: "trending-up" as const,
    focusArea: "Weakness in completion",
  },
];

const MOCK_FEEDBACK = [
  {
    id: "1",
    title: "Improve Shoulder Alignment",
    shortDescription: "12 degrees off-center during release",
    fullDescription:
      "Your shoulders are rotating 12 degrees off-center during the release phase. This is causing inconsistency in your aim and reducing power transfer. Focus on keeping your shoulders square to the target throughout the motion. Practice in front of a mirror to build muscle memory for proper alignment.",
    priority: "high" as const,
    linkedDrill: { name: "Mirror Alignment Drill", duration: "5 min" },
  },
  {
    id: "2",
    title: "Deepen Knee Flexion",
    shortDescription: "5 degrees short of optimal bend",
    fullDescription:
      "Increasing your knee bend by 5 degrees will significantly improve power transfer from your lower body. This is especially important for generating force in explosive movements. Practice the 'Deep Squat Hold' exercise to build flexibility and strength in this range.",
    priority: "medium" as const,
    linkedDrill: { name: "Deep Squat Hold", duration: "8 min" },
  },
  {
    id: "3",
    title: "Excellent Hip Rotation",
    shortDescription: "Nearly perfect angle at 42 degrees",
    fullDescription:
      "Your hip angle is nearly perfect at 42 degrees. This is generating good power and allows for efficient energy transfer through the kinetic chain. Continue to maintain this form and use it as a reference point for other movements.",
    priority: "low" as const,
    linkedDrill: null,
  },
];

const MOCK_RELATED_DRILLS = [
  {
    id: "1",
    name: "Mirror Alignment Drill",
    duration: "5 min",
    focus: "Shoulder",
    hasVideo: true,
    hasDiagram: true,
  },
  {
    id: "2",
    name: "Wall Squat Holds",
    duration: "8 min",
    focus: "Knee Flexion",
    hasVideo: true,
    hasDiagram: false,
  },
  {
    id: "3",
    name: "Resistance Band Rotation",
    duration: "6 min",
    focus: "Hip Power",
    hasVideo: true,
    hasDiagram: true,
  },
];

export default function AnalysisResultScreen({
  route,
  navigation,
}: AnalysisResultScreenProps) {
  const { theme } = useTheme();
  const [selectedSpeed, setSelectedSpeed] = useState("1x");
  const [expandedFeedback, setExpandedFeedback] = useState<string | null>("1");
  const [selectedStillImage, setSelectedStillImage] = useState<string | null>(
    null,
  );
  const { getAnalysis, getVideo } = useVideos();

  const rootNavigation = useRootNavigation<NavigationProp<ParamListBase>>();

  const analysisId = route.params?.analysisId;
  const videoId = route.params?.videoId;
  const analysis = analysisId ? getAnalysis(analysisId) : undefined;
  const video = videoId ? getVideo(videoId) : undefined;

  const overallScore = analysis?.overallScore ?? 76;
  const keyFrames = analysis?.keyFrames ?? MOCK_STILL_IMAGES;
  const biomechanics = analysis?.biomechanics ?? MOCK_BIOMECHANICS;
  const feedback = analysis?.feedback ?? MOCK_FEEDBACK;
  const recommendedDrills =
    analysis?.recommendedDrills?.map((d, i) => ({
      ...d,
      hasVideo: true,
      hasDiagram: i % 2 === 0,
    })) ?? MOCK_RELATED_DRILLS;

  const injuryAlerts = analysis?.injuryAlerts ?? [];
  const hasInjuryRisks =
    injuryAlerts.length > 0 &&
    injuryAlerts.some(
      (alert) => alert.riskLevel === "high" || alert.riskLevel === "moderate",
    );

  const handleVideoPress = () => {
    if (video?.uri) {
      rootNavigation.navigate("VideoPlayback", {
        videoId: video.id,
        uri: video.uri,
        title: video.title,
        sport: video.sport,
      });
    }
  };

  const handleDrillPress = (
    drillId: string,
    drillName: string,
    focus?: string,
  ) => {
    navigation.navigate("DrillDetail", {
      drillId,
      title: drillName,
      focus,
    });
  };

  const getScoreColor = () => {
    if (overallScore >= 80) return theme.success;
    if (overallScore >= 60) return "#FFB800";
    return theme.warning;
  };

  return (
    <ScreenScrollView>
      <Pressable
        onPress={handleVideoPress}
        style={({ pressed }) => [
          styles.videoContainer,
          { backgroundColor: theme.backgroundSecondary },
          pressed && { opacity: 0.8 },
        ]}
      >
        <View style={styles.videoPlaceholder}>
          <Feather name="play-circle" size={48} color={theme.primary} />
          {video?.uri ? (
            <ThemedText
              type="small"
              style={{ color: theme.textSecondary, marginTop: Spacing.sm }}
            >
              Tap to play video
            </ThemedText>
          ) : (
            <ThemedText
              type="small"
              style={{ color: theme.textSecondary, marginTop: Spacing.sm }}
            >
              Video unavailable
            </ThemedText>
          )}
        </View>
        <View style={styles.videoOverlay}>
          <View
            style={[
              styles.scoreOverlay,
              { backgroundColor: getScoreColor() + "E6" },
            ]}
          >
            <ThemedText type="h3" style={styles.scoreText}>
              {overallScore}
            </ThemedText>
          </View>
        </View>
      </Pressable>

      <Spacer height={Spacing.md} />

      <View style={styles.playbackControls}>
        <View style={styles.scrubber}>
          <View
            style={[
              styles.scrubberProgress,
              { backgroundColor: theme.primary },
            ]}
          />
          <View
            style={[styles.scrubberThumb, { backgroundColor: theme.primary }]}
          />
        </View>
        <View style={styles.speedControls}>
          {PLAYBACK_SPEEDS.map((speed) => (
            <Pressable
              key={speed}
              onPress={() => setSelectedSpeed(speed)}
              style={[
                styles.speedButton,
                {
                  backgroundColor:
                    selectedSpeed === speed
                      ? theme.primary
                      : theme.backgroundDefault,
                },
              ]}
            >
              <ThemedText
                type="small"
                style={[
                  styles.speedButtonText,
                  { color: selectedSpeed === speed ? "#FFFFFF" : theme.text },
                ]}
              >
                {speed}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </View>

      <Spacer height={Spacing["2xl"]} />

      <ThemedText type="h4">Form Analysis</ThemedText>
      <ThemedText
        type="small"
        style={{ color: theme.textSecondary, marginTop: Spacing.xs }}
      >
        Body position visualization with areas of focus
      </ThemedText>
      <Spacer height={Spacing.md} />

      <View
        style={[
          styles.skeletonContainer,
          { backgroundColor: theme.backgroundDefault },
        ]}
      >
        <SkeletonOverlay
          width={180}
          height={250}
          biomechanics={biomechanics as BiomechanicsMetric[]}
          sport={route.params?.sport}
        />
        <View style={styles.skeletonLegend}>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendDot, { backgroundColor: theme.success }]}
            />
            <ThemedText type="small">Excellent Form</ThemedText>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#FFB800" }]} />
            <ThemedText type="small">Needs Focus</ThemedText>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#FF4444" }]} />
            <ThemedText type="small">Priority Area</ThemedText>
          </View>
        </View>
      </View>

      <Spacer height={Spacing["2xl"]} />

      {hasInjuryRisks ? (
        <>
          <View
            style={[
              styles.injurySectionHeader,
              { backgroundColor: "#FF444410" },
            ]}
          >
            <Feather name="alert-triangle" size={20} color="#FF4444" />
            <ThemedText type="h4" style={{ marginLeft: Spacing.sm }}>
              Injury Prevention Alerts
            </ThemedText>
          </View>
          <ThemedText
            type="small"
            style={{ color: theme.textSecondary, marginTop: Spacing.xs }}
          >
            Form patterns that may increase injury risk
          </ThemedText>
          <Spacer height={Spacing.md} />

          {injuryAlerts
            .filter((a) => a.riskLevel !== "low")
            .map((alert) => (
              <React.Fragment key={alert.id}>
                <InjuryAlert
                  bodyPart={alert.bodyPart}
                  riskLevel={alert.riskLevel}
                  issue={alert.issue}
                  prevention={alert.prevention}
                />
                <Spacer height={Spacing.sm} />
              </React.Fragment>
            ))}

          <Spacer height={Spacing["2xl"]} />
        </>
      ) : null}

      <View style={styles.sectionHeader}>
        <ThemedText type="h4">Key Frames</ThemedText>
        <View style={styles.keyPointLegend}>
          <View
            style={[styles.keyPointIndicator, { borderColor: theme.warning }]}
          />
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Focus Area
          </ThemedText>
        </View>
      </View>
      <Spacer height={Spacing.md} />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.stillImagesScroll}
      >
        {keyFrames.map((image) => (
          <StillImage
            key={image.id}
            timestamp={image.timestamp}
            label={image.label}
            description={image.description}
            isKeyPoint={image.isKeyPoint || selectedStillImage === image.id}
            onPress={() => setSelectedStillImage(image.id)}
          />
        ))}
      </ScrollView>

      <Spacer height={Spacing["2xl"]} />

      <ThemedText type="h4">Biomechanics Analysis</ThemedText>
      <ThemedText
        type="small"
        style={{ color: theme.textSecondary, marginTop: Spacing.xs }}
      >
        Areas of exposure, weakness, and focus
      </ThemedText>
      <Spacer height={Spacing.md} />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.biomechanicsScroll}
      >
        {biomechanics.map((item, index) => (
          <BiomechanicsCard
            key={index}
            label={item.label}
            value={item.value}
            target={item.target}
            status={item.status}
            focusArea={item.focusArea || undefined}
            icon={item.icon as keyof typeof Feather.glyphMap}
          />
        ))}
      </ScrollView>

      <Spacer height={Spacing["2xl"]} />

      <ThemedText type="h4">Coaching Feedback</ThemedText>
      <ThemedText
        type="small"
        style={{ color: theme.textSecondary, marginTop: Spacing.xs }}
      >
        Tap to expand for details and linked drills
      </ThemedText>
      <Spacer height={Spacing.md} />

      {feedback.map((item) => (
        <React.Fragment key={item.id}>
          <FeedbackCard
            title={item.title}
            shortDescription={item.shortDescription}
            fullDescription={item.fullDescription}
            priority={item.priority}
            expanded={expandedFeedback === item.id}
            linkedDrill={item.linkedDrill || undefined}
            onToggle={() =>
              setExpandedFeedback(expandedFeedback === item.id ? null : item.id)
            }
            onDrillPress={() => {
              if (item.linkedDrill) {
                handleDrillPress(
                  `drill-${item.id}`,
                  item.linkedDrill.name,
                  item.title,
                );
              }
            }}
          />
          <Spacer height={Spacing.sm} />
        </React.Fragment>
      ))}

      <Spacer height={Spacing["2xl"]} />

      <ThemedText type="h4">Recommended Drills</ThemedText>
      <ThemedText
        type="small"
        style={{ color: theme.textSecondary, marginTop: Spacing.xs }}
      >
        Based on your analysis, with videos and diagrams
      </ThemedText>
      <Spacer height={Spacing.md} />

      {recommendedDrills.map((drill) => (
        <React.Fragment key={drill.id}>
          <Pressable
            onPress={() => handleDrillPress(drill.id, drill.name, drill.focus)}
            style={({ pressed }) => [
              styles.relatedDrill,
              { backgroundColor: theme.backgroundDefault },
              pressed && { opacity: 0.7 },
            ]}
          >
            <View
              style={[
                styles.drillThumbnail,
                { backgroundColor: theme.backgroundSecondary },
              ]}
            >
              <Feather name="play-circle" size={20} color={theme.primary} />
            </View>
            <View style={styles.drillInfo}>
              <ThemedText type="body" style={{ fontWeight: "600" }}>
                {drill.name}
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {drill.duration} - {drill.focus}
              </ThemedText>
              <View style={styles.drillBadges}>
                {drill.hasVideo ? (
                  <View
                    style={[
                      styles.drillBadge,
                      { backgroundColor: theme.primary + "15" },
                    ]}
                  >
                    <Feather name="video" size={10} color={theme.primary} />
                    <ThemedText
                      type="small"
                      style={[styles.badgeText, { color: theme.primary }]}
                    >
                      Video
                    </ThemedText>
                  </View>
                ) : null}
                {drill.hasDiagram ? (
                  <View
                    style={[
                      styles.drillBadge,
                      { backgroundColor: theme.success + "15" },
                    ]}
                  >
                    <Feather name="image" size={10} color={theme.success} />
                    <ThemedText
                      type="small"
                      style={[styles.badgeText, { color: theme.success }]}
                    >
                      Diagram
                    </ThemedText>
                  </View>
                ) : null}
              </View>
            </View>
            <Feather
              name="chevron-right"
              size={20}
              color={theme.textSecondary}
            />
          </Pressable>
          <Spacer height={Spacing.sm} />
        </React.Fragment>
      ))}

      <Spacer height={Spacing["4xl"]} />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  videoContainer: {
    aspectRatio: 16 / 9,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    position: "relative",
  },
  videoPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  videoOverlay: {
    position: "absolute",
    top: Spacing.md,
    right: Spacing.md,
  },
  scoreOverlay: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  playbackControls: {
    gap: Spacing.md,
  },
  scrubber: {
    height: 4,
    backgroundColor: "rgba(0,0,0,0.1)",
    borderRadius: 2,
    position: "relative",
  },
  scrubberProgress: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: "30%",
    borderRadius: 2,
  },
  scrubberThumb: {
    position: "absolute",
    left: "30%",
    top: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: -6,
  },
  speedControls: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  speedButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
  },
  speedButtonText: {
    fontWeight: "500",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  keyPointLegend: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  keyPointIndicator: {
    width: 12,
    height: 12,
    borderRadius: 2,
    borderWidth: 2,
  },
  stillImagesScroll: {
    gap: Spacing.md,
    paddingRight: Spacing.xl,
  },
  stillImage: {
    width: 120,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  stillImageContent: {
    height: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  timestampBadge: {
    position: "absolute",
    top: Spacing.xs,
    left: Spacing.xs,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  timestampText: {
    color: "#FFFFFF",
    fontSize: 10,
  },
  keyPointBadge: {
    position: "absolute",
    top: Spacing.xs,
    right: Spacing.xs,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  stillImageInfo: {
    padding: Spacing.sm,
  },
  biomechanicsScroll: {
    gap: Spacing.md,
    paddingRight: Spacing.xl,
  },
  biomechanicsCard: {
    width: 180,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  biomechanicsHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  biomechanicsHeaderText: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  biomechanicsIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  biomechanicsLabel: {
    fontWeight: "500",
    fontSize: 13,
    marginBottom: 4,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "500",
  },
  biomechanicsValues: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  valueColumn: {
    alignItems: "center",
  },
  focusAreaContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  feedbackCard: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  feedbackHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: Spacing.lg,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.md,
    marginTop: 6,
  },
  feedbackTitleContainer: {
    flex: 1,
    gap: 4,
  },
  feedbackTitle: {
    fontWeight: "600",
  },
  feedbackContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    paddingTop: 0,
    gap: Spacing.md,
  },
  linkedDrill: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  linkedDrillIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  linkedDrillInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  relatedDrill: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  drillThumbnail: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  drillInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  drillBadges: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  drillBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "500",
  },
  skeletonContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  skeletonLegend: {
    gap: Spacing.md,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  injurySectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  injuryAlertCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 4,
  },
  injuryAlertHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  injuryAlertHeaderText: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  injuryAlertIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  riskBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  injuryAlertContent: {
    gap: Spacing.sm,
  },
  preventionTip: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs,
  },
});
