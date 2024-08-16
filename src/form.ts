import type { Static, TObject } from "@sinclair/typebox";

import { HTMLBuilder } from "./htmlBuilder.js";
import { type ElementData } from "./htmlBuilder.js";
import { type CruddyFormOptions } from "./types.js";
import { type ValidationResult, Validator } from "./validator.js";

export class Form<T extends TObject> {
    private buttonLabel: string;
    private componentElement: string;
    private defaultErrorHeading = "Validation Errors";
    private errorDetails: string[] = new Array<string>();
    private errorMessage = "";
    private htmlBuilder: HTMLBuilder<T>;
    private options: CruddyFormOptions;
    private validator: Validator<T>;

    constructor( schema: T, buttonLabel?: string, options?: CruddyFormOptions ) {
        this.buttonLabel = buttonLabel ?? "Submit";
        this.componentElement = "cruddy-form";
        this.options = options ?? {};
        this.options.method ||= "post";
        this.htmlBuilder = new HTMLBuilder<T>( schema, options );
        this.options.passwordHideSVG ??= `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="24" height="24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
      </svg>`;
        this.options.passwordShowSVG ??= `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="24" height="24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>`;
        this.validator = new Validator<T>( schema );
    }

    getHTML( values?: Partial<Static<T>>, lang?: string ) : string {
        // Get the element data from the supplied schema
        const elementData: ElementData[] = this.htmlBuilder.getElementDataFromSchema( lang );

        // Convert the given values object to a Map.
        const suppliedValues = new Map<string, string>();
        if ( values ) {
            for ( const [ key, value ] of Object.entries( values ) ) {
                // Store the value in lower case and in original case
                suppliedValues.set( `${ key.toLowerCase() }`, `${ value }` );
                suppliedValues.set( `${ key }`, `${ value }` );
            }
        }

        let inputs = "";
        for ( const data of elementData ) {
            // Overlay any supplied values.
            const value = suppliedValues.get( data.name );
            if ( value !== undefined ) {
                data.stringAttributes.set( "value", value );
            }

            // Generate the html and store it for later.
            let html = `<div class="${ data.inputType ?? data.element }">`;
            html += HTMLBuilder.getExtraHTMLBefore( data );
            html += HTMLBuilder.getElementHTML( data, suppliedValues );
            html += HTMLBuilder.getExtraHTMLAfter( data, this.options );
            html += HTMLBuilder.getHintHTML( data.hint );
            html += "</div>";

            inputs += html;
        }

        // Assemble the final HTML.
        const fieldset = HTMLBuilder.getFieldsetHTML( this.options.fieldset, this.options.legend );
        const extraHTML = this.options.extraHTML ?? "";
        const errors = HTMLBuilder.getErrorsHTML( this.errorMessage, this.errorDetails );
        const submitButton = HTMLBuilder.getSubmitButtonHTML( this.buttonLabel );
        const formElement = HTMLBuilder.getFormElementHTML( this.options );
        const html = `${ formElement }${ fieldset.start }${ extraHTML }
${ inputs }
${ errors }${ fieldset.end }${ submitButton }
</form>`;

        return html;
    }

    getHTMLComponent( values?: Partial<Static<T>>, lang?: string ) : string {
        return `<${ this.componentElement }>${ this.getHTML( values, lang ) }</${ this.componentElement }>`;
    }

    setErrorMessage( message: string, details: string[] ) {
        this.errorMessage = message;
        this.errorDetails = details;
    }

    setErrorMessageFromResult( result: ValidationResult, errorHeading?: string ) {
        if ( !result.valid ) {
            this.setErrorMessage( errorHeading ?? this.defaultErrorHeading, result.errors );
        }

        return result;
    }

    validate( formData: FormData, errorHeading?: string ) : ValidationResult {
        const result = this.validator.validateFormData( formData );
        return this.setErrorMessageFromResult( result, errorHeading );
    }

    validateObject( obj: object, errorHeading?: string ) : ValidationResult {
        const result = this.validator.validateObject( obj );
        return this.setErrorMessageFromResult( result, errorHeading );
    }
}
