import { Player } from "@minecraft/server"

export interface commands {
  name: string,
  description: string,
  permission: (pl: Player) => boolean,
  callback: (pl: Player) => void,
  prefix: string
}

export const commandLists: commands[] = []

export default class CommandBuilder {
  private name: string
  private description: string
  private permission: (pl: Player) => boolean
  private prefix: string;
  constructor(name: string, description: string, prefix: string, permission: (pl: Player) => boolean) { 
    this.name = name
    this.description = description
    this.permission = permission
    this.prefix = prefix
  }

  public overload(callback: (pl: Player) => void) {
    commandLists.push({
      name: this.name,
      description: this.description,
      permission: this.permission,
      callback: callback,
      prefix: this.prefix
    })
  }
}