export interface FormInput {
    class?: string;
    endpoint?: string | object;
    hint?: string | object;
    label?: string | object;
}

export interface FormInputTextEditable {
    autocapitalize?: "off" | "on";
    autocomplete?: "off" | "on";
    autocorrect?: "off" | "on";
    autofocus?: boolean;
    placeholder?: string | object;
    spellcheck?: "false" | "true";
    value?: string;
}

export interface FormTextArea extends FormInput, FormInputTextEditable {
    cols?: number;
    element: "textarea";
    inputType: "text";
    maxLength: number;
    minLength: number;
    rows?: number;
    wrap?: "hard" | "soft";
}

export interface FormInputText extends FormInput, FormInputTextEditable {
    element: "input";
    inputType: "email" | "hidden" | "password" | "search" | "text";
    maxLength?: number;
    minLength?: number;
    pattern?: string;
}

export interface FormInputCheckbox extends FormInput {
    checked?: boolean; 
    element: "input";
    inputType: "checkbox";
}

export interface CruddyFormOptions {
    action?: string;
    buttonLabel?: string;
    class?: string;
    extraHTML?: string;
    fieldset?: boolean;
    id?: string;
    idSuffix?: string;
    legend?: string;
    method?: "get" | "post";
    novalidate?: boolean;
    passwordHideSVG?: string;
    passwordShowSVG?: string;
}