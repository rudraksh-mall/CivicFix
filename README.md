# 🏛️ CivicFix

> AI-powered civic issue reporting and community-driven governance platform that helps citizens report, discover, validate, prioritize, and track public infrastructure issues in real time.

---

## 🌐 Live Demo

**Deployment:** [https://civic-fix-ai-eight.vercel.app/]

---

# 🚀 Overview

CivicFix AI is a modern civic engagement platform that bridges the gap between citizens and municipal authorities.

Citizens can report civic infrastructure issues such as:

* Potholes
* Garbage accumulation
* Drainage problems
* Streetlight failures
* Water leakage
* Road damage
* Public infrastructure defects

The platform uses AI-powered image verification, location intelligence, and community participation to ensure complaints are authentic, properly categorized, and prioritized based on real-world impact.

---

# ✨ Key Features

## 🤖 AI-Powered Complaint Verification

Before a complaint is accepted:

* AI validates uploaded images
* Detects whether the image depicts a real civic issue
* Rejects irrelevant images (anime, screenshots, memes, pets, landscapes, etc.)
* Validates image-description consistency
* Auto-generates:

  * Category
  * Severity
  * Confidence score
  * Tags

### Example

✅ Real pothole image + pothole description → Accepted

❌ Batman image + pothole description → Rejected

❌ Pothole image + "Street Light Issue" description → Rejected

---

## 📝 Smart Complaint Reporting

Guided multi-step workflow:

### Step 1

Upload evidence photo

### Step 2

Select location

* Current location
* Map picker
* Manual map selection

### Step 3

Describe issue

### Step 4

Review & Submit

---

## 🗺️ Interactive Civic Intelligence Map

Explore civic issues across the city using an interactive map.

Features:

* Complaint markers
* Nearby issues
* Search locations
* Location-based discovery
* Complaint clustering
* Live community feed
* Map-driven complaint exploration

---

## 📍 Location-Aware Discovery

Citizens can discover issues using:

### Nearby

Issues within a configurable radius

### Ward

Issues in a specific ward

### City

Issues reported across the city

### All Reports

Complete public issue feed

---

## 🤝 Community Support System

Instead of duplicate reporting:

Citizens can:

* Support existing complaints
* Increase issue visibility
* Help authorities prioritize problems

Benefits:

* Reduced duplicate reports
* Better prioritization
* Stronger community engagement

---

## 📊 Complaint Lifecycle Tracking

Track complaints through every stage:

### Submitted

Complaint successfully reported

### Under Review

Authority reviewing complaint

### In Progress

Work initiated

### Resolved

Issue fixed

---

## 🏢 Authority Dashboard

Dedicated dashboard for municipal authorities.

Capabilities:

* View ward-specific complaints
* Filter by category
* Manage complaint status
* Prioritize high-impact issues
* Monitor community support
* Track resolution progress

---

## 🔐 Authentication & Security

### Citizen Authentication

* Email / Password Login
* Google OAuth Login
* Google OAuth Signup

### Authority Authentication

* Secure Authority Login
* Role-Based Access Control

### Security

* JWT Authentication
* Protected Routes
* Role Guards
* Password Hashing (bcrypt)

---

## 🎨 Modern User Experience

### Responsive Design

Optimized for:

* Desktop
* Tablet
* Mobile

### Features

* Dark modern interface
* Multi-step reporting wizard
* Interactive maps
* Real-time feedback
* Accessible navigation
* Consistent design system

---

# 🧠 Technology Stack

## Frontend

* React 19
* Vite
* Tailwind CSS
* Zustand
* Axios
* React Router
* React Hot Toast
* Recharts
* Lucide React
* Leaflet
* React Leaflet
* Google OAuth

---

## Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT
* bcrypt
* Cloudinary
* Multer
* Nodemailer
* OpenAI Vision API
* UUID

---

# 🤖 AI Features

CivicFix AI leverages multimodal AI for civic issue validation.

### AI Capabilities

* Civic image classification
* Image authenticity verification
* Image-description matching
* Auto categorization
* Severity assessment
* Confidence scoring
* Automated tagging

---

# ☁️ Integrations

### Google OAuth

Secure social authentication

### Cloudinary

Image storage and optimization

### OpenAI Vision

AI-powered civic issue validation

### Leaflet

Interactive mapping and location services

---

# 📂 Architecture

Insert your architecture diagram here.

```text
Frontend (React)
      │
      ▼
Backend API (Express)
      │
 ┌────┼────┐
 ▼    ▼    ▼
MongoDB Cloudinary OpenAI
```

---

# 🛠️ Local Setup

## Prerequisites

* Node.js 18+
* MongoDB
* Cloudinary Account
* OpenAI API Key
* Google OAuth Credentials

---

## Installation

```bash
git clone https://github.com/rudraksh-mall/CivicFix.git

cd CivicFix

# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

---

# 👥 Team

### Rudraksh Mall
### Pratyush Bhaskar
### Rajeev Dixi
### Sahil Bharne
---
