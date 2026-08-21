# Changelog

## [3.0.0] - 2026-08-22

> Major architectural rewrite — All Stacker ถูกสร้างใหม่จากฐานรากด้วย architecture ใหม่ทั้งหมด
> เน้นด้าน performance, ความยืดหยุ่น, และประสบการณ์ผู้ใช้ที่ดีขึ้น

---

### 🏗️ Architecture Rewrite

- **Plugin System ใหม่** — เปลี่ยนจากโครงสร้าง monolithic เป็น `PluginBase` event-driven system
  - แต่ละ plugin ลงทะเบียน event listener ของตัวเอง (spawn, die, interact, remove)
  - Plugin สามารถ enable/disable ได้ขณะ runtime โดยไม่ต้องรีสตาร์ท
- **Config System ใหม่** — ใช้ `DynamicPropertyStorageAdapter` แทน JSON flat-file
  - config บันทึกลงใน World Dynamic Properties ทนต่อการ restart server
  - รองรับ type-safe settings (`boolean`, `number`, `string`, `array`)
- **Adapter Pattern** — แยก logic ออกจาก Minecraft API ผ่าน Adapter
  - `DynamicPropertyStorageAdapter` — เก็บ amount ของ stack ต่อ entity
  - `NameTagRenderingAdapter` — จัดการ display nametag แบบ centralized
  - `ItemStackingAdapter` / `MobStackingAdapter` — logic การ stack แบบแยกอิสระ
- **Build System ใหม่** — ใช้ Deno + esbuild แทน mcbuild เดิม
  - `deno run dev` — watch mode + hot reload + auto copy ไป Minecraft
  - `deno run packs` — build `.mcaddon` / `.zip` พร้อม image optimizer
  - UUID generate จาก seed แบบ deterministic (ไม่ random ทุกครั้ง)

---

### ✨ New Features

#### 🐣 Mass Breeding (ใหม่)
- ให้อาหารสัตว์ที่ stack อยู่เพื่อผสมพันธุ์ทั้ง stack พร้อมกันในครั้งเดียว
- ระบบคำนวณจำนวนคู่จากอาหารที่มีและจำนวนสัตว์ใน stack
- spawn baby stack ที่ตรงกับจำนวนคู่ที่ผสมสำเร็จ
- Cooldown 5 นาที (6000 ticks) ต่อ stack เพื่อป้องกันการ abuse
- ให้ XP 3 คูณจำนวนคู่ทดแทน vanilla XP
- สามารถ enable/disable ได้ใน Advanced Settings

#### 🌐 Language System (ใหม่)
- รองรับภาษา **English** และ **ภาษาไทย** สลับได้ทุก player
- ภาษาบันทึกต่อ player — แต่ละคนเลือกภาษาของตัวเองได้
- ข้อความทุกจุดในระบบ (settings, messages, UI labels) แปลครบ
- ขยายภาษาใหม่ได้ง่ายผ่าน `LanguageManager.setLanguage()`

#### 📊 JobDebug Live Stats (ใหม่)
- แสดงสถิติ real-time ของ stacking job บน action bar
- เปิดใช้ด้วย `/tag @s add jobdebug`
- แสดง: items tracked, items pending, mob scan ms, entities scanned/merged
- ทำงานต่อเนื่องแม้ plugin จะถูก disable ชั่วคราว

---

### 🔄 Changed Features

#### 🐄 MobStacker — เปลี่ยนแปลงสำคัญ

| Feature | 2.7.0 | 3.0.0 |
|---------|-------|-------|
| Spawn/Merge timing | ทันทีใน event | ใช้ co-operative job (ลด TPS spike) |
| Stack persistence | ไม่มี — สัตว์หายตอน chunk unload | ใช้ `nameTag = "\u200B"` ป้องกัน despawn |
| XP drop | spawn orbs ตรงๆ ใน event | ผ่าน XP queue (กระจาย load) |
| Death loot | drop ครั้งเดียวทั้งหมด | จำกัด 32 ต่อ tick ป้องกัน lag spike |
| Breed interaction | split 1 ตัวออกมา breed ตามปกติ | Mass Breeding — breed ทั้ง stack พร้อมกัน |
| Settings storage | flat JSON file | DynamicProperty (ทนต่อ restart) |
| Stack radius config | ปรับได้ใน UI | ปรับได้ใน UI + บันทึกถาวร |
| Display text | `§e §7§c§l%a §r%n§r` | ปรับได้ผ่าน UI |

#### 📦 ItemStacker — เปลี่ยนแปลงสำคัญ

| Feature | 2.7.0 | 3.0.0 |
|---------|-------|-------|
| Stack algorithm | loop per tick | Co-operative job (แชร์ tick budget) |
| Item despawn | destack ทั้งหมดเมื่อ remove | Skip bundle/inventory items (fix crash) |
| Fast Mode | มี | มี — ปรับได้ใน settings |
| Radius Seeing | 10 blocks default | ปรับได้ |
| Radius Combine | 15 blocks default | ปรับได้ |
| Egg multiplication | มี (race condition) | fix แล้ว — deferred 1 tick ด้วย `system.run()` |

#### ⚙️ ConfigMenu — เปลี่ยนแปลงสำคัญ

| Feature | 2.7.0 | 3.0.0 |
|---------|-------|-------|
| Settings UI | Form แบบ flat | แยก Stacking Settings / Advanced Settings |
| Debug Menu | แสดงให้ทุกคนเห็น | ซ่อน — เห็นเฉพาะ **Operator** |
| Language | ไม่มี | เลือกภาษาได้ per-player |
| Plugin toggle | มี | มี + apply state ทันที runtime |
| Advanced Settings crash | crash หรือไม่แสดง | fix แล้ว ด้วย `.catch()` |

---

### 🐛 Bug Fixes

- **Advanced Settings เด้งออก** — `settingSelectionMenu.show()` ขาด `.catch()` ทำให้ unhandled Promise rejection ทำลายเมนู
- **ไก่ stack ออกไข่จำนวนไม่ถูกต้อง** — race condition ระหว่าง `onEntitySpawn` ของ MobStacker และ ItemStacker แก้ด้วย `system.run()` deferred
- **สัตว์ตัวโต stack หายตอนออก chunk** — entity ไม่ถูก persist แก้ด้วยการตั้ง `nameTag = "\u200B"` (zero-width space) ซึ่งเป็น vanilla mechanism ป้องกัน natural despawn
- **Bundle right-click ไม่ได้** — `onItemRemoved` ดัก bundle ก่อนที่จะ open UI ทำให้ถูก interrupt แก้ด้วย early-return เมื่อ item มี component `minecraft:bundle`
- **JobDebug ตายเมื่อ disable plugin** — loop ใช้ `return` แทน `system.run(tick)` ทำให้ loop ตายถาวร

---

### 🔧 Internal / Build Changes

- ชื่อ folder deploy ไม่มี version (`All-Stackers-Addon_BP` แทน `All-Stackers-Addon@2.7.0_BP`) — Minecraft ไม่ต้อง re-link pack เมื่อ version เปลี่ยน
- UUID ใน manifest generate จาก `seed` อย่างเดียว (deterministic, ไม่เปลี่ยนตาม version)
- `header.version` ใน manifest อัปเดตอัตโนมัติจาก `config.json` ทุกครั้งที่ build
- GitHub Actions workflow: push tag `vX.Y.Z` → auto build + release `.mcaddon`

---

## [2.7.0] - 2025 (Legacy)

> รุ่นก่อนหน้า — ดูโค้ดได้ที่ [2.7.0-dev branch](https://github.com/PUKAN223/AllStacker-Addons/tree/2.7.0-dev)

