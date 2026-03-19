# Changelog

รายการการเปลี่ยนแปลงทั้งหมดของโปรเจ็ค My Vote
รูปแบบอ้างอิงจาก [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
และใช้ [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

---

## [Unreleased]

---

## [1.1.0] — 2026-03-19

### Firebase Optimization — ลด Reads/Writes และ Bandwidth

#### แก้ไข
- **`subscribeToVoterCount`** — เปลี่ยนจากอ่าน `votes` collection ทั้งหมด (N docs) เป็นอ่านแค่ `settings/config` 1 doc ผ่าน counter field `voterCount`
- **`submitVote`** — เพิ่ม increment `voterCount` ใน `settings/config` ภายใน transaction เดิม ไม่มี read เพิ่ม
- **Toggle functions ทั้ง 6** (`toggleVoting`, `toggleShowResults`, `toggleReactions`, `toggleSounds`, `toggleUserSubmission`, `setTotalEligibleVoters`) — เปลี่ยนจาก `runTransaction` (1 read + 1 write) เป็น `setDoc + merge` (1 write เท่านั้น)
- **Cleanup interval** — ย้ายจาก `DashboardPage` (ทุก client รัน) ไปอยู่ใน `AdminPanelPage` (รันเฉพาะ Admin client เดียว)
- **`AdminPanelPage`** — ลบ `fetchCandidates()` ที่ซ้ำซ้อน 6 จุด หลัง add/edit/delete/reset/seed เพราะ `subscribeToCandidates` จัดการ real-time update อยู่แล้ว

#### เพิ่มใหม่
- **Image compression** — บีบอัดรูปภาพก่อนอัปโหลด Firebase Storage (max 800px, JPEG 80%) ลด Storage และ bandwidth ในการโหลดรูป

#### ผลลัพธ์
| จุด | ก่อน | หลัง |
|-----|------|------|
| ดูจำนวนผู้โหวต | อ่าน N docs ทุกครั้ง | อ่าน 1 doc |
| กด Toggle 1 ครั้ง | 1 read + 1 write | 1 write |
| Cleanup (10 คนดู Dashboard) | 10 clients รัน | 1 client รัน |
| Admin จัดการ candidates | subscription + fetch ซ้ำ | subscription อย่างเดียว |
| อัปโหลดรูป 5MB | 5MB ขึ้น Storage | ~200KB ขึ้น Storage |

---

## [1.0.0] — 2026-03-19

### เพิ่มใหม่
- ระบบโหวตแบบ Real-time ด้วย Firebase Firestore `onSnapshot`
- หน้าโหวต (VoterPage) — เลือกผู้สมัครได้ 2 คน พร้อม Confetti animation
- Live Dashboard — กราฟแท่ง Recharts, Leaderboard Top 3, Voting Progress bar
- Admin Panel — เพิ่ม/แก้ไข/ลบผู้สมัคร, ตั้งค่าระบบด้วย Minecraft Toggle
- หน้าผลการโหวต (ResultsPage) — แท่นอันดับ Top 3 สไตล์ทอง/เงิน/ทองแดง
- ระบบ Reaction แบบ Real-time — Emoji ลอยขึ้นจอพร้อม Sound Board
- ระบบ User Submission — ผู้ใช้ส่งชื่อผู้สมัครเองได้ (เปิด/ปิดโดย Admin)
- QR Code สำหรับเข้าถึงหน้าโหวตและหน้า submission
- Firebase Anonymous Authentication สำหรับผู้โหวต
- Firebase Email/Password Authentication สำหรับ Admin
- Firebase Storage สำหรับอัปโหลดรูปภาพผู้สมัคร
- Firestore Security Rules ป้องกันการโหวตซ้ำและการแก้ไขข้อมูลโดยไม่ได้รับอนุญาต
- Transaction-based voting ป้องกัน race condition
- Batch delete สำหรับลบข้อมูลจำนวนมาก (สูงสุด 500 ops/batch)
- Auto-cleanup reactions และ sounds ทุก 30 วินาที
- ธีม Minecraft pixel art ด้วย CSS Variables
- Framer Motion animations — leaderboard reordering, card hover, transitions
- รองรับ responsive design (mobile, tablet, desktop)
- Firebase Hosting deployment

### เทคโนโลยี
- React 19, TypeScript, Vite 7
- Firebase 11 (Firestore, Auth, Storage, Analytics)
- Tailwind CSS 4, Framer Motion 11
- Recharts, react-qr-code, canvas-confetti, lucide-react

---

## รูปแบบ Semantic Versioning

```
MAJOR.MINOR.PATCH

MAJOR — เปลี่ยนแปลงที่ไม่ backward compatible (เช่น เปลี่ยน database schema)
MINOR — เพิ่มฟีเจอร์ใหม่ที่ยังคง backward compatible
PATCH — แก้ bug หรือปรับปรุงประสิทธิภาพเล็กน้อย
```
