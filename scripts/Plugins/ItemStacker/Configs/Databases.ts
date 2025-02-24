import { Entity } from "@minecraft/server";
import DynamicProperties from "../../../Utilities/Database";
import { QIDB } from "../../../Utilities/QIDB";

export const itemStackMap = new QIDB("itemstacks")
export const itemCode = new DynamicProperties<string>("itemCodes")
export const itemList = new Set<Entity>();
export const SeeingItem = new Set();