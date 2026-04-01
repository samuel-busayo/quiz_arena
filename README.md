# Coordi.Tech Quiz Arena

Professional Dual-Screen Quiz Competition Software built with Electron, React, and TailwindCSS.

![Mission Control Aesthetic](https://raw.githubusercontent.com/samuel-busayo/quiz_arena/main/preview.png)

## 🚀 Overview

Coordi.Tech Quiz Arena is a futuristic, "Mission Control" themed quiz application designed for high-stakes school competitions AND professional events. It features a robust dual-screen architecture, keeping the Admin Console separate from the Projection Screen for a seamless participant experience.

## ✨ Key Features

- **Dual-Screen Engine**: Immersive Projection window with synchronized Admin controls.
- **Cinematic Winner Sequence**: Multi-stage celebration with eliminated team memories and 3D trophy reveals.
- **Automated Tie-Breaker**: Smart stalemate detection with 1-take engagement loops.
- **Dynamic Leaderboard**: Glassmorphic, real-time standings with 'Elimination' status indicators.
- **Keyboard Mastery**: Full keyboard support for rapid Host operations (A/B/C/D, Pause, Resume).
- **Offline First**: Runs entirely locally via JSON data vectors.

## 🛠️ Tech Stack

- **Core**: Electron + Vite
- **Frontend**: React + TailwindCSS
- **Animations**: Framer Motion
- **State Management**: Zustand
- **3D Visuals**: React Three Fiber + Three.js
- **Audio**: Howler.js

## 🚦 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/samuel-busayo/quiz_arena.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Run the application in development mode:
```bash
npm run dev
```

### Production Build

Generate a production-ready installer:
```bash
npm run build
npm run dist
```

## 📖 Host Guide (Admin)

1. **Setup**: Select your question JSON and register up to 4 teams.
2. **Live Console**: Command the mission. Select data nodes, verify responses, and advance rounds.
3. **Emergency Override**: Use 'FORCE PROCEED' to skip transition delays if necessary.

## 🏆 Player Guide

1. **Objective**: Accumulate the highest 'Intel' score by decrypting data packets (questions).
2. **Lifelines**: Deploy the 50/50 lifeline to narrow down possibilities.
3. **Elimination**: Final-ranking teams are discharged with honor as the field narrows.

## 👨‍💻 Contributors

- **Olatunbosun Samuel Busayo** - CTO @ Coordi.Tech
- **Biose Peter John** - CTO @ BioLab

---

© 2026 Coordi.Tech. All Rights Reserved.
