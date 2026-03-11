import { IActionForm, IModalForm } from "@axeth/api";
import { AppFormType, BasePhoneApp } from "../class/BasePhoneApp.ts";
import { Player } from "@minecraft/server";

class EmoteApp extends BasePhoneApp {
  public override name: string = "ท่าทาง";
  public override icon: string = "textures/icons_apps/carry";
  public override formType: AppFormType = AppFormType.ActionForm;

  private categoriesMap = {
    sit: "นั่ง",
    general: "ทั่วไป",
    funny: "ตลก",
    sleep: "นอน",
    pose: "โพส",
    stand: "ยืน",
    dance: "เต้น",
  };

  private emoteLists: {
    [key: string]: {
      titan: Record<string, string>;
      seamuw: Record<string, string>;
    };
  } = {
    sit: {
      titan: {
        "thoughtfully": "ครุ่นคิด",
        "withhands_back": "วางมือไว้ด้านหลัง",
        "clg": "มือไว้หน้าแล้วขาพับไปด้านหลัง",
        "elegantly": "ไขว่ห้างนำมือกุมเข่า",
        "raslabon": "ขาซ้ายทับขาขวานำมือไว้ที่เข่า",
        "hok": "นั่งแบบสุภาพให้เกียรติ",
        "clg2": "นำมือไว้ด้านหน้าแล้วข้างขาออก",
        "withhand_1": "ยกขาขวาขึ้น นำมือซ้ายพิงไว้ที่เข่า",
        "mdt": "นั่งขัดสมาธิ นำมือไว้ด้านหลัง",
        "xlg": "นั่งพับเพียบ มือขวาดันพื้น",
        "mdt_2": "นั่งขัดสมาธิ นำมือไว้ด้านหน้า",
        "thoughtfully_2": "ครุ่นคิด ยกขาขึ้น",
        "withhand_2": "ยกขาสองข้างขึ้น นำมือกอดเข่า",
        "withhand_3": "นั่งเล่น นำมือกอดเข่า",
        "withhand_4": "ยกขาสองข้างขึ้น นำมือไว้ด้านข้าง",
      },
      seamuw: {
        "sit": "นั่งเล่น",
        "sit2": "นั่งงอน",
        "sit3": "นั่งแกว่ง",
        "pap": "นั่งพับเพียบ",
        "a1": "นั่งดูเวลา",
        "a3": "นั่งแอ็ค",
        "a5": "นั่งพาดขา",
        "a6": "นั่งชิล",
        "c12": "นั่งเอียงคอ",
        "c15": "บังเป้าแปป",
        "c17": "อยู่นู้น",
        "c18": "จ้องแล้วนะคะ",
        "c23": "นั่งเอียงคอ",
        "c35": "ไม่ได้แอ็ค",
        "c38": "นั่งแอ็คดิวะ",
        "c39": "เพ้อถึงผู้",
        "c44": "ผมยอมแล้ว",
      },
    },
    stand: {
      titan: {},
      seamuw: {
        "stop": "นิ่งไว้!!",
        "buri": "สูบบุหรี่",
        "stand": "ยืนแอค",
        "ka": "นกกระเรียน",
        "a2": "ยืนพิงรออ",
        "a7": "ยืนพิง",
        "a8": "ยืนกอดอก",
        "a13": "ท่าโพส1",
        "a14": "ท่าโพส2",
        "c6": "ตรงนั้นมีผู้",
        "c7": "เก๊ก",
        "c10": "แม่ร่วง",
        "c16": "ว้ายยย",
        "c19": "งงเด้",
        "c20": "หัวจะปวด",
        "c24": "หาเรื่องออ",
        "c25": "ขาเดียว",
        "c26": "ชี้หน้า!!",
        "c29": "นิ่งไว้~",
        "c30": "เร็วๆ",
        "c31": "อุ้ยผู้ชาย",
        "c32": "ดูนั่น ผู้!!",
        "c34": "ไผนิ",
        "c36": "คนมันหล่อ~",
        "c42": "ร้องเพลง",
        "c43": "อ๊าา กลิ่นผู้",
      },
    },
    general: {
      titan: {
        "sit": "นั่ง",
        "handsup": "ชูขึ้นสองมือ",
        "armstand_right": "ยกมือขวาขึ้น",
        "armstand_left": "ยกมือซ้ายขึ้น",
        "armstand_hands": "ยกสองมือขึ้น",
        "yes": "พยักหน้า",
        "no": "ส่ายหน้า",
        "action": "ต่อย (ไม่มีดาเมจ)",
        "dab": "ยกแขนด้านข้างหนึ่งขึ้นไปยังด้านบน",
        "facepalm": "ปวดหัวและส่ายหน้า",
        "sneeze": "การจาม",
      },
      seamuw: {
        "down": "มอบให้",
        "tap": "ตบหน้า",
        "a4": "ก้มหัว",
        "a9": "ยืนไม่ไหว",
        "a10": "ตายย×~×",
        "a15": "ลอยยย~",
        "b11": "ลูบหัวๆ",
        "c9": "นั่งลอยย",
        "c11": "ใกล้ตาย",
        "c14": "อุ้ย!!",
      },
    },
    dance: {
      "titan": {},
      seamuw: {
        "mu": "หมูเด้ง",
        "a11": "โยกย้าย",
        "b1": "หนูเต้น",
        "b5": "ร็อค!",
        "b6": "ซ้อนท้าย",
        "b7": "โยกน่ารักๆ",
        "b8": "โยกตูดด",
        "b10": "วิ่งๆๆๆ",
        "c1": "โซเดมาคอม",
      },
    },
    sleep: {
      titan: {
        "1": "นอนแผ่",
        "2": "นอนหันข้าง\n§6ท่าทางขยับ",
        "3": "นอนขว้ำหน้า\n§6ท่าทางขยับ",
        "4": "นอน นำมือไว้ด้านหลังหัว",
        "5": "นอนเล่น มือซ้ายจับหน้า\n§6ท่าทางขยับ",
        "6": "นอนเงยหน้า",
      },
      seamuw: {
        "c8": "ผู้ชายอยู่ไหน",
        "c13": "ตายแปป",
        "c27": "อุ้ยเป็นลม",
        "c28": "ขอโทดคับพี่",
        "c33": "นอนอ่อยผู้",
        "c37": "ไม่อยู่แล้ว",
        "c41": "นอนรอผู้",
      },
    },
    pose: {
      titan: {
        "armstand_back": "นำมือไว้ด้านหลัง",
        "armstand_front": "นำมือไว้ด้านหน้า",
        "hands_pose_1": "ยืนพิง กอดอก",
        "hands_pose_2": "ยืนพิง กอดอก\n§6ท่าทางขยับ",
        "hands_pose_3": "กอดอก ขากว้าง",
        "hands_pose_4": "นำมือไว้ด้านข้าง",
        "armstand_back_2": "กำลังเอ็นดู นำมือไว้ด้านหลัง",
        "gun_stand": "ท่าถือปืน",
        "hands_withhead": "มือสองข้างจับหัวแล้วหมุนๆ\n§6ท่าทางขยับ",
      },
      seamuw: {},
    },
    funny: {
      titan: {
        "t_pose": "กางแขนเป็นตัวT",
        "funny_1": "โยกไปโยกมา ไวมากๆ\n§6ท่าทางขยับ",
        "funny_2": "โยกไปโยกมาย่อช้าๆ\n§6ท่าทางขยับ",
        "funny_3": "เหลือแค่หัวกับขา",
        "funny_4": "ก้มตัวลง มือแตะพื้นและกระโดด\n§6ท่าทางขยับ",
        "funny_5": "นำหัวมาถือ",
        "funny_6": "โยกไปโยกมา สำหรับไว้เดิน\n§6ท่าทางขยับ",
        "mjs": "ท่าโนมตัวไปด้านหน้า ไมเคิลแจ็คสัน\n§6ท่าทางขยับ",
      },
      seamuw: {
        "big": "ยืด",
        "mini": "ตัวไรหว่า",
        "jibi": "ตัวเล็ก3ครับ",
        "b2": "5x30 - 1",
        "b3": "5x30 - 2",
        "b4": "5x30 - 3",
        "c2": "นอนแผ่",
      },
    },
  };

  public override getAppHome(
    pl: Player,
    previosForm: (pl: Player) => void,
  ): IActionForm | IModalForm {
    const form = super.getAppHome(pl, previosForm) as IActionForm;
    form;

    for (const category in this.emoteLists) {
      const cetegoryName =
        this.categoriesMap[category as keyof typeof this.categoriesMap];

      form.addButton(
        cetegoryName ?? category,
        `textures/icons_apps/effect`,
        () => {
          this.showEmote(pl, category, previosForm);
        },
      );
    }
    form.addButton(`เครดิต`, `textures/icons_apps/settings`, () => {
      const creditForm = super.getAppHome(pl, previosForm) as IActionForm;
      creditForm.setBody(
        "\n\n\n§fท่าทางเหล่านี้เซิฟเวอร์ไม่ได้จัดทำขึ้นมาเอง\nโดยเครดิตผู้จัดทำทีดังนี้",
      );
      creditForm.addButton(
        `§bดิสคอร์ด§0: §7leraxs001§r`,
        `textures/icons_apps/discraft`,
      );
      creditForm.addButton(
        `§7Sea muww§r`,
        `textures/icons_apps/discraft`,
      );
      creditForm.addButton(`ปิด`, `textures/icons_apps/back`, () => {
        creditForm.back(pl);
      });
      creditForm.show(pl);
    });
    return form;
  }

  private showEmote(
    pl: Player,
    category: string,
    previosForm: (pl: Player) => void,
  ) {
    const emotesKey = Object.keys(
      this.emoteLists[category as keyof typeof this.emoteLists],
    );
    const emotes = emotesKey.map((key) => {
      return {
        type: key,
        emotes: this
          .emoteLists[category as keyof typeof this.emoteLists][
            key as "titan"
          ],
      };
    });

    const emoteForm = super.getAppHome(pl, previosForm) as IActionForm;
    for (
      const [_id, data] of Object.entries(emotes)
    ) {
      for (const emote of Object.entries(data.emotes)) {
        emoteForm.addButton(emote[1], `textures/icons_apps/effect`, () => {
          let categoryId;

          if (
            category === "general"
          ) {
            categoryId = "";
          } else if (category === "pose") {
            categoryId = "";
          } else if (category === "funny") {
            categoryId = "";
          } else {
            categoryId = category;
          }

          if (data.type == "titan") {
            pl.playAnimation(
              `animation.taekung.${categoryId ? category + "_" : ""}` +
                emote[0],
            );
          } else {
            pl.playAnimation(`animation.${emote[0]}`, {
              blendOutTime: 999999,
            });
          }
        });
      }
    }
    emoteForm.show(pl);
  }
}

export { EmoteApp };
