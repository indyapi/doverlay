# 🎬 Doverlay

ระบบรับ Donation สำหรับ Streamer พร้อม Overlay Real-time สำหรับ OBS

---

## 🛠️ Tech Stack

- **Next.js 14** + TypeScript
- **Tailwind CSS** + shadcn/ui
- **Firebase** (Firestore, Storage, Auth)
- **Tesseract.js** — OCR อ่านสลิปธนาคาร
- **Framer Motion** — Animation
- **Web Speech API** — TTS อ่านข้อความฝาก

---

## 🚀 วิธี Setup

### 1. Clone และติดตั้ง dependencies
```bash
git clone https://github.com/yourusername/doverlay.git
cd doverlay
npm install
```

### 2. ตั้งค่า Firebase
1. ไปที่ [Firebase Console](https://console.firebase.google.com)
2. สร้าง Project ใหม่
3. เปิดใช้งาน **Firestore**, **Storage**, **Authentication (Email/Password)**
4. ไปที่ Project Settings > Your Apps > เพิ่ม Web App
5. คัดลอก config มาใส่ `.env.local`

### 3. ตั้งค่า Environment Variables
```bash
cp .env.local.example .env.local
# แก้ไขค่าต่างๆ ใน .env.local
```

### 4. สร้าง Admin Account
1. ไปที่ Firebase Console > Authentication > Users
2. Add User > ใส่ email และ password ที่ต้องการ

### 5. รัน Development Server
```bash
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000)

---

## 📁 โครงสร้างโปรเจค

```
src/
  app/
    page.tsx                  → หน้า Donation (Public)
    admin/page.tsx            → Admin Panel (3 tabs)
    overlay/
      alert/page.tsx          → OBS: แจ้งเตือน donation
      topdonate/page.tsx      → OBS: Top 10 Donators
  lib/
    firebase.ts               → Firebase config
    firestore.ts              → Firestore service functions
    ocr.ts                    → Tesseract.js OCR
    tts.ts                    → Web Speech API
    utils.ts                  → Utility functions
  types/
    index.ts                  → TypeScript types
  contexts/
    AuthContext.tsx            → Firebase Auth context
```

---

## 🎮 วิธีใช้งาน

### OBS Browser Source
1. เปิด Admin > Tab Overlay
2. คัดลอกลิงค์ Overlay
3. ใน OBS เพิ่ม Browser Source > วาง URL
4. ตั้งขนาดตามต้องการ

### URL Overlays
- Alert: `https://yoursite.vercel.app/overlay/alert`
- Top Donate: `https://yoursite.vercel.app/overlay/topdonate`

---

## 💰 ค่าใช้จ่าย

**ฟรีทั้งหมด** สำหรับการใช้งานส่วนตัว

| บริการ | Free Tier |
|---|---|
| Firebase Firestore | 1GB, 50k reads/วัน |
| Firebase Storage | 5GB |
| Firebase Auth | 10k users/เดือน |
| Vercel | 100GB bandwidth/เดือน |

---

## 📝 License

MIT
