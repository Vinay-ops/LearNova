"""Tests for the LLM client abstraction layer.

All tests use mocks — no real Groq API calls are made.
"""
import json
import pytest
from unittest.mock import MagicMock, patch

from app.ai.client import (
    LLMResponse,
    StubLLMClient,
    GroqLLMClient,
    get_llm_client,
    validate_structured_output,
)
from app.schemas.ai import StructuredEvaluation
from app.core.exceptions import AIError, AIValidationError

GROQ_BASE_URL = "https://api.groq.com/openai/v1"
DEFAULT_MODEL = "openai/gpt-oss-120b"


# ============================================================
# LLMResponse
# ============================================================

class TestLLMResponse:
    def test_basic_response(self):
        resp = LLMResponse(content="hello", model="test", tokens_used=10, latency_ms=50)
        assert resp.content == "hello"
        assert resp.model == "test"
        assert resp.tokens_used == 10
        assert resp.latency_ms == 50
        assert resp.structured is None
        assert resp.raw_response is None

    def test_defaults(self):
        resp = LLMResponse(content="x")
        assert resp.tokens_used == 0
        assert resp.latency_ms == 0


# ============================================================
# StubLLMClient
# ============================================================

class TestStubLLMClient:
    def test_returns_stub_content(self):
        client = StubLLMClient()
        resp = client.chat("system", "user")
        assert "STUB RESPONSE" in resp.content
        assert resp.model is not None
        assert resp.tokens_used == 0

    def test_custom_model_passthrough(self):
        client = StubLLMClient()
        resp = client.chat("system", "user", model="custom-model")
        assert resp.model == "custom-model"

    def test_ignores_temperature_and_max_tokens(self):
        client = StubLLMClient()
        resp = client.chat("system", "user", temperature=0.1, max_tokens=100)
        assert "STUB RESPONSE" in resp.content


# ============================================================
# get_llm_client factory
# ============================================================

class TestGetLLMClient:
    def test_returns_stub_when_no_key(self):
        with patch("app.ai.client.settings") as mock_settings:
            mock_settings.GROQ_API_KEY = None
            client = get_llm_client()
            assert isinstance(client, StubLLMClient)

    def test_returns_groq_when_key_set(self):
        with patch("app.ai.client.settings") as mock_settings:
            mock_settings.GROQ_API_KEY = "test-key-123"
            mock_settings.GROQ_MODEL = DEFAULT_MODEL
            mock_settings.GROQ_BASE_URL = GROQ_BASE_URL
            mock_settings.LLM_TEMPERATURE = 0.7
            client = get_llm_client()
            assert isinstance(client, GroqLLMClient)
            assert client.api_key == "test-key-123"
            assert client.base_url == GROQ_BASE_URL

    def test_returns_stub_when_key_empty(self):
        with patch("app.ai.client.settings") as mock_settings:
            mock_settings.GROQ_API_KEY = ""
            client = get_llm_client()
            assert isinstance(client, StubLLMClient)


# ============================================================
# GroqLLMClient
# ============================================================

class TestGroqLLMClient:
    def _make_client(self, api_key="test-key"):
        with patch("app.ai.client.settings") as mock_settings:
            mock_settings.GROQ_API_KEY = api_key
            mock_settings.GROQ_MODEL = DEFAULT_MODEL
            mock_settings.GROQ_BASE_URL = GROQ_BASE_URL
            mock_settings.LLM_TEMPERATURE = 0.7
            return GroqLLMClient()

    def test_is_configured_with_key(self):
        client = self._make_client(api_key="real-key")
        assert client._is_configured() is True

    def test_not_configured_without_key(self):
        client = self._make_client(api_key="")
        assert client._is_configured() is False

    def test_raises_when_no_key(self):
        client = self._make_client(api_key="")
        with pytest.raises(AIError, match="GROQ_API_KEY"):
            client.chat("system", "user")

    def test_raises_when_openai_not_installed(self):
        client = self._make_client()
        with patch.dict("sys.modules", {"openai": None}):
            with pytest.raises(AIError, match="openai package is not installed"):
                client._get_client()

    def test_successful_chat_uses_groq_base_url_and_model(self):
        client = self._make_client()

        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "Test response"
        mock_response.usage.total_tokens = 42

        mock_openai_cls = MagicMock()
        mock_openai_cls.return_value.chat.completions.create.return_value = mock_response

        with patch.dict("sys.modules", {"openai": MagicMock(OpenAI=mock_openai_cls)}):
            resp = client.chat("system prompt", "user prompt")

        # Client must point at Groq's OpenAI-compatible endpoint.
        assert mock_openai_cls.call_args[1]["base_url"] == GROQ_BASE_URL
        assert resp.content == "Test response"
        assert resp.tokens_used == 42
        assert resp.model == DEFAULT_MODEL
        call_kwargs = mock_openai_cls.return_value.chat.completions.create.call_args[1]
        assert call_kwargs["model"] == DEFAULT_MODEL

    def test_empty_response_raises(self):
        client = self._make_client()

        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = ""
        mock_response.usage.total_tokens = 0

        mock_openai_cls = MagicMock()
        mock_openai_cls.return_value.chat.completions.create.return_value = mock_response

        with patch.dict("sys.modules", {"openai": MagicMock(OpenAI=mock_openai_cls)}):
            with pytest.raises(AIError, match="empty response"):
                client.chat("system", "user")

    def test_timeout_error(self):
        client = self._make_client()

        mock_openai_cls = MagicMock()
        mock_openai_cls.return_value.chat.completions.create.side_effect = Exception("Connection timed out")

        with patch.dict("sys.modules", {"openai": MagicMock(OpenAI=mock_openai_cls)}):
            with pytest.raises(AIError, match="timed out"):
                client.chat("system", "user")

    def test_rate_limit_error(self):
        client = self._make_client()

        mock_openai_cls = MagicMock()
        mock_openai_cls.return_value.chat.completions.create.side_effect = Exception("Rate limit exceeded")

        with patch.dict("sys.modules", {"openai": MagicMock(OpenAI=mock_openai_cls)}):
            with pytest.raises(AIError, match="Rate limit"):
                client.chat("system", "user")

    def test_invalid_key_error(self):
        client = self._make_client()

        mock_openai_cls = MagicMock()
        mock_openai_cls.return_value.chat.completions.create.side_effect = Exception("Invalid API key provided")

        with patch.dict("sys.modules", {"openai": MagicMock(OpenAI=mock_openai_cls)}):
            with pytest.raises(AIError, match="Invalid API key"):
                client.chat("system", "user")

    def test_invalid_model_error(self):
        client = self._make_client()

        mock_openai_cls = MagicMock()
        mock_openai_cls.return_value.chat.completions.create.side_effect = Exception("Model not found: fake-model")

        with patch.dict("sys.modules", {"openai": MagicMock(OpenAI=mock_openai_cls)}):
            with pytest.raises(AIError, match="not available on Groq"):
                client.chat("system", "user")

    def test_generic_api_error(self):
        client = self._make_client()

        mock_openai_cls = MagicMock()
        mock_openai_cls.return_value.chat.completions.create.side_effect = Exception("Something went wrong")

        with patch.dict("sys.modules", {"openai": MagicMock(OpenAI=mock_openai_cls)}):
            with pytest.raises(AIError, match="Groq API error"):
                client.chat("system", "user")

    def test_model_override(self):
        client = self._make_client()

        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "ok"
        mock_response.usage.total_tokens = 10

        mock_openai_cls = MagicMock()
        mock_openai_cls.return_value.chat.completions.create.return_value = mock_response

        with patch.dict("sys.modules", {"openai": MagicMock(OpenAI=mock_openai_cls)}):
            resp = client.chat("system", "user", model="llama-3.1-8b-instant")

        assert resp.model == "llama-3.1-8b-instant"
        call_kwargs = mock_openai_cls.return_value.chat.completions.create.call_args[1]
        assert call_kwargs["model"] == "llama-3.1-8b-instant"

    def test_max_tokens_passed(self):
        client = self._make_client()

        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "ok"
        mock_response.usage.total_tokens = 5

        mock_openai_cls = MagicMock()
        mock_openai_cls.return_value.chat.completions.create.return_value = mock_response

        with patch.dict("sys.modules", {"openai": MagicMock(OpenAI=mock_openai_cls)}):
            client.chat("system", "user", max_tokens=500)

        call_kwargs = mock_openai_cls.return_value.chat.completions.create.call_args[1]
        assert call_kwargs["max_tokens"] == 500

    def test_blank_configured_model_still_sends_a_model(self):
        """Regression: an empty GROQ_MODEL env value ("") must fall back to a
        valid model — the provider rejects model-less requests with a 400."""
        with patch("app.ai.client.settings") as mock_settings:
            mock_settings.GROQ_API_KEY = "test-key"
            mock_settings.GROQ_MODEL = ""  # explicitly blank in env
            mock_settings.GROQ_BASE_URL = GROQ_BASE_URL
            mock_settings.LLM_TEMPERATURE = 0.7
            client = GroqLLMClient()

            mock_response = MagicMock()
            mock_response.choices = [MagicMock()]
            mock_response.choices[0].message.content = "ok"
            mock_response.usage.total_tokens = 5

            mock_openai_cls = MagicMock()
            mock_openai_cls.return_value.chat.completions.create.return_value = mock_response

            with patch.dict("sys.modules", {"openai": MagicMock(OpenAI=mock_openai_cls)}):
                # No model passed by the caller (templates pass model=None)
                resp = client.chat("system", "user")

            assert resp.model == DEFAULT_MODEL
            call_kwargs = mock_openai_cls.return_value.chat.completions.create.call_args[1]
            assert call_kwargs["model"] == DEFAULT_MODEL

    def test_mistaken_models_url_is_normalized(self):
        """Regression: setting GROQ_BASE_URL to the model-list URL must not
        corrupt request paths (404 /openai/v1/models/chat/completions)."""
        with patch("app.ai.client.settings") as mock_settings:
            mock_settings.GROQ_API_KEY = "test-key"
            mock_settings.GROQ_MODEL = DEFAULT_MODEL
            mock_settings.GROQ_BASE_URL = "https://api.groq.com/openai/v1/models"
            mock_settings.LLM_TEMPERATURE = 0.7
            client = GroqLLMClient()
        assert client.base_url == GROQ_BASE_URL

        # trailing slash and bare value also normalize
        assert GroqLLMClient._normalize_base_url("https://api.groq.com/openai/v1/") == GROQ_BASE_URL
        assert GroqLLMClient._normalize_base_url("") == GROQ_BASE_URL
        assert GroqLLMClient._normalize_base_url(None) == GROQ_BASE_URL

    def test_whitespace_only_model_arg_falls_back(self):
        with patch("app.ai.client.settings") as mock_settings:
            mock_settings.GROQ_MODEL = ""
            assert GroqLLMClient._resolve_model("   ") == DEFAULT_MODEL
            assert GroqLLMClient._resolve_model("llama-3.1-8b-instant") == "llama-3.1-8b-instant"

    def test_api_key_not_in_error_messages(self):
        """Security: API key must never appear in error messages."""
        client = self._make_client(api_key="super-secret-key-abc123")

        mock_openai_cls = MagicMock()
        mock_openai_cls.return_value.chat.completions.create.side_effect = Exception(
            "Error with super-secret-key-abc123 in message"
        )

        with patch.dict("sys.modules", {"openai": MagicMock(OpenAI=mock_openai_cls)}):
            with pytest.raises(AIError) as exc_info:
                client.chat("system", "user")

        assert "super-secret-key-abc123" not in str(exc_info.value.detail)


# ============================================================
# validate_structured_output
# ============================================================

class TestValidateStructuredOutput:
    def test_valid_json(self):
        raw = '{"overall_score": 80, "skills": [], "strengths": ["s1"], "improvements": [], "recommendations": []}'
        result = validate_structured_output(raw, StructuredEvaluation, max_retries=0)
        assert result.overall_score == 80
        assert result.skills == []

    def test_json_with_markdown_fences(self):
        raw = '```json\n{"overall_score": 70, "skills": [], "strengths": [], "improvements": [], "recommendations": []}\n```'
        result = validate_structured_output(raw, StructuredEvaluation, max_retries=0)
        assert result.overall_score == 70

    def test_json_with_plain_fences(self):
        raw = '```\n{"overall_score": 65, "skills": [], "strengths": [], "improvements": [], "recommendations": []}\n```'
        result = validate_structured_output(raw, StructuredEvaluation, max_retries=0)
        assert result.overall_score == 65

    def test_invalid_json_retries_then_raises(self):
        with pytest.raises(AIValidationError):
            validate_structured_output("NOT JSON AT ALL", StructuredEvaluation, max_retries=2)

    def test_partial_json_retries(self):
        """If first attempt fails but second succeeds, should return result."""
        # First call returns invalid, but we can't easily test retry with different inputs
        # since the function takes a single string. Test that 0 retries works.
        raw = '{"overall_score": 50, "skills": [], "strengths": [], "improvements": [], "recommendations": []}'
        result = validate_structured_output(raw, StructuredEvaluation, max_retries=0)
        assert result.overall_score == 50

    def test_wrong_schema_retries_then_raises(self):
        """JSON is valid but doesn't match schema."""
        raw = '{"wrong_field": true}'
        with pytest.raises(AIValidationError):
            validate_structured_output(raw, StructuredEvaluation, max_retries=1)


# ============================================================
# Integration: InterviewerService + EvaluatorService with mocked LLM
# ============================================================

class TestInterviewerServiceWithLLM:
    def test_next_question_uses_llm(self):
        from app.ai.interviewer import InterviewerService

        mock_client = MagicMock()
        mock_response = LLMResponse(
            content=json.dumps({
                "question": "Tell me about the profit decline.",
                "question_type": "structuring",
                "display_hint": "",
                "expected_duration_seconds": 120,
                "notes": "",
            }),
            model="test-model",
            tokens_used=50,
        )
        mock_client.chat.return_value = mock_response

        service = InterviewerService(client=mock_client)
        result = service.next_question(
            profile={"experience_level": "Intermediate", "target_firms": ["McK"]},
            case_data={"title": "Coffee Co", "company": "GCC", "case_type": "Profitability", "difficulty": "Medium", "background": "Test"},
            questions=[{"question_type": "structuring", "question_text": "How approach?"}],
            conversation_history=[],
            question_index=0,
            total_questions=3,
        )

        assert result["message"] == "Tell me about the profit decline."
        mock_client.chat.assert_called_once()

    def test_next_question_handles_non_json_response(self):
        from app.ai.interviewer import InterviewerService

        mock_client = MagicMock()
        mock_response = LLMResponse(
            content="What factors do you think contributed to this decline?",
            model="test-model",
            tokens_used=30,
        )
        mock_client.chat.return_value = mock_response

        service = InterviewerService(client=mock_client)
        result = service.next_question(
            profile={"experience_level": "Beginner"},
            case_data={"title": "X", "company": "Y", "case_type": "Z", "difficulty": "Easy", "background": "B"},
            questions=[{"question_type": "intro", "question_text": "Q1"}],
            conversation_history=[],
            question_index=0,
            total_questions=2,
        )

        assert "question" in result["structured_output"]
        assert result["message"] == "What factors do you think contributed to this decline?"


class TestEvaluatorServiceWithLLM:
    def test_evaluate_returns_structured(self):
        from app.ai.evaluator import EvaluatorService

        eval_json = {
            "overall_score": 72,
            "skills": [
                {"skill": "Problem Structuring", "score": 75, "evidence": "Good structure"},
                {"skill": "Quantitative Reasoning", "score": 68, "evidence": "Decent math"},
            ],
            "strengths": ["Clear framework"],
            "improvements": ["More quantitative depth"],
            "recommendations": ["Practice mental math"],
        }

        mock_client = MagicMock()
        mock_response = LLMResponse(
            content=json.dumps(eval_json),
            model="test-model",
            tokens_used=100,
        )
        mock_client.chat.return_value = mock_response

        service = EvaluatorService(client=mock_client)
        result = service.evaluate_attempt(
            case_data={"title": "Test", "case_type": "Profitability", "rubric": "Standard"},
            transcript="Candidate: I would analyze revenue...",
            answers=[{"answer_text": "Revenue analysis", "model_answer": "Break down into components"}],
            candidate_profile={"experience_level": "Intermediate"},
        )

        assert result.overall_score == 72
        assert len(result.skills) == 2
        assert result.strengths == ["Clear framework"]
        mock_client.chat.assert_called_once()

    def test_evaluate_handles_invalid_json(self):
        from app.ai.evaluator import EvaluatorService

        mock_client = MagicMock()
        mock_response = LLMResponse(
            content="This is not JSON at all",
            model="test-model",
            tokens_used=50,
        )
        mock_client.chat.return_value = mock_response

        service = EvaluatorService(client=mock_client)
        with pytest.raises(AIValidationError):
            service.evaluate_attempt(
                case_data={"title": "T", "case_type": "X", "rubric": "R"},
                transcript="transcript",
                answers=[],
                candidate_profile={},
            )
