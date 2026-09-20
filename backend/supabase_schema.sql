-- Learnova schema for Supabase PostgreSQL
-- Generated from the SQLAlchemy models (postgresql dialect).
-- Run in: Supabase Dashboard > SQL Editor > New query > Run

CREATE TABLE assessments (
	id VARCHAR(36) NOT NULL, 
	title VARCHAR NOT NULL, 
	category VARCHAR NOT NULL, 
	description TEXT, 
	difficulty VARCHAR NOT NULL, 
	total_questions INTEGER NOT NULL, 
	time_limit_minutes INTEGER NOT NULL, 
	skills JSON NOT NULL, 
	is_active BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id)
);

CREATE TABLE prompts (
	id VARCHAR(36) NOT NULL, 
	name VARCHAR NOT NULL, 
	purpose VARCHAR NOT NULL, 
	version VARCHAR NOT NULL, 
	description TEXT, 
	system_prompt TEXT NOT NULL, 
	user_prompt_template TEXT, 
	variables JSON, 
	output_schema JSON, 
	model VARCHAR NOT NULL, 
	temperature NUMERIC(3, 2) NOT NULL, 
	top_p NUMERIC(3, 2), 
	max_tokens INTEGER, 
	prompt_techniques JSON, 
	is_active BOOLEAN NOT NULL, 
	parent_prompt_id VARCHAR(36), 
	parent_version VARCHAR, 
	changelog TEXT, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id)
);

CREATE TABLE skills (
	id VARCHAR(36) NOT NULL, 
	name VARCHAR NOT NULL, 
	description TEXT, 
	color VARCHAR, 
	weight FLOAT NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_skills_name UNIQUE (name)
);

CREATE TABLE users (
	id VARCHAR(36) NOT NULL, 
	email VARCHAR NOT NULL, 
	password_hash VARCHAR NOT NULL, 
	is_active BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_users_email UNIQUE (email)
);

CREATE TABLE ai_sessions (
	id VARCHAR(36) NOT NULL, 
	user_id VARCHAR(36) NOT NULL, 
	session_type VARCHAR NOT NULL, 
	related_resource_id VARCHAR(36), 
	related_resource_type VARCHAR, 
	prompt_id VARCHAR(36), 
	model_used VARCHAR, 
	status VARCHAR NOT NULL, 
	started_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	ended_at TIMESTAMP WITH TIME ZONE, 
	total_tokens INTEGER NOT NULL, 
	total_latency_ms INTEGER NOT NULL, 
	metadata_ JSON, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE, 
	FOREIGN KEY(prompt_id) REFERENCES prompts (id) ON DELETE SET NULL
);

CREATE TABLE applications (
	id VARCHAR(36) NOT NULL, 
	user_id VARCHAR(36) NOT NULL, 
	company VARCHAR NOT NULL, 
	role VARCHAR NOT NULL, 
	deadline DATE, 
	stage VARCHAR NOT NULL, 
	preparation INTEGER NOT NULL, 
	notes TEXT, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE assessment_attempts (
	id VARCHAR(36) NOT NULL, 
	user_id VARCHAR(36) NOT NULL, 
	assessment_id VARCHAR(36) NOT NULL, 
	status VARCHAR NOT NULL, 
	started_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	completed_at TIMESTAMP WITH TIME ZONE, 
	time_spent_seconds INTEGER NOT NULL, 
	total_questions INTEGER NOT NULL, 
	correct_count INTEGER NOT NULL, 
	score NUMERIC(5, 2), 
	percentile NUMERIC(5, 2), 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE, 
	FOREIGN KEY(assessment_id) REFERENCES assessments (id) ON DELETE CASCADE
);

CREATE TABLE assessment_questions (
	id VARCHAR(36) NOT NULL, 
	assessment_id VARCHAR(36) NOT NULL, 
	question_type VARCHAR NOT NULL, 
	question_text TEXT NOT NULL, 
	options JSON, 
	correct_option_index INTEGER, 
	correct_answer TEXT, 
	explanation TEXT, 
	display_order INTEGER NOT NULL, 
	points INTEGER NOT NULL, 
	difficulty VARCHAR NOT NULL, 
	skill_tag VARCHAR, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(assessment_id) REFERENCES assessments (id) ON DELETE CASCADE
);

CREATE TABLE cases (
	id VARCHAR(36) NOT NULL, 
	title VARCHAR NOT NULL, 
	company VARCHAR NOT NULL, 
	case_type VARCHAR NOT NULL, 
	difficulty VARCHAR NOT NULL, 
	duration_minutes INTEGER NOT NULL, 
	description TEXT, 
	prompt TEXT, 
	background TEXT, 
	skills JSON NOT NULL, 
	is_active BOOLEAN NOT NULL, 
	is_ai_generated BOOLEAN NOT NULL, 
	generated_by_prompt_id VARCHAR(36), 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(generated_by_prompt_id) REFERENCES prompts (id) ON DELETE SET NULL
);

CREATE TABLE drills (
	id VARCHAR(36) NOT NULL, 
	title VARCHAR NOT NULL, 
	description TEXT, 
	category VARCHAR NOT NULL, 
	difficulty VARCHAR NOT NULL, 
	duration_minutes INTEGER NOT NULL, 
	total_questions INTEGER NOT NULL, 
	skills JSON NOT NULL, 
	is_active BOOLEAN NOT NULL, 
	is_ai_generated BOOLEAN NOT NULL, 
	generated_by_prompt_id VARCHAR(36), 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(generated_by_prompt_id) REFERENCES prompts (id) ON DELETE SET NULL
);

CREATE TABLE profiles (
	id VARCHAR(36) NOT NULL, 
	user_id VARCHAR(36) NOT NULL, 
	full_name VARCHAR NOT NULL, 
	avatar_url TEXT, 
	experience_level VARCHAR, 
	target_firms JSON NOT NULL, 
	interview_date TIMESTAMP WITH TIME ZONE, 
	readiness_score INTEGER NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_profiles_user_id UNIQUE (user_id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE user_skills (
	id VARCHAR(36) NOT NULL, 
	user_id VARCHAR(36) NOT NULL, 
	skill_id VARCHAR(36) NOT NULL, 
	current_score INTEGER NOT NULL, 
	previous_score INTEGER, 
	trend VARCHAR NOT NULL, 
	total_practice_minutes INTEGER NOT NULL, 
	last_practiced_at TIMESTAMP WITH TIME ZONE, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE, 
	FOREIGN KEY(skill_id) REFERENCES skills (id) ON DELETE CASCADE
);

CREATE TABLE ai_messages (
	id VARCHAR(36) NOT NULL, 
	session_id VARCHAR(36) NOT NULL, 
	role VARCHAR NOT NULL, 
	content TEXT NOT NULL, 
	structured_output JSON, 
	tokens_used INTEGER, 
	latency_ms INTEGER, 
	sequence_number INTEGER NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(session_id) REFERENCES ai_sessions (id) ON DELETE CASCADE
);

CREATE TABLE assessment_answers (
	id VARCHAR(36) NOT NULL, 
	attempt_id VARCHAR(36) NOT NULL, 
	question_id VARCHAR(36) NOT NULL, 
	selected_option_index INTEGER, 
	free_text_answer TEXT, 
	is_correct BOOLEAN, 
	points_earned INTEGER NOT NULL, 
	time_spent_seconds INTEGER, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(attempt_id) REFERENCES assessment_attempts (id) ON DELETE CASCADE, 
	FOREIGN KEY(question_id) REFERENCES assessment_questions (id) ON DELETE CASCADE
);

CREATE TABLE case_attempts (
	id VARCHAR(36) NOT NULL, 
	user_id VARCHAR(36) NOT NULL, 
	case_id VARCHAR(36) NOT NULL, 
	status VARCHAR NOT NULL, 
	current_question_index INTEGER NOT NULL, 
	started_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	completed_at TIMESTAMP WITH TIME ZONE, 
	elapsed_seconds INTEGER NOT NULL, 
	overall_score INTEGER, 
	structuring_score INTEGER, 
	quantitative_score INTEGER, 
	business_judgment_score INTEGER, 
	communication_score INTEGER, 
	synthesis_score INTEGER, 
	ai_feedback TEXT, 
	strengths JSON NOT NULL, 
	weaknesses JSON NOT NULL, 
	recommendations TEXT, 
	evaluated_by_prompt_id VARCHAR(36), 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE, 
	FOREIGN KEY(case_id) REFERENCES cases (id) ON DELETE CASCADE, 
	FOREIGN KEY(evaluated_by_prompt_id) REFERENCES prompts (id) ON DELETE SET NULL
);

CREATE TABLE case_questions (
	id VARCHAR(36) NOT NULL, 
	case_id VARCHAR(36) NOT NULL, 
	question_type VARCHAR NOT NULL, 
	question_text TEXT NOT NULL, 
	model_answer TEXT, 
	display_order INTEGER NOT NULL, 
	time_limit_seconds INTEGER, 
	rubric TEXT, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(case_id) REFERENCES cases (id) ON DELETE CASCADE
);

CREATE TABLE drill_attempts (
	id VARCHAR(36) NOT NULL, 
	user_id VARCHAR(36) NOT NULL, 
	drill_id VARCHAR(36) NOT NULL, 
	status VARCHAR NOT NULL, 
	started_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	completed_at TIMESTAMP WITH TIME ZONE, 
	total_questions INTEGER NOT NULL, 
	correct_count INTEGER NOT NULL, 
	score INTEGER, 
	time_spent_seconds INTEGER NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE, 
	FOREIGN KEY(drill_id) REFERENCES drills (id) ON DELETE CASCADE
);

CREATE TABLE drill_questions (
	id VARCHAR(36) NOT NULL, 
	drill_id VARCHAR(36) NOT NULL, 
	question_type VARCHAR NOT NULL, 
	question_text TEXT NOT NULL, 
	options JSON, 
	correct_option_index INTEGER, 
	correct_answer TEXT, 
	explanation TEXT, 
	display_order INTEGER NOT NULL, 
	time_limit_seconds INTEGER, 
	difficulty VARCHAR NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(drill_id) REFERENCES drills (id) ON DELETE CASCADE
);

CREATE TABLE case_answers (
	id VARCHAR(36) NOT NULL, 
	attempt_id VARCHAR(36) NOT NULL, 
	question_id VARCHAR(36) NOT NULL, 
	answer_text TEXT, 
	score INTEGER, 
	ai_feedback TEXT, 
	duration_seconds INTEGER, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(attempt_id) REFERENCES case_attempts (id) ON DELETE CASCADE, 
	FOREIGN KEY(question_id) REFERENCES case_questions (id) ON DELETE CASCADE
);

CREATE TABLE resumes (
	id VARCHAR(36) NOT NULL, 
	user_id VARCHAR(36) NOT NULL, 
	filename VARCHAR NOT NULL, 
	source_type VARCHAR, 
	role VARCHAR, 
	data JSON NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE readiness_snapshots (
	id VARCHAR(36) NOT NULL, 
	user_id VARCHAR(36) NOT NULL, 
	score INTEGER NOT NULL, 
	source VARCHAR NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX ix_resumes_id ON resumes (id);

CREATE INDEX ix_resumes_user_id ON resumes (user_id);

CREATE INDEX ix_readiness_snapshots_id ON readiness_snapshots (id);

CREATE INDEX ix_readiness_snapshots_user_id ON readiness_snapshots (user_id);

CREATE INDEX ix_assessments_id ON assessments (id);

CREATE INDEX ix_prompts_id ON prompts (id);

CREATE INDEX ix_prompts_name ON prompts (name);

CREATE INDEX ix_skills_id ON skills (id);

CREATE INDEX ix_skills_name ON skills (name);

CREATE INDEX ix_users_email ON users (email);

CREATE INDEX ix_users_id ON users (id);

CREATE INDEX ix_ai_sessions_id ON ai_sessions (id);

CREATE INDEX ix_ai_sessions_prompt_id ON ai_sessions (prompt_id);

CREATE INDEX ix_ai_sessions_user_id ON ai_sessions (user_id);

CREATE INDEX ix_applications_id ON applications (id);

CREATE INDEX ix_applications_user_id ON applications (user_id);

CREATE INDEX ix_assessment_attempts_assessment_id ON assessment_attempts (assessment_id);

CREATE INDEX ix_assessment_attempts_id ON assessment_attempts (id);

CREATE INDEX ix_assessment_attempts_user_id ON assessment_attempts (user_id);

CREATE INDEX ix_assessment_questions_assessment_id ON assessment_questions (assessment_id);

CREATE INDEX ix_assessment_questions_id ON assessment_questions (id);

CREATE INDEX ix_cases_generated_by_prompt_id ON cases (generated_by_prompt_id);

CREATE INDEX ix_cases_id ON cases (id);

CREATE INDEX ix_drills_id ON drills (id);

CREATE INDEX ix_profiles_id ON profiles (id);

CREATE INDEX ix_profiles_user_id ON profiles (user_id);

CREATE INDEX ix_user_skills_id ON user_skills (id);

CREATE INDEX ix_user_skills_skill_id ON user_skills (skill_id);

CREATE INDEX ix_user_skills_user_id ON user_skills (user_id);

CREATE INDEX ix_ai_messages_id ON ai_messages (id);

CREATE INDEX ix_ai_messages_session_id ON ai_messages (session_id);

CREATE INDEX ix_assessment_answers_attempt_id ON assessment_answers (attempt_id);

CREATE INDEX ix_assessment_answers_id ON assessment_answers (id);

CREATE INDEX ix_assessment_answers_question_id ON assessment_answers (question_id);

CREATE INDEX ix_case_attempts_case_id ON case_attempts (case_id);

CREATE INDEX ix_case_attempts_id ON case_attempts (id);

CREATE INDEX ix_case_attempts_user_id ON case_attempts (user_id);

CREATE INDEX ix_case_questions_case_id ON case_questions (case_id);

CREATE INDEX ix_case_questions_id ON case_questions (id);

CREATE INDEX ix_drill_attempts_drill_id ON drill_attempts (drill_id);

CREATE INDEX ix_drill_attempts_id ON drill_attempts (id);

CREATE INDEX ix_drill_attempts_user_id ON drill_attempts (user_id);

CREATE INDEX ix_drill_questions_drill_id ON drill_questions (drill_id);

CREATE INDEX ix_drill_questions_id ON drill_questions (id);

CREATE INDEX ix_case_answers_attempt_id ON case_answers (attempt_id);

CREATE INDEX ix_case_answers_id ON case_answers (id);

CREATE INDEX ix_case_answers_question_id ON case_answers (question_id);

-- Stamp Alembic at head so future 'alembic upgrade head' is a no-op
CREATE TABLE IF NOT EXISTS alembic_version (
    version_num VARCHAR(32) NOT NULL,
    CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
);
INSERT INTO alembic_version (version_num) VALUES ('0003_resumes_readiness')
ON CONFLICT (version_num) DO NOTHING;