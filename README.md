# My Vote — ระบบโหวตแบบ Real-time

ระบบโหวตออนไลน์แบบ Real-time สร้างด้วย **React 19**, **TypeScript** และ **Firebase** ธีม Minecraft pixel art พร้อม Live Dashboard, ระบบ Reaction และแผงควบคุม Admin ครบครัน

> พัฒนาสำหรับงาน **ครบรอบ 30 ปี SBAC** ในฐานะส่วนหนึ่งของ WebAppDev Workshop

---

## ภาพหน้าจอ

| หน้าโหวต | Live Dashboard | Admin Panel |
|:---------:|:--------------:|:-----------:|
| *(เร็วๆ นี้)* | *(เร็วๆ นี้)* | *(เร็วๆ นี้)* |

---

## ฟีเจอร์

### สำหรับผู้โหวต
- เรียกดูรายชื่อผู้สมัครพร้อมรูปภาพและคำอธิบาย
- เลือกได้ **2 คน** ต่อการโหวต 1 ครั้ง
- แสดง Confetti animation เมื่อโหวตสำเร็จ
- ป้องกันการโหวตซ้ำ
- ส่งชื่อผู้สมัครของตัวเองได้ (เมื่อ Admin เปิดใช้งาน)

### Live Dashboard
- อัปเดตคะแนนแบบ Real-time ผ่าน Firestore subscription
- กราฟแท่งเคลื่อนไหวด้วย Recharts
- Leaderboard Top 3 พร้อม animation เรียงลำดับสด
- ส่ง Emoji reaction (❤️ 👍 🔥 🎉 🚀) และ Sound board
- QR Code สำหรับเข้าถึงหน้าโหวตได้ทันที
- ล้าง reaction อัตโนมัติทุก 30 วินาที

### Admin Panel
- เข้าสู่ระบบด้วย Email/Password ผ่าน Firebase Auth
- เพิ่ม แก้ไข ลบผู้สมัคร พร้อมอัปโหลดรูปภาพ
- ตั้งค่าระบบ: เปิด/ปิดการโหวต, แสดง/ซ่อนผล, เปิด/ปิด Reaction และ Sound
- รีเซ็ตคะแนนทั้งหมด / ลบผู้สมัครทั้งหมด
- Seed ข้อมูลตัวอย่างสำหรับทดสอบ
- สร้าง QR Code ลิงก์ส่งชื่อผู้สมัคร

### หน้าผลการโหวต
- แท่นอันดับ Top 3 (ทอง / เงิน / ทองแดง)
- ตาราง Leaderboard พร้อมจำนวนโหวตและเปอร์เซ็นต์

---

## เทคโนโลยีที่ใช้

| หมวดหมู่ | เทคโนโลยี |
|----------|-----------|
| Frontend | React 19, TypeScript |
| Build Tool | Vite 7 + SWC |
| Styling | Tailwind CSS 4, Framer Motion |
| Backend | Firebase 11 (Firestore, Auth, Storage) |
| Charts | Recharts |
| อื่นๆ | canvas-confetti, react-qr-code, lucide-react, clsx |

---

## การติดตั้งและเริ่มต้นใช้งาน

### สิ่งที่ต้องมีก่อน

- Node.js v18 ขึ้นไป
- npm
- โปรเจ็ค [Firebase](https://console.firebase.google.com/)

### 1. Clone repository

```bash
git clone https://github.com/<your-username>/my-vote.git
cd my-vote
```

### 2. ติดตั้ง dependencies

```bash
npm install
```

### 3. ตั้งค่า Firebase

ใน Firebase Console:

1. สร้างโปรเจ็คใหม่
2. เปิด **Authentication** → เลือก Anonymous และ Email/Password
3. เปิด **Firestore Database** (เริ่มในโหมด Test)
4. เปิด **Storage**
5. คัดลอก Web App Config ของโปรเจ็ค

### 4. ตั้งค่า Environment Variables

สร้างไฟล์ `.env` ที่ root ของโปรเจ็ค (copy จาก `.env.example`):

```bash
cp .env.example .env
```

แก้ไขใส่ค่า Firebase ของคุณ:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

> **ห้าม commit ไฟล์ `.env` ขึ้น GitHub เด็ดขาด** — ไฟล์นี้ถูกเพิ่มใน `.gitignore` แล้ว

### 5. Deploy Firestore Security Rules

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules
```

### 6. รัน Development Server

```bash
npm run dev
```

เปิดเบราว์เซอร์ที่ [http://localhost:5173](http://localhost:5173)

---

## โครงสร้างโปรเจ็ค

```
my-vote/
├── src/
│   ├── assets/             # รูปภาพ static
│   ├── components/
│   │   ├── ui/             # UI ทั่วไป (Button, Card, MinecraftToggle)
│   │   └── ...             # Feature components (Confetti, Fireworks, ฯลฯ)
│   ├── context/
│   │   └── AuthContext.tsx # จัดการ Firebase auth state
│   ├── pages/
│   │   ├── VoterPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── AdminPanelPage.tsx
│   │   ├── AdminLoginPage.tsx
│   │   ├── AddCandidatePage.tsx
│   │   └── ResultsPage.tsx
│   ├── services/
│   │   ├── voteService.ts  # Firestore operations ทั้งหมด
│   │   └── soundService.ts
│   ├── types/types.ts      # TypeScript interfaces
│   ├── routes.ts           # ค่าคงที่ของ Route path
│   ├── firebase.ts         # Firebase initialization
│   └── App.tsx             # Router setup
├── firestore.rules         # Firestore security rules
├── firebase.json           # Firebase hosting config
├── .env.example            # ตัวอย่าง environment variables
└── vite.config.ts
```

---

## เส้นทาง (Routes)

| Path | หน้า | สิทธิ์เข้าถึง |
|------|------|--------------|
| `/` | หน้าโหวต | สาธารณะ |
| `/dashboard` | Live Dashboard | สาธารณะ |
| `/results` | หน้าผลการโหวต | สาธารณะ |
| `/add-candidate` | ส่งชื่อผู้สมัคร | สาธารณะ (เมื่อเปิดใช้งาน) |
| `/admin-login` | เข้าสู่ระบบ Admin | สาธารณะ |
| `/admin-panel` | แผงควบคุม Admin | Admin เท่านั้น |

---

## โครงสร้างข้อมูล Firestore

```
candidates/          # รายชื่อผู้สมัครพร้อมจำนวนโหวต
votes/               # 1 document ต่อ 1 ผู้ใช้ (userId เป็น doc ID)
settings/config      # การตั้งค่าระบบ (votingEnabled, showResults ฯลฯ)
reactions/           # Emoji reactions แบบ real-time (ลบอัตโนมัติหลัง 30 วินาที)
sounds/              # Sound events (ลบอัตโนมัติหลัง 30 วินาที)
history/             # เก็บผลการโหวตของแต่ละ session
```

---

## คำสั่งที่ใช้บ่อย

```bash
npm run dev        # เริ่ม development server
npm run build      # ตรวจ type และ build สำหรับ production
npm run preview    # ทดสอบ production build บนเครื่อง
npm run lint       # รัน ESLint
```

---

## การ Deploy

### Firebase Hosting

```bash
npm run build
firebase deploy
```

แอปจะขึ้นที่ `https://<project-id>.web.app`

---

## การปรับแต่งธีม

แก้ไข CSS variables ใน [src/index.css](src/index.css) เพื่อเปลี่ยนสีธีม:

```css
:root {
  --mc-bg: #1a1a1a;        /* พื้นหลังสีเข้ม */
  --mc-primary: #38bdf8;   /* Diamond blue */
  --mc-success: #4ade80;   /* Lime green */
  --mc-danger: #ef4444;    /* Redstone red */
  --mc-card: #2c2c2c;      /* พื้นหลัง Card */
}
```

---

## License

MIT License

Copyright (c) 2026 Ratchanon Semsayan (รัชชานนท์ เสมสายัณห์)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
