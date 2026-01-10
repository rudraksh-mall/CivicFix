# GDG-TechSprint

# 🏛️ CivicFix AI

> A transparent, scalable, and citizen-first civic engagement platform designed to streamline complaint reporting, enhance community participation, and improve governance through data-driven prioritization.

---

## 🌟 Overview

**CivicFix AI** bridges the gap between citizens and local authorities by providing a unified digital platform for reporting civic issues, tracking resolutions, and prioritizing problems through community voting.

The platform promotes **accountability**, **transparency**, and **data-driven governance**, ensuring that critical civic problems receive the attention they deserve.

---

## 🧩 Problem Statement

Urban governance systems often suffer from:
- Manual and opaque complaint redressal processes
- No clear prioritization of urgent civic issues
- Low citizen engagement after complaint submission
- Inefficient communication between citizens and authorities

**CivicFix AI** addresses these gaps by **digitizing complaints**, **introducing democratic prioritization via voting**, and **empowering authorities with structured dashboards and analytics**.

---

## 🎯 Core Functionality

### 🧱 Basic Features
- **Citizen Complaint Reporting**  
  Submit complaints with descriptions, images, and precise geo-location.

- **Role-Based Authentication**  
  Secure JWT-based authentication for Citizens, Authorities, and Admins.

- **Complaint Lifecycle Tracking**  
  Track complaints through *Pending*, *In Progress*, and *Resolved* states.

- **Community Voting System**  
  One-vote-per-user mechanism to prioritize high-impact issues.

---

### ⚙️ Advanced Features
- **📍 Location-Based Filtering**  
  Ward-wise and area-wise complaint views for authorities.

- **📊 Priority Analytics**  
  Ranking of complaints based on votes and engagement metrics.

- **🖼️ Secure Image Uploads**  
  Media storage and optimization using Cloudinary.

- **🧩 Clean Backend Architecture**  
  Modular structure with Controllers, Services, Middlewares, and Utilities.

---

## 🤖 System & Technical Capabilities

- **JWT + Role Guards** for fine-grained access control  
- **Vote Deduplication** enforced via database-level indexing  
- **Centralized Error Handling** using `ApiError` and `ApiResponse`  
- **Scalable MongoDB Schema Design** for high-volume civic data  

---

## 🎨 User Experience

- **📱 Fully Responsive UI** for mobile, tablet, and desktop
- **⚡ Fast State Management** using Zustand
- **🧭 Intuitive Workflows** from complaint creation to resolution tracking
- **🗺️ Interactive Maps** for visualizing complaint locations

---

## 🧠 Tech Stack

### 🎨 Frontend
- React 19 + Vite  
- Tailwind CSS  
- Zustand (state management)  
- Axios  
- Leaflet & React Leaflet  
- Google OAuth (`@react-oauth/google`)  
- Recharts (analytics & charts)  
- Lucide React (icons)  
- React Hot Toast (notifications)  

---

### ⚙️ Backend
- Node.js & Express.js (v5)
- MongoDB & Mongoose
- JWT Authentication
- bcrypt (password hashing)
- Cloudinary (media storage)
- Multer & Multer-Cloudinary
- Nodemailer (email services)
- OpenAI API
- UUID
- dotenv, CORS, Cookie Parser

---

## ☁️ Google Technologies Used

This project integrates multiple **Google-powered technologies** to enhance authentication, mapping, and AI-driven analysis:

- **Google OAuth 2.0**  
  Secure and seamless authentication for users using Google accounts.

- **Google Cloud Vision API**  
  AI-powered image analysis for validating and categorizing complaint images.

- **Google Auth Library**  
  Secure token verification and authentication handling on the backend.

These technologies collectively improve **security**, **accuracy**, and **user experience** while ensuring enterprise-grade reliability.

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB (local or cloud)
- Cloudinary account
- Google Cloud project (OAuth, Maps, Vision API enabled)

---

### 🧭 Steps
```bash
# Clone the repository
git clone https://github.com/your-username/civicfix-ai.git

# Navigate to the project directory
cd civicfix-ai

# Backend setup
cd backend
npm install
npm run dev

# Frontend setup (new terminal)
cd frontend
npm install
npm run dev
```


## 👥 Team

This project was developed collaboratively as a team effort:

- **Pratyush Bhaskar**
- **Rudraksh Mall**
- **Rajeev Dixit**
- **Sahil Bharne**
