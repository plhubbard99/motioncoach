import React, { useState } from "react";
import { StyleSheet, View, Pressable, ScrollView, Modal } from "react-native";
import { Feather } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Image } from "expo-image";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import Spacer from "@/components/Spacer";
import type { HomeStackParamList } from "@/navigation/HomeStackNavigator";
import { useVideos } from "@/contexts/VideoContext";
import { useSport } from "@/contexts/SportContext";

const defaultAthleteImage = require("@/assets/images/female_athlete_neutral_stance.png");
const basketballAthleteImage = require("@/assets/images/dual_male_female_basketball_pose.png");
const baseballAthleteImage = require("@/assets/images/male_baseball_pitching_pose.png");
const bowlingAthleteImage = require("@/assets/images/dual_bowling_stance_pose.png");
const cheerDanceAthleteImage = require("@/assets/images/female_cheer_dance_pose.png");
const crossCountryAthleteImage = require("@/assets/images/dual_cross_country_running_pose.png");
const fencingAthleteImage = require("@/assets/images/dual_fencing_lunge_pose.png");
const footballAthleteImage = require("@/assets/images/male_football_throwing_pose.png");
const golfAthleteImage = require("@/assets/images/dual_male_female_golf_swing.png");
const iceHockeyAthleteImage = require("@/assets/images/dual_ice_hockey_skating_pose.png");
const indoorTrackAthleteImage = require("@/assets/images/dual_indoor_track_sprint_pose.png");
const lacrosseAthleteImage = require("@/assets/images/dual_lacrosse_action_pose.png");
const outdoorTrackAthleteImage = require("@/assets/images/dual_outdoor_track_field_pose.png");
const rugbyAthleteImage = require("@/assets/images/dual_rugby_running_pose.png");
const skiingAthleteImage = require("@/assets/images/dual_skiing_snowboarding_pose.png");
const soccerAthleteImage = require("@/assets/images/dual_male_female_soccer_kick.png");
const softballAthleteImage = require("@/assets/images/female_softball_pitching_pose.png");
const swimmingAthleteImage = require("@/assets/images/dual_swimming_diving_pose.png");
const tennisAthleteImage = require("@/assets/images/dual_male_female_tennis_serve.png");
const volleyballAthleteImage = require("@/assets/images/female_volleyball_spike_pose.png");
const wrestlingAthleteImage = require("@/assets/images/male_wrestling_stance_pose.png");

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<HomeStackParamList, "Home">;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SPORT_IMAGES: Record<string, any> = {
  default: defaultAthleteImage,
  Basketball: basketballAthleteImage,
  Baseball: baseballAthleteImage,
  Bowling: bowlingAthleteImage,
  "Cheer & Dance": cheerDanceAthleteImage,
  "Cross Country": crossCountryAthleteImage,
  Fencing: fencingAthleteImage,
  Football: footballAthleteImage,
  Golf: golfAthleteImage,
  "Ice Hockey": iceHockeyAthleteImage,
  "Indoor Track & Field": indoorTrackAthleteImage,
  Lacrosse: lacrosseAthleteImage,
  "Outdoor Track & Field": outdoorTrackAthleteImage,
  Rugby: rugbyAthleteImage,
  "Skiing / Snowboarding": skiingAthleteImage,
  Soccer: soccerAthleteImage,
  Softball: softballAthleteImage,
  "Swimming & Diving": swimmingAthleteImage,
  Tennis: tennisAthleteImage,
  Volleyball: volleyballAthleteImage,
  Wrestling: wrestlingAthleteImage,
};

const SPORTS = [
  { id: "basketball", name: "Basketball", icon: "circle" },
  { id: "baseball", name: "Baseball", icon: "circle" },
  { id: "bowling", name: "Bowling", icon: "disc" },
  { id: "cheer-dance", name: "Cheer & Dance", icon: "star" },
  { id: "cross-country", name: "Cross Country", icon: "map" },
  { id: "fencing", name: "Fencing", icon: "zap" },
  { id: "football", name: "Football", icon: "target" },
  { id: "golf", name: "Golf", icon: "flag" },
  { id: "ice-hockey", name: "Ice Hockey", icon: "hexagon" },
  { id: "indoor-track", name: "Indoor Track & Field", icon: "activity" },
  { id: "lacrosse", name: "Lacrosse", icon: "crosshair" },
  { id: "outdoor-track", name: "Outdoor Track & Field", icon: "sun" },
  { id: "rugby", name: "Rugby", icon: "shield" },
  { id: "skiing", name: "Skiing / Snowboarding", icon: "navigation" },
  { id: "soccer", name: "Soccer", icon: "circle" },
  { id: "softball", name: "Softball", icon: "circle" },
  { id: "swimming", name: "Swimming & Diving", icon: "droplet" },
  { id: "tennis", name: "Tennis", icon: "disc" },
  { id: "volleyball", name: "Volleyball", icon: "circle" },
  { id: "wrestling", name: "Wrestling", icon: "users" },
];

const NEXT_STEPS = [
  { id: "review", name: "Review Prior Lessons", icon: "book-open" },
  { id: "record", name: "Record Practice", icon: "video" },
];

interface DropdownProps {
  label: string;
  value: string | null;
  placeholder: string;
  onPress: () => void;
  compact?: boolean;
}

function Dropdown({ label, value, placeholder, onPress, compact }: DropdownProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const accent = (theme as any).accent || "#FFB81C";

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View>
      <ThemedText type="small" style={[styles.dropdownLabel, { color: theme.primary, fontWeight: "700" }]}>
        {label}
      </ThemedText>
      <Spacer height={Spacing.xs} />
      <AnimatedPressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.98, { damping: 15 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15 });
        }}
        style={[
          styles.dropdown,
          compact ? styles.dropdownCompact : null,
          { backgroundColor: theme.backgroundDefault, borderColor: value ? accent : theme.border, borderWidth: value ? 2 : 1 },
          animatedStyle,
        ]}
      >
        <ThemedText
          type={compact ? "small" : "body"}
          style={[
            styles.dropdownText,
            !value && { color: theme.textSecondary },
            value && { color: theme.primary, fontWeight: "600" },
          ]}
        >
          {value || placeholder}
        </ThemedText>
        <View style={[styles.dropdownIcon, { backgroundColor: accent }]}>
          <Feather name="chevron-down" size={16} color="#0A2240" />
        </View>
      </AnimatedPressable>
    </View>
  );
}

interface SelectModalProps {
  visible: boolean;
  title: string;
  options: { id: string; name: string; icon: string }[];
  onSelect: (option: { id: string; name: string }) => void;
  onClose: () => void;
}

function SelectModal({ visible, title, options, onSelect, onClose }: SelectModalProps) {
  const { theme } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={[styles.modalOverlay, { backgroundColor: theme.overlay }]} onPress={onClose}>
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={[styles.modalContent, { backgroundColor: theme.backgroundRoot }]}
        >
          <ThemedText type="h4" style={styles.modalTitle}>
            {title}
          </ThemedText>
          <Spacer height={Spacing.md} />
          <ScrollView 
            showsVerticalScrollIndicator={true}
            style={styles.modalScrollView}
            contentContainerStyle={styles.modalScrollContent}
          >
            {options.map((option) => (
              <Pressable
                key={option.id}
                onPress={() => {
                  onSelect(option);
                  onClose();
                }}
                style={({ pressed }) => [
                  styles.modalOption,
                  { backgroundColor: pressed ? theme.backgroundSecondary : "transparent" },
                ]}
              >
                <View style={[styles.optionIcon, { backgroundColor: theme.primary + "20" }]}>
                  <Feather name={option.icon as any} size={20} color={theme.primary} />
                </View>
                <ThemedText type="body" style={styles.optionText}>
                  {option.name}
                </ThemedText>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

interface AthleteDisplayProps {
  selectedSport: string | null;
  onPersonalize?: () => void;
}

function AthleteDisplay({ selectedSport, onPersonalize }: AthleteDisplayProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  
  const imageSource = selectedSport ? SPORT_IMAGES[selectedSport] || SPORT_IMAGES.default : SPORT_IMAGES.default;
  const sportLabel = selectedSport || "Ready to Train";

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.athleteDisplayContainer, animatedStyle]}>
      <View style={styles.athleteCardContainer}>
        <View style={[styles.athleteCardBackground, { backgroundColor: theme.primary }]}>
          <View style={[styles.athleteGoldStripe, { backgroundColor: (theme as any).accent || "#FFB81C" }]} />
        </View>
        <View style={[styles.athleteImageWrapper, { borderColor: (theme as any).accent || "#FFB81C", borderWidth: 3 }]}>
          <Image
            source={imageSource}
            style={styles.athleteImage}
            contentFit="cover"
            transition={300}
          />
        </View>
        <View style={[styles.sportBadge, { backgroundColor: (theme as any).accent || "#FFB81C" }]}>
          <ThemedText type="small" style={[styles.sportBadgeText, { color: theme.primary }]}>
            {sportLabel}
          </ThemedText>
        </View>
      </View>
      {onPersonalize ? (
        <Pressable
          onPress={onPersonalize}
          style={[styles.personalizeButton, { backgroundColor: (theme as any).accent || "#FFB81C" }]}
        >
          <Feather name="edit-2" size={14} color="#0A2240" />
          <ThemedText type="small" style={{ color: "#0A2240", marginLeft: Spacing.xs, fontWeight: "600" }}>
            Personalize
          </ThemedText>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

interface AnalysisCardProps {
  title: string;
  date: string;
  sport: string;
  score: number;
  onPress: () => void;
}

function AnalysisCard({ title, date, sport, score, onPress }: AnalysisCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const accent = (theme as any).accent || "#FFB81C";

  const getScoreColor = () => {
    if (score >= 80) return theme.success;
    if (score >= 60) return accent;
    return theme.warning;
  };

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
        styles.analysisCardHorizontal,
        { backgroundColor: theme.primary },
        animatedStyle,
      ]}
    >
      <View style={[styles.analysisThumbnail, { backgroundColor: accent }]}>
        <Feather name="play" size={20} color={theme.primary} />
      </View>
      <View style={styles.analysisInfo}>
        <ThemedText type="body" style={[styles.analysisTitle, { color: "#FFFFFF", fontWeight: "600" }]} numberOfLines={1}>
          {title}
        </ThemedText>
        <ThemedText type="small" style={[styles.analysisDate, { color: "rgba(255,255,255,0.7)" }]}>
          {sport} - {date}
        </ThemedText>
      </View>
      <View style={[styles.scoreContainer, { backgroundColor: getScoreColor() }]}>
        <ThemedText type="small" style={[styles.scoreText, { color: theme.primary, fontWeight: "700" }]}>
          {score}
        </ThemedText>
      </View>
    </AnimatedPressable>
  );
}

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function CollapsibleSection({ title, children, defaultOpen = false }: CollapsibleSectionProps) {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const rotation = useSharedValue(defaultOpen ? 1 : 0);
  const accent = (theme as any).accent || "#FFB81C";

  const toggleSection = () => {
    setIsOpen(!isOpen);
    rotation.value = withTiming(isOpen ? 0 : 1, { duration: 200 });
  };

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value * 180}deg` }],
  }));

  return (
    <View style={[styles.collapsibleSection, { backgroundColor: theme.backgroundDefault, borderLeftColor: accent, borderLeftWidth: 4 }]}>
      <Pressable
        onPress={toggleSection}
        style={({ pressed }) => [
          styles.collapsibleHeader,
          { opacity: pressed ? 0.8 : 1 },
        ]}
      >
        <ThemedText type="body" style={[styles.collapsibleTitle, { color: theme.primary, fontWeight: "700" }]}>
          {title}
        </ThemedText>
        <View style={[styles.collapsibleIconWrapper, { backgroundColor: isOpen ? accent : theme.backgroundSecondary }]}>
          <Animated.View style={iconStyle}>
            <Feather name="chevron-down" size={18} color={isOpen ? "#0A2240" : theme.textSecondary} />
          </Animated.View>
        </View>
      </Pressable>
      {isOpen ? <View style={styles.collapsibleContent}>{children}</View> : null}
    </View>
  );
}

interface DrillCardProps {
  title: string;
  duration: string;
  focus: string;
  concept?: string;
  onPress: () => void;
}

function DrillCard({ title, duration, focus, concept, onPress }: DrillCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const accent = (theme as any).accent || "#FFB81C";

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
        styles.drillCard,
        { backgroundColor: theme.backgroundSecondary },
        animatedStyle,
      ]}
    >
      <View style={[styles.drillIcon, { backgroundColor: accent }]}>
        <Feather name="play-circle" size={18} color="#0A2240" />
      </View>
      <View style={styles.drillInfo}>
        <ThemedText type="body" style={[styles.drillTitle, { fontWeight: "600" }]} numberOfLines={1}>
          {title}
        </ThemedText>
        <ThemedText type="small" style={[styles.drillMeta, { color: theme.textSecondary }]}>
          {duration} - {focus}
        </ThemedText>
        {concept ? (
          <View style={[styles.conceptBadge, { backgroundColor: (theme as any).accent || "#FFB81C" }]}>
            <ThemedText type="small" style={[styles.conceptText, { color: "#0A2240" }]}>
              {concept}
            </ThemedText>
          </View>
        ) : null}
      </View>
      <View style={[styles.drillArrow, { backgroundColor: theme.primary }]}>
        <Feather name="chevron-right" size={16} color="#FFFFFF" />
      </View>
    </AnimatedPressable>
  );
}

const MOCK_ANALYSES = [
  { id: "1", title: "Morning Jump Shot", date: "Today", sport: "Basketball", score: 85 },
  { id: "2", title: "Golf Swing Practice", date: "Yesterday", sport: "Golf", score: 72 },
  { id: "3", title: "Sprint Form Check", date: "Dec 28", sport: "Running", score: 68 },
  { id: "4", title: "Tennis Serve", date: "Dec 27", sport: "Tennis", score: 78 },
  { id: "5", title: "Pitching Form", date: "Dec 26", sport: "Softball", score: 81 },
];

const SUGGESTED_WORKOUT = [
  { id: "1", title: "Core Stability Series", duration: "15 min", focus: "Core Strength" },
  { id: "2", title: "Hip Mobility Flow", duration: "10 min", focus: "Flexibility" },
];

const ADDITIONAL_DRILLS_STRENGTH = [
  { id: "1", title: "Elbow Position Drill", duration: "5 min", focus: "Form" },
  { id: "2", title: "Wrist Snap Practice", duration: "8 min", focus: "Technique" },
];

const ADDITIONAL_DRILLS_ACCURACY = [
  { id: "1", title: "Target Practice Drill", duration: "10 min", focus: "Precision" },
  { id: "2", title: "Follow-Through Focus", duration: "6 min", focus: "Consistency" },
  { id: "3", title: "Release Point Training", duration: "8 min", focus: "Accuracy" },
];

const CONTINUED_TRAINING = [
  { id: "1", title: "Arm Slot Consistency", duration: "6 min", focus: "Technique", concept: "Throwing Mechanics" },
  { id: "2", title: "Lower Body Drive", duration: "10 min", focus: "Power", concept: "Throwing Mechanics" },
  { id: "3", title: "Balance Point Holds", duration: "5 min", focus: "Stability", concept: "Balance & Control" },
  { id: "4", title: "Stride Length Drills", duration: "8 min", focus: "Form", concept: "Balance & Control" },
];

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { theme } = useTheme();
  const { videos, analyses } = useVideos();
  const { selectedSport, setSelectedSport } = useSport();
  const [selectedNextStep, setSelectedNextStep] = useState<string | null>(null);
  const [showSportModal, setShowSportModal] = useState(false);
  const [showNextStepModal, setShowNextStepModal] = useState(false);

  const recentRecordings = videos.slice(0, 3).map((v) => {
    const analysis = analyses[v.id];
    return {
      id: v.id,
      title: v.title,
      date: v.date,
      sport: v.sport,
      score: analysis?.overallScore || 0,
      isAnalyzed: v.isAnalyzed,
    };
  });

  const hasVideos = recentRecordings.length > 0;

  const handleNextStepSelect = (option: { id: string; name: string }) => {
    setSelectedNextStep(option.name);
    if (option.id === "record") {
      navigation.getParent()?.navigate("RecordModal", { sport: selectedSport || "Training" });
    } else if (option.id === "review") {
      navigation.getParent()?.navigate("MainTabs", { screen: "LibraryTab" });
    }
  };

  const handleDrillPress = (drillTitle: string, focus: string) => {
    navigation.navigate("DrillDetail", {
      drillId: drillTitle.toLowerCase().replace(/\s+/g, "-"),
      title: drillTitle,
      focus,
    });
  };

  const handlePersonalizeImage = () => {
  };

  return (
    <ScreenScrollView>
      <AthleteDisplay
        selectedSport={selectedSport}
        onPersonalize={handlePersonalizeImage}
      />

      <Spacer height={Spacing.xl} />

      <Dropdown
        label="Select Your Sport"
        value={selectedSport}
        placeholder="Choose a sport to evaluate"
        onPress={() => setShowSportModal(true)}
        compact
      />

      {selectedSport ? (
        <>
          <Spacer height={Spacing.md} />
          <Dropdown
            label="Next Steps"
            value={selectedNextStep}
            placeholder="What would you like to do?"
            onPress={() => setShowNextStepModal(true)}
            compact
          />
        </>
      ) : null}

      <Spacer height={Spacing["2xl"]} />

      <View style={styles.sectionHeader}>
        <ThemedText type="h4">Recent Analysis</ThemedText>
        {hasVideos ? (
          <Pressable
            onPress={() => navigation.getParent()?.navigate("MainTabs", { screen: "LibraryTab" })}
            hitSlop={8}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <ThemedText type="link">See All</ThemedText>
          </Pressable>
        ) : null}
      </View>

      <Spacer height={Spacing.md} />

      {hasVideos ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
        >
          {recentRecordings.map((analysis, index) => (
            <React.Fragment key={analysis.id}>
              <AnalysisCard
                title={analysis.title}
                date={analysis.date}
                sport={analysis.sport}
                score={analysis.score}
                onPress={() => navigation.navigate("AnalysisResult", { analysisId: analysis.id, videoId: analysis.id })}
              />
              {index < recentRecordings.length - 1 ? <View style={{ width: Spacing.md }} /> : null}
            </React.Fragment>
          ))}
        </ScrollView>
      ) : (
        <View style={[styles.emptyState, { backgroundColor: theme.backgroundSecondary }]}>
          <Feather name="video" size={32} color={theme.textSecondary} />
          <ThemedText type="body" style={[styles.emptyStateText, { color: theme.textSecondary }]}>
            No recordings yet
          </ThemedText>
          <ThemedText type="small" style={[styles.emptyStateSubtext, { color: theme.textSecondary }]}>
            Select a sport above and record your first session
          </ThemedText>
        </View>
      )}

      <Spacer height={Spacing["2xl"]} />

      <CollapsibleSection title="Suggested Next Workout">
        {SUGGESTED_WORKOUT.map((drill) => (
          <DrillCard
            key={drill.id}
            title={drill.title}
            duration={drill.duration}
            focus={drill.focus}
            onPress={() => handleDrillPress(drill.title, drill.focus)}
          />
        ))}
      </CollapsibleSection>

      <Spacer height={Spacing.md} />

      <CollapsibleSection title="Additional Drills - Throwing (Arm Strength)">
        {ADDITIONAL_DRILLS_STRENGTH.map((drill) => (
          <DrillCard
            key={drill.id}
            title={drill.title}
            duration={drill.duration}
            focus={drill.focus}
            onPress={() => handleDrillPress(drill.title, drill.focus)}
          />
        ))}
      </CollapsibleSection>

      <Spacer height={Spacing.md} />

      <CollapsibleSection title="Additional Drills - Throwing (Accuracy)">
        {ADDITIONAL_DRILLS_ACCURACY.map((drill) => (
          <DrillCard
            key={drill.id}
            title={drill.title}
            duration={drill.duration}
            focus={drill.focus}
            onPress={() => handleDrillPress(drill.title, drill.focus)}
          />
        ))}
      </CollapsibleSection>

      <Spacer height={Spacing.md} />

      <CollapsibleSection title="Continued Training" defaultOpen>
        <ThemedText type="small" style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
          Drills grouped by concept
        </ThemedText>
        <Spacer height={Spacing.sm} />
        {CONTINUED_TRAINING.map((drill) => (
          <DrillCard
            key={drill.id}
            title={drill.title}
            duration={drill.duration}
            focus={drill.focus}
            concept={drill.concept}
            onPress={() => handleDrillPress(drill.title, drill.focus)}
          />
        ))}
      </CollapsibleSection>

      <Spacer height={Spacing["3xl"]} />

      <SelectModal
        visible={showSportModal}
        title="Select Your Sport"
        options={SPORTS}
        onSelect={(option) => setSelectedSport(option.name)}
        onClose={() => setShowSportModal(false)}
      />

      <SelectModal
        visible={showNextStepModal}
        title="Next Steps"
        options={NEXT_STEPS}
        onSelect={handleNextStepSelect}
        onClose={() => setShowNextStepModal(false)}
      />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  athleteDisplayContainer: {
    alignItems: "center",
  },
  athleteCardContainer: {
    alignItems: "center",
    position: "relative",
  },
  athleteCardBackground: {
    position: "absolute",
    top: 20,
    left: -30,
    right: -30,
    height: 180,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  athleteGoldStripe: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 8,
  },
  athleteImageWrapper: {
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    zIndex: 1,
  },
  athleteImage: {
    width: "100%",
    height: "100%",
  },
  sportBadge: {
    position: "absolute",
    bottom: -15,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    zIndex: 2,
  },
  sportBadgeText: {
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  personalizeButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing["2xl"],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  dropdownLabel: {
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  dropdownCompact: {
    padding: Spacing.md,
  },
  dropdownText: {
    flex: 1,
  },
  dropdownIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  modalContent: {
    width: "100%",
    maxWidth: 340,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    maxHeight: "80%",
  },
  modalScrollView: {
    flexGrow: 0,
  },
  modalScrollContent: {
    paddingBottom: Spacing.sm,
  },
  modalTitle: {
    textAlign: "center",
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  optionText: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  horizontalScroll: {
    paddingRight: Spacing.lg,
  },
  analysisCardHorizontal: {
    width: 260,
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  analysisThumbnail: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  analysisInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  analysisTitle: {
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  analysisDate: {},
  scoreContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreText: {
    fontWeight: "700",
    fontSize: 12,
  },
  collapsibleSection: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  collapsibleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
  },
  collapsibleTitle: {
    fontWeight: "600",
  },
  collapsibleIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  collapsibleContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  sectionSubtitle: {
    paddingHorizontal: Spacing.sm,
  },
  drillCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  drillIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  drillInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  drillTitle: {
    fontWeight: "600",
    marginBottom: 2,
  },
  drillMeta: {},
  conceptBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    marginTop: 4,
  },
  conceptText: {
    fontSize: 11,
    fontWeight: "500",
  },
  drillArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing["2xl"],
    borderRadius: BorderRadius.lg,
  },
  emptyStateText: {
    marginTop: Spacing.md,
    fontWeight: "500",
  },
  emptyStateSubtext: {
    marginTop: Spacing.xs,
    textAlign: "center",
  },
});
