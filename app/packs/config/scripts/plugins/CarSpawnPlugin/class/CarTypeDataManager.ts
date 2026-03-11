import { IActionForm, IModalForm, PlayerUtils, PluginBase } from "@axeth/api";
import { Player } from "@minecraft/server";
import type { CarSpawnDatabase, CarSpawnProfileData, CarTypeData, CarTypeGroup } from "../types/CarSpawnData.ts";

class CarTypeDataManager {
    private readonly plugin: PluginBase;

    private constructor(plugin: PluginBase) {
        this.plugin = plugin;
    }

    public static initialize(plugin: PluginBase) {
        return new CarTypeDataManager(plugin);
    }

    private get defaultDatabase(): CarSpawnDatabase {
        return {
            cars: {},
            spawns: {},
        };
    }

    private parseDatabase(raw: string): CarSpawnDatabase {
        try {
            const parsed = JSON.parse(raw) as Partial<CarSpawnDatabase>;
            return {
                cars: parsed?.cars ?? {},
                spawns: parsed?.spawns ?? {},
            };
        } catch {
            return this.defaultDatabase;
        }
    }

    public get database(): CarSpawnDatabase {
        const value = this.plugin.config.get()["carSpawnData"]!.value as string;
        return this.parseDatabase(value);
    }

    private saveDatabase(database: CarSpawnDatabase): void {
        const updatedConfig = this.plugin.config.get();
        updatedConfig["carSpawnData"]!.value = JSON.stringify(database);
        this.plugin.config.set(updatedConfig);
    }

    private normalizeTags(tags: string[]): string[] {
        return [...new Set(tags.map((tag) => tag.trim()).filter((tag) => tag.length > 0))];
    }

    private normalizeCarIds(carIds: string[]): string[] {
        return [...new Set(carIds.map((carId) => carId.trim()).filter((carId) => carId.length > 0))];
    }

    private normalizeCar(car: CarTypeData): CarTypeData {
        const modelId = (car.modelId ?? "").trim() || car.id;
        const modelName = (car.modelName ?? "").trim() || car.name;
        const colorName = (car.colorName ?? "").trim() || car.name;

        return {
            ...car,
            modelId,
            modelName,
            colorName,
            ownershipTags: this.normalizeTags(car.ownershipTags),
        };
    }

    public hasCarType(carId: string): boolean {
        return this.database.cars[carId] !== undefined;
    }

    public registerCarType(car: CarTypeData, overwrite: boolean = false): boolean {
        const db = this.database;
        if (!overwrite && db.cars[car.id]) return false;

        db.cars[car.id] = this.normalizeCar(car);
        this.saveDatabase(db);
        return true;
    }

    public updateCarType(prevCarId: string, nextCar: CarTypeData): boolean {
        const db = this.database;
        const previous = db.cars[prevCarId];
        if (!previous) return false;

        if (prevCarId !== nextCar.id && db.cars[nextCar.id]) {
            return false;
        }

        delete db.cars[prevCarId];
        db.cars[nextCar.id] = this.normalizeCar(nextCar);

        Object.keys(db.spawns).forEach((key) => {
            db.spawns[key]!.carIds = db.spawns[key]!.carIds.map((id) => id === prevCarId ? nextCar.id : id);
        });

        this.saveDatabase(db);
        return true;
    }

    public removeCarType(carId: string): boolean {
        const db = this.database;
        if (!db.cars[carId]) return false;

        delete db.cars[carId];
        Object.keys(db.spawns).forEach((key) => {
            db.spawns[key]!.carIds = db.spawns[key]!.carIds.filter((id) => id !== carId);
        });

        this.saveDatabase(db);
        return true;
    }

    public getCarTypes(): CarTypeData[] {
        return Object.values(this.database.cars);
    }

    public getSpawnProfile(spawnKey: string): CarSpawnProfileData | null {
        return this.database.spawns[spawnKey] ?? null;
    }

    public setSpawnProfile(spawnKey: string, carIds: string[]): { ok: boolean; unknownCarIds: string[] } {
        const db = this.database;
        const normalizedCarIds = this.normalizeCarIds(carIds);
        const unknownCarIds = normalizedCarIds.filter((carId) => !db.cars[carId]);
        if (unknownCarIds.length > 0) {
            return { ok: false, unknownCarIds };
        }

        db.spawns[spawnKey] = {
            key: spawnKey,
            carIds: normalizedCarIds,
        };
        this.saveDatabase(db);
        return { ok: true, unknownCarIds: [] };
    }

    public removeSpawnProfile(spawnKey: string): boolean {
        const db = this.database;
        if (!db.spawns[spawnKey]) return false;
        delete db.spawns[spawnKey];
        this.saveDatabase(db);
        return true;
    }

    public getCarsBySpawnKey(spawnKey: string): CarTypeData[] {
        const db = this.database;
        const profile = db.spawns[spawnKey];

        if (!profile || profile.carIds.length <= 0) {
            return Object.values(db.cars);
        }

        return profile.carIds
            .map((carId) => db.cars[carId])
            .filter((car): car is CarTypeData => !!car);
    }

    public getPlayerCarsBySpawnKey(player: Player, spawnKey: string): CarTypeData[] {
        return this.getCarsBySpawnKey(spawnKey).filter((car) => {
            if (!car.ownershipTags || car.ownershipTags.length <= 0) return true;
            return car.ownershipTags.some((tag) => player.hasTag(tag));
        });
    }

    public getPlayerCarGroupsBySpawnKey(player: Player, spawnKey: string): CarTypeGroup[] {
        const cars = this.getPlayerCarsBySpawnKey(player, spawnKey);
        const groups = new Map<string, CarTypeGroup>();

        for (const car of cars) {
            const modelId = (car.modelId ?? "").trim() || car.id;
            const modelName = (car.modelName ?? "").trim() || car.name;
            const colorName = (car.colorName ?? "").trim() || car.name;

            if (!groups.has(modelId)) {
                groups.set(modelId, {
                    modelId,
                    modelName,
                    icon: car.icon,
                    variants: [],
                });
            }

            groups.get(modelId)!.variants.push({
                ...car,
                modelId,
                modelName,
                colorName,
            });
        }

        return [...groups.values()]
            .map((group) => ({
                ...group,
                variants: group.variants.sort((a, b) => (a.colorName ?? a.name).localeCompare(b.colorName ?? b.name)),
            }))
            .sort((a, b) => a.modelName.localeCompare(b.modelName));
    }

    public showAdvancedSettings(player: Player): void {
        const db = this.database;
        const form = IActionForm.createForm(
            "ตั้งค่าระบบเรียกรถ",
            "เลือกเมนูที่ต้องการจัดการ",
        );

        form.addButton(this.plugin.mcColors("ปิด").red, "textures/ui/realms_red_x");
        form.addDivider();
        form.addButton(
            this.plugin.mcColors("จัดการรายการรถ").yellow + this.plugin.mcColors(` (${Object.keys(db.cars).length})`).blackGray,
            "textures/ui/sidebar_icons/marketplace",
            () => {
                this.showCarTypeMenu(player);
            },
        );
        form.addButton(
            this.plugin.mcColors("จัดการโปรไฟล์จุดเรียกรถ").yellow + this.plugin.mcColors(` (${Object.keys(db.spawns).length})`).blackGray,
            "textures/ui/book_edit_default",
            () => {
                this.showSpawnProfileMenu(player);
            },
        );

        form.show(player);
    }

    private showCarTypeMenu(player: Player): void {
        const cars = this.getCarTypes();
        const form = IActionForm.createForm("จัดการรายการรถ", "เพิ่ม แก้ไข หรือลบรถ");

        form.addButton(this.plugin.mcColors("ย้อนกลับ").yellow, "textures/ui/arrow_left", () => {
            this.showAdvancedSettings(player);
        });
        form.addButton(this.plugin.mcColors("เพิ่มรถใหม่").green, "textures/items/spawn_egg", () => {
            this.showCreateCarModal(player);
        });
        form.addDivider();

        for (const car of cars) {
            form.addButton(
                this.plugin.mcColors(car.name).white + this.plugin.mcColors(` [${car.id}]`).grey,
                car.icon,
                () => {
                    this.showCarActionMenu(player, car.id);
                },
            );
        }

        form.show(player);
    }

    private showCreateCarModal(player: Player): void {
        const modal = IModalForm.createForm("เพิ่มรถใหม่", "กรอกข้อมูลรถ");
        modal.addTextField({ label: "Car ID (ห้ามซ้ำ)", placeholderText: "rx115_white" }, () => {});
        modal.addTextField({ label: "ชื่อรถ", placeholderText: "RX115 White" }, () => {});
        modal.addTextField({ label: "Entity typeId", placeholderText: "rx115:white" }, () => {});
        modal.addTextField({ label: "ไอคอน", placeholderText: "textures/icon/rx115" }, () => {});
        modal.addTextField({ label: "Model ID (รุ่นเดียวกันใช้ค่าเดียวกัน)", placeholderText: "rx115" }, () => {});
        modal.addTextField({ label: "ชื่อรุ่น", placeholderText: "RX115" }, () => {});
        modal.addTextField({ label: "ชื่อสี", placeholderText: "White" }, () => {});
        modal.addTextField({ label: "แท็กเจ้าของรถ (คั่นด้วย ,)", placeholderText: "car:rx115_white" }, () => {});

        modal.show(player).then((res) => {
            if (!res || res.canceled || !res.formValues) return;

            const id = String(res.formValues[0] ?? "").trim();
            const name = String(res.formValues[1] ?? "").trim();
            const typeId = String(res.formValues[2] ?? "").trim();
            const icon = String(res.formValues[3] ?? "").trim();
            const modelId = String(res.formValues[4] ?? "").trim();
            const modelName = String(res.formValues[5] ?? "").trim();
            const colorName = String(res.formValues[6] ?? "").trim();
            const ownershipTagsRaw = String(res.formValues[7] ?? "");

            if (!id || !name || !typeId || !icon) {
                PlayerUtils.sendToast(player, "", this.plugin.mcColors("กรอกข้อมูลให้ครบก่อน").red);
                return;
            }

            const ok = this.registerCarType({
                id,
                name,
                typeId,
                icon,
                modelId,
                modelName,
                colorName,
                ownershipTags: ownershipTagsRaw.split(","),
            });

            if (!ok) {
                PlayerUtils.sendToast(player, "", this.plugin.mcColors("เพิ่มไม่สำเร็จ: Car ID ซ้ำ").red);
                return;
            }

            PlayerUtils.sendToast(player, "", this.plugin.mcColors(`เพิ่มรถ ${name} สำเร็จ`).green);
            this.showCarTypeMenu(player);
        });
    }

    private showCarActionMenu(player: Player, carId: string): void {
        const car = this.database.cars[carId];
        if (!car) return;

        const form = IActionForm.createForm(`${car.name}`, `จัดการรถ [${car.id}]`);
        form.addButton(this.plugin.mcColors("ย้อนกลับ").yellow, "textures/ui/arrow_left", () => {
            this.showCarTypeMenu(player);
        });
        form.addButton(this.plugin.mcColors("แก้ไขข้อมูลรถ").green, "textures/ui/book_edit_default", () => {
            this.showEditCarModal(player, car.id);
        });
        form.addButton(this.plugin.mcColors("ลบรถ").red, "textures/ui/icon_trash", () => {
            this.removeCarType(car.id);
            PlayerUtils.sendToast(player, "", this.plugin.mcColors(`ลบรถ ${car.name} แล้ว`).green);
            this.showCarTypeMenu(player);
        });
        form.show(player);
    }

    private showEditCarModal(player: Player, carId: string): void {
        const car = this.database.cars[carId];
        if (!car) return;

        const modal = IModalForm.createForm(`แก้ไข ${car.name}`, "ปรับข้อมูลรถ");
        modal.addTextField({ label: "Car ID", placeholderText: "rx115_white", defaultValue: car.id }, () => {});
        modal.addTextField({ label: "ชื่อรถ", placeholderText: "RX115 White", defaultValue: car.name }, () => {});
        modal.addTextField({ label: "Entity typeId", placeholderText: "rx115:white", defaultValue: car.typeId }, () => {});
        modal.addTextField({ label: "ไอคอน", placeholderText: "textures/icon/rx115", defaultValue: car.icon }, () => {});
        modal.addTextField({ label: "Model ID", placeholderText: "rx115", defaultValue: car.modelId ?? car.id }, () => {});
        modal.addTextField({ label: "ชื่อรุ่น", placeholderText: "RX115", defaultValue: car.modelName ?? car.name }, () => {});
        modal.addTextField({ label: "ชื่อสี", placeholderText: "White", defaultValue: car.colorName ?? car.name }, () => {});
        modal.addTextField({
            label: "แท็กเจ้าของรถ (คั่นด้วย ,)",
            placeholderText: "car:rx115_white",
            defaultValue: car.ownershipTags.join(","),
        }, () => {});

        modal.show(player).then((res) => {
            if (!res || res.canceled || !res.formValues) return;

            const nextId = String(res.formValues[0] ?? "").trim();
            const name = String(res.formValues[1] ?? "").trim();
            const typeId = String(res.formValues[2] ?? "").trim();
            const icon = String(res.formValues[3] ?? "").trim();
            const modelId = String(res.formValues[4] ?? "").trim();
            const modelName = String(res.formValues[5] ?? "").trim();
            const colorName = String(res.formValues[6] ?? "").trim();
            const ownershipTagsRaw = String(res.formValues[7] ?? "");

            if (!nextId || !name || !typeId || !icon) {
                PlayerUtils.sendToast(player, "", this.plugin.mcColors("กรอกข้อมูลให้ครบก่อน").red);
                return;
            }

            const ok = this.updateCarType(carId, {
                id: nextId,
                name,
                typeId,
                icon,
                modelId,
                modelName,
                colorName,
                ownershipTags: ownershipTagsRaw.split(","),
            });

            if (!ok) {
                PlayerUtils.sendToast(player, "", this.plugin.mcColors("บันทึกไม่สำเร็จ: Car ID ซ้ำ").red);
                return;
            }

            PlayerUtils.sendToast(player, "", this.plugin.mcColors(`แก้ไขรถ ${name} สำเร็จ`).green);
            this.showCarTypeMenu(player);
        });
    }

    private showSpawnProfileMenu(player: Player): void {
        const db = this.database;
        const form = IActionForm.createForm("จัดการโปรไฟล์จุดเรียกรถ", "โปรไฟล์จะผูกกับแท็ก car_spawn:X");

        form.addButton(this.plugin.mcColors("ย้อนกลับ").yellow, "textures/ui/arrow_left", () => {
            this.showAdvancedSettings(player);
        });
        form.addButton(this.plugin.mcColors("สร้างโปรไฟล์ใหม่").green, "textures/ui/book_edit_default", () => {
            this.showCreateSpawnProfileModal(player);
        });
        form.addDivider();

        Object.keys(db.spawns)
            .sort((a, b) => a.localeCompare(b))
            .forEach((spawnKey) => {
                const profile = db.spawns[spawnKey]!;
                const countText = profile.carIds.length <= 0 ? "ทุกคัน" : `${profile.carIds.length} คัน`;
                form.addButton(
                    this.plugin.mcColors(`car_spawn:${profile.key}`).white + this.plugin.mcColors(` (${countText})`).blackGray,
                    "textures/ui/sidebar_icons/marketplace",
                    () => {
                        this.showSpawnProfileActionMenu(player, profile.key);
                    },
                );
            });

        form.show(player);
    }

    private showCreateSpawnProfileModal(player: Player): void {
        const modal = IModalForm.createForm("สร้างโปรไฟล์ใหม่", "ใส่เฉพาะชื่อ X ใน car_spawn:X");
        modal.addTextField({ label: "ชื่อโปรไฟล์", placeholderText: "vip" }, () => {});

        modal.show(player).then((res) => {
            if (!res || res.canceled || !res.formValues) return;

            const key = String(res.formValues[0] ?? "").trim();
            if (!key) {
                PlayerUtils.sendToast(player, "", this.plugin.mcColors("กรุณาใส่ชื่อโปรไฟล์").red);
                return;
            }

            if (this.database.spawns[key]) {
                PlayerUtils.sendToast(player, "", this.plugin.mcColors("โปรไฟล์นี้มีอยู่แล้ว").red);
                return;
            }

            this.setSpawnProfile(key, []);
            PlayerUtils.sendToast(player, "", this.plugin.mcColors(`สร้างโปรไฟล์ car_spawn:${key} สำเร็จ`).green);
            this.showSpawnProfileActionMenu(player, key);
        });
    }

    private showSpawnProfileActionMenu(player: Player, spawnKey: string): void {
        const db = this.database;
        const profile = db.spawns[spawnKey];
        if (!profile) return;

        const selectedCars = profile.carIds
            .map((carId) => db.cars[carId])
            .filter((car): car is CarTypeData => !!car);

        const form = IActionForm.createForm(
            `โปรไฟล์ car_spawn:${spawnKey}`,
            "เลือกรถจากรายการได้เลย ไม่ต้องพิมพ์ Car ID",
        );

        form.addButton(this.plugin.mcColors("ย้อนกลับ").yellow, "textures/ui/arrow_left", () => {
            this.showSpawnProfileMenu(player);
        });
        form.addButton(this.plugin.mcColors("เลือกรถในโปรไฟล์").green, "textures/ui/sidebar_icons/marketplace", () => {
            this.showProfileCarPickerMenu(player, spawnKey);
        });
        form.addButton(this.plugin.mcColors("ตั้งเป็นใช้รถทุกคัน").yellow, "textures/ui/icon_setting", () => {
            this.setSpawnProfile(spawnKey, []);
            PlayerUtils.sendToast(player, "", this.plugin.mcColors("ตั้งค่าเป็นใช้รถทุกคันแล้ว").green);
            this.showSpawnProfileActionMenu(player, spawnKey);
        });
        form.addButton(this.plugin.mcColors("ลบโปรไฟล์นี้").red, "textures/ui/icon_trash", () => {
            this.removeSpawnProfile(spawnKey);
            PlayerUtils.sendToast(player, "", this.plugin.mcColors(`ลบโปรไฟล์ car_spawn:${spawnKey} แล้ว`).green);
            this.showSpawnProfileMenu(player);
        });
        form.addDivider();

        if (selectedCars.length <= 0) {
            form.addLabel(this.plugin.mcColors("ตอนนี้โปรไฟล์นี้ใช้รถทุกคัน").blackGray);
        } else {
            form.addLabel(this.plugin.mcColors("รถที่เลือกไว้ (กดเพื่อลบออก)").blackGray);
            for (const car of selectedCars) {
                form.addButton(
                    this.plugin.mcColors(`ลบ ${car.name}`).red + this.plugin.mcColors(` [${car.id}]`).blackGray,
                    car.icon,
                    () => {
                        const nextCarIds = profile.carIds.filter((id) => id !== car.id);
                        this.setSpawnProfile(spawnKey, nextCarIds);
                        PlayerUtils.sendToast(player, "", this.plugin.mcColors(`ลบ ${car.name} ออกจากโปรไฟล์แล้ว`).green);
                        this.showSpawnProfileActionMenu(player, spawnKey);
                    },
                );
            }
        }

        form.show(player);
    }

    private showProfileCarPickerMenu(player: Player, spawnKey: string): void {
        const db = this.database;
        const profile = db.spawns[spawnKey];
        if (!profile) return;

        const cars = Object.values(db.cars).sort((a, b) => a.name.localeCompare(b.name));
        const selectedSet = new Set(profile.carIds);

        const form = IActionForm.createForm(
            `เลือกรถสำหรับ car_spawn:${spawnKey}`,
            "กดที่รถเพื่อเพิ่ม/เอาออกจากโปรไฟล์",
        );

        form.addButton(this.plugin.mcColors("ย้อนกลับ").yellow, "textures/ui/arrow_left", () => {
            this.showSpawnProfileActionMenu(player, spawnKey);
        });
        form.addDivider();

        for (const car of cars) {
            const isSelected = selectedSet.has(car.id);
            const actionText = isSelected ? "เอาออก" : "เพิ่ม";
            const actionColor = isSelected ? this.plugin.mcColors(actionText).red : this.plugin.mcColors(actionText).green;

            form.addButton(
                actionColor + this.plugin.mcColors(` ${car.name}`).white + this.plugin.mcColors(` [${car.id}]`).blackGray,
                car.icon,
                () => {
                    const nextCarIds = isSelected
                        ? profile.carIds.filter((id) => id !== car.id)
                        : [...profile.carIds, car.id];

                    this.setSpawnProfile(spawnKey, nextCarIds);
                    this.showProfileCarPickerMenu(player, spawnKey);
                },
            );
        }

        form.show(player);
    }
}

export { CarTypeDataManager };
