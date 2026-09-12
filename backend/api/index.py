"""Vercel entry point for the Learnova FastAPI application."""
import os
import sys

# Ensure the backend package is importable.
# Vercel bundles files relative to the project root, so we add the backend
# directory to sys.path so that 'from app.main import app' resolves correctly.
BACKEND_DIR = os.path.join(os.path.dirname(__file__), "..")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, os.path.abspath(BACKEND_DIR))

from app.main import app
