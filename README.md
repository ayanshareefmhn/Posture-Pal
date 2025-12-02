PosturePal – AI-Powered Desk Posture Detection (MERN + Python ML Model)

PosturePal is an AI-based posture monitoring application built using the MERN stack integrated with a Python machine learning model. The system analyzes a user’s live webcam feed while they are working on a laptop or desktop and detects whether their posture is correct or slouched.

This project was developed with the help of Mohammed Mubashir Uddin Faraz.

🔍 Core Features

🧠 ML Model (97% Accuracy): Trained using Python, OpenCV, and MediaPipe/TensorFlow to detect upper-body posture from webcam input.

🌐 MERN Stack Integration:

React frontend streaming live webcam footage

Node.js + Express backend communicating with Python

MongoDB storing posture alerts and user data

⚠️ Real-Time Posture Alerts: Warns users when slouching or leaning forward for too long.

📊 Analytics Dashboard: Logs posture warnings and shows user-wise statistics.

🔒 Secure Authentication: JWT/Clerk/Firebase (optional based on project setup).

🏗️ Tech Stack

Frontend: React.js

Backend: Node.js, Express.js

Database: MongoDB

Machine Learning: Python, OpenCV, MediaPipe/TensorFlow, NumPy

Integration: Child process / Flask API / Socket bridge (depending on your implementation)

📈 Use-Case

Perfect for students, remote employees, gamers, and anyone working long hours on a computer. Helps improve ergonomics and reduce back/neck strain.

file structure =
backend/
│── index.js
│
├── controllers/
│     └── alerts.controller.js
│
├── middleware/
│     └── auth.js
│
├── models/
│     └── Alert.js
│
├── routes/
│     ├── alerts.routes.js
│     └── postureRoutes.js
│
└── package.json  (if present)

frontend/
│── index.html
│── package.json
│── vite.config.js
│
└── src/
     │── App.jsx
     │── App.css
     │── index.css
     │── main.jsx
     │
     └── component/
           ├── Home.jsx
           ├── Navbar.jsx
           ├── Navbar.css
           ├── PostureTracker.jsx
           └── PostureTracker.css

posturepal_model/
│── .python-version
│── requirements.txt
│── collect_data.py
│── infer_runtime.py
│── main.py
│── posture_features.py
│── train_model.py
│
├── .venv/               (virtual environment - should NOT be committed)
│
├── __pycache__/         (auto-generated - ignore)
│
├── data/
│     ├── raw/           (raw webcam captures / keypoints)
│     ├── processed/     (cleaned & feature-extracted data)
│     └── labels/        (label files if any)
│
└── models/
      ├── saved_model.pkl
      ├── posture_classifier.joblib
      └── (any trained weights)

