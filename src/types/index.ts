export type ID = string;
export type UUID = string;

export interface BaseEntity {
  id: ID;
  created_at: string;
  updated_at: string;
}

export type Trend = "up" | "down" | "flat";
export type Difficulty = "Easy" | "Medium" | "Hard";
export type AttemptStatus = "in_progress" | "completed" | "abandoned" | "paused";
export type ApplicationStage =
  | "Preparing"
  | "Applied"
  | "OA"
  | "Interview"
  | "Offer"
  | "Rejected";
export type CaseType =
  | "Profitability"
  | "Market Entry"
  | "Growth Strategy"
  | "Operations"
  | "M&A"
  | "Market Sizing"
  | "Pricing"
  | "New Product";
export type QuestionType =
  | "introduction"
  | "structuring"
  | "quantitative"
  | "probe"
  | "synthesis"
  | "brainstorm"
  | "mcq"
  | "calculation"
  | "interpretation"
  | "situational";
export type AIRole = "interviewer" | "candidate" | "system";
export type AISessionType =
  | "case_interview"
  | "evaluation"
  | "feedback"
  | "drill"
  | "recommendation"
  | "case_generation";

export interface SkillNameValue {
  name: string;
}

export interface User {
  id: ID;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface Profile {
  id: ID;
  user_id: ID;
  full_name: string;
  avatar_url: string | null;
  experience_level: string | null;
  target_firms: string[];
  interview_date: string | null;
  readiness_score: number;
  created_at: string;
  updated_at: string;
}

export interface SkillScore {
  name: string;
  score: number;
  previous_score?: number;
  trend: Trend;
  color: string;
  evidence?: string;
}

export interface ReadinessEntry {
  date: string;
  score: number;
}

export interface CaseData {
  id: ID;
  title: string;
  company: string;
  case_type?: CaseType;
  type: CaseType;
  difficulty: Difficulty;
  duration_minutes?: number;
  duration: number;
  skills: string[];
  completed: boolean;
  score?: number;
  description?: string;
  background?: string;
  prompt?: string;
  is_active?: boolean;
  is_ai_generated?: boolean;
}

export interface CaseQuestion {
  id: ID;
  case_id: ID;
  question_type: QuestionType;
  question_text: string;
  model_answer?: string;
  display_order: number;
  time_limit_seconds?: number;
  rubric?: string;
}

export interface CaseAttempt {
  id: ID;
  user_id: ID;
  case_id: ID;
  status: AttemptStatus;
  current_question_index: number;
  started_at: string;
  completed_at?: string;
  elapsed_seconds: number;
  overall_score?: number;
  structuring_score?: number;
  quantitative_score?: number;
  business_judgment_score?: number;
  communication_score?: number;
  synthesis_score?: number;
  ai_feedback?: string;
  strengths: string[];
  weaknesses: string[];
  recommendations?: string;
}

export interface CaseAnswer {
  id: ID;
  attempt_id: ID;
  question_id: ID;
  answer_text?: string;
  score?: number;
  ai_feedback?: string;
  duration_seconds?: number;
  created_at: string;
  updated_at: string;
}

export interface AssessmentData {
  id: ID;
  title: string;
  category: string;
  questions: number;
  total_questions?: number;
  time_minutes?: number;
  time_limit_minutes?: number;
  difficulty: Difficulty;
  completed: boolean;
  score?: number;
  description?: string;
  skills?: string[];
}

export interface AssessmentQuestion {
  id: ID;
  assessment_id: ID;
  question_type: QuestionType;
  question_text: string;
  options?: any[];
  correct_option_index?: number;
  correct_answer?: string;
  explanation?: string;
  display_order: number;
  points: number;
  difficulty: Difficulty;
  skill_tag?: string;
}

export interface AssessmentAttempt {
  id: ID;
  user_id: ID;
  assessment_id: ID;
  status: AttemptStatus;
  started_at: string;
  completed_at?: string;
  time_spent_seconds: number;
  total_questions: number;
  correct_count: number;
  score?: number;
  percentile?: number;
}

export interface AssessmentAnswer {
  id: ID;
  attempt_id: ID;
  question_id: ID;
  selected_option_index?: number;
  free_text_answer?: string;
  is_correct?: boolean;
  points_earned: number;
  time_spent_seconds?: number;
}

export interface DrillData {
  id: ID;
  title: string;
  description?: string;
  category?: string;
  duration: number;
  duration_minutes?: number;
  skills: string[];
  difficulty: Difficulty | string;
  completed: boolean;
  score?: number;
  total_questions?: number;
}

export interface DrillAttempt {
  id: ID;
  user_id: ID;
  drill_id: ID;
  status: AttemptStatus;
  started_at: string;
  completed_at?: string;
  total_questions: number;
  correct_count: number;
  score?: number;
  time_spent_seconds: number;
}

export interface ApplicationData {
  id: ID;
  user_id?: ID;
  company: string;
  role: string;
  deadline?: string;
  stage: ApplicationStage;
  preparation: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProgressSummary {
  user_id: ID;
  readiness_score: number;
  previous_readiness_score?: number;
  streak_days: number;
  total_cases_completed: number;
  total_assessments_completed: number;
  total_drills_completed: number;
  total_practice_minutes: number;
  average_score: number;
  best_score?: number;
  skill_scores: SkillScore[];
  readiness_over_time: ReadinessEntry[];
}

export interface AISession {
  id: ID;
  user_id: ID;
  session_type: AISessionType;
  related_resource_id?: ID;
  related_resource_type?: string;
  prompt_id?: ID;
  model_used?: string;
  status: string;
  started_at: string;
  ended_at?: string;
  total_tokens: number;
  total_latency_ms: number;
  metadata?: any;
}

export interface AIMessage {
  id: ID;
  session_id: ID;
  role: AIRole;
  content: string;
  structured_output?: any;
  tokens_used?: number;
  latency_ms?: number;
  sequence_number: number;
  created_at: string;
}

export interface PromptVersionInfo {
  name: string;
  purpose: string;
  version: string;
  description?: string;
  system_prompt: string;
  user_prompt_template?: string;
  variables?: any[];
  techniques?: string[];
  technique_notes?: Record<string, string>;
  model: string;
  temperature: number;
}

export interface StructuredEvaluation {
  overall_score: number;
  skills: Array<{ skill: string; score: number; evidence?: string }>;
  strengths: string[];
  improvements: string[];
  recommendations: string[];
}

export interface FeedbackResult {
  overall_score: number;
  max_score: number;
  skill_breakdown: SkillScore[];
  strengths: string[];
  biggest_opportunity?: { skill: string; score: number; feedback: string };
  better_approach?: string;
  recommended_drill?: { title: string; duration: number; skill: string };
}

export interface Recommendations {
  recommended_cases: Array<{ id: ID; reason?: string }>;
  recommended_drills: Array<{ id: ID; reason?: string }>;
  next_best_action?: string;
  reasoning?: string;
}

export interface ApiError {
  statusCode?: number;
  detail?: any;
  code?: string;
  message: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface AIChatResponse {
  session_id: ID;
  message: string;
  next_question?:
    | {
        question: string;
        question_type: QuestionType;
        display_hint?: string;
        expected_duration_seconds?: number;
        notes?: string;
      };
  structured_output?: any;
}

export interface AIEvaluationResponse {
  case_attempt_id: ID;
  evaluation: StructuredEvaluation;
  ai_session_id?: ID;
}

export interface AIFeedbackResponse {
  overall_score: number;
  max_score: number;
  skill_breakdown: SkillScore[];
  strengths: string[];
  improvements?: string[];
  recommendations?: string[];
  better_approach?: string;
  biggest_opportunity?: { skill: string; score: number; feedback: string };
}
