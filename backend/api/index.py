"""Vercel Serverless Entry Point for Learnova Backend.

This module wraps the FastAPI application for Vercel's Python serverless runtime.
Vercel automatically detects api/*.py files and deploys them as serverless functions.
"""
import os
import sys

# Ensure the backend package is importable.
# Vercel bundles files relative to the project root, so we add the backend
# directory to sys.path so that 'from app.main import app' resolves correctly.
BACKEND_DIR = os.path.join(os.path.dirname(__file__), "..")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, os.path.abspath(BACKEND_DIR))

from mangum import Mangum

from app.main import app

# Mangum is an adapter that allows ASGI apps (like FastAPI) to run on AWS Lambda
# (which is what Vercel's Python runtime uses under the hood).
handler = Mangum(app, lifespan="off")
