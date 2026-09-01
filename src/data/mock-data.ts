export interface SkillScore {
  name: string;
  score: number;
  previousScore: number;
  trend: "up" | "down" | "flat";
  color: string;
}

export interface CaseData {
  id: string;
  title: string;
  company: string;
  type: string;
  difficulty: "Easy" | "Medium" | "Hard";
  duration: number;
  skills: string[];
  completed: boolean;
  score?: number;
}

export interface AssessmentData {
  id: string;
  title: string;
  category: string;
  questions: number;
  timeMinutes: number;
  difficulty: "Easy" | "Medium" | "Hard";
  completed: boolean;
  score?: number;
}

export interface ApplicationData {
  id: string;
  company: string;
  role: string;
  deadline: string;
  stage: "Preparing" | "Applied" | "OA" | "Interview" | "Offer" | "Rejected";
  preparation: number;
}

export interface ReadinessEntry {
  date: string;
  score: number;
}

export const userProfile = {
  name: "Alex",
  email: "alex.chen@email.com",
  targetFirms: ["BCG", "Bain", "McKinsey"],
  experienceLevel: "Intermediate" as const,
  interviewDate: "2026-09-13",
  readinessScore: 78,
  previousReadinessScore: 66,
  streak: 12,
  totalCasesCompleted: 24,
  averageScore: 74,
  averageCaseTime: 26,
};

export const skillScores: SkillScore[] = [
  { name: "Structuring", score: 82, previousScore: 74, trend: "up", color: "#1e3a5f" },
  { name: "Quantitative Analysis", score: 89, previousScore: 85, trend: "up", color: "#2563eb" },
  { name: "Mental Math", score: 76, previousScore: 72, trend: "up", color: "#7c3aed" },
  { name: "Business Judgment", score: 64, previousScore: 62, trend: "up", color: "#d97706" },
  { name: "Communication", score: 73, previousScore: 70, trend: "up", color: "#059669" },
  { name: "Synthesis", score: 61, previousScore: 50, trend: "up", color: "#dc2626" },
];

export const readinessOverTime: ReadinessEntry[] = [
  { date: "Aug 1", score: 42 },
  { date: "Aug 4", score: 48 },
  { date: "Aug 7", score: 52 },
  { date: "Aug 10", score: 55 },
  { date: "Aug 13", score: 58 },
  { date: "Aug 16", score: 62 },
  { date: "Aug 19", score: 60 },
  { date: "Aug 22", score: 66 },
  { date: "Aug 25", score: 70 },
  { date: "Aug 28", score: 74 },
  { date: "Aug 31", score: 78 },
];

export const practiceCases: CaseData[] = [
  {
    id: "case-1",
    title: "Global Coffee Co.",
    company: "Global Coffee Co.",
    type: "Profitability",
    difficulty: "Medium",
    duration: 25,
    skills: ["Structuring", "Quantitative", "Synthesis"],
    completed: true,
    score: 78,
  },
  {
    id: "case-2",
    title: "Meridian Airlines",
    company: "Meridian Airlines",
    type: "Market Entry",
    difficulty: "Hard",
    duration: 35,
    skills: ["Business Judgment", "Quantitative", "Communication"],
    completed: true,
    score: 65,
  },
  {
    id: "case-3",
    title: "TechVault Inc.",
    company: "TechVault Inc.",
    type: "Growth Strategy",
    difficulty: "Medium",
    duration: 30,
    skills: ["Structuring", "Business Judgment", "Synthesis"],
    completed: false,
  },
  {
    id: "case-4",
    title: "Urban Fresh Markets",
    company: "Urban Fresh Markets",
    type: "Operations",
    difficulty: "Easy",
    duration: 20,
    skills: ["Structuring", "Quantitative"],
    completed: false,
  },
  {
    id: "case-5",
    title: "Nova Pharma",
    company: "Nova Pharma",
    type: "M&A",
    difficulty: "Hard",
    duration: 40,
    skills: ["Quantitative", "Business Judgment", "Synthesis", "Communication"],
    completed: false,
  },
  {
    id: "case-6",
    title: "Atlas Logistics",
    company: "Atlas Logistics",
    type: "Profitability",
    difficulty: "Medium",
    duration: 25,
    skills: ["Structuring", "Quantitative", "Business Judgment"],
    completed: false,
  },
  {
    id: "case-7",
    title: "Pinnacle Bank",
    company: "Pinnacle Bank",
    type: "Market Entry",
    difficulty: "Hard",
    duration: 35,
    skills: ["Business Judgment", "Synthesis", "Communication"],
    completed: false,
  },
  {
    id: "case-8",
    title: "BrightPath Education",
    company: "BrightPath Education",
    type: "Growth Strategy",
    difficulty: "Easy",
    duration: 20,
    skills: ["Structuring", "Business Judgment"],
    completed: false,
  },
];

export const skillDrills = [
  {
    id: "drill-1",
    title: "Business Judgment Drill",
    description: "Practice identifying the most important business implications from limited information.",
    duration: 10,
    skills: ["Business Judgment"],
    difficulty: "Medium",
    completed: false,
  },
  {
    id: "drill-2",
    title: "Mental Math Sprint",
    description: "Timed arithmetic challenges at consulting-speed pace.",
    duration: 10,
    skills: ["Mental Math", "Quantitative"],
    difficulty: "Medium",
    completed: true,
    score: 82,
  },
  {
    id: "drill-3",
    title: "Synthesis Under Pressure",
    description: "Summarize findings into a clear recommendation under time pressure.",
    duration: 10,
    skills: ["Synthesis", "Communication"],
    difficulty: "Hard",
    completed: false,
  },
  {
    id: "drill-4",
    title: "Framework Selection",
    description: "Choose the right framework for each business problem scenario.",
    duration: 10,
    skills: ["Structuring"],
    difficulty: "Easy",
    completed: false,
  },
  {
    id: "drill-5",
    title: "Data Interpretation",
    description: "Read charts and tables quickly to extract key insights.",
    duration: 15,
    skills: ["Quantitative", "Business Judgment"],
    difficulty: "Medium",
    completed: false,
  },
  {
    id: "drill-6",
    title: "Structuring Speed Run",
    description: "Build issue trees as fast as possible for common case types.",
    duration: 10,
    skills: ["Structuring"],
    difficulty: "Medium",
    completed: false,
  },
];

export const mentalMathDrills = [
  {
    id: "mm-1",
    title: "Mental Math Sprint",
    description: "10 rapid-fire calculations at consulting speed.",
    duration: 10,
    questions: 15,
    difficulty: "Medium",
    completed: true,
    score: 82,
  },
  {
    id: "mm-2",
    title: "Percentage Master",
    description: "Practice percentage calculations commonly used in cases.",
    duration: 10,
    questions: 12,
    difficulty: "Medium",
    completed: false,
  },
  {
    id: "mm-3",
    title: "Market Sizing Math",
    description: "Quick estimations for market sizing calculations.",
    duration: 15,
    questions: 8,
    difficulty: "Hard",
    completed: false,
  },
];

export const dataInterpDrills = [
  {
    id: "di-1",
    title: "Chart Analysis",
    description: "Interpret business charts and extract key insights.",
    duration: 15,
    questions: 10,
    difficulty: "Medium",
    completed: false,
  },
  {
    id: "di-2",
    title: "Table Extraction",
    description: "Quickly identify important data from financial tables.",
    duration: 12,
    questions: 8,
    difficulty: "Easy",
    completed: false,
  },
];

export const behavioralDrills = [
  {
    id: "bh-1",
    title: "Fit Interview Practice",
    description: "Practice common behavioral questions for consulting interviews.",
    duration: 15,
    questions: 6,
    difficulty: "Medium",
    completed: false,
  },
  {
    id: "bh-2",
    title: "Storytelling Framework",
    description: "Structure compelling personal stories using the STAR method.",
    duration: 10,
    questions: 4,
    difficulty: "Easy",
    completed: false,
  },
];

export const assessments: AssessmentData[] = [
  {
    id: "assess-1",
    title: "Numerical Reasoning",
    category: "Numerical Reasoning",
    questions: 20,
    timeMinutes: 25,
    difficulty: "Medium",
    completed: true,
    score: 85,
  },
  {
    id: "assess-2",
    title: "Logical Reasoning",
    category: "Logical Reasoning",
    questions: 18,
    timeMinutes: 20,
    difficulty: "Medium",
    completed: false,
  },
  {
    id: "assess-3",
    title: "Data Interpretation",
    category: "Data Interpretation",
    questions: 15,
    timeMinutes: 20,
    difficulty: "Hard",
    completed: false,
  },
  {
    id: "assess-4",
    title: "Situational Judgment",
    category: "Situational Judgment",
    questions: 12,
    timeMinutes: 15,
    difficulty: "Medium",
    completed: false,
  },
];

export const applications: ApplicationData[] = [
  { id: "app-1", company: "BCG", role: "Associate", deadline: "2026-09-15", stage: "Applied", preparation: 84 },
  { id: "app-2", company: "Bain", role: "Consultant", deadline: "2026-09-20", stage: "OA", preparation: 71 },
  { id: "app-3", company: "Deloitte", role: "Analyst", deadline: "2026-09-25", stage: "Preparing", preparation: 45 },
  { id: "app-4", company: "McKinsey", role: "Associate", deadline: "2026-10-01", stage: "Preparing", preparation: 62 },
  { id: "app-5", company: "Kearney", role: "Consultant", deadline: "2026-10-10", stage: "Preparing", preparation: 30 },
];

export const todayTraining = [
  { id: "t-1", title: "Business Judgment Drill", duration: 10, completed: false, type: "drill" as const },
  { id: "t-2", title: "Profitability Case", duration: 30, completed: false, type: "case" as const },
  { id: "t-3", title: "Mental Math Sprint", duration: 10, completed: true, type: "drill" as const },
];

// Case interview mock conversation
export const caseConversation = {
  caseId: "case-1",
  title: "Global Coffee Co.",
  type: "Profitability",
  company: "Global Coffee Co.",
  totalQuestions: 5,
  currentQuestion: 2,
  elapsedSeconds: 342,
  questions: [
    {
      id: 1,
      type: "introduction",
      interviewer: "The client is a global coffee company whose profits have declined by 15% over the last year. Revenue has remained relatively flat, but costs have increased significantly. How would you approach this problem?",
      candidateResponse: "I'd like to structure this problem by breaking down profitability into its core components: revenue and costs. On the revenue side, I'd examine pricing, volume, and product mix. On the costs side, I'd look at fixed vs. variable costs, raw material costs, and operational efficiency. Let me start by building an issue tree.",
    },
    {
      id: 2,
      type: "probe",
      interviewer: "That's a solid structure. Now, given that revenue is flat but profits are down 15%, where would you focus first and why?",
    },
  ],
  notes: "Revenue flat, costs up 15%\nKey areas to explore:\n- Raw material costs (coffee beans)\n- Labor costs\n- Supply chain\n- Store operations",
  issueTree: {
    label: "Profit Decline",
    children: [
      {
        label: "Revenue",
        children: [
          { label: "Price" },
          { label: "Volume" },
          { label: "Mix" },
        ],
      },
      {
        label: "Costs",
        children: [
          { label: "Fixed" },
          { label: "Variable" },
        ],
      },
    ],
  },
};

export const caseFeedback = {
  score: 78,
  maxScore: 100,
  skillBreakdown: skillScores,
  strengths: [
    "Strong initial structure that covered all major profitability drivers",
    "Accurate mental math throughout the quantitative sections",
    "Clear and logical progression through the case",
  ],
  biggestOpportunity: {
    skill: "Synthesis",
    score: 61,
    feedback: "You identified the correct drivers but took too long to connect the findings into a clear recommendation.",
  },
  betterApproach:
    "Instead of listing all findings before synthesizing, try weaving your synthesis throughout the case. After each major analysis, briefly state what it means for the overall recommendation. This demonstrates executive-level communication.",
  recommendedDrill: {
    title: "Synthesis Under Pressure",
    duration: 10,
    skill: "Synthesis",
  },
};

// Assessment questions for the assessment UI
export const assessmentQuestions = [
  {
    id: 1,
    question: "A company's revenue grew from $4.2M to $5.1M while profit margin decreased from 12% to 9%. What happened to absolute profit?",
    options: [
      "Increased by approximately $108K",
      "Decreased by approximately $96K",
      "Stayed approximately the same",
      "Increased by approximately $60K",
    ],
    correctIndex: 0,
  },
  {
    id: 2,
    question: "If a market is growing at 8% annually and a company's market share drops from 25% to 22% over 2 years, what happened to the company's revenue?",
    options: [
      "It definitely declined",
      "It likely increased",
      "It stayed the same",
      "Cannot be determined without more information",
    ],
    correctIndex: 1,
  },
  {
    id: 3,
    question: "A retail chain has 200 stores. If top-quartile stores generate $2.5M revenue and bottom-quartile generate $0.8M, and the average is $1.6M, what can we infer about the middle two quartiles?",
    options: [
      "They generate between $0.8M and $1.6M",
      "They generate approximately $1.4M–$1.8M on average",
      "They must generate exactly $1.6M each",
      "They generate more than the top quartile",
    ],
    correctIndex: 1,
  },
];

export const notifications = [
  { id: "n-1", title: "Case completed", message: "You scored 78/100 on Global Coffee Co.", time: "2 hours ago", read: false },
  { id: "n-2", title: "Streak milestone", message: "You've maintained a 12-day practice streak!", time: "1 day ago", read: false },
  { id: "n-3", title: "New drill available", message: "Synthesis Under Pressure drill is now available", time: "2 days ago", read: true },
];
