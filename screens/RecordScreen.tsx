import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  Pressable,
  Platform,
  Text,
  Switch,
  Linking,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import {
  useNavigation,
  useRoute,
  RouteProp,
  CommonActions,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions, CameraType } from "expo-camera";
import * as Haptics from "expo-haptics";
import { Accelerometer, AccelerometerMeasurement } from "expo-sensors";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useVideos } from "@/contexts/VideoContext";

type RootStackParamList = {
  MainTabs: undefined;
  RecordModal: { sport?: string } | undefined;
};

type RecordModalParams = {
  RecordModal: { sport?: string } | undefined;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type RecordingState = "idle" | "countdown" | "recording" | "waiting_motion";

interface BodyHighlight {
  id: string;
  name: string;
  position: { top: string; left: string };
  riskLevel: "high" | "medium" | "low";
}

const BODY_HIGHLIGHTS: BodyHighlight[] = [
  {
    id: "shoulder",
    name: "Shoulder",
    position: { top: "25%", left: "30%" },
    riskLevel: "medium",
  },
  {
    id: "elbow",
    name: "Elbow",
    position: { top: "38%", left: "22%" },
    riskLevel: "high",
  },
  {
    id: "wrist",
    name: "Wrist",
    position: { top: "48%", left: "18%" },
    riskLevel: "medium",
  },
  {
    id: "knee",
    name: "Knee",
    position: { top: "62%", left: "42%" },
    riskLevel: "high",
  },
  {
    id: "ankle",
    name: "Ankle",
    position: { top: "82%", left: "40%" },
    riskLevel: "medium",
  },
  {
    id: "hip",
    name: "Hip",
    position: { top: "52%", left: "48%" },
    riskLevel: "low",
  },
];

function InjuryHighlight({
  highlight,
  visible,
}: {
  highlight: BodyHighlight;
  visible: boolean;
}) {
  const colors = {
    high: "#FF3B30",
    medium: "#FF9500",
    low: "#FFD60A",
  };

  const color = colors[highlight.riskLevel];
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.3, { duration: 800 }),
          withTiming(1, { duration: 800 }),
        ),
        -1,
        true,
      );
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      style={[
        styles.injuryHighlight,
        {
          top: highlight.position.top as any,
          left: highlight.position.left as any,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.injuryDot,
          { backgroundColor: color, borderColor: color },
          animatedStyle,
        ]}
      />
      <View style={[styles.injuryLabel, { backgroundColor: color }]}>
        <Text style={styles.injuryLabelText}>{highlight.name}</Text>
      </View>
    </Animated.View>
  );
}

export default function RecordScreen() {
  const { theme } = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RecordModalParams, "RecordModal">>();

  const dismissModal = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "MainTabs" }],
        }),
      );
    }
  };
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const { addVideo } = useVideos();

  const selectedSport = route.params?.sport || "Training";
  const isRecordingRef = useRef(false);
  const recordingStartTimeRef = useRef<number>(0);

  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [countdown, setCountdown] = useState(3);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showGrid, setShowGrid] = useState(false);
  const [motionDetectionEnabled, setMotionDetectionEnabled] = useState(false);
  const [showInjuryPrevention, setShowInjuryPrevention] = useState(false);
  const [, setMotionDetected] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [, setIsSaving] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);

  const recordButtonScale = useSharedValue(1);
  const recordingPulse = useSharedValue(1);
  const flipButtonRotation = useSharedValue(0);

  const lastAcceleration = useRef<AccelerometerMeasurement | null>(null);
  const motionThreshold = 0.15; // Lower threshold for more sensitivity
  const [motionLevel, setMotionLevel] = useState(0);

  const handleMotionDetected = useCallback(() => {
    setMotionDetected(true);
    setRecordingState("countdown");
    setCountdown(3);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, []);

  useEffect(() => {
    let subscription: { remove: () => void } | null = null;

    if (
      recordingState === "waiting_motion" &&
      motionDetectionEnabled &&
      Platform.OS !== "web"
    ) {
      Accelerometer.setUpdateInterval(50); // Faster updates for smoother detection

      subscription = Accelerometer.addListener(
        (data: AccelerometerMeasurement) => {
          if (lastAcceleration.current) {
            const deltaX = Math.abs(data.x - lastAcceleration.current.x);
            const deltaY = Math.abs(data.y - lastAcceleration.current.y);
            const deltaZ = Math.abs(data.z - lastAcceleration.current.z);
            const totalMovement = deltaX + deltaY + deltaZ;

            // Amplify motion level for better visual feedback
            setMotionLevel(Math.min(totalMovement * 5, 1));

            if (totalMovement > motionThreshold) {
              handleMotionDetected();
            }
          }
          lastAcceleration.current = data;
        },
      );
    } else if (
      recordingState === "waiting_motion" &&
      motionDetectionEnabled &&
      Platform.OS === "web"
    ) {
      const motionTimer = setTimeout(
        () => {
          handleMotionDetected();
        },
        2000 + Math.random() * 2000,
      );
      return () => clearTimeout(motionTimer);
    }

    return () => {
      if (subscription) {
        subscription.remove();
      }
      lastAcceleration.current = null;
      setMotionLevel(0);
    };
  }, [recordingState, motionDetectionEnabled, handleMotionDetected]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (recordingState === "countdown" && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }, 1000);
    } else if (recordingState === "countdown" && countdown === 0) {
      setRecordingState("recording");
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
      startActualRecording();
    }
    return () => clearTimeout(timer);
  }, [countdown, recordingState]); // eslint-disable-line react-hooks/exhaustive-deps

  const startActualRecording = async () => {
    if (Platform.OS === "web" || !cameraRef.current) {
      isRecordingRef.current = true;
      recordingStartTimeRef.current = Date.now();
      return;
    }

    if (!isCameraReady) {
      console.log("Camera not ready, waiting...");
      return;
    }

    try {
      isRecordingRef.current = true;
      recordingStartTimeRef.current = Date.now();
      const videoResult = await cameraRef.current.recordAsync({
        maxDuration: 60,
      });

      if (videoResult && videoResult.uri) {
        const elapsedSeconds = Math.floor(
          (Date.now() - recordingStartTimeRef.current) / 1000,
        );
        const actualDuration = Math.max(elapsedSeconds, 1);
        saveRecordedVideo(videoResult.uri, actualDuration);

        isRecordingRef.current = false;
        setRecordingState("idle");
        setRecordingTime(0);
        setMotionDetected(false);
        setIsSaving(false);

        Alert.alert(
          "Video Saved",
          "Your recording has been saved. You can view it in the Video Review tab.",
          [{ text: "OK", onPress: () => dismissModal() }],
        );
      }
    } catch (error) {
      console.log("Recording error:", error);
      isRecordingRef.current = false;
      setRecordingState("idle");
      setIsSaving(false);
    }
  };

  const saveRecordedVideo = (uri: string, duration: number) => {
    const now = new Date();
    const formattedDate = now.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const mins = Math.floor(duration / 60);
    const secs = duration % 60;
    const durationStr =
      mins > 0 || secs > 0
        ? `${mins}:${secs.toString().padStart(2, "0")}`
        : "0:01";

    addVideo({
      uri,
      title: `${selectedSport} Session`,
      date: formattedDate,
      duration: durationStr,
      sport: selectedSport,
      isAnalyzed: false,
    });

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (recordingState === "recording") {
      recordingPulse.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 500 }),
          withTiming(1, { duration: 500 }),
        ),
        -1,
        true,
      );
      timer = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      recordingPulse.value = 1;
    }
    return () => clearInterval(timer);
  }, [recordingState]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let stopTimer: NodeJS.Timeout;
    if (
      recordingState === "recording" &&
      motionDetectionEnabled &&
      recordingTime > 5
    ) {
      const shouldStop = Math.random() > 0.7;
      if (shouldStop) {
        stopTimer = setTimeout(() => {
          handleStopRecording();
        }, 1000);
      }
    }
    return () => clearTimeout(stopTimer);
  }, [recordingTime, motionDetectionEnabled, recordingState]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStartRecording = () => {
    if (recordingState === "idle") {
      if (motionDetectionEnabled) {
        setRecordingState("waiting_motion");
        setMotionDetected(false);
      } else {
        setCountdown(3);
        setRecordingState("countdown");
      }
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } else if (recordingState === "recording") {
      handleStopRecording();
    } else if (recordingState === "waiting_motion") {
      setRecordingState("idle");
    }
  };

  const handleStopRecording = async () => {
    if (!isRecordingRef.current) {
      setRecordingState("idle");
      setRecordingTime(0);
      setMotionDetected(false);
      dismissModal();
      return;
    }

    setIsSaving(true);

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    if (Platform.OS !== "web" && cameraRef.current) {
      try {
        cameraRef.current.stopRecording();
      } catch {
        console.log("Stop recording error");
      }
    } else if (Platform.OS === "web") {
      const now = new Date();
      const formattedDate = now.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      const elapsedSeconds = Math.floor(
        (Date.now() - recordingStartTimeRef.current) / 1000,
      );
      const actualDuration = Math.max(elapsedSeconds, 1);
      const mins = Math.floor(actualDuration / 60);
      const secs = actualDuration % 60;
      const duration = `${mins}:${secs.toString().padStart(2, "0")}`;

      addVideo({
        uri: `web_recording_${Date.now()}`,
        title: `${selectedSport} Session`,
        date: formattedDate,
        duration,
        sport: selectedSport,
        isAnalyzed: false,
      });

      isRecordingRef.current = false;
      setRecordingState("idle");
      setRecordingTime(0);
      setMotionDetected(false);
      setIsSaving(false);

      Alert.alert(
        "Video Saved",
        "Your recording has been saved. You can view it in the Video Review tab.",
        [{ text: "OK", onPress: () => dismissModal() }],
      );
      return;
    }

    isRecordingRef.current = false;
    setRecordingState("idle");
    setRecordingTime(0);
    setMotionDetected(false);
    setIsSaving(false);
    dismissModal();
  };

  const handleFlipCamera = () => {
    setFacing(facing === "back" ? "front" : "back");
    flipButtonRotation.value = withSpring(flipButtonRotation.value + 180);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const recordButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: recordButtonScale.value }],
  }));

  const recordingIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ scale: recordingPulse.value }],
  }));

  const flipButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${flipButtonRotation.value}deg` }],
  }));

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getRecordingHint = () => {
    switch (recordingState) {
      case "idle":
        return motionDetectionEnabled
          ? "Tap to enable motion detection"
          : "Tap to start recording";
      case "waiting_motion":
        return "Waiting for motion...";
      case "countdown":
        return "Get ready...";
      case "recording":
        return "Tap to stop";
      default:
        return "";
    }
  };

  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: "#000" }]}>
        <View style={styles.permissionContainer}>
          <ThemedText type="body" style={styles.permissionText}>
            Loading camera...
          </ThemedText>
        </View>
      </View>
    );
  }

  if (!permission.granted) {
    const cannotAskAgain =
      permission.status === "denied" && !permission.canAskAgain;

    const handleOpenSettings = async () => {
      try {
        await Linking.openSettings();
      } catch {
        // openSettings not supported on this platform
      }
    };

    return (
      <View style={[styles.container, { backgroundColor: "#000" }]}>
        <Pressable
          onPress={() => dismissModal()}
          style={[styles.closeButton, { top: insets.top + Spacing.md }]}
        >
          <Feather name="x" size={28} color="#FFFFFF" />
        </Pressable>
        <View style={styles.permissionContainer}>
          <Feather name="camera-off" size={48} color="#FFFFFF" />
          <ThemedText type="h4" style={styles.permissionTitle}>
            Camera Access Required
          </ThemedText>
          <ThemedText type="body" style={styles.permissionText}>
            {cannotAskAgain
              ? "Camera permission was denied. Please enable it in your device settings to record your athletic movements."
              : "Pocket Coach needs camera access to record your athletic movements for form analysis."}
          </ThemedText>
          {cannotAskAgain && Platform.OS !== "web" ? (
            <Pressable
              onPress={handleOpenSettings}
              style={[
                styles.permissionButton,
                { backgroundColor: theme.primary },
              ]}
            >
              <Feather
                name="settings"
                size={18}
                color="#FFFFFF"
                style={{ marginRight: Spacing.xs }}
              />
              <ThemedText type="body" style={styles.permissionButtonText}>
                Open Settings
              </ThemedText>
            </Pressable>
          ) : !cannotAskAgain ? (
            <Pressable
              onPress={requestPermission}
              style={[
                styles.permissionButton,
                { backgroundColor: theme.primary },
              ]}
            >
              <ThemedText type="body" style={styles.permissionButtonText}>
                Enable Camera
              </ThemedText>
            </Pressable>
          ) : null}
          {Platform.OS === "web" ? (
            <ThemedText
              type="small"
              style={[styles.webNote, { color: "rgba(255,255,255,0.6)" }]}
            >
              For the best experience, run in Expo Go on your device
            </ThemedText>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {Platform.OS === "web" ? (
        <View
          style={[styles.cameraPlaceholder, { backgroundColor: "#1a1a1a" }]}
        >
          <Feather name="video" size={64} color="rgba(255,255,255,0.3)" />
          <ThemedText
            type="body"
            style={[styles.webPlaceholderText, { marginTop: Spacing.lg }]}
          >
            Camera preview available in Expo Go
          </ThemedText>
        </View>
      ) : (
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          mode="video"
          onCameraReady={() => setIsCameraReady(true)}
        />
      )}

      {showGrid ? (
        <View style={styles.gridOverlay}>
          <View style={styles.gridRow}>
            <View style={styles.gridCell} />
            <View style={[styles.gridCell, styles.gridBorderH]} />
            <View style={styles.gridCell} />
          </View>
          <View style={[styles.gridRow, styles.gridBorderV]}>
            <View style={styles.gridCell} />
            <View style={[styles.gridCell, styles.gridBorderH]} />
            <View style={styles.gridCell} />
          </View>
          <View style={styles.gridRow}>
            <View style={styles.gridCell} />
            <View style={[styles.gridCell, styles.gridBorderH]} />
            <View style={styles.gridCell} />
          </View>
        </View>
      ) : null}

      {showInjuryPrevention && recordingState === "recording" ? (
        <View style={styles.injuryOverlay}>
          {BODY_HIGHLIGHTS.map((highlight) => (
            <InjuryHighlight
              key={highlight.id}
              highlight={highlight}
              visible={true}
            />
          ))}
        </View>
      ) : null}

      <View
        style={[styles.topOverlay, { paddingTop: insets.top + Spacing.md }]}
      >
        <Pressable
          onPress={() => dismissModal()}
          style={({ pressed }) => [
            styles.iconButton,
            { opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Feather name="x" size={28} color="#FFFFFF" />
        </Pressable>

        {recordingState === "recording" ? (
          <Animated.View
            style={[styles.recordingIndicator, recordingIndicatorStyle]}
          >
            <View style={styles.recordingDot} />
            <Text style={styles.recordingTimeText}>
              {formatTime(recordingTime)}
            </Text>
          </Animated.View>
        ) : recordingState === "waiting_motion" ? (
          <Animated.View
            entering={FadeIn}
            style={[styles.motionIndicator, { backgroundColor: theme.primary }]}
          >
            <Feather name="activity" size={14} color="#FFFFFF" />
            <Text style={styles.motionIndicatorText}>Motion Detection</Text>
          </Animated.View>
        ) : null}

        <View style={styles.topRightButtons}>
          <Pressable
            onPress={() => setShowSettings(!showSettings)}
            style={({ pressed }) => [
              styles.iconButton,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Feather
              name="settings"
              size={24}
              color={showSettings ? theme.primary : "#FFFFFF"}
            />
          </Pressable>
          <Pressable
            onPress={() => setShowGrid(!showGrid)}
            style={({ pressed }) => [
              styles.iconButton,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Feather
              name="grid"
              size={24}
              color={showGrid ? theme.primary : "#FFFFFF"}
            />
          </Pressable>
          <Animated.View style={flipButtonAnimatedStyle}>
            <Pressable
              onPress={handleFlipCamera}
              style={({ pressed }) => [
                styles.iconButton,
                { opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Feather name="refresh-cw" size={24} color="#FFFFFF" />
            </Pressable>
          </Animated.View>
        </View>
      </View>

      {showSettings ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={styles.settingsPanel}
        >
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Feather name="activity" size={18} color="#FFFFFF" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Motion Detection</Text>
                <Text style={styles.settingDesc}>
                  Move device to start recording
                </Text>
              </View>
            </View>
            <Switch
              value={motionDetectionEnabled}
              onValueChange={setMotionDetectionEnabled}
              trackColor={{
                false: "rgba(255,255,255,0.2)",
                true: theme.primary,
              }}
              thumbColor="#FFFFFF"
            />
          </View>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Feather name="shield" size={18} color="#FFFFFF" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Injury Prevention</Text>
                <Text style={styles.settingDesc}>
                  Highlight high-impact areas
                </Text>
              </View>
            </View>
            <Switch
              value={showInjuryPrevention}
              onValueChange={setShowInjuryPrevention}
              trackColor={{
                false: "rgba(255,255,255,0.2)",
                true: theme.warning,
              }}
              thumbColor="#FFFFFF"
            />
          </View>
          {showInjuryPrevention ? (
            <View style={styles.legendContainer}>
              <Text style={styles.legendTitle}>Risk Levels:</Text>
              <View style={styles.legendRow}>
                <View
                  style={[styles.legendDot, { backgroundColor: "#FF3B30" }]}
                />
                <Text style={styles.legendText}>High Risk</Text>
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: "#FF9500", marginLeft: Spacing.md },
                  ]}
                />
                <Text style={styles.legendText}>Medium</Text>
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: "#FFD60A", marginLeft: Spacing.md },
                  ]}
                />
                <Text style={styles.legendText}>Low</Text>
              </View>
            </View>
          ) : null}
        </Animated.View>
      ) : null}

      {recordingState === "countdown" ? (
        <View style={styles.countdownOverlay}>
          <View style={styles.countdownCircle}>
            <Text style={styles.countdownText}>{countdown}</Text>
          </View>
        </View>
      ) : null}

      {recordingState === "waiting_motion" ? (
        <View style={styles.motionWaitingOverlay}>
          <View style={styles.motionLevelContainer}>
            <View
              style={[
                styles.motionLevelBar,
                {
                  width: `${Math.max(motionLevel * 100, 5)}%`,
                  backgroundColor:
                    motionLevel > 0.3 ? theme.success : theme.primary,
                },
              ]}
            />
          </View>
          <Animated.View
            style={[
              styles.motionWaitingCircle,
              {
                borderColor:
                  motionLevel > 0.3
                    ? theme.success
                    : `rgba(0,102,255,${0.3 + motionLevel * 0.7})`,
              },
            ]}
          >
            <Feather
              name="activity"
              size={48}
              color={motionLevel > 0.3 ? theme.success : theme.primary}
            />
          </Animated.View>
          <Text style={styles.motionWaitingText}>
            {motionLevel > 0.2
              ? "Motion detected..."
              : "Move to start recording"}
          </Text>
          <Text style={styles.motionSubtext}>
            Shake your device or start moving
          </Text>
          <Pressable
            onPress={() => {
              setRecordingState("idle");
              setMotionDetected(false);
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }
            }}
            style={({ pressed }) => [
              styles.cancelMotionButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Feather name="x" size={20} color="#FFFFFF" />
            <Text style={styles.cancelMotionText}>Cancel</Text>
          </Pressable>
        </View>
      ) : null}

      {recordingState === "recording" ? (
        <View style={styles.stopButtonOverlay}>
          <Pressable
            onPress={handleStopRecording}
            style={({ pressed }) => [
              styles.stopButton,
              { opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Feather name="square" size={24} color="#FFFFFF" />
            <Text style={styles.stopButtonText}>Stop Recording</Text>
          </Pressable>
        </View>
      ) : null}

      <View
        style={[
          styles.bottomOverlay,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        {Platform.OS !== "web" &&
        !isCameraReady &&
        recordingState === "idle" ? (
          <View style={styles.cameraInitializingContainer}>
            <Feather name="camera" size={24} color="rgba(255,255,255,0.6)" />
            <Text style={styles.cameraInitializingText}>
              Camera initializing...
            </Text>
          </View>
        ) : null}
        <View style={styles.recordButtonContainer}>
          <AnimatedPressable
            onPress={handleStartRecording}
            disabled={
              Platform.OS !== "web" &&
              !isCameraReady &&
              recordingState === "idle"
            }
            onPressIn={() => {
              recordButtonScale.value = withSpring(0.9, { damping: 15 });
            }}
            onPressOut={() => {
              recordButtonScale.value = withSpring(1, { damping: 15 });
            }}
            style={[
              styles.recordButton,
              recordButtonAnimatedStyle,
              Platform.OS !== "web" &&
                !isCameraReady &&
                recordingState === "idle" &&
                styles.recordButtonDisabled,
            ]}
          >
            <View
              style={[
                styles.recordButtonInner,
                recordingState === "recording" && styles.recordButtonRecording,
                recordingState === "waiting_motion" &&
                  styles.recordButtonWaiting,
              ]}
            />
          </AnimatedPressable>
        </View>
        <ThemedText type="small" style={styles.recordHint}>
          {getRecordingHint()}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  cameraPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  webPlaceholderText: {
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
  },
  topOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: Spacing.lg,
  },
  closeButton: {
    position: "absolute",
    left: Spacing.lg,
    zIndex: 10,
    padding: Spacing.sm,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  topRightButtons: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  recordingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,0,0,0.8)",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
    marginRight: Spacing.sm,
  },
  recordingTimeText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  motionIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  motionIndicatorText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 12,
  },
  settingsPanel: {
    position: "absolute",
    top: 100,
    left: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: "rgba(0,0,0,0.85)",
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  settingText: {
    gap: 2,
  },
  settingLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  settingDesc: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
  },
  legendContainer: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  legendTitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    marginBottom: Spacing.sm,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: Spacing.xs,
  },
  legendText: {
    color: "#FFFFFF",
    fontSize: 12,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  gridRow: {
    flex: 1,
    flexDirection: "row",
  },
  gridCell: {
    flex: 1,
  },
  gridBorderH: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  gridBorderV: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  injuryOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },
  injuryHighlight: {
    position: "absolute",
    alignItems: "center",
  },
  injuryDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    opacity: 0.8,
  },
  injuryLabel: {
    marginTop: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  injuryLabelText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },
  countdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  countdownCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(0,102,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  countdownText: {
    fontSize: 64,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  motionWaitingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  motionLevelContainer: {
    width: 200,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 2,
    marginBottom: Spacing.xl,
    overflow: "hidden",
  },
  motionLevelBar: {
    height: "100%",
    borderRadius: 2,
  },
  motionWaitingCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(0,102,255,0.5)",
  },
  motionSubtext: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    marginTop: Spacing.xs,
  },
  motionWaitingText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
    marginTop: Spacing.lg,
  },
  bottomOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingTop: Spacing["2xl"],
  },
  recordButtonContainer: {
    marginBottom: Spacing.md,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },
  recordButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FF3B30",
  },
  recordButtonRecording: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  recordButtonWaiting: {
    backgroundColor: "#0066FF",
  },
  recordButtonDisabled: {
    opacity: 0.5,
  },
  cameraInitializingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  cameraInitializingText: {
    color: "rgba(255,255,255,0.6)",
    marginLeft: Spacing.sm,
    fontSize: 14,
  },
  recordHint: {
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
  },
  permissionContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing["2xl"],
  },
  permissionTitle: {
    color: "#FFFFFF",
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  permissionText: {
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  permissionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing["2xl"],
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.full,
  },
  permissionButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  webNote: {
    marginTop: Spacing.xl,
    textAlign: "center",
  },
  cancelMotionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing["2xl"],
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },
  cancelMotionText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  stopButtonOverlay: {
    position: "absolute",
    bottom: 160,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  stopButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF3B30",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },
  stopButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
