✨ Developed by Team Doctor Assistant ✨

1. Kamal Nayan Kumar - 23BDS026
2. Vijay Pal Singh Rathore - 23BDS067
3. Tejas Chalwadi- 23BDS063
4. Rahul Patel - 23BDS047
5. Karan Kabdal - 23BDS028
6. Yash Srivastava - 23BDS071

---
### Datasets for Testing
- [Audio File](https://github.com/VPbanna123/doc_assistant/blob/main/py/test.mp3)

- [Medical Report Img](https://github.com/VPbanna123/doc_assistant/blob/main/py/blood_report.png)

## Folder Structure
```bash
doc_assistant/
├── backend/                  # Node.js backend for authentication 
│   ├── controllers/          # Auth controller
│   ├── db/                   # MongoDB connection setup
│   ├── middleware/           # Authentication middleware
│   ├── model/                # Mongoose models
│   ├── routes/               # API route definitions
│   ├── uploads/              # Uploaded files storage
│   ├── utils/                # Utility functions
│   ├── server.ts             # Entry point for backend server
│   └── tsconfig.json         # TypeScript configuration
│
├── py/                       # Python scripts for LLM and audio processing
│   ├── chatbot.py            # Direct Chat AI assistant 
│   ├── ocr_extraction.py     # Text Extraction
│   ├── summarizer.py         # Summarises Transcription Scripts    
│   ├── main.py               # Entry point for Python processing
│   ├── whisper_transcribe.py # Whisper transcription scripts
│   └── requirements.txt      # Python dependencies
│
├── src/                      # React Native frontend
│   ├── api/                  # API request files
│   ├── context/              # Auth context provider
│   ├── screens/              # All app screens (login, signup, home, etc.)
│   ├── services/             # Auth and utility services
│   ├── video/                # Video and audio handling and uploading
│   └── App.tsx               # App entry point
│
├── package.json              # Frontend dependencies
├── tsconfig.json             # TypeScript config for frontend
└── README.md                 # Project documentation
```

# 🏥 Doctor Assistant App

## 📌 Overview  

The **Doctor Assistant App** is an **AI-powered medical assistant** designed to help doctors manage patient consultations efficiently.  

### **How It Works:**  
1. A patient visits the doctor, and the doctor turns on the app.  
2. The app records the **live conversation** between the doctor and the patient.  
3. Alternatively, doctors can **upload an MP3 audio file and Video file** if a live recording is unavailable.  
4. The doctor can also **attach patient reports** such as medical reports, or test results, which are with the help of Optical Character Recognition tranformed into readable text.
5. The app processes the recorded/audio file & video file using **Whisper AI**, converting speech into text.  
6. The transcribed text is analyzed by **Google Gemini AI**, which:  
   - **Diagnoses potential health issues**  
   - **Identifies symptoms**  
   - **Suggests recommended tests & reports**  
7. The app also features an AI-powered chatbot, allowing doctors to ask medical-related queries they might want to search without recording a conversation.  
8. **User authentication and security are ensured** passwords are securely stored using **bcrypt hashing** so that even the app administration cannot access them. **Auth Middleware with JWT** which checks whether a user is valid.
9. The features help increasing accuracy in medicare aiming to revolutionize medical and healthcare industry.
This app acts as a **smart medical assistant** that enhances healthcare efficiency and decision-making.  

---

## 🛠 Tech Stack  

- **Frontend:** React Native (TypeScript)  
- **Backend:** Python (Flask) ,Typescript   
- **APIs Used:**  
  - 🗣 **Whisper API (Local)** – Speech-to-text transcription  
  - 🤖 **Google Gemini AI** – AI chatbot & medical report summarization  
  - 📝 **Tesseract.js** – OCR (Extracts text from medical documents)  
- **Storage:** MongoDB, Local storage (**Cloud integration planned**)  
- **Development Tools:** VS Code, Git, Android Studio, Expo  

---

## 🚀 Features  

- 🎙 **Speech-to-Text Transcription** – Converts recorded consultations into structured transcripts.  
- ⏺️ **Doctor patient conersation recorder** – Doctor can directly record conversation with patient through our app.  
- 🎵 **MP3 & Video Upload Support** – Doctors can upload pre-recorded audio files for analysis.  
- 📄 **Document OCR** – Extracts text from medical reports, prescriptions, and scans.  
- 🤖 **AI Chatbot** – Assists patients with medical queries they may hesitate to ask a doctor.  
- 📊 **Report Generation** – Summarizes patient meetings into structured reports and can be saved locally.  
- 🔐 **Secure Authentication** – Uses **bcrypt hashing**, **Auth Middleware with JWT** for user security .  
- 🖥 **User-friendly UI** – Designed for a seamless experience for doctors and medical staff.  

---

## 🔧 Installation & Setup  

### **Prerequisites**  

Ensure you have the following installed:  
- **Node.js (LTS version)**  
- **Python 3.x** (with Flask installed)  
- **React Native CLI**  
- **Android Studio** (for running the app on an emulator/simulator)  
- **JAVA JDK**   

### **1️⃣ Clone the Repository**  

```bash
git clone https://github.com/VPbanna123/doc_assistant.git
cd doctor-assistant

```

### 2️⃣ Install Dependencies

#### In React Native :

```bash
npm install
```


#### For Python Backend:

```bash
 cd py
 pip install -r requirements.txt
```

### 3️⃣ Run the Application

#### Start Backend (Python)

```bash
 cd py
 python main.py 
```
#### Start Backend (Typescript)

```bash
 cd backend
 npm install
 npm run dev 
```

#### Start Frontend (React Native)

```bash
 npx react-native start
 npx react-native run-android  # For Android
 npx react-native run-ios      # For iOS
```

## 🛠 API Endpoints

| Endpoint      | Method | Description                  |
| ------------- | ------ | ---------------------------- |
| `/transcribe` | POST   | Converts speech to text      |
| `/summarize`  | POST   | Summarizes text documents    |
| `/chatbot`    | POST   | AI-powered chatbot responses |
| `/ocr`        | POST   | Extracts text from images    |

## 🎯 Future Improvements

- 🔹 Cloud storage for storing reports
- 🔹 Multi-language support
- 🔹 More Secure authentication & authorization
- 🔹 Integration with EHR (Electronic Health Record) systems
- 🔹Generates disease prediction graphs to assist doctors 
---