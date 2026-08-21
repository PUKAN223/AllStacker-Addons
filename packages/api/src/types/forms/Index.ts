import type { IActionForm } from  "@packages/api/src/class/forms/IActionForm.ts";
import type { IMessageForm } from  "@packages/api/src/class/forms/IMessageForm.ts";
import type { IModalForm } from  "@packages/api/src/class/forms/IModalForm.ts";

type Forms = IActionForm | IMessageForm | IModalForm;

export type { Forms };
