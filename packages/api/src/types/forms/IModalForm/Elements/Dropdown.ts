export type IModalFormDropdown = {
  label: string;
  options: string[];
  defaultValueIndex?: number;
  tooltip?: string;
  onSubmit: (value: number) => void;
};
