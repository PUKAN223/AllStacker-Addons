export type IModalFormToggle = {
    label: string;
    defaultValue?: boolean;
    tooltip?: string;
    onSubmit: (value: boolean) => void;
}
