from enum import Enum


class ExperienceLevel(str, Enum):
    BEGINNER = "Beginner"
    INTERMEDIATE = "Intermediate"
    ADVANCED = "Advanced"
    EXPERT = "Expert"


class Difficulty(str, Enum):
    EASY = "Easy"
    MEDIUM = "Medium"
    HARD = "Hard"


class CaseType(str, Enum):
    PROFITABILITY = "Profitability"
    MARKET_ENTRY = "Market Entry"
    GROWTH_STRATEGY = "Growth Strategy"
    OPERATIONS = "Operations"
    MERGERS_ACQUISITIONS = "M&A"
    MARKET_SIZING = "Market Sizing"
    PRICING = "Pricing"
    NEW_PRODUCT = "New Product"


class QuestionType(str, Enum):
    INTRODUCTION = "introduction"
    STRUCTURING = "structuring"
    QUANTITATIVE = "quantitative"
    PROBE = "probe"
    SYNTHESIS = "synthesis"
    BRAINSTORM = "brainstorm"
    MCQ = "mcq"
    CALCULATION = "calculation"
    INTERPRETATION = "interpretation"
    SITUATIONAL = "situational"


class AttemptStatus(str, Enum):
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ABANDONED = "abandoned"
    PAUSED = "paused"


class ApplicationStage(str, Enum):
    PREPARING = "Preparing"
    APPLIED = "Applied"
    ONLINE_ASSESSMENT = "OA"
    INTERVIEW = "Interview"
    OFFER = "Offer"
    REJECTED = "Rejected"


class AIRole(str, Enum):
    INTERVIEWER = "interviewer"
    CANDIDATE = "candidate"
    SYSTEM = "system"


class AISessionType(str, Enum):
    CASE_INTERVIEW = "case_interview"
    EVALUATION = "evaluation"
    FEEDBACK = "feedback"
    DRILL = "drill"
    RECOMMENDATION = "recommendation"
    CASE_GENERATION = "case_generation"


class SkillName(str, Enum):
    STRUCTURING = "Structuring"
    QUANTITATIVE_ANALYSIS = "Quantitative Analysis"
    MENTAL_MATH = "Mental Math"
    BUSINESS_JUDGMENT = "Business Judgment"
    COMMUNICATION = "Communication"
    SYNTHESIS = "Synthesis"
    CREATIVITY = "Creativity"
    DATA_INTERPRETATION = "Data Interpretation"
    LOGICAL_REASONING = "Logical Reasoning"
    NUMERICAL_REASONING = "Numerical Reasoning"
    SITUATIONAL_JUDGMENT = "Situational Judgment"


class Trend(str, Enum):
    UP = "up"
    DOWN = "down"
    FLAT = "flat"


class PromptPurpose(str, Enum):
    INTERVIEWER = "interviewer"
    EVALUATOR = "evaluator"
    CASE_GENERATION = "case_generation"
    FEEDBACK = "feedback"
    RECOMMENDATIONS = "recommendations"
    DRILL_GENERATION = "drill_generation"
    ADAPTIVE_DIFFICULTY = "adaptive_difficulty"


class DrillCategory(str, Enum):
    BUSINESS_JUDGMENT = "Business Judgment"
    MENTAL_MATH = "Mental Math"
    SYNTHESIS = "Synthesis"
    FRAMEWORK_SELECTION = "Framework Selection"
    DATA_INTERPRETATION = "Data Interpretation"
    STRUCTURING = "Structuring"
    BEHAVIORAL = "Behavioral"
    NUMERICAL_REASONING = "Numerical Reasoning"
    LOGICAL_REASONING = "Logical Reasoning"
