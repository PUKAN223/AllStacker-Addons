export type IModalFormSlider = {
    label: string;
    minimumValue: number;
    maximumValue: number;
    valueStep: number;
    defaultValue?: number;
    tooltip?: string;
    onSubmit: (value: number) => void;
}
