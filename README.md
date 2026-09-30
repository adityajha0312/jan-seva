# Jan Seva (जन सेवा)

> **Sovereign AI Citizen Governance & Welfare Delivery Platform for Madhya Pradesh**  
> *Developed by Team Elite Titans for MPOnline Idea & Innovation Hackathon 2026 (Challenge 5)*

[![React](https://img.shields.io/badge/Frontend-React_18_%2B_Vite-61dafb.svg)](https://react.dev/)
[![Database](https://img.shields.io/badge/Database-Supabase_PostgreSQL-3ecf8e.svg)](https://supabase.com/)
[![AI Engine](https://img.shields.io/badge/AI_Engine-Gemini_1.5_Multimodal-4285f4.svg)](https://deepmind.google/technologies/gemini/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Live Demo: [https://jan-seva-mp.vercel.app/](https://jan-seva-mp.vercel.app/)

---

## Overview

Jan Seva is an AI-powered public digital service platform built to connect citizens across Madhya Pradesh with 500+ Central and State welfare schemes. The platform provides:
- **Multilingual Voice Intake**: Conversational scheme discovery in Hindi, English, Marathi, and Tamil using Web Speech API.
- **Explainable Eligibility Scorecard**: Multi-variable rule engine scoring citizen compatibility (0-100%) with transparent legal justification.
- **Vision Document OCR**: Automated field extraction from Aadhaar, Samagra ID, and passbooks with zero persistent PII storage.
- **Kiosk Verification Slip**: Printable acknowledgment slips with deterministic SVG QR verification codes for MPOnline / CSC operators.
- **CM Helpline 181 Auto-Petitions**: Formal grievance generator calculating statutory delay under the MP Public Services Guarantee Act 2010.
- **Offline-First Resilience**: Local caching in IndexedDB for uninterrupted use during rural network dropouts.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Client UI** | React 18, Vite, Responsive CSS Grid / Flexbox |
| **Speech Pipeline** | Web Speech API (Native browser ASR & TTS, BCP-47) |
| **Multimodal Vision & LLM** | Google Gemini 1.5 Flash / Vision API |
| **Database & Auth** | Supabase (PostgreSQL with Row Level Security) |
| **Offline Cache** | IndexedDB, LocalStorage, Connection Status Observers |
| **Hosting & CI/CD** | Vercel Serverless Edge |

---

## Project Structure

```text
├── public/                 # Static assets & icons
├── src/
│   ├── lib/
│   │   ├── gemini.js       # AI chat orchestration & document OCR parser
│   │   ├── supabase.js     # Database client for verified scheme catalog
│   │   ├── speech.js       # Web Speech API voice synthesis & recognition
│   │   ├── offline.js      # IndexedDB scheme cache & connection observer
│   │   ├── profile.js      # Local user profile persistence
│   │   ├── settings.js     # Accessibility & language preferences
│   │   └── applicationDraft.js # Local form draft manager
│   ├── App.jsx             # Core application shell & navigation state
│   ├── LandingPage.jsx     # Citizen portal landing view & scheme showcase
│   ├── ApplicationForm.jsx # OCR document upload & kiosk slip generator
│   ├── EligibilityScorecard.jsx # Multi-scheme compatibility matcher
│   ├── GrievanceRedressal.jsx   # CM Helpline 181 escalation petition drafter
│   ├── AdminDashboard.jsx  # Nodal officer district analytics & SLA monitor
│   ├── Logo.jsx            # Official vector emblem
│   ├── Icons.jsx           # UI icons library
│   ├── index.css           # Global typography, themes & accessibility styles
│   └── main.jsx            # React root mount
├── package.json
└── vite.config.js
