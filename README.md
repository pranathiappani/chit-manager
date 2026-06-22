# Group Savings & Credit Manager (ROSCA / Chit Fund Manager)

A secure, full-stack web and mobile application designed to manage Group Savings and Credit Associations (ROSCAs, commonly known as chit funds or committees). The application facilitates member enrollment, contribution tracking, automated loan amortization/interest calculations, and payout scheduling.

---

## 🚀 Live Demo
* **Deployed Web URL:** [https://chit-manager-psi.vercel.app/](https://chit-manager-psi.vercel.app/)
* **Hosting Infrastructure:** Frontend deployed on **Vercel**, REST API backend on **Render**, and Database hosted on **Aiven (MySQL)**.

### 🔑 Demo Credentials
You can log in and explore all administrative capabilities of the application using the following test account:
* **Username:** `admin`
* **Password:** `admin123`

---

## ✨ Key Features
* **👥 Group Savings Management:** Create and track rotating savings groups, including duration, member count, monthly contributions, and dividend payouts.
* **💳 Loan Accrual & Interest Tracking:** Automated interest calculation modules that accurately compute and collect time-based interest on group loans, preventing data conflicts at loan closure.
* **🔒 Database-Level AES-256 Encryption:** Enhanced database security using Hibernate Attribute Converters to transparently encrypt sensitive PII (Personally Identifiable Information) like names, phone numbers, and addresses.
* **🔁 Resilient API Middleware:** Integrated an automatic request retry interceptor within Axios to gracefully handle cloud cold starts (Render sleep states), retrying failed requests up to 5 times with a 3-second delay.
* **📱 Cross-Platform Mobile Support:** Packaged using **Capacitor** to compile into a native Android application with dynamic IP network routing.
* **📊 Analytics Dashboard:** A comprehensive visual overview displaying total active members, cumulative group profits, pending collections, and interactive payout summaries.

---

## 🛠️ Tech Stack

### Frontend & Mobile
* **Core:** React.js, Vite
* **State Management:** Zustand
* **API Client:** Axios (with custom retry interceptors)
* **Mobile Bridge:** Capacitor (Android SDK / Gradle integration)
* **Styling:** Material-UI (MUI), Vanilla CSS
* **Charts:** Recharts

### Backend
* **Framework:** Spring Boot (v3.2.6)
* **Security:** Spring Security, JWT (JSON Web Tokens)
* **ORM:** Hibernate / Spring Data JPA
* **Build Tool:** Maven

### Database & Dev Environment
* **Database:** MySQL
* **Containers:** Docker, Docker Compose
* **Environment Management:** spring-dotenv

---

## 💻 Local Setup Guide

### Prerequisites
* Java JDK 21
* Node.js (v18+)
* Docker & Docker Compose

### 1. Database Setup
Start the local MySQL database instance using Docker:
```bash
docker-compose up -d
```
The database will start on port `3307`.

### 2. Backend Setup
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create a `.env` file in the `backend` folder and populate it with your environment variables:
   ```env
   JWT_SECRET=your_super_secret_jwt_key_here_32_bytes_or_more
   JWT_EXPIRATION_MS=3600000
   SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3307/chitmanager?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
   SPRING_DATASOURCE_USERNAME=root
   SPRING_DATASOURCE_PASSWORD=root
   DB_ENCRYPTION_KEY=your_aes_256_key_32_characters_long
   ```
3. Run the Spring Boot application:
   ```bash
   ./mvnw spring-boot:run
   ```
The backend API will start on `http://localhost:8080`.

### 3. Frontend Setup
1. Navigate to the `frontend` directory:
   ```bash
   cd ../frontend
   ```
2. Create a `.env` file in the `frontend` folder:
   ```env
   VITE_API_URL=http://localhost:8080/api
   ```
3. Install dependencies and start the Vite dev server:
   ```bash
   npm install
   npm run dev
   ```
Open `http://localhost:5173` in your browser.

### 4. Build Native Mobile App (Android)
To sync your frontend build and run it in Android Studio:
```bash
npm run build
npx cap sync
npx cap open android
```
Use Android Studio to build or run the app on an emulator/physical device.
