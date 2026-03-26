import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  Pressable,
  Dimensions,
  Platform,
  Text,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEvent } from "expo";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useVideos } from "@/contexts/VideoContext";

type VideoPlaybackStackParamList = {
  VideoPlayback: {
    videoId: string;
    uri?: string;
    title?: string;
    sport?: string;
  };
};

type VideoPlaybackScreenProps = NativeStackScreenProps<
  VideoPlaybackStackParamList,
  "VideoPlayback"
>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const SLOW_MO_SPEEDS = [0.25, 0.5, 0.75, 1, 1.5, 2];
const DEFAULT_SLOW_MO = 0.25;
const SEEK_AMOUNT = 10;
const REWIND_STEP = 0.1; // How many seconds to rewind per interval
const REWIND_INTERVAL = 50; // Interval in ms for rewinding

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function VideoPlaybackScreen({
  route,
  navigation,
}: VideoPlaybackScreenProps) {
  const {
    videoId,
    uri: paramUri,
    title: paramTitle,
    sport: paramSport,
  } = route.params;
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { getVideo } = useVideos();

  const contextVideo = getVideo(videoId);
  const videoUri = paramUri || contextVideo?.uri || "";
  const videoTitle = paramTitle || contextVideo?.title || "Video";
  const videoSport = paramSport || contextVideo?.sport || "";

  const player = useVideoPlayer(videoUri, (player) => {
    player.loop = true;
    player.play();
  });

  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [selectedSlowMo, setSelectedSlowMo] = useState(DEFAULT_SLOW_MO);
  const [isSeeking, setIsSeeking] = useState(false);
  const [showSpeedIndicator, setShowSpeedIndicator] = useState(false);
  const [isHoldingLeft, setIsHoldingLeft] = useState(false);
  const [isHoldingRight, setIsHoldingRight] = useState(false);

  const speedIndicatorOpacity = useSharedValue(0);
  const hideSpeedTimeout = useRef<NodeJS.Timeout | null>(null);
  const scrubberWidth = SCREEN_WIDTH - Spacing.lg * 2 - 80;
  const holdTimerLeft = useRef<NodeJS.Timeout | null>(null);
  const holdTimerRight = useRef<NodeJS.Timeout | null>(null);
  const rewindIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const wasHoldingLeft = useRef(false);
  const wasHoldingRight = useRef(false);

  const { status } = useEvent(player, "statusChange", {
    status: player.status,
  });

  const { isPlaying: playerIsPlaying } = useEvent(player, "playingChange", {
    isPlaying: player.playing,
  });

  useEffect(() => {
    setIsPlaying(playerIsPlaying);
  }, [playerIsPlaying]);

  useEffect(() => {
    if (status === "readyToPlay" && player.duration) {
      setDuration(player.duration);
    }
  }, [status, player.duration]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && !isSeeking) {
      interval = setInterval(() => {
        if (player.currentTime !== undefined) {
          setCurrentTime(player.currentTime);
        }
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isSeeking, player]);

  const showSpeedChange = useCallback(
    (speedText: string) => {
      setShowSpeedIndicator(true);
      speedIndicatorOpacity.value = withTiming(1, { duration: 150 });

      if (hideSpeedTimeout.current) {
        clearTimeout(hideSpeedTimeout.current);
      }

      hideSpeedTimeout.current = setTimeout(() => {
        speedIndicatorOpacity.value = withTiming(0, { duration: 300 });
        setTimeout(() => setShowSpeedIndicator(false), 300);
      }, 1000);
    },
    [speedIndicatorOpacity],
  );

  const togglePlayPause = () => {
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  };

  const handleSeek = (position: number) => {
    const clampedPosition = Math.max(0, Math.min(position, duration));
    player.currentTime = clampedPosition;
    setCurrentTime(clampedPosition);
  };

  const startRewind = () => {
    player.pause();
    showSpeedChange("Rewinding...");
    rewindIntervalRef.current = setInterval(() => {
      const newTime = Math.max(0, player.currentTime - REWIND_STEP);
      player.currentTime = newTime;
      setCurrentTime(newTime);
      if (newTime <= 0) {
        stopRewind();
      }
    }, REWIND_INTERVAL);
  };

  const stopRewind = () => {
    if (rewindIntervalRef.current) {
      clearInterval(rewindIntervalRef.current);
      rewindIntervalRef.current = null;
    }
    if (isPlaying) {
      player.play();
    }
  };

  const handleLeftPressIn = () => {
    holdTimerLeft.current = setTimeout(() => {
      wasHoldingLeft.current = true;
      setIsHoldingLeft(true);
      startRewind();
    }, 200);
  };

  const handleLeftPressOut = () => {
    if (holdTimerLeft.current) {
      clearTimeout(holdTimerLeft.current);
      holdTimerLeft.current = null;
    }

    if (wasHoldingLeft.current) {
      wasHoldingLeft.current = false;
      setIsHoldingLeft(false);
      stopRewind();
      showSpeedChange("Normal Speed");
    } else {
      handleSeek(currentTime - SEEK_AMOUNT);
      showSpeedChange(`-${SEEK_AMOUNT}s`);
    }
  };

  const handleRightPressIn = () => {
    holdTimerRight.current = setTimeout(() => {
      wasHoldingRight.current = true;
      setIsHoldingRight(true);
      setPlaybackSpeed(selectedSlowMo);
      player.playbackRate = selectedSlowMo;
      showSpeedChange(`${selectedSlowMo}x Slow-Mo`);
    }, 200);
  };

  const handleRightPressOut = () => {
    if (holdTimerRight.current) {
      clearTimeout(holdTimerRight.current);
      holdTimerRight.current = null;
    }

    if (wasHoldingRight.current) {
      wasHoldingRight.current = false;
      setIsHoldingRight(false);
      setPlaybackSpeed(1);
      player.playbackRate = 1;
      showSpeedChange("Normal Speed");
    } else {
      handleSeek(currentTime + SEEK_AMOUNT);
      showSpeedChange(`+${SEEK_AMOUNT}s`);
    }
  };

  const handleSpeedSelect = (speed: number) => {
    setSelectedSlowMo(speed);
    if (speed === 1) {
      setPlaybackSpeed(1);
      player.playbackRate = 1;
      showSpeedChange("Normal Speed");
    } else {
      setPlaybackSpeed(speed);
      player.playbackRate = speed;
      showSpeedChange(`${speed}x`);
    }
  };

  const progress = duration > 0 ? currentTime / duration : 0;

  const speedIndicatorStyle = useAnimatedStyle(() => ({
    opacity: speedIndicatorOpacity.value,
  }));

  const scrubberGesture = Gesture.Pan()
    .onBegin((e) => {
      runOnJS(setIsSeeking)(true);
      const newPosition = (e.x / scrubberWidth) * duration;
      runOnJS(handleSeek)(newPosition);
    })
    .onUpdate((e) => {
      const newPosition = (e.x / scrubberWidth) * duration;
      runOnJS(handleSeek)(newPosition);
    })
    .onEnd(() => {
      runOnJS(setIsSeeking)(false);
    });

  const scrubberTapGesture = Gesture.Tap().onEnd((e) => {
    const newPosition = (e.x / scrubberWidth) * duration;
    runOnJS(handleSeek)(newPosition);
  });

  const combinedScrubberGesture = Gesture.Race(
    scrubberGesture,
    scrubberTapGesture,
  );

  const hasValidVideo = videoUri && videoUri.length > 0;

  const getSpeedIndicatorText = () => {
    if (isHoldingLeft) {
      return "Rewinding...";
    }
    if (isHoldingRight) {
      return `${selectedSlowMo}x Slow-Mo`;
    }
    return playbackSpeed === 1 ? "Normal Speed" : `${playbackSpeed}x`;
  };

  if (!hasValidVideo && Platform.OS !== "web") {
    return (
      <View style={[styles.container, { backgroundColor: "#000" }]}>
        <View style={styles.errorContainer}>
          <Feather name="video-off" size={48} color="rgba(255,255,255,0.5)" />
          <ThemedText type="body" style={styles.errorText}>
            Video unavailable
          </ThemedText>
          <ThemedText type="small" style={styles.errorSubtext}>
            This video cannot be played
          </ThemedText>
          <Pressable
            style={[styles.backButton, { backgroundColor: theme.primary }]}
            onPress={() => navigation.goBack()}
          >
            <ThemedText type="body" style={styles.backButtonText}>
              Go Back
            </ThemedText>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: "#000" }]}>
      <Pressable style={styles.videoWrapper} onPress={togglePlayPause}>
        {Platform.OS === "web" ? (
          <View style={styles.webFallback} pointerEvents="none">
            <Feather name="video" size={64} color="rgba(255,255,255,0.5)" />
            <Text style={styles.webFallbackText}>
              Video playback works best in Expo Go
            </Text>
            <Text style={styles.webFallbackSubtext}>
              Scan the QR code to test on your device
            </Text>
          </View>
        ) : (
          <VideoView
            style={styles.video}
            player={player}
            allowsFullscreen={false}
            allowsPictureInPicture={false}
            nativeControls={false}
            contentFit="contain"
          />
        )}
      </Pressable>

      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
          hitSlop={12}
        >
          <Feather name="x" size={28} color="#FFFFFF" />
        </Pressable>
        <View style={styles.videoInfoTop}>
          <ThemedText type="body" style={styles.videoTitle}>
            {videoTitle}
          </ThemedText>
          <ThemedText type="small" style={styles.videoSport}>
            {videoSport}
          </ThemedText>
        </View>
        <View style={{ width: 44 }} />
      </View>

      {showSpeedIndicator ? (
        <Animated.View style={[styles.speedIndicator, speedIndicatorStyle]}>
          <Text style={styles.speedIndicatorText}>
            {getSpeedIndicatorText()}
          </Text>
        </Animated.View>
      ) : null}

      {!isPlaying ? (
        <View style={styles.pauseIndicator}>
          <Feather name="pause" size={48} color="rgba(255,255,255,0.8)" />
        </View>
      ) : null}

      <View
        style={[
          styles.bottomControls,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        <Pressable
          style={[
            styles.controlButton,
            styles.controlButtonLeft,
            isHoldingLeft && styles.controlButtonActive,
          ]}
          onPressIn={handleLeftPressIn}
          onPressOut={handleLeftPressOut}
        >
          <Feather name="rewind" size={28} color="#FFFFFF" />
          <Text style={styles.controlButtonText}>Rewind</Text>
        </Pressable>

        <View style={styles.scrubberArea}>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
            <GestureDetector gesture={combinedScrubberGesture}>
              <View style={styles.scrubberContainer}>
                <View style={styles.scrubberTrack}>
                  <View
                    style={[
                      styles.scrubberProgress,
                      {
                        width: `${progress * 100}%`,
                        backgroundColor: theme.primary,
                      },
                    ]}
                  />
                </View>
                <Animated.View
                  style={[
                    styles.scrubberThumb,
                    {
                      left: progress * scrubberWidth - 8,
                      backgroundColor: theme.primary,
                    },
                  ]}
                />
              </View>
            </GestureDetector>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
          <Text style={styles.instructionText}>
            Tap: Seek | Hold Left: Rewind | Hold Right: Slow-Mo
          </Text>
        </View>

        <Pressable
          style={[
            styles.controlButton,
            styles.controlButtonRight,
            isHoldingRight && styles.controlButtonActive,
          ]}
          onPressIn={handleRightPressIn}
          onPressOut={handleRightPressOut}
        >
          <Feather name="fast-forward" size={28} color="#FFFFFF" />
          <Text style={styles.controlButtonText}>Forward</Text>
        </Pressable>
      </View>

      <View
        style={[
          styles.speedControlsContainer,
          { paddingBottom: insets.bottom + Spacing.sm },
        ]}
      >
        <Text style={styles.speedLabel}>Speed:</Text>
        <View style={styles.speedButtonsRow}>
          {SLOW_MO_SPEEDS.map((speed) => (
            <Pressable
              key={speed}
              style={[
                styles.speedButton,
                playbackSpeed === speed && { backgroundColor: theme.primary },
              ]}
              onPress={() => handleSpeedSelect(speed)}
            >
              <Text
                style={[
                  styles.speedButtonText,
                  playbackSpeed === speed && { color: "#FFFFFF" },
                ]}
              >
                {speed}x
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  videoWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  video: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  webFallback: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing["2xl"],
  },
  webFallbackText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 16,
    marginTop: Spacing.lg,
    textAlign: "center",
  },
  webFallbackSubtext: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    marginTop: Spacing.sm,
    textAlign: "center",
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 22,
  },
  videoInfoTop: {
    alignItems: "center",
  },
  videoTitle: {
    color: "#FFFFFF",
    fontWeight: "600",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  videoSport: {
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  speedIndicator: {
    position: "absolute",
    top: "40%",
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  speedIndicatorText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  pauseIndicator: {
    position: "absolute",
    top: "45%",
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomControls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.sm,
  },
  controlButton: {
    width: 75,
    height: 75,
    borderRadius: 38,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  controlButtonLeft: {
    marginBottom: Spacing.md,
  },
  controlButtonRight: {
    marginBottom: Spacing.md,
  },
  controlButtonActive: {
    backgroundColor: "rgba(0,102,255,0.8)",
    borderColor: "#0066FF",
  },
  controlButtonText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
  },
  scrubberArea: {
    flex: 1,
    paddingHorizontal: Spacing.xs,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  timeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
    width: 40,
    textAlign: "center",
  },
  scrubberContainer: {
    flex: 1,
    height: 30,
    justifyContent: "center",
    marginHorizontal: Spacing.xs,
  },
  scrubberTrack: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 2,
  },
  scrubberProgress: {
    height: "100%",
    borderRadius: 2,
  },
  scrubberThumb: {
    position: "absolute",
    width: 16,
    height: 16,
    borderRadius: 8,
    top: 7,
  },
  instructionText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    color: "#FFFFFF",
    marginTop: Spacing.lg,
  },
  errorSubtext: {
    color: "rgba(255,255,255,0.6)",
    marginTop: Spacing.sm,
    marginBottom: Spacing["2xl"],
    textAlign: "center",
  },
  backButton: {
    paddingHorizontal: Spacing["2xl"],
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  speedControlsContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.8)",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  speedLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: "500",
    marginRight: Spacing.md,
  },
  speedButtonsRow: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  speedButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: BorderRadius.md,
    minWidth: 48,
    alignItems: "center",
  },
  speedButtonText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "600",
  },
});
