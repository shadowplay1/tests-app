export enum DialogType {
    INFO = 0,
    QUESTION = 1,
    SUBMIT = 2,
    SUBMIT_WITH_CANCEL = 3,
    NONE = 4
}

export interface IDialogInput {
    fields?: IDialogInputField[]
    checkboxes?: IDialogCheckbox[]
    selects?: IDialogSelection[]
}

export interface IBaseDialogField {
    name: string
}


export interface IDialogInputField extends IBaseDialogField {
    value: string
}

export interface IDialogCheckbox extends IBaseDialogField {
    checked: boolean
}

export interface IDialogSelection extends IBaseDialogField {
    selected: number
}
