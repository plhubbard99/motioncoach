import AsyncStorage from "@react-native-async-storage/async-storage";

const API_KEY_STORAGE = "@pocket_coach_api_key";

export type MetricStatus = "good" | "warning" | "needs_work" | "neutral";

export interface BiomechanicsMetric {
  label: string;
  value: string;
  target: string;
  status: MetricStatus;
  focusArea?: string | null;
  icon?: string;
}

export interface AnalysisFrame {
  id: string;
  timestamp: string;
  label: string;
  description: string;
  isKeyPoint: boolean;
}

export interface AnalysisFeedback {
  id: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  priority: "high" | "medium" | "low";
  linkedDrill?: {
    name: string;
    duration: string;
  } | null;
}

export interface RecommendedDrill {
  id: string;
  name: string;
  duration: string;
  focus?: string;
}

export interface InjuryAlert {
  bodyPart: string;
  riskLevel: "high" | "moderate" | "low";
  issue: string;
  prevention: string;
}

export interface AnalysisResult {
  overallScore: number;
  keyFrames: AnalysisFrame[];
  biomechanics: BiomechanicsMetric[];
  feedback: AnalysisFeedback[];
  recommendedDrills: RecommendedDrill[];
  injuryAlerts: InjuryAlert[];
}

export async function saveApiKey(key: string): Promise<void> {
  await AsyncStorage.setItem(API_KEY_STORAGE, key);
}

export async function getApiKey(): Promise<string | null> {
  return AsyncStorage.getItem(API_KEY_STORAGE);
}

export async function deleteApiKey(): Promise<void> {
  await AsyncStorage.removeItem(API_KEY_STORAGE);
}

export async function hasApiKey(): Promise<boolean> {
  const key = await getApiKey();
  return Boolean(key && key.trim().length > 0);
}

export async function extractFrames(
  _videoUri: string,
  _durationMs: number,
): Promise<AnalysisFrame[]> {
  return [
    {
      id: "f1",
      timestamp: "0:02",
      label: "Setup Position",
      description: "Initial setup and alignment",
      isKeyPoint: false,
    },
    {
      id: "f2",
      timestamp: "0:05",
      label: "Power Phase",
      description: "Drive and force transfer",
      isKeyPoint: true,
    },
  ];
}

export async function analyzeVideo(
  _frames: AnalysisFrame[],
  _sport: string,
): Promise<AnalysisResult> {
  return {
    overallScore: 76,
    keyFrames: await extractFrames("", 0),
    biomechanics: [
      {
        label: "Shoulder Alignment",
        value: "12 deg",
        target: "0 deg",
        status: "warning",
        focusArea: "upper body",
      },
    ],
    feedback: [
      {
        id: "fb-1",
        title: "Improve shoulder alignment",
        shortDescription: "Slight offset during release",
        fullDescription:
          "Your shoulder line drifts during the release phase. Keep shoulders square through follow-through.",
        priority: "medium",
      },
    ],
    recommendedDrills: [
      {
        id: "drill-1",
        name: "Mirror alignment drill",
        duration: "5 min",
        focus: "Shoulder",
      },
    ],
    injuryAlerts: [],
  };
}
