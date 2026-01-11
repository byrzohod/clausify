# /ai-setup - Setup Local AI with Ollama

Setup and configure Ollama for local AI contract analysis.

## Prerequisites

Install Ollama from: https://ollama.ai/download

## Commands to Execute

```bash
# Start Ollama server (run in background or separate terminal)
ollama serve &

# Wait for server to start
sleep 2

# Check available models
ollama list

# Pull recommended model for contract analysis
ollama pull llama3.2

# Verify it works
curl http://localhost:11434/api/tags
```

## Recommended Models

| Model | Size | Quality | Speed |
|-------|------|---------|-------|
| llama3.2 | 2GB | Good | Fast |
| llama3.1 | 4GB | Better | Medium |
| mistral | 4GB | Good | Fast |

## Change Model

Edit `.env.local`:
```bash
OLLAMA_MODEL="llama3.2"  # or mistral, llama3.1, etc.
```

## Test Analysis

With the dev server running, upload a contract to test the AI analysis.
