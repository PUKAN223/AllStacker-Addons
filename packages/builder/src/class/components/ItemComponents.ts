type IconComponent = string;
type MaxStackComponent = number;

interface FoodComponent {
  can_always_eat?: boolean;
  nutrition: number;
  saturation_modifier?: number;
}

interface DisplayNameComponent {
  value: string;
}

interface UseModifiersComponent {
  use_duration?: number;
  movement_modifier?: number;
}

type UseAnimationComponent = "eat" | "drink" | "none";

interface TagsComponent {
  tags: string[];
}

class ItemComponents {
  private components: Record<string, unknown> = {};

  public setIcon(icon: IconComponent): this {
    this.components["minecraft:icon"] = icon;
    return this;
  }

  public setMaxStackSize(size: MaxStackComponent): this {
    this.components["minecraft:max_stack_size"] = size;
    return this;
  }

  public setFood(food: FoodComponent): this {
    this.components["minecraft:food"] = food;
    return this;
  }

  public setDisplayName(name: string): this {
    const display: DisplayNameComponent = { value: name };
    this.components["minecraft:display_name"] = display;
    return this;
  }

  public setUseModifiers(modifiers: UseModifiersComponent): this {
    this.components["minecraft:use_modifiers"] = modifiers;
    return this;
  }

  public setUseAnimation(animation: UseAnimationComponent): this {
    this.components["minecraft:use_animation"] = animation;
    return this;
  }

  public setTags(tags: string[]): this {
    const value: TagsComponent = { tags };
    this.components["minecraft:tags"] = value;
    return this;
  }

  /** Set any additional custom component by id. */
  public setCustomComponent<T>(id: string, value: T): this {
    this.components[id] = value;
    return this;
  }

  /** Merge a partial components object into the current set. */
  public merge(components: Record<string, unknown>): this {
    this.components = { ...this.components, ...components };
    return this;
  }

  /** Return a plain object suitable for JSON serialization. */
  public toJSON(): Record<string, unknown> {
    return { ...this.components };
  }
}

export {
  type DisplayNameComponent,
  type FoodComponent,
  type IconComponent,
  ItemComponents,
  type MaxStackComponent,
  type TagsComponent,
  type UseAnimationComponent,
  type UseModifiersComponent,
};
