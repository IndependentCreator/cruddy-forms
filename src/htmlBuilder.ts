import { type TObject } from "@sinclair/typebox";

import { type CruddyFormOptions } from "./types.js";

export interface ElementData {
    booleanAttributes: string[],
    element: string,
    elementValue?: string,
    hint?: string,
    id: string,
    inputType?: string,
    label: string,
    name: string,
    stringAttributes: Map<string, string>,
}

type LocalizedString = Record<string, string>;

export class HTMLBuilder<T extends TObject> {
    static defaultsTextInputs = {
        autocapitalize: "off",
        autocomplete: "off",
        autocorrect: "off",
        placeholder: "",
        spellcheck: "false",
        value: "", 
    };
    private options: CruddyFormOptions | undefined;
    private schema: T;

    constructor( schema: T, options?: CruddyFormOptions ) {
        this.schema = schema;
        this.options = options ?? {};
        //TODO this.options.method ||= "post";
    }

    /** Create a new Map of attributes by merging default values on top of the given attributes. */
    static applyDefaultAttributes( element: string, inputType: string,  attributes: Map<string, string> )
        : Map<string, string> {
        const merged = attributes;
        if ( element === "textarea" || ( element === "input" && inputType !== "checkbox" ) ) {
            for ( const [ key, val ] of Object.entries( HTMLBuilder.defaultsTextInputs ) ) {
                if ( merged.get( key ) === undefined ) {
                    merged.set( key, val );
                }
            }
        }

        return merged;
    }

    /** Generate HTML from the given ElementData object. */
    static getElementHTML( data: ElementData, values: Map<string, string> ) {
        // Start the element.
        let html = `<${ data.element } class="${ data.name }"`;

        // Add attributes.
        for ( const [ key, value ] of data.stringAttributes.entries() ) {
            if ( key.toLowerCase() !== "checked" ) {
                html += ` ${ key.toLowerCase() }="${ value }"`;
            }
        }

        // Add boolean attributes.
        for ( const attribute of data.booleanAttributes ) {
            html += ` ${ attribute }`;
        }

        // Write the element value and close the element.
        if ( data.element === "input" && data.inputType === "checkbox" ) {
            const name = data.stringAttributes.get( "name" );
            if ( name ) {
                const checked = values.get( name ) === "true" ? " checked" : "";
                html += checked;
            }

            html += " >";
        }
        else if ( data.element === "input" || data.element === "textarea" ) {
            html += ">";
        }
        else {
            html += "/>";
        }

        if ( data.element === "textarea" ) {
            // Get the default content, if any, from the value of the "name" field.
            const name = data.stringAttributes.get( "name" );
            const content = name ? values.get( name ) ?? "" : "";
            html += `${ content }</textarea>`;
        }

        return html;
    }

    static getErrorsHTML( errorMessage: string, errorDetails: string[] ) {

        if ( errorMessage ) {
            const errorMessageHeading = `<span>${ errorMessage }:</span>\n<ul>\n<li>`;
            const errorDetailsList = `${ errorDetails.join( "</li>\n<li>\n" ) }</li>\n</ul>`;
            return `<div class="error">
${ errorDetails.length > 0 ? errorMessageHeading : `${ errorMessage }` }
${ errorDetails.length > 0 ? errorDetailsList : "" }
</div>`;
        }

        return "";
    }

    /** Create extra elements needed for rendering, to be placed after the given element */
    static getExtraHTMLAfter( data: ElementData, options: CruddyFormOptions ) {
        // Return a label to be placed after the input element.
        if ( data.element === "input" && data.inputType === "checkbox" ) {
            return `<label for="${ data.id }">${ data.label }</label>`;
        }

        if ( data.element === "input" && data.inputType === "password" ) {
            if ( options.passwordHideSVG && options.passwordHideSVG.length > 0 &&
                 options.passwordShowSVG && options.passwordShowSVG.length > 0 ) {
                return `<button class="button-password-hide" type="button">${ options.passwordHideSVG }</button>
                <button class="button-password-show" type="button">${ options.passwordShowSVG }</button>`;
            }
        }

        return "";
    }

    /** Create extra elements needed for rendering, to be placed after the given element */
    static getExtraHTMLBefore( data: ElementData ) {
        // Create an extra hidden input to handle unchecked state for checkboxes.
        if ( data.element === "input" && data.inputType === "checkbox" ) {
            return ` <input type="hidden" name="${ data.name }" value="off">`;
        }
        else if ( ( !data.inputType || ![ "checkbox", "hidden" ].includes( data.inputType ) )
            && data.element != "textarea" )  {
            // Return a label for use before the input element
            return `<label for="${ data.id }">${ data.label }</label>`;
        }

        return "";
    }

    static getFieldsetHTML( fieldset?: boolean, legend?: string ) {
        const html = { end: "", start: "" };
        if ( fieldset ) {
            html.start = legend ? `<fieldset><legend>${ legend }</legend>` : "<fieldset>";
            html.end = "</fieldset>";
        }

        return html;
    }

    static getFormElementHTML( opts?: CruddyFormOptions ) {
        const action = opts?.action ? ` action="${ opts.action }"` : "";
        const cls = opts?.class ? ` class="normform ${ opts.class }"` : " class=\"normform\"";
        const id = opts?.id ? ` id="${ opts.id }"` : "";
        const method = opts?.method ? ` method="${ opts.method }"` : "";
        const novalidate = opts?.novalidate ? " novalidate" : "";
        return `<form${ action }${ cls }${ id }${ novalidate }${ method }>`;
    }

    static getHintHTML( hint?: string ) {
        return hint ? `<div class="requirements">${ hint }</div>` : "";
    }

    static getSubmitButtonHTML( buttonLabel: string, cls?: string ) {
        const divClass = cls ?? "submit";
        return `<div class="${ divClass }"><input class="button" type="submit" value="${ buttonLabel }"></div>`;
    }

    private getLocalizedValue( value: LocalizedString | string, lang?: string ): string {
        if ( this.isLocalizedString( value ) ) {
            if ( !lang ) {
                throw new Error( "Language must be specified for internationalized schema" );
            }

            if ( !( lang in value ) ) {
                throw new Error( `Language '${ lang }' is not available in the schema` );
            }

            return value[ lang ];
        }

        return value;
    }

    private isLocalizedString( value: unknown ): value is LocalizedString {
        return typeof value === "object" && value !== null && Object.values( value ).every( v => typeof v === "string" );
    }

    /** Extract a list of ElementData objects from the current typebox schema. */
    getElementDataFromSchema( lang?: string ): ElementData[] {
        const elementData = new Array<ElementData>();
        let schemaType: "localized" | "non-localized" | null = null;
        const localizableFields: string[] = [];

        const processValue = ( value: unknown, key: string ): string => {
            const isLocalized = this.isLocalizedString( value );
        
            if ( schemaType === null ) {
                schemaType = isLocalized ? "localized" : "non-localized";
                if ( isLocalized ) {
                    localizableFields.push( key );
                }
            } else if ( schemaType === "localized" && !isLocalized ) {
                throw new Error( `Mixed localized and non-localized values are not allowed. 
                Expected '${ key }' to be localized. 
                Localizable fields are: ${ localizableFields.join( ", " ) }` );
            } else if ( schemaType === "non-localized" && isLocalized ) {
                throw new Error( `Mixed localized and non-localized values are not allowed. 
                Unexpected localization for '${ key }'. 
                No fields were expected to be localized.` );
            }

            if ( isLocalized ) {
                localizableFields.push( key );
                if ( !lang ) {
                    throw new Error( `Language must be specified for internationalized schema. 
                    Localizable fields are: ${ localizableFields.join( ", " ) }` );
                }

                return this.getLocalizedValue( value as Record<string, string>, lang );
            }

            return typeof value === "string" ? value : String( value );
        };

        Object.entries( this.schema.properties ).forEach( ( [ name, props ] ) => {
            let element: string | undefined;
            let elementValue: string | undefined;
            let hint: string | undefined;
            let inputType: string | undefined;
            let label: string | undefined;
            const stringAttributes = new Map<string, string>();
            stringAttributes.set( "name", name );
        
            const id = `${ name }_${ this.options?.idSuffix ?? "" }`;
            stringAttributes.set( "id", id );
        
            const booleanAttributes: string[] = [];
            if ( this.schema.required?.includes( name ) ) {
                booleanAttributes.push( "required" );
            }

            for ( const [ key, value ] of Object.entries( props ) ) {
                switch ( key ) {
                case "element":
                    element = String( value );
                    break;
                case "hint":
                    hint = processValue( value, `${ name }.${ key }` );
                    break;
                case "label":
                    label = processValue( value, `${ name }.${ key }` );
                    break;
                case "placeholder":
                    stringAttributes.set( key, processValue( value, `${ name }.${ key }` ) );
                    break;
                case "endpoint":
                    stringAttributes.set( "data-endpoint", processValue( value, `${ name }.${ key }` ) );
                    break;
                case "elementValue":
                    elementValue = String( value );
                    stringAttributes.set( "value", String( value ) );
                    break;
                case "inputType":
                    inputType = String( value );
                    stringAttributes.set( "type", String( value ) );
                    break;
                default:
                    if ( typeof value === "boolean" && value ) {
                        booleanAttributes.push( key );
                    } else if ( key !== "type" ) {
                        stringAttributes.set( key, String( value ) );
                    }
                }
            }

            if ( !element ) {throw Error( "Invalid schema - element is required" );}

            if ( !inputType ) {throw Error( "Invalid schema - inputType is required" );}

            label ||= name.slice( 0, 1 ).toUpperCase() + name.slice( 1 );
            const attributesWithDefaults = HTMLBuilder.applyDefaultAttributes( element, inputType, stringAttributes );

            elementData.push( {
                booleanAttributes,
                element,
                elementValue,
                hint,
                id,
                inputType,
                label,
                name,
                stringAttributes: attributesWithDefaults
            } );
        } );

        return elementData;
    }
}