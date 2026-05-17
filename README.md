# Doverlay 🚀

**Doverlay** is a modern, high-performance donation overlay system for streamers. Built with Next.js 15, it features real-time donation alerts, top donator leaderboards, and an automated slip verification system using OCR (Optical Character Recognition).

---

## ✨ Features

- 🎨 **Sleek Overlay Design:** Beautifully designed alerts and leaderboards ready for OBS/Streamlabs.
- 🔍 **Auto-Slip Verification:** Uses Tesseract.js OCR to read and verify transfer slips (supports Thai banks).
- ⚡ **Real-time Updates:** Powered by Firebase Realtime Database for instant alert triggers.
- 🛠️ **Admin Dashboard:** Manage donations, confirm payments, and configure your payment methods easily.
- 🎤 **Text-to-Speech (TTS):** Automatic narration of donation messages.
- 📱 **Responsive UI:** Clean and modern interface built with Tailwind CSS and Framer Motion.

---

## 🛠️ Tech Stack

- **Framework:** [Next.js 15+](https://nextjs.org/) (App Router)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/), [Lucide React](https://lucide.dev/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **Backend/Database:** [Firebase](https://firebase.google.com/) (Realtime Database & Auth)
- **OCR:** [Tesseract.js](https://tesseract.projectnaptha.com/)
- **Image Hosting:** [ImgBB API](https://api.imgbb.com/)
- **Deployment:** [Netlify](https://www.netlify.com/)

---

## 📁 Project Structure

```text
src/
├── app/
│   ├── (main)/       # Main website & Admin panel (Home, Login, Dashboard)
│   └── (overlay)/    # Streaming overlays (Alerts, Leaderboards)
├── components/       # Reusable UI components
├── contexts/         # React Contexts (Auth, etc.)
├── lib/              # Utility functions (Firebase, OCR, TTS)
└── types/            # TypeScript definitions
```

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd Doverlay
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env.local` file in the root and add your credentials:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_DATABASE_URL=your_database_url
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_IMGBB_API_KEY=your_imgbb_api_key
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to see the result.

---

## 📦 Deployment

### Netlify
This project is optimized for Netlify. Simply connect your repository and set the environment variables in the Netlify Dashboard.

- **Build Command:** `npm run build`
- **Publish Directory:** `.next`

---

## 🤝 Contributing

Feel free to open issues or submit pull requests to improve the project!

---

## 📝 License

Private / Internal Use.
