# /ai-setup - Setup Local AI (Ollama)

Configure Ollama for free local AI contract analysis.

## Install Ollama

Download from: https://ollama.ai/download

## Quick Setup

```bash
# Start server
ollama serve

# Pull model (in another terminal)
ollama pull llama3.2

# Verify
curl http://localhost:11434/api/tags
```

## Configure App

Set in `.env.local`:
```
AI_PROVIDER=ollama
OLLAMA_MODEL=llama3.2
```

## Recommended Models

| Model | Size | Quality | Speed |
|-------|------|---------|-------|
| llama3.2 | 2GB | Good | Fast |
| llama3.1 | 4GB | Better | Medium |
| mistral | 4GB | Good | Fast |

## Switch to Cloud AI

For production or better quality, use Anthropic:

```
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Connection refused" | Start Ollama: `ollama serve` |
| Slow responses | Use smaller model: `llama3.2` |
| Out of memory | Close other apps, use smaller model |
