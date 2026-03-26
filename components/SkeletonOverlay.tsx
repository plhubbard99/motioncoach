import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Circle, Line, G } from "react-native-svg";
import { BiomechanicsMetric } from "@/services/AnalysisService";
import { Colors } from "../constants/theme";

interface JointPosition {
  x: number;
  y: number;
}

interface SkeletonOverlayProps {
  width?: number;
  height?: number;
  biomechanics?: BiomechanicsMetric[];
  sport?: string;
  animated?: boolean;
}

const getStatusColor = (
  status: "good" | "warning" | "needs_work" | "neutral",
): string => {
  switch (status) {
    case "good":
      return Colors.light.success;
    case "warning":
      return Colors.light.warning;
    case "needs_work":
      return "#FF4444";
    case "neutral":
      return "rgba(150, 150, 150, 0.5)";
    default:
      return "rgba(150, 150, 150, 0.5)";
  }
};

const getJointStatus = (
  jointName: string,
  biomechanics?: BiomechanicsMetric[],
): "good" | "warning" | "needs_work" | "neutral" => {
  if (!biomechanics || biomechanics.length === 0) return "neutral";

  const jointMappings: Record<string, string[]> = {
    head: ["head", "neck", "posture"],
    shoulder_left: ["shoulder", "arm", "upper body"],
    shoulder_right: ["shoulder", "arm", "upper body"],
    elbow_left: ["elbow", "arm", "follow-through"],
    elbow_right: ["elbow", "arm", "follow-through"],
    wrist_left: ["wrist", "hand", "grip"],
    wrist_right: ["wrist", "hand", "grip"],
    hip_left: ["hip", "rotation", "lower body"],
    hip_right: ["hip", "rotation", "lower body"],
    knee_left: ["knee", "leg", "stance"],
    knee_right: ["knee", "leg", "stance"],
    ankle_left: ["ankle", "foot", "balance"],
    ankle_right: ["ankle", "foot", "balance"],
    spine: ["spine", "core", "posture", "back"],
  };

  const keywords = jointMappings[jointName] || [];

  for (const metric of biomechanics) {
    const labelLower = metric.label.toLowerCase();
    const focusLower = metric.focusArea?.toLowerCase() || "";

    for (const keyword of keywords) {
      if (labelLower.includes(keyword) || focusLower.includes(keyword)) {
        return metric.status;
      }
    }
  }

  return "neutral";
};

const getSportPose = (sport?: string): Record<string, JointPosition> => {
  const basePose: Record<string, JointPosition> = {
    head: { x: 100, y: 30 },
    neck: { x: 100, y: 50 },
    shoulder_left: { x: 70, y: 60 },
    shoulder_right: { x: 130, y: 60 },
    elbow_left: { x: 50, y: 90 },
    elbow_right: { x: 150, y: 90 },
    wrist_left: { x: 35, y: 120 },
    wrist_right: { x: 165, y: 120 },
    spine: { x: 100, y: 100 },
    hip_left: { x: 80, y: 140 },
    hip_right: { x: 120, y: 140 },
    knee_left: { x: 75, y: 190 },
    knee_right: { x: 125, y: 190 },
    ankle_left: { x: 70, y: 240 },
    ankle_right: { x: 130, y: 240 },
  };

  switch (sport?.toLowerCase()) {
    case "basketball":
      return {
        ...basePose,
        elbow_right: { x: 160, y: 50 },
        wrist_right: { x: 170, y: 20 },
        knee_left: { x: 65, y: 180 },
        knee_right: { x: 135, y: 200 },
      };
    case "golf":
      return {
        ...basePose,
        shoulder_left: { x: 60, y: 55 },
        shoulder_right: { x: 140, y: 65 },
        elbow_left: { x: 30, y: 70 },
        elbow_right: { x: 160, y: 100 },
        wrist_left: { x: 10, y: 90 },
        wrist_right: { x: 175, y: 130 },
        hip_left: { x: 75, y: 135 },
        hip_right: { x: 125, y: 145 },
      };
    case "tennis":
      return {
        ...basePose,
        shoulder_right: { x: 140, y: 55 },
        elbow_right: { x: 170, y: 40 },
        wrist_right: { x: 190, y: 25 },
        hip_left: { x: 70, y: 135 },
        hip_right: { x: 130, y: 145 },
        knee_left: { x: 60, y: 185 },
      };
    case "baseball":
    case "softball":
      return {
        ...basePose,
        shoulder_left: { x: 55, y: 55 },
        shoulder_right: { x: 145, y: 60 },
        elbow_right: { x: 175, y: 45 },
        wrist_right: { x: 190, y: 30 },
        hip_left: { x: 70, y: 135 },
        hip_right: { x: 130, y: 145 },
        knee_left: { x: 55, y: 180 },
        ankle_left: { x: 45, y: 235 },
      };
    case "football":
      return {
        ...basePose,
        elbow_right: { x: 165, y: 75 },
        wrist_right: { x: 180, y: 55 },
        knee_left: { x: 60, y: 185 },
        knee_right: { x: 140, y: 195 },
      };
    case "soccer":
      return {
        ...basePose,
        hip_right: { x: 130, y: 135 },
        knee_right: { x: 155, y: 170 },
        ankle_right: { x: 175, y: 210 },
      };
    case "swimming & diving":
      return {
        ...basePose,
        shoulder_left: { x: 60, y: 65 },
        shoulder_right: { x: 140, y: 65 },
        elbow_left: { x: 30, y: 55 },
        elbow_right: { x: 170, y: 55 },
        wrist_left: { x: 10, y: 45 },
        wrist_right: { x: 190, y: 45 },
        knee_left: { x: 75, y: 200 },
        knee_right: { x: 125, y: 200 },
      };
    default:
      return basePose;
  }
};

const BONES: [string, string][] = [
  ["head", "neck"],
  ["neck", "shoulder_left"],
  ["neck", "shoulder_right"],
  ["shoulder_left", "elbow_left"],
  ["shoulder_right", "elbow_right"],
  ["elbow_left", "wrist_left"],
  ["elbow_right", "wrist_right"],
  ["neck", "spine"],
  ["spine", "hip_left"],
  ["spine", "hip_right"],
  ["hip_left", "hip_right"],
  ["hip_left", "knee_left"],
  ["hip_right", "knee_right"],
  ["knee_left", "ankle_left"],
  ["knee_right", "ankle_right"],
];

export const SkeletonOverlay: React.FC<SkeletonOverlayProps> = ({
  width = 200,
  height = 280,
  biomechanics,
  sport,
  animated = false,
}) => {
  const pose = getSportPose(sport);
  const scaleX = width / 200;
  const scaleY = height / 280;

  const scaledPose = Object.entries(pose).reduce(
    (acc, [key, pos]) => {
      acc[key] = { x: pos.x * scaleX, y: pos.y * scaleY };
      return acc;
    },
    {} as Record<string, JointPosition>,
  );

  const getBoneColor = (joint1: string, joint2: string): string => {
    const status1 = getJointStatus(joint1, biomechanics);
    const status2 = getJointStatus(joint2, biomechanics);

    if (status1 === "needs_work" || status2 === "needs_work") {
      return getStatusColor("needs_work");
    }
    if (status1 === "warning" || status2 === "warning") {
      return getStatusColor("warning");
    }
    if (status1 === "good" || status2 === "good") {
      return getStatusColor("good");
    }
    return getStatusColor("neutral");
  };

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height}>
        <G>
          {BONES.map(([joint1, joint2], index) => {
            const pos1 = scaledPose[joint1];
            const pos2 = scaledPose[joint2];
            if (!pos1 || !pos2) return null;

            return (
              <Line
                key={`bone-${index}`}
                x1={pos1.x}
                y1={pos1.y}
                x2={pos2.x}
                y2={pos2.y}
                stroke={getBoneColor(joint1, joint2)}
                strokeWidth={3}
                strokeLinecap="round"
              />
            );
          })}

          {Object.entries(scaledPose).map(([jointName, pos]) => {
            const status = getJointStatus(jointName, biomechanics);
            const color = getStatusColor(status);
            const isHead = jointName === "head";

            return (
              <Circle
                key={jointName}
                cx={pos.x}
                cy={pos.y}
                r={
                  isHead
                    ? 12 * Math.min(scaleX, scaleY)
                    : 6 * Math.min(scaleX, scaleY)
                }
                fill={color}
                stroke="#FFFFFF"
                strokeWidth={2}
              />
            );
          })}
        </G>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
});

export default SkeletonOverlay;
