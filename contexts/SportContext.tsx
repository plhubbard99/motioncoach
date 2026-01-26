import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "pocket_coach_selected_sport";

interface SportContextType {
  selectedSport: string | null;
  setSelectedSport: (sport: string | null) => void;
}

const SportContext = createContext<SportContextType | undefined>(undefined);

export function SportProvider({ children }: { children: ReactNode }) {
  const [selectedSport, setSelectedSportState] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((savedSport) => {
        if (savedSport) {
          setSelectedSportState(savedSport);
        }
      })
      .catch(console.log);
  }, []);

  const setSelectedSport = (sport: string | null) => {
    setSelectedSportState(sport);
    if (sport) {
      AsyncStorage.setItem(STORAGE_KEY, sport).catch(console.log);
    } else {
      AsyncStorage.removeItem(STORAGE_KEY).catch(console.log);
    }
  };

  return (
    <SportContext.Provider value={{ selectedSport, setSelectedSport }}>
      {children}
    </SportContext.Provider>
  );
}

export function useSport() {
  const context = useContext(SportContext);
  if (!context) {
    throw new Error("useSport must be used within a SportProvider");
  }
  return context;
}

export const SPORT_DRILLS: Record<string, Array<{
  id: string;
  title: string;
  duration: string;
  focus: string;
  description: string;
  steps: Array<{ id: string; title: string; description: string }>;
}>> = {
  "Basketball": [
    {
      id: "bball-1",
      title: "Perfect Your Jump Shot",
      duration: "8 min",
      focus: "Form",
      description: "Master the fundamentals of a consistent jump shot. This drill focuses on proper shooting form, release timing, and follow-through mechanics.",
      steps: [
        { id: "1", title: "Stance Setup", description: "Position feet shoulder-width apart, knees slightly bent" },
        { id: "2", title: "Ball Placement", description: "Hold ball in shooting pocket at chest level" },
        { id: "3", title: "Elbow Alignment", description: "Keep elbow directly under the ball, aligned with knee and foot" },
        { id: "4", title: "Release & Follow Through", description: "Extend arm fully, snap wrist, hold follow-through" },
        { id: "5", title: "Repetition Practice", description: "Repeat 20 times from close range, then move back" },
      ],
    },
    {
      id: "bball-2",
      title: "Free Throw Consistency",
      duration: "5 min",
      focus: "Technique",
      description: "Develop a reliable free throw routine that you can execute under pressure. Focus on mental preparation and physical consistency.",
      steps: [
        { id: "1", title: "Pre-Shot Routine", description: "Establish consistent dribbles before shooting" },
        { id: "2", title: "Breath Control", description: "Take a deep breath to calm nerves" },
        { id: "3", title: "Focus Point", description: "Pick a spot on the rim to aim for" },
        { id: "4", title: "Smooth Release", description: "Use legs for power, keep motion fluid" },
        { id: "5", title: "Track Results", description: "Log makes and misses to identify patterns" },
      ],
    },
    {
      id: "bball-3",
      title: "Dribbling Fundamentals",
      duration: "10 min",
      focus: "Ball Control",
      description: "Improve your ball handling with essential dribbling drills that build finger strength and court awareness.",
      steps: [
        { id: "1", title: "Low Dribble", description: "Keep the ball below knee height for control" },
        { id: "2", title: "Crossover", description: "Practice quick hand-to-hand transfers" },
        { id: "3", title: "Behind the Back", description: "Move ball behind your back while moving" },
        { id: "4", title: "Speed Dribble", description: "Sprint while maintaining control" },
        { id: "5", title: "Eyes Up", description: "Practice without looking at the ball" },
      ],
    },
  ],
  "Golf": [
    {
      id: "golf-1",
      title: "Hip Rotation Fundamentals",
      duration: "12 min",
      focus: "Technique",
      description: "Learn proper hip rotation mechanics to generate more power and consistency in your swing.",
      steps: [
        { id: "1", title: "Address Position", description: "Set up with proper stance width and ball position" },
        { id: "2", title: "Backswing Turn", description: "Rotate hips 45 degrees while shoulders turn 90" },
        { id: "3", title: "Hip Initiation", description: "Start downswing with hip rotation, not arms" },
        { id: "4", title: "Power Transfer", description: "Feel weight shift from back foot to front" },
        { id: "5", title: "Full Extension", description: "Complete rotation with belt buckle facing target" },
      ],
    },
    {
      id: "golf-2",
      title: "Full Swing Analysis",
      duration: "15 min",
      focus: "Range of Motion",
      description: "Break down your full swing into components for detailed analysis and improvement.",
      steps: [
        { id: "1", title: "Grip Check", description: "Verify neutral grip pressure and positioning" },
        { id: "2", title: "Takeaway", description: "Keep club on plane during first 18 inches" },
        { id: "3", title: "Top of Swing", description: "Check club position and wrist angle" },
        { id: "4", title: "Impact Zone", description: "Focus on square clubface at contact" },
        { id: "5", title: "Follow Through", description: "Maintain balance through finish" },
      ],
    },
  ],
  "Tennis": [
    {
      id: "tennis-1",
      title: "Serve Power & Control",
      duration: "10 min",
      focus: "Form",
      description: "Develop a powerful and accurate serve using proper technique and body mechanics.",
      steps: [
        { id: "1", title: "Ball Toss", description: "Practice consistent toss placement" },
        { id: "2", title: "Trophy Position", description: "Reach high with racket behind you" },
        { id: "3", title: "Pronation", description: "Rotate forearm through contact for spin" },
        { id: "4", title: "Target Practice", description: "Aim for specific service box areas" },
        { id: "5", title: "Second Serve", description: "Add spin for reliable backup serve" },
      ],
    },
    {
      id: "tennis-2",
      title: "Forehand Fundamentals",
      duration: "8 min",
      focus: "Technique",
      description: "Master the modern forehand with proper grip, rotation, and follow-through.",
      steps: [
        { id: "1", title: "Grip Selection", description: "Choose semi-western or eastern grip" },
        { id: "2", title: "Unit Turn", description: "Turn shoulders and hips together" },
        { id: "3", title: "Low to High", description: "Swing upward through the ball" },
        { id: "4", title: "Contact Point", description: "Hit in front of your body" },
        { id: "5", title: "Windshield Wiper", description: "Finish with racket over shoulder" },
      ],
    },
  ],
  "Football": [
    {
      id: "football-1",
      title: "Throwing Accuracy Drills",
      duration: "8 min",
      focus: "Technique",
      description: "Improve your passing accuracy with targeted throwing exercises.",
      steps: [
        { id: "1", title: "Grip Position", description: "Fingers on laces, firm but relaxed" },
        { id: "2", title: "Shoulder Turn", description: "Rotate shoulders toward target" },
        { id: "3", title: "Release Point", description: "Let go at highest arm extension" },
        { id: "4", title: "Spiral Practice", description: "Focus on tight spiral rotation" },
        { id: "5", title: "Moving Targets", description: "Practice throws to receivers in motion" },
      ],
    },
    {
      id: "football-2",
      title: "Route Running Basics",
      duration: "10 min",
      focus: "Footwork",
      description: "Learn to run crisp routes with explosive cuts and proper timing.",
      steps: [
        { id: "1", title: "Stance", description: "Explosive start position" },
        { id: "2", title: "Acceleration", description: "Drive out of your break" },
        { id: "3", title: "Plant and Cut", description: "Sharp directional changes" },
        { id: "4", title: "Hand Technique", description: "Timing for catching" },
        { id: "5", title: "Route Combinations", description: "Practice common route trees" },
      ],
    },
  ],
  "Softball": [
    {
      id: "softball-1",
      title: "Pitching Mechanics 101",
      duration: "10 min",
      focus: "Form",
      description: "Develop proper windmill pitching technique for speed and accuracy.",
      steps: [
        { id: "1", title: "Stance", description: "Position on pitching rubber" },
        { id: "2", title: "Windmill Motion", description: "Circular arm path" },
        { id: "3", title: "Hip Drive", description: "Power from lower body" },
        { id: "4", title: "Release Point", description: "Consistent release timing" },
        { id: "5", title: "Follow Through", description: "Complete the motion" },
      ],
    },
    {
      id: "softball-2",
      title: "Batting Stance & Swing",
      duration: "8 min",
      focus: "Hitting",
      description: "Build a solid foundation for consistent hitting.",
      steps: [
        { id: "1", title: "Stance Width", description: "Comfortable athletic position" },
        { id: "2", title: "Grip", description: "Knocking knuckles aligned" },
        { id: "3", title: "Load", description: "Weight transfer to back foot" },
        { id: "4", title: "Swing Path", description: "Level through the zone" },
        { id: "5", title: "Extension", description: "Full arm extension at contact" },
      ],
    },
  ],
  "Baseball": [
    {
      id: "baseball-1",
      title: "Pitching Mechanics",
      duration: "12 min",
      focus: "Form",
      description: "Master the fundamentals of pitching mechanics for velocity and control.",
      steps: [
        { id: "1", title: "Wind-Up", description: "Begin with balanced stance" },
        { id: "2", title: "Leg Lift", description: "Controlled knee drive" },
        { id: "3", title: "Hip Rotation", description: "Generate power from core" },
        { id: "4", title: "Arm Action", description: "Efficient arm path" },
        { id: "5", title: "Follow Through", description: "Decelerate safely" },
      ],
    },
  ],
  "Soccer": [
    {
      id: "soccer-1",
      title: "First Touch Control",
      duration: "8 min",
      focus: "Ball Control",
      description: "Improve your ability to receive and control the ball in tight spaces.",
      steps: [
        { id: "1", title: "Body Position", description: "Open up to receive" },
        { id: "2", title: "Cushion Touch", description: "Absorb the ball's momentum" },
        { id: "3", title: "Inside Foot", description: "Practice inside foot control" },
        { id: "4", title: "Outside Foot", description: "Quick directional changes" },
        { id: "5", title: "Chest Control", description: "Bring aerial balls down" },
      ],
    },
    {
      id: "soccer-2",
      title: "Shooting Technique",
      duration: "10 min",
      focus: "Striking",
      description: "Develop powerful and accurate shooting technique.",
      steps: [
        { id: "1", title: "Plant Foot", description: "Position beside the ball" },
        { id: "2", title: "Body Over Ball", description: "Keep shot low and controlled" },
        { id: "3", title: "Strike Zone", description: "Hit center of ball" },
        { id: "4", title: "Follow Through", description: "Point toe at target" },
        { id: "5", title: "Finishing Drills", description: "Practice under pressure" },
      ],
    },
  ],
  "Volleyball": [
    {
      id: "volleyball-1",
      title: "Serving Mechanics",
      duration: "8 min",
      focus: "Technique",
      description: "Develop a consistent and powerful serve.",
      steps: [
        { id: "1", title: "Toss", description: "Consistent ball placement" },
        { id: "2", title: "Approach", description: "Step pattern timing" },
        { id: "3", title: "Contact", description: "High point contact" },
        { id: "4", title: "Wrist Snap", description: "Add power and spin" },
        { id: "5", title: "Target Zones", description: "Aim for weak spots" },
      ],
    },
  ],
  "Running": [
    {
      id: "running-1",
      title: "Running Posture Basics",
      duration: "6 min",
      focus: "Posture",
      description: "Optimize your running form for efficiency and injury prevention.",
      steps: [
        { id: "1", title: "Head Position", description: "Look forward, not down" },
        { id: "2", title: "Shoulders", description: "Relaxed, not hunched" },
        { id: "3", title: "Arm Swing", description: "Forward-back, not across" },
        { id: "4", title: "Core Engagement", description: "Slight forward lean from ankles" },
        { id: "5", title: "Foot Strike", description: "Land under your center of mass" },
      ],
    },
    {
      id: "running-2",
      title: "Cadence Optimization",
      duration: "10 min",
      focus: "Efficiency",
      description: "Find your optimal stride rate for better performance.",
      steps: [
        { id: "1", title: "Count Steps", description: "Measure current cadence" },
        { id: "2", title: "Metronome", description: "Use rhythm to guide pace" },
        { id: "3", title: "Shorter Strides", description: "Reduce overstriding" },
        { id: "4", title: "Quick Feet", description: "Light, fast ground contact" },
        { id: "5", title: "Practice Runs", description: "Gradually increase cadence" },
      ],
    },
  ],
  "Swimming & Diving": [
    {
      id: "swim-1",
      title: "Freestyle Technique",
      duration: "10 min",
      focus: "Stroke",
      description: "Improve your freestyle stroke for speed and efficiency.",
      steps: [
        { id: "1", title: "Body Position", description: "Horizontal alignment in water" },
        { id: "2", title: "Catch Phase", description: "High elbow catch" },
        { id: "3", title: "Pull", description: "Powerful underwater pull" },
        { id: "4", title: "Breathing", description: "Rhythmic side breathing" },
        { id: "5", title: "Kick", description: "Compact flutter kick" },
      ],
    },
  ],
};

export function getDrillsForSport(sport: string | null): typeof SPORT_DRILLS[string] {
  if (!sport || sport === "All") {
    return Object.values(SPORT_DRILLS).flat();
  }
  return SPORT_DRILLS[sport] || [];
}

export function getDrillById(drillId: string): (typeof SPORT_DRILLS[string][number]) | undefined {
  for (const drills of Object.values(SPORT_DRILLS)) {
    const drill = drills.find((d) => d.id === drillId);
    if (drill) return drill;
  }
  return undefined;
}
