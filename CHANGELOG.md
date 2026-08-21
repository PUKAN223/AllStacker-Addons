# Changelog

## [3.0.0] - 2026-08-22

### ✨ New Features
- **Mass Breeding** – ให้อาหารสัตว์ทั้ง stack เพื่อผสมพันธุ์พร้อมกันในครั้งเดียว
- **Language Support (EN/TH)** – ระบบแปลภาษาสำหรับทุกข้อความใน UI
- **OP-only Debug Menu** – ซ่อนเมนู Debug Data จากผู้เล่นทั่วไป

### 🐛 Bug Fixes
- แก้ไข Advanced Settings เด้งออกหรือไม่แสดงผล
- แก้ไขไก่ stack ออกไข่จำนวนไม่ถูกต้อง
- แก้ไขสัตว์ตัวโต stack หายตอนออก chunk
- แก้ไข Bundle ไม่สามารถ right-click ได้เมื่อเปิด ItemStacker
- แก้ไข JobDebug loop ตายเมื่อ disable plugin

### 🔧 Changes
- ชื่อ folder deploy ไม่มี version แล้ว (จาก `Addon@2.7.0_BP` เป็น `Addon_BP`)
- UUID ใน manifest ยึดตาม seed อย่างเดียว ไม่ผสม version
