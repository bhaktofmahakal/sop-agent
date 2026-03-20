# SOP Agent [Live Demo at](https://agent-sop-beige.vercel.app/)
# AI Resume screening automation [Live Demo at](https://resume-screener-pi.vercel.app)  

Single-file SOP to training generator built as a plain HTML app.

## Tracked Files

- `index.html`: main UI and client-side logic
- `AI_Automation_Intern_Assessment.docx.md`: assignment brief
- `README.md`: project overview
- `.gitignore`: GitHub-safe ignore rules

## Supported Providers

- Groq
- Claude
- GPT / OpenAI

## Generated Outputs

- Structured SOP summary
- Training steps
- Quiz with expandable answers
- Presentation-style slides
- Import-ready n8n workflow JSON

## Workflow Export

The workflow JSON is designed for n8n import and models a PDF-first flow:

- Google Drive Trigger
- Download SOP File
- Extract From File
- Provider-aware HTTP Request
- Parse JSON
- Notion Page
- Gmail notification

## Local Usage

Open `index.html` directly in a browser, paste SOP text, select a provider, enter your API key, and generate outputs from the same single-file UI.

## Repository Hygiene

This repository intentionally excludes local-only files such as:

- agent skill folders
- Vercel temp output
- local logs
- deploy tarballs
- scratch JSON files

## Deployment

The app can be deployed as a plain static site on Vercel without a build step because everything lives in `index.html`.
