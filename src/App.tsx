import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  Brain, 
  Car, 
  Navigation, 
  Zap,
  Moon,
  ChevronRight,
  Loader2,
  Sun,
  Users,
  Download
} from 'lucide-react';
import { StressProfile, PredictionResult, TrafficState } from './types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import jsPDF from 'jspdf';

export default function App() {
  const [profile, setProfile] = useState<StressProfile>({
    age: 30,
    commuteTime: 30,
    sleepHours: 7,
    trafficState: 'Moderate Steady',
    mood: 'Neutral'
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [predictedProfile, setPredictedProfile] = useState<{ age: number, commuteTime: number, sleepHours: number, trafficEncoded: number, moodEncoded: number } | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [dailyInsight, setDailyInsight] = useState("");
  const [history, setHistory] = useState<number[]>([]);

  const [activeTab, setActiveTab] = useState("Neural Analyzer");
  const [userName, setUserName] = useState("");
  
  const TABS = ["Neural Analyzer", "Recovery & Stability", "In-Traffic Support", "Crowd Intel"];

  useEffect(() => {
    const quotes_list = [
      "Calm driving is intelligent driving.",
      "Stress behind the wheel reduces reaction time.",
      "Your breath is the fastest way to reset your nervous system.",
      "A clear mind makes safer decisions.",
      "Sleep is your strongest performance enhancer.",
      "Control the breath, control the drive.",
      "Fatigue often feels like frustration.",
      "Emotional stability improves road awareness.",
      "Small pauses prevent big mistakes.",
      "Your nervous system drives with you.",
      "A relaxed body reacts faster than a tense one.",
      "A smooth ride starts with a calm mind.",
      "Mindful breathing turns traffic jams into mental breaks.",
      "Frustration is traffic's loudest passenger; leave it at the curb.",
      "The best safety feature in any car is a steady mind.",
      "Drive with intention, not reaction."
    ];
    setDailyInsight(quotes_list[Math.floor(Math.random() * quotes_list.length)]);
    
    const intervalId = setInterval(() => {
      setDailyInsight(quotes_list[Math.floor(Math.random() * quotes_list.length)]);
    }, 3000);
    
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);

  const loadingMessages = [
    "Initializing neural weights...",
    "Scanning traffic dynamics...",
    "Correlating circadian patterns...",
    "Finalizing stress vector analysis..."
  ];

  useEffect(() => {
    if (isAnalyzing) {
      const interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % loadingMessages.length);
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [isAnalyzing]);

  const getScore = (age: number, commute: number, sleep: number, traffic: number, mood: number) => {
    let s = (commute / 20) + ((8 - sleep) * 0.8) + (traffic * 1.5) + (mood * 1.2) + (age / 40);
    return Math.max(1, Math.min(10, Math.round(s * 10) / 10));
  };

  const handlePredict = async () => {
    setIsAnalyzing(true);
    
    const trafficMap: Record<string, number> = {
      "Light": 0,
      "Moderate Steady": 1,
      "Heavy": 2,
      "Jammed": 3
    };
    const traffic_encoded = trafficMap[profile.trafficState] ?? 1;

    const moodMap: Record<string, number> = {
      "Frustrated": 4,
      "Anxious": 3,
      "Neutral": 2,
      "Calm": 1,
      "Energized": 0
    };
    const mood_encoded = moodMap[profile.mood] ?? 2;

    setTimeout(() => {
      const baseScore = getScore(profile.age, profile.commuteTime, profile.sleepHours, traffic_encoded, mood_encoded);

      let topReasons: { factor: string; delta: number }[] = [];

      if (baseScore > 3.5) {
        // A) Better sleep
        let impact_sleep = 0;
        if (profile.sleepHours < 10) {
          const sleepAlt = Math.min(profile.sleepHours + 1, 10);
          const delta_sleep = baseScore - getScore(profile.age, profile.commuteTime, sleepAlt, traffic_encoded, mood_encoded);
          impact_sleep = delta_sleep / 1;
        }
        
        // B) Lighter traffic
        let impact_traffic = 0;
        if (traffic_encoded > 0) {
          const trafficAlt = traffic_encoded - 1;
          const delta_traffic = baseScore - getScore(profile.age, profile.commuteTime, profile.sleepHours, trafficAlt, mood_encoded);
          impact_traffic = delta_traffic / 1;
        }

        // C) Shorter commute
        let impact_commute = 0;
        const commute_baseline = 30;
        if (profile.commuteTime > commute_baseline) {
          const commuteAlt = commute_baseline;
          const delta_commute = baseScore - getScore(profile.age, commuteAlt, profile.sleepHours, traffic_encoded, mood_encoded);
          impact_commute = delta_commute;
        }

        // D) Calmer mood
        let impact_mood = 0;
        if (mood_encoded > 0) {
          const moodAlt = Math.max(mood_encoded - 1, 0);
          const delta_mood = baseScore - getScore(profile.age, profile.commuteTime, profile.sleepHours, traffic_encoded, moodAlt);
          impact_mood = delta_mood / 1;
        }

        if (profile.sleepHours < 7) {
          impact_sleep *= 1.3;
        } else if (profile.sleepHours >= 7) {
          impact_sleep *= 0.7;
        }

        if (mood_encoded <= 1) {
          impact_mood *= 0.6;
        } else if (mood_encoded >= 3) {
          impact_mood *= 1.3;
        }

        const deltas = [
          { factor: 'Lack of Sleep', delta: impact_sleep },
          { factor: 'Traffic Conditions', delta: impact_traffic },
          { factor: 'Commute Duration', delta: impact_commute },
          { factor: 'Current Mood', delta: impact_mood },
        ];

        deltas.sort((a, b) => b.delta - a.delta);
        topReasons = deltas.filter(d => d.delta > 0).slice(0, 3);
      }

      setResult({
        stressScore: baseScore,
        confidence: 0.85,
        primaryStressors: [],
        remedies: [],
        stressReasons: topReasons,
        whatIfScenarios: []
      });
      setPredictedProfile({
        age: profile.age,
        commuteTime: profile.commuteTime,
        sleepHours: profile.sleepHours,
        trafficEncoded: traffic_encoded,
        moodEncoded: mood_encoded
      });
      setHistory((prev) => [...prev, baseScore]);
      setIsAnalyzing(false);
    }, 2500);
  };

  const generatePDFReport = () => {
    if (!result) return;
    
    const doc = new jsPDF();
    const score = Math.round(result.stressScore * 10) / 10;
    
    // Use predictedProfile or fallback to the current selected profile
    const refProfile = predictedProfile || profile;
    const { commuteTime, sleepHours } = refProfile;
    const age = refProfile.age || profile.age;
    const now = new Date().toLocaleString();

    // Page Background (#0E1117)
    doc.setFillColor(14, 17, 23);
    doc.rect(0, 0, 210, 297, "F");

    // Container (#161B22)
    doc.setFillColor(22, 27, 34);
    doc.roundedRect(10, 10, 190, 277, 5, 5, "F");

    // Title
    doc.setTextColor(255, 75, 75); // #FF4B4B
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("CalmRide AI", 20, 30);
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text("Stress Intelligence Report", 20, 40);

    // Name & Date
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(200, 200, 200);
    doc.text(`Name: ${userName || "Anonymous"}`, 20, 55);
    doc.text(`Generated On: ${now}`, 20, 62);

    // --- SECTION: Stress Summary ---
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("Stress Summary", 20, 80);

    let zone = "High";
    let r = 213, g = 0, b = 0; // #D50000
    if (score <= 3.5) {
      zone = "Low";
      r = 0; g = 200; b = 83; // #00C853
    } else if (score <= 6.5) {
      zone = "Moderate";
      r = 255; g = 214; b = 0; // #FFD600
    }

    // Badge
    doc.setFillColor(r, g, b);
    doc.roundedRect(20, 85, 50 + (zone.length * 2), 10, 2, 2, "F");
    doc.setTextColor(0, 0, 0); // Black text on badge
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`${zone} Stress (${score})`, 25, 92);

    // Bar
    doc.setFillColor(50, 50, 50); // Background bar
    doc.roundedRect(20, 105, 150, 4, 2, 2, "F");
    doc.setFillColor(r, g, b); // Active bar
    const barWidth = Math.min(150 * (score / 10), 150);
    doc.roundedRect(20, 105, barWidth, 4, 2, 2, "F");

    // --- SECTION: Driver Profile ---
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Driver Profile", 20, 125);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Age: ${age}`, 20, 135);
    doc.text(`Commute Time: ${commuteTime} minutes`, 20, 142);
    doc.text(`Sleep Hours: ${sleepHours} hours`, 20, 149);

    // --- SECTION: Session Change ---
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Session Change", 20, 165);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    if (history.length >= 2) {
      const currentScore = history[history.length - 1];
      const previousScore = history[history.length - 2];
      const delta = Math.round((currentScore - previousScore) * 100) / 100;
      doc.text(`Last Session Delta: ${delta > 0 ? "+" : ""}${delta}`, 20, 175);
    } else {
      doc.text(`Last Session Delta: N/A (Need more sessions)`, 20, 175);
    }

    // --- SECTION: Benchmark Stats (from Crowd Intelligence) ---
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Benchmarking", 20, 195);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    
    const MOCK_POPULATION = Array.from({ length: 1000 }, (_, i) => {
        let u = 0, v = 0;
        while (u === 0) u = Math.random();
        while (v === 0) v = Math.random();
        let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        return Math.min(10, Math.max(1, (num * 1.5) + 5.2));
    });
    const mean_stress = MOCK_POPULATION.reduce((a, b) => a + b, 0) / MOCK_POPULATION.length;
    const belowScoreCount = MOCK_POPULATION.filter(s => s < score).length;
    const percentile = Math.round((belowScoreCount / MOCK_POPULATION.length) * 100 * 10) / 10;
    const deviation = Math.round((score - mean_stress) * 100) / 100;

    doc.text(`Population Mean Stress: ${Math.round(mean_stress * 100) / 100}`, 20, 205);
    doc.text(`Deviation from Average: ${deviation > 0 ? "+" : ""}${deviation}`, 20, 212);
    doc.text(`Percentile Ranking: ${percentile}%`, 20, 219);


    // --- SECTION: AI Interpretation ---
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("AI Interpretation", 20, 235);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(170, 170, 170);
    const splitText = doc.splitTextToSize("This report is generated using AI-based behavioral stress analysis. Results reflect current commute and lifestyle inputs.", 170);
    doc.text(splitText, 20, 245);

    // --- Footer ---
    doc.setTextColor(136, 136, 136); // #888
    doc.setFontSize(9);
    doc.text("CalmRide AI • Behavioral Stress Intelligence Engine • Confidential Report", 105, 275, { align: "center" });

    doc.save("calmride_stress_report.pdf");
  };

  const moods = [
    { label: 'Frustrated', emoji: '😫' },
    { label: 'Anxious', emoji: '😟' },
    { label: 'Neutral', emoji: '😐' },
    { label: 'Calm', emoji: '😊' },
    { label: 'Energized', emoji: '🤩' },
  ];

  const trafficStates: TrafficState[] = ['Light', 'Moderate Steady', 'Heavy', 'Jammed'];

  return (
    <div className="min-h-screen bg-[var(--bg-color)] text-[var(--text-color)] font-sans selection:bg-red-600/30 relative overflow-hidden flex flex-col transition-colors duration-500">
      
      {/* VIVID BACKGROUND GLOWS */}
      <div className="atmosphere-blur" />
      
      {/* TOP NAV */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-[1600px] w-full mx-auto border-b border-[var(--border-color)] bg-[var(--panel-bg)] backdrop-blur-xl transition-colors duration-500">
        <div className="flex items-center gap-3">
          <Car className="w-8 h-8 text-red-600" />
          <span className="text-2xl font-bold tracking-tight">CalmRide</span>
        </div>

        <div className="hidden md:flex items-center gap-10 text-sm font-medium">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 outline-none transition-colors relative ${activeTab === tab ? 'text-red-500' : 'text-[var(--text-muted)] hover:text-[var(--text-color)]'}`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div layoutId="navline" className="absolute left-0 right-0 -bottom-[3px] h-0.5 bg-red-500" />
              )}
            </button>
          ))}
        </div>

        <button 
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="text-amber-500 p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-zinc-800" />}
        </button>
      </nav>

      <main className="relative z-10 max-w-[1400px] mx-auto px-8 py-16 flex-1 w-full">
        {activeTab === 'Neural Analyzer' && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-16 items-start">
            
            {/* LEFT COLUMN */}
            <div className="pt-2">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-7xl lg:text-[5.5rem] font-bold tracking-tighter leading-[0.95] mb-6 font-display">
                  Stress<br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-700">Intelligence Engine.</span>
                </h1>
                <p className="text-[var(--text-muted)] text-[1.1rem] max-w-sm leading-relaxed mb-16">
                  Real-time prediction and optimization of commuter stress.
                </p>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-[32px] glass-panel p-8 relative overflow-hidden">
                <div className="flex gap-8 mb-8 border-b border-[var(--border-color)] pb-4">
                  <div className="text-[10px] uppercase font-bold tracking-[0.15em] flex items-center gap-2 text-[var(--text-color)]">
                     <Zap className="w-3.5 h-3.5 text-amber-500" /> WHY IS MY STRESS RISING?
                  </div>
                </div>

                <div className="min-h-[220px]">
                  <AnimatePresence mode="wait">
                    <motion.div key="reasons" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-4">
                      {!result ? (
                        <div className="p-6 rounded-2xl glass-card min-h-[190px] flex flex-col items-center justify-center">
                          <p className="text-[var(--text-muted)] text-sm text-center">Please run prediction first.</p>
                        </div>
                      ) : (() => {
                        const score = result.stressScore;
                        const impacts = result.stressReasons || [];
                        
                        const currentCommute = predictedProfile ? predictedProfile.commuteTime : profile.commuteTime;
                        const currentSleep = predictedProfile ? predictedProfile.sleepHours : profile.sleepHours;
                        const currentTraffic = predictedProfile ? predictedProfile.trafficEncoded : 0;
                        const currentMood = predictedProfile ? predictedProfile.moodEncoded : 0;

                        let extremeConditions = 0;
                        if (currentCommute >= 90) extremeConditions += 1;
                        if (currentSleep <= 5) extremeConditions += 1;
                        if (currentTraffic >= 2) extremeConditions += 1;
                        if (currentMood >= 3) extremeConditions += 1;

                        if (score >= 8.5 && extremeConditions >= 3) {
                          return (
                            <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 min-h-[190px] flex flex-col justify-center">
                              <h4 className="text-red-500 font-bold mb-3">🚨 High Alert: Multi-Factor Overload Detected</h4>
                              <p className="text-[var(--text-color)] text-sm mb-2">All major stress amplifiers are active simultaneously.</p>
                              <p className="text-[var(--text-color)] text-sm mb-2">Extended commute, reduced recovery, congestion, and emotional load are interacting.</p>
                            </div>
                          );
                        }

                        if (score <= 3.5) {
                          return (
                            <div className="p-6 rounded-2xl glass-card min-h-[190px] flex flex-col items-center justify-center px-8">
                              <p className="text-emerald-500 font-medium text-center leading-relaxed">✅ Stress level is stable. Only minor background contributors detected.</p>
                            </div>
                          );
                        }

                        if (impacts.length === 0 || impacts.reduce((acc, r) => acc + r.delta, 0) < 0.2) {
                          return (
                            <div className="p-6 rounded-2xl glass-card min-h-[190px] flex flex-col items-center justify-center px-8">
                              <p className="text-[var(--text-color)] text-center leading-relaxed">No strong dominant driver found. Stress may be influenced by background variability.</p>
                            </div>
                          );
                        }

                        return (
                          <div className="flex flex-col gap-4">
                            <div className="text-[10px] uppercase font-bold text-[var(--text-color)] tracking-[0.15em]">
                              {score <= 6.5 ? "Moderate stress contributors" : "High stress drivers detected"}
                            </div>
                            
                            <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/20">
                              <div className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-[0.15em] mb-1.5">Primary Stress Driver</div>
                              <div className="text-[var(--text-color)] font-medium text-[0.95rem] leading-snug">
                                <span className="font-semibold">{impacts[0].factor}</span> is increasing your stress by <span className="text-red-400">+{impacts[0].delta.toFixed(2)}</span> impact.
                              </div>
                            </div>
                            
                            {impacts.length > 1 && (
                              <div className="space-y-3 mt-1">
                                <div className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-[0.15em]">Secondary Contributors</div>
                                <div className="space-y-2">
                                  {impacts.slice(1).map((reason, idx) => (
                                    <div key={idx} className="flex items-center gap-3">
                                      <div className="w-[120px] text-xs text-[var(--text-muted)] truncate">{reason.factor}</div>
                                      <div className="flex-1 h-1.5 bg-black/10 dark:bg-white/5 rounded-full overflow-hidden">
                                        <motion.div 
                                          initial={{ width: 0 }}
                                          animate={{ width: `${impacts[0].delta > 0 ? (reason.delta / impacts[0].delta) * 100 : 0}%` }}
                                          className="h-full bg-red-400 rounded-full"
                                        />
                                      </div>
                                      <div className="w-[45px] text-right text-xs font-mono text-[var(--text-muted)]">+{reason.delta.toFixed(2)}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="p-4 mt-2 rounded-xl glass-card">
                              <div className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-[0.15em] mb-1.5">System Interpretation</div>
                              <div className="text-[var(--text-color)] text-sm">
                                {score > 6.5 ? "Multiple high-load factors are interacting, leading to elevated stress response." : "Stress appears influenced by combined moderate factors."}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </motion.div>
                  </AnimatePresence>
                </div>

              </motion.div>

              <div 
                className="mt-6 p-5 rounded-[14px] bg-black/5 dark:bg-white/[0.03] border border-black/5 dark:border-white/[0.05] italic text-[#666] dark:text-[#cfcfcf] text-center"
              >
                <AnimatePresence mode="popLayout">
                  <motion.div
                    key={dailyInsight}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.3 }}
                  >
                    💡 {dailyInsight}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }} className="rounded-[40px] glass-panel p-12 relative z-10">
              <div className="flex justify-between items-start mb-16">
                <div>
                  <h2 className="text-4xl font-bold mb-3 tracking-tight text-[var(--text-color)]">Prediction Profile</h2>
                  <p className="text-[var(--text-muted)] text-sm tracking-wide">Configure your journey metrics for spatial analysis.</p>
                </div>
                {result?.stressScore !== undefined ? (
                  <div className="w-[4.5rem] h-[4.5rem] rounded-2xl bg-red-600 shadow-[0_0_40px_rgba(220,38,38,0.3)] flex items-center justify-center">
                    <span className="text-[1.75rem] font-bold text-white leading-none tracking-tight">{isAnalyzing ? "..." : result.stressScore}</span>
                  </div>
                ) : (
                  <div className="w-[4.5rem] h-[4.5rem] rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center">
                    <span className="text-[1.75rem] font-bold text-[var(--text-muted)] leading-none tracking-tight">{isAnalyzing ? "..." : "--"}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-14 gap-y-12 mb-12">
                
                {/* Left sliders */}
                <div className="space-y-10">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-[0.15em] text-[#9CA3AF]">
                      <span>Age (Years)</span>
                      <span className="font-mono text-[var(--text-color)] text-xs">{profile.age}</span>
                    </div>
                    <input type="range" min="18" max="70" value={profile.age} onChange={e => setProfile({...profile, age: +e.target.value})} className="w-full h-2 bg-black/10 dark:bg-white/10 rounded-full appearance-none accent-red-600 outline-none cursor-pointer" />
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-[0.15em] text-[#9CA3AF]">
                      <span>Commute (Min)</span>
                      <span className="font-mono text-[var(--text-color)] text-xs">{profile.commuteTime}</span>
                    </div>
                    <input type="range" min="5" max="180" step="5" value={profile.commuteTime} onChange={e => setProfile({...profile, commuteTime: +e.target.value})} className="w-full h-2 bg-black/10 dark:bg-white/10 rounded-full appearance-none accent-red-600 outline-none cursor-pointer" />
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-[0.15em] text-[#9CA3AF]">
                      <span>Sleep (Hrs)</span>
                      <span className="font-mono text-[var(--text-color)] text-xs">{profile.sleepHours}</span>
                    </div>
                    <input type="range" min="3" max="10" step="0.5" value={profile.sleepHours} onChange={e => setProfile({...profile, sleepHours: +e.target.value})} className="w-full h-2 bg-black/10 dark:bg-white/10 rounded-full appearance-none accent-red-600 outline-none cursor-pointer" />
                  </div>
                </div>

                {/* Right inputs */}
                <div className="space-y-12">
                  <div className="space-y-4">
                    <div className="text-[10px] uppercase font-bold tracking-[0.15em] text-[#9CA3AF]">Traffic State</div>
                    <select value={profile.trafficState} onChange={e => setProfile({...profile, trafficState: e.target.value as TrafficState})} className="w-full glass-card hover:border-[var(--text-muted)] text-[var(--text-color)] font-medium text-sm rounded-xl px-5 py-4 focus:ring-1 focus:ring-red-600 outline-none cursor-pointer transition-colors appearance-none md:bg-transparent">
                      {trafficStates.map(t => <option key={t} value={t} className="bg-[var(--bg-color)]">{t}</option>)}
                    </select>
                  </div>

                  <div className="space-y-4">
                    <div className="text-[10px] uppercase font-bold tracking-[0.15em] text-[#9CA3AF]">Current Mood</div>
                    <div className="flex gap-1.5 glass-card p-2 rounded-2xl w-full">
                      {moods.map(m => (
                        <button key={m.label} onClick={() => setProfile({...profile, mood: m.label})} className={`flex-1 flex flex-col items-center justify-center py-3 rounded-xl transition-all ${profile.mood === m.label ? 'bg-red-500/10 border border-red-500/30 shadow-sm' : 'border border-transparent hover:bg-black/5 dark:hover:bg-white/5'}`}>
                          <span className={`text-[1.35rem] mb-1.5 transition-transform ${profile.mood === m.label ? 'scale-110' : 'opacity-40 grayscale hover:opacity-100 hover:grayscale-0'}`}>{m.emoji}</span>
                          <span className={`text-[6.5px] uppercase font-bold tracking-widest ${profile.mood === m.label ? 'text-[var(--text-color)]' : 'text-[var(--text-muted)]'}`}>{m.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button disabled={isAnalyzing} onClick={handlePredict} className="w-full py-5 rounded-[1.25rem] bg-red-700 hover:bg-red-800 transition-all flex justify-center items-center gap-3 text-white shadow-[0_10px_30px_rgba(220,38,38,0.25)] active:scale-[0.98] disabled:opacity-70 disabled:cursor-wait">
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-white/70" />
                      <span className="font-bold text-[1.05rem]">{loadingMessages[loadingStep]}</span>
                    </>
                  ) : (
                    <>
                      <span className="font-bold text-[1.1rem] tracking-wide">Predict Stress Level</span>
                      <ChevronRight className="w-5 h-5 text-white/70" />
                    </>
                  )}
                </button>
              </div>

              <div className="mt-8 pt-8 border-t border-[var(--border-color)]">
                 <div className="flex items-center gap-3 mb-6">
                   <Brain className="w-6 h-6 text-amber-500" />
                   <h3 className="text-[10px] uppercase font-bold tracking-[0.15em] text-[var(--text-color)]">Smart Assistant</h3>
                 </div>
                 <div className="p-6 rounded-2xl glass-card flex flex-col justify-center">
                    {!result ? (
                      <p className="text-[var(--text-muted)] text-sm text-center">Run prediction to activate Smart Assistant.</p>
                    ) : (
                      <div className="space-y-3">
                        {result.stressScore <= 3.5 && (
                          <p className="text-emerald-500 font-medium text-sm leading-relaxed">✅ Your stress level is stable. Maintain hydration, light music, and steady breathing.</p>
                        )}
                        {result.stressScore > 3.5 && result.stressScore <= 6.5 && (
                          <p className="text-amber-500 font-medium text-sm leading-relaxed">⚠ Your stress is moderately elevated. Try controlled breathing and reduce mental load.</p>
                        )}
                        {result.stressScore > 6.5 && (
                          <p className="text-red-500 font-medium text-sm leading-relaxed">🚨 High stress detected. Consider pausing safely, deep breathing, or short mental reset.</p>
                        )}
                      </div>
                    )}
                 </div>
              </div>
            </motion.div>

          </div>
        )}

        {/* OTHER TABS */}
        {activeTab === 'Recovery & Stability' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto mt-12 glass-panel rounded-[2rem] p-12">
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-3"><Activity className="w-8 h-8 text-red-600"/> Recovery & Stability</h2>
            
            {result && predictedProfile ? (
              <div className="space-y-8">
                {/* SECTION 1 - Recovery Projection */}
                <div>
                  <h3 className="text-xl font-bold mb-4 text-[var(--text-color)]">Recovery Projection</h3>
                  <div className="glass-card p-6 rounded-2xl flex flex-col space-y-4">
                    {(() => {
                      const score = result.stressScore;

                      if (score <= 3.5) {
                        return (
                          <div className="text-center p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                            <p className="text-emerald-500 font-medium tracking-wide">Your stress level is already within optimal range. No recovery optimization required.</p>
                          </div>
                        );
                      }

                      const { age, commuteTime, sleepHours, trafficEncoded, moodEncoded } = predictedProfile;

                      const improvedCommute = Math.min(commuteTime, 30);
                      const improvedSleep = Math.max(sleepHours, 8);
                      const improvedTraffic = Math.min(trafficEncoded, 0);
                      const improvedMood = Math.min(moodEncoded, 1);

                      const optimizedScoreRaw = getScore(age, improvedCommute, improvedSleep, improvedTraffic, improvedMood);
                      const optimizedScore = Math.max(1, Math.min(10, Math.round(optimizedScoreRaw * 10) / 10));

                      const recoveryGain = Math.max(0, Math.round((score - optimizedScore) * 100) / 100);
                      const recoveryPercent = score > 0 ? (Math.round((recoveryGain / score) * 100 * 10) / 10) : 0;

                      if (score <= 6.5 && recoveryGain < 1.0) {
                        return (
                          <div className="text-center p-6 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                            <p className="text-blue-400 font-medium tracking-wide">Minor improvements possible, but your stress is reasonably managed.</p>
                          </div>
                        );
                      }

                      let dominantFactor = "";
                      let maxImpact = 0;

                      const testCases = [
                        { factor: "Commute Optimization", inputs: [age, 30, sleepHours, trafficEncoded, moodEncoded] },
                        { factor: "Sleep Recovery", inputs: [age, commuteTime, 8, trafficEncoded, moodEncoded] },
                        { factor: "Traffic Relief", inputs: [age, commuteTime, sleepHours, 0, moodEncoded] },
                        { factor: "Mood Stabilization", inputs: [age, commuteTime, sleepHours, trafficEncoded, 1] }
                      ];

                      testCases.forEach(tc => {
                        const testScoreRaw = getScore(tc.inputs[0], tc.inputs[1], tc.inputs[2], tc.inputs[3], tc.inputs[4]);
                        const testScore = Math.max(1, Math.min(10, Math.round(testScoreRaw * 10) / 10));
                        const impact = Math.round((score - testScore) * 100) / 100;
                        if (impact > maxImpact) {
                          maxImpact = impact;
                          dominantFactor = tc.factor;
                        }
                      });
                      
                      return (
                        <>
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="p-4 bg-black/10 dark:bg-white/5 rounded-xl">
                              <p className="text-[10px] uppercase font-bold tracking-[0.15em] text-[var(--text-muted)] mb-1">Current Stress</p>
                              <p className="text-2xl font-bold text-red-500">{score.toFixed(2)}</p>
                            </div>
                            <div className="p-4 bg-black/10 dark:bg-white/5 rounded-xl">
                              <p className="text-[10px] uppercase font-bold tracking-[0.15em] text-[var(--text-muted)] mb-1">Optimized Potential</p>
                              <p className="text-2xl font-bold text-emerald-500">{optimizedScore.toFixed(2)}</p>
                            </div>
                            <div className="p-4 bg-black/10 dark:bg-white/5 rounded-xl">
                              <p className="text-[10px] uppercase font-bold tracking-[0.15em] text-[var(--text-muted)] mb-1">Recovery Window</p>
                              <p className="text-2xl font-bold text-[var(--text-color)]">{recoveryGain.toFixed(2)} pts</p>
                            </div>
                          </div>
                          
                          <div className="text-center text-[var(--text-muted)]">
                            <p>Recovery Potential: {recoveryPercent.toFixed(1)}%</p>
                          </div>

                          <div className="mt-2 text-center p-3 rounded-lg bg-black/5 dark:bg-white/5">
                            {dominantFactor && maxImpact > 0 ? (
                              <p className="text-emerald-500 font-medium tracking-wide">Greatest improvement possible from: {dominantFactor}</p>
                            ) : (
                              <p className="text-blue-400 font-medium tracking-wide">Your current stress profile is already near optimal.</p>
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* SECTION 2 - Stress Pattern Analysis */}
                <div>
                  <h3 className="text-xl font-bold mb-4 text-[var(--text-color)]">Stress Pattern Analysis</h3>
                  <div className="glass-card p-6 rounded-2xl flex flex-col justify-center">
                    {history.length === 0 ? (
                      <p className="text-[var(--text-muted)] text-center py-6">Run predictions over time to unlock behavioral stress insights.</p>
                    ) : history.length === 1 ? (
                      <p className="text-[var(--text-muted)] text-center py-6">At least two sessions are required to analyze stress trends.</p>
                    ) : (
                      (() => {
                        const recentScores = history.slice(-5);
                        
                        let trend = "Stable Pattern";
                        const delta = recentScores[recentScores.length - 1] - recentScores[0];
                        const current_score = recentScores[recentScores.length - 1];
                        
                        if (delta > 1.0) {
                          trend = "Significant Upward Trend";
                        } else if (delta > 0.5) {
                          trend = "Moderate Upward Shift";
                        } else if (delta > 0.2) {
                          trend = "Mild Increase";
                        } else if (delta < -1.0) {
                          trend = "Significant Downward Trend";
                        } else if (delta < -0.5) {
                          trend = "Moderate Downward Shift";
                        } else if (delta < -0.2) {
                          trend = "Mild Decrease";
                        }

                        let zone = "High";
                        if (current_score <= 3.5) {
                            zone = "Low";
                        } else if (current_score <= 6.5) {
                            zone = "Moderate";
                        }

                        let trendExplanation = "";
                        if (trend.includes("Upward")) {
                          if (zone === "High") {
                            trendExplanation = "Stress is increasing and remains in a high-risk range. Immediate stress management is recommended.";
                          } else if (zone === "Moderate") {
                            trendExplanation = "Stress levels are trending upward. Monitor contributing factors.";
                          } else {
                            trendExplanation = "Stress is increasing slightly but remains within healthy range.";
                          }
                        } else if (trend.includes("Downward")) {
                          if (zone === "High") {
                            trendExplanation = "Stress is decreasing but still remains elevated. Continued management advised.";
                          } else if (zone === "Moderate") {
                            trendExplanation = "Stress levels are improving but remain moderately elevated.";
                          } else {
                            trendExplanation = "Stress levels are decreasing and remain within healthy range.";
                          }
                        } else if (trend.includes("Increase")) {
                          trendExplanation = "Minor upward variation detected. Stress remains stable overall.";
                        } else if (trend.includes("Decrease")) {
                          trendExplanation = "Minor downward variation detected.";
                        } else {
                          trendExplanation = "Stress fluctuations remain within normal variation.";
                        }
                        
                        let stability = 0;
                        let pattern = "";
                        let stabilityExplanation = "";
                        
                        if (recentScores.length >= 3) {
                          const mean = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
                          const variance = recentScores.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / recentScores.length;
                          stability = Math.round(Math.sqrt(variance) * 100) / 100;

                          if (stability < 0.5) {
                            pattern = "Highly Stable Stress Pattern";
                            stabilityExplanation = "Your stress levels remain consistent across sessions.";
                          } else if (stability < 1.2) {
                            pattern = "Adaptive Stress Pattern";
                            stabilityExplanation = "Your stress fluctuates moderately depending on conditions.";
                          } else {
                            pattern = "Reactive Stress Pattern";
                            stabilityExplanation = "Your stress levels change significantly based on environment.";
                          }
                        }
                        
                        const chartData = recentScores.map((s, i) => ({ index: i, score: s }));
                        
                        return (
                          <div className="space-y-6">
                            <div className="flex justify-between items-start px-4">
                              <div>
                                <p className="text-[10px] uppercase font-bold tracking-[0.15em] text-[var(--text-muted)] mb-1">Trend Direction</p>
                                <p className="text-[var(--text-color)] font-medium">{trend}</p>
                                <p className="text-sm text-[var(--text-muted)] mt-1">{trendExplanation}</p>
                              </div>
                              {recentScores.length >= 3 && (
                                <div className="text-right">
                                  <p className="text-[10px] uppercase font-bold tracking-[0.15em] text-[var(--text-muted)] mb-1">Variability Score</p>
                                  <p className="text-xl font-bold text-[var(--text-color)]">{stability}</p>
                                </div>
                              )}
                            </div>
                            
                            <div className="h-40 w-full mt-4">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                                  <YAxis domain={['dataMin - 1', 'dataMax + 1']} hide />
                                  <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', background: 'rgba(0,0,0,0.8)', color: '#fff' }} 
                                    itemStyle={{ color: '#fff' }} 
                                    labelStyle={{ display: 'none' }}
                                  />
                                  <Line type="monotone" dataKey="score" stroke="#ef4444" strokeWidth={3} dot={{ r: 5, fill: '#ef4444' }} activeDot={{ r: 8 }} />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>

                            {recentScores.length >= 3 && (
                              <div className="p-4 bg-black/10 dark:bg-white/5 rounded-xl text-center">
                                <p className={`font-medium mb-1 ${stability < 0.5 ? 'text-emerald-500' : stability < 1.2 ? 'text-amber-500' : 'text-red-500'}`}>{pattern}</p>
                                <p className="text-[var(--text-muted)] text-sm">{stabilityExplanation}</p>
                              </div>
                            )}
                          </div>
                        );
                      })()
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <h3 className="text-xl text-[var(--text-muted)] mb-2">No data yet</h3>
                <p className="text-[var(--text-muted)]">Run prediction to see recovery insights.</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'In-Traffic Support' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto mt-12 glass-panel rounded-[2rem] p-12">
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-3"><Navigation className="w-8 h-8 text-red-600"/> In-Traffic Support</h2>
            {!result || !predictedProfile ? (
              <div className="text-center py-6 glass-card rounded-xl">
                <p className="text-[var(--text-muted)] font-medium">Run prediction to activate In-Traffic Support.</p>
              </div>
            ) : (() => {
              const score = result.stressScore;
              const { trafficEncoded, moodEncoded, commuteTime, sleepHours } = predictedProfile;
              const zone = score <= 3.5 ? "Low" : score <= 6.5 ? "Moderate" : "High";
              const cognitiveLoad = Math.round(score * 10);
              const reactionRisk = Math.round(score * 1.5 * 10) / 10;

              return (
                <div className="space-y-8">
                  {/* Driver State Summary */}
                  <div className="glass-card p-6 rounded-2xl flex flex-col space-y-4">
                     <h3 className="text-xl font-bold mb-2 text-[var(--text-color)]">Driver State Summary</h3>
                     
                     {zone === "Low" ? (
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl mb-4">
                           <p className="text-emerald-500 font-medium tracking-wide">🟢 Calm Drive Mode Active</p>
                        </div>
                     ) : zone === "Moderate" ? (
                        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-4">
                           <p className="text-amber-500 font-medium tracking-wide">🟡 Focus Mode Active</p>
                        </div>
                     ) : (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-4">
                           <p className="text-red-500 font-bold tracking-wide">🔴 High Alert Mode Activated</p>
                        </div>
                     )}

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-[10px] uppercase font-bold tracking-[0.15em] text-[var(--text-muted)] mb-1">Stress Level</p>
                            <p className="text-lg font-medium text-[var(--text-color)]">{zone}</p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold tracking-[0.15em] text-[var(--text-muted)] mb-1">Current Score</p>
                            <p className="text-lg font-medium text-[var(--text-color)]">{Math.round(score * 100) / 100}</p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold tracking-[0.15em] text-[var(--text-muted)] mb-1">Cognitive Load Estimate</p>
                            <p className="text-lg font-medium text-[var(--text-color)]">{cognitiveLoad}%</p>
                        </div>
                        {(zone === "Moderate" || zone === "High") && (
                           <div>
                              <p className="text-[10px] uppercase font-bold tracking-[0.15em] text-[var(--text-muted)] mb-1">Estimated Reaction Delay Risk</p>
                              <p className="text-lg font-medium text-red-400">+{zone === "High" ? reactionRisk + 5 : reactionRisk}%</p>
                           </div>
                        )}
                     </div>
                  </div>

                  {/* Adaptive Interventions */}
                  {(zone === "Moderate" || zone === "High") && (
                      <div className="glass-card p-6 rounded-2xl flex flex-col space-y-4">
                        <h3 className="text-xl font-bold mb-2 text-[var(--text-color)]">{zone === "Moderate" ? "Micro Reset Protocol" : "Deep Reset Protocol"}</h3>
                        <div className="p-4 bg-black/10 dark:bg-white/5 rounded-xl">
                            <ul className="list-disc list-inside space-y-2 text-[var(--text-color)]">
                                <li>Inhale 4 seconds</li>
                                <li>Hold {zone === "Moderate" ? "4" : "7"} seconds</li>
                                <li>Exhale {zone === "Moderate" ? "4" : "8"} seconds</li>
                            </ul>
                        </div>
                      </div>
                  )}

                  {/* Context-Aware Driving Advice */}
                  <div className="glass-card p-6 rounded-2xl flex flex-col space-y-4">
                      <h3 className="text-xl font-bold mb-2 text-[var(--text-color)]">Context-Aware Advice</h3>
                      <div className="space-y-3">
                        {commuteTime > 60 && (
                           <div className="flex items-start gap-3 p-3 bg-black/10 dark:bg-white/5 rounded-lg border-l-4 border-amber-500">
                              <p className="text-[var(--text-color)] text-sm">Long commute detected. Maintain lane discipline and reduce aggressive maneuvers.</p>
                           </div>
                        )}
                        {trafficEncoded === 3 && (
                           <div className="flex items-start gap-3 p-3 bg-black/10 dark:bg-white/5 rounded-lg border-l-4 border-amber-500">
                              <p className="text-[var(--text-color)] text-sm">Heavy congestion detected. Avoid frequent lane switching.</p>
                           </div>
                        )}
                        {sleepHours < 6 && (
                           <div className="flex items-start gap-3 p-3 bg-black/10 dark:bg-white/5 rounded-lg border-l-4 border-amber-500">
                              <p className="text-[var(--text-color)] text-sm">Low sleep detected. Reduce cognitive multitasking.</p>
                           </div>
                        )}
                        {moodEncoded >= 3 && (
                           <div className="flex items-start gap-3 p-3 bg-black/10 dark:bg-white/5 rounded-lg border-l-4 border-amber-500">
                              <p className="text-[var(--text-color)] text-sm">Elevated emotional load detected. Relax grip on steering wheel.</p>
                           </div>
                        )}
                        {!(commuteTime > 60 || trafficEncoded === 3 || sleepHours < 6 || moodEncoded >= 3) && (
                           <p className="text-[var(--text-muted)] text-sm">No specific contextual hazards detected for this journey.</p>
                        )}
                      </div>
                  </div>

                  {/* Trend Awareness Integration */}
                  {history.length >= 2 && (
                     <div className="glass-card p-6 rounded-2xl flex flex-col space-y-4">
                        <h3 className="text-xl font-bold mb-2 text-[var(--text-color)]">Session Delta Analysis</h3>
                        {(() => {
                           const currentScore = history[history.length - 1];
                           const previousScore = history[history.length - 2];
                           const delta = Math.round((currentScore - previousScore) * 100) / 100;
                           
                           let zone = "High";
                           if (currentScore <= 3.5) {
                               zone = "Low";
                           } else if (currentScore <= 6.5) {
                               zone = "Moderate";
                           }

                           let message = "";
                           if (Math.abs(delta) < 0.3) {
                               message = "Minor variation detected. Stress remains stable.";
                           } else if (delta <= -1.5) {
                               message = "Significant stress reduction detected. Maintain current coping strategies.";
                           } else if (delta < -0.3) {
                               message = "Noticeable stress improvement since last session.";
                           } else if (delta >= 1.5) {
                               message = "Rapid stress escalation detected. Immediate regulation recommended.";
                           } else if (delta > 0.3) {
                               message = "Stress has increased compared to last session. Review contributing factors.";
                           }

                           if (delta < 0 && zone === "High") {
                               message += " However, stress remains elevated.";
                           }
                           
                           if (delta > 0 && zone === "Low") {
                               message += " Stress remains within healthy range.";
                           }

                           return <p className="text-[var(--text-color)] text-sm">{message}</p>;
                        })()}
                     </div>
                  )}

                </div>
              );
            })()}
          </motion.div>
        )}

        {activeTab === 'Crowd Intel' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto mt-12 glass-panel rounded-[2rem] p-12">
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-3"><Users className="w-8 h-8 text-red-600"/> Crowd Intelligence</h2>
            {!result ? (
              <div className="text-center py-6 glass-card rounded-xl">
                 <p className="text-[var(--text-muted)] font-medium">Run prediction to compare with commuter benchmarks.</p>
              </div>
            ) : (() => {
               const score = result.stressScore;
               
               const MOCK_POPULATION = Array.from({ length: 1000 }, (_, i) => {
                  let u = 0, v = 0;
                  while (u === 0) u = Math.random();
                  while (v === 0) v = Math.random();
                  let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
                  return Math.min(10, Math.max(1, (num * 1.5) + 5.2));
               });
               
               const mean_stress = MOCK_POPULATION.reduce((a, b) => a + b, 0) / MOCK_POPULATION.length;
               
               const belowScoreCount = MOCK_POPULATION.filter(s => s < score).length;
               const percentile = Math.round((belowScoreCount / MOCK_POPULATION.length) * 100 * 10) / 10;
               
               const deviation = Math.round((score - mean_stress) * 100) / 100;
               
               let tier = "";
               if (Math.abs(deviation) < 0.5) {
                   tier = "Within Normal Commuter Range";
               } else if (deviation >= 0.5 && deviation < 1.5) {
                   tier = "Slightly Elevated Compared to Peers";
               } else if (deviation >= 1.5) {
                   tier = "Significantly Above Population Average";
               } else if (deviation <= -0.5 && deviation > -1.5) {
                   tier = "Below Average Stress Level";
               } else {
                   tier = "Significantly Below Population Average";
               }
               
               let explanation = "";
               if (percentile >= 75) {
                   explanation = "Your stress level is higher than most commuters. Consider stress mitigation strategies.";
               } else if (percentile >= 40) {
                   explanation = "Your stress level aligns with typical commuter experiences.";
               } else {
                   explanation = "Your stress level is lower than the majority of commuters.";
               }

               const comparisonData = [
                  { name: "Population Average", value: Math.round(mean_stress * 100) / 100 },
                  { name: "Your Score", value: Math.round(score * 100) / 100 }
               ];

               return (
                  <div className="space-y-8">
                     <h3 className="text-xl font-bold text-[var(--text-color)]">Behavioral Benchmark</h3>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="glass-card p-6 rounded-2xl flex flex-col justify-center">
                           <p className="text-[10px] uppercase font-bold tracking-[0.15em] text-[var(--text-muted)] mb-1">Population Mean Stress</p>
                           <p className="text-2xl font-medium text-[var(--text-color)]">{Math.round(mean_stress * 100) / 100}</p>
                        </div>
                        <div className="glass-card p-6 rounded-2xl flex flex-col justify-center">
                           <p className="text-[10px] uppercase font-bold tracking-[0.15em] text-[var(--text-muted)] mb-1">Your Stress Score</p>
                           <p className="text-2xl font-medium text-[var(--text-color)]">{Math.round(score * 100) / 100}</p>
                        </div>
                        <div className="glass-card p-6 rounded-2xl flex flex-col justify-center">
                           <p className="text-[10px] uppercase font-bold tracking-[0.15em] text-[var(--text-muted)] mb-1">Deviation from Average</p>
                           <p className={`text-2xl font-medium ${deviation > 0 ? "text-amber-500" : "text-emerald-500"}`}>{deviation > 0 ? `+${deviation}` : deviation}</p>
                        </div>
                        <div className="glass-card p-6 rounded-2xl flex flex-col justify-center">
                           <p className="text-[10px] uppercase font-bold tracking-[0.15em] text-[var(--text-muted)] mb-1">Percentile Ranking</p>
                           <p className="text-2xl font-medium text-[var(--text-color)]">{percentile}%</p>
                        </div>
                     </div>

                     <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                        <p className="text-emerald-500 font-medium tracking-wide text-center">{tier}</p>
                     </div>

                     <div className="glass-card p-6 rounded-2xl">
                        <p className="text-[10px] uppercase font-bold tracking-[0.15em] text-[var(--text-muted)] mb-6 text-center">Visual Comparison</p>
                        <div className="h-64 w-full">
                           <ResponsiveContainer width="100%" height="100%">
                             <BarChart data={comparisonData}>
                               <XAxis dataKey="name" stroke="#6b7280" />
                               <YAxis stroke="#6b7280" domain={[0, 10]} />
                               <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px' }} />
                               <Bar dataKey="value" fill="#ef4444" radius={[4, 4, 0, 0]} />
                             </BarChart>
                           </ResponsiveContainer>
                        </div>
                     </div>

                     <div className="glass-card p-6 rounded-2xl">
                        <p className="text-[var(--text-color)] text-center text-sm">{explanation}</p>
                     </div>
                  </div>
               );
            })()}
          </motion.div>
        )}

        {result && (
          <div className="max-w-4xl mx-auto mt-8 mb-12 glass-panel rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full sm:w-auto flex-1 max-w-sm">
              <input
                type="text"
                placeholder="Enter Your Name for Report"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-4 py-2.5 text-[var(--text-color)] text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-shadow"
              />
            </div>
            <button
              onClick={generatePDFReport}
              className="w-full sm:w-auto px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 text-sm shadow-md"
            >
              <Download className="w-4 h-4" />
              Download Stress Report (PDF)
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
