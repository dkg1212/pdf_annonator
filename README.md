# 📄 PDF Annotator Full Stack Application

A full-stack React application that allows users to upload PDF files, highlight text within the document, and persist these highlights for later viewing. The application supports user authentication, PDF upload and viewing, text highlighting, and a personal library dashboard. All data is securely stored using MongoDB and AWS S3 (cloud storage). The app is production-ready and can be deployed to Vercel (frontend) and Render (backend).
A full-stack React application that allows users to upload PDF files, highlight text within the document, and persist these highlights for later viewing. The application supports user authentication, PDF upload and viewing, text highlighting, and a personal library dashboard. All data is securely stored using MongoDB and AWS S3 (cloud storage). The app is production-ready and can be deployed to Vercel (frontend) and Render (backend).

---

## �️ User Flow (Step-by-Step)

1. 🔐 **Register/Login:**
  - Enter your email and password to create an account or log in.
  - JWT token is used for secure session management.
2. ⬆️ **Upload PDF:**
  - Click the upload button and select a PDF from your device.
  - The PDF is uploaded to secure AWS S3 cloud storage and appears in your personal library/dashboard.
3. 👁️ **View & Annotate:**
  - Click on any PDF in your library to open it in the viewer.
  - Use your mouse to select and highlight text. Highlights are saved automatically.
4. 🖍️ **Restore Highlights:**
  - When you reopen a PDF, all your previous highlights are restored and shown.
5. 🗂️ **Manage Library:**
  - Rename (✏️) or delete (🗑️) PDFs from your dashboard with one click.
  - Only you can see and manage your own files and highlights.

---
---


## ✨ Features
- 🔐 **User Authentication**: Register and login with email/password. JWT-based session management.
- ⬆️ **PDF Upload & Cloud Storage**: Upload PDF files, which are stored securely in AWS S3 and tracked with UUIDs.
- 👁️ **PDF Viewer**: View uploaded PDFs in-browser with pagination and zoom support.
- 🖍️ **Text Highlighting**: Select and highlight text on any page. Highlights are saved with metadata (PDF UUID, page, text, position, timestamp).
- 💾 **Highlight Persistence**: Highlights are stored in MongoDB and restored when the PDF is re-opened.
- 🗂️ **My Library (Dashboard)**: View, rename (✏️), or delete (🗑️) your uploaded PDFs. Long file names are truncated for a clean UI.
- 🌗 **Responsive UI**: Modern, dark-mode enabled, mobile-friendly interface.
- 🚀 **Production Ready**: Deployable to Vercel (frontend) and Render (backend) with cloud file storage.
- 🔒 **Secure**: All files and highlights are private to each user. JWT and CORS protection enabled.

---

## 🧰 Tech Stack
- ⚛️ **Frontend**: React, [react-pdf](https://github.com/wojtekmaj/react-pdf), [pdfjs-dist](https://github.com/mozilla/pdfjs-dist), Vite, Vercel
- 🛠️ **Backend**: Node.js, Express, Render
- 🗄️ **Database**: MongoDB (with Mongoose, Atlas or local)
- 🔐 **Authentication**: JWT
- ☁️ **File Storage**: AWS S3 (cloud storage)

---

## Setup Instructions

- 🟢 Node.js (v18+ recommended)
- 📦 npm
- 🗄️ MongoDB (local or cloud instance)
- ☁️ AWS account (for S3 bucket)

### 1. 📥 Clone the Repository
```bash
git clone <your-repo-url>
cd pdf_anonator
```

### 2. 🛠️ Backend Setup
```bash
cd backend
npm install
```


#### 🗝️ Create a `.env` file in `backend/`:
```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your_bucket_name
```

#### ▶️ Start the Backend
```bash
npm run dev
```

### 3. ⚛️ Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```

---

## 🗝️ Sample .env (Backend)
```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your_bucket_name
```

---

## 📁 Folder Structure
```
backend/
  models/
  routes/
  s3.js
  index.js
frontend/
  src/
  public/
  App.jsx
```

---

## 🚦 Usage
1. 🔐 Register or login as a user.
2. ⬆️ Upload PDF files from your dashboard.
3. 👁️ View and annotate PDFs with highlights.
4. 💾 All highlights are saved and restored automatically.
5. 🗂️ Manage your PDF library (rename, delete, open files).

---


## 📝 Notes
- Each user can only access their own PDFs and highlights.
- All PDF files are stored in AWS S3 for persistence and scalability.
- Highlights are associated with both the user and the PDF UUID.
- CORS and security best practices are enabled for production deployment.

---

## 📄 License
MIT

---

## 📬 Contact
For questions or support, contact: [gogoidimpal546@gmail.com]
