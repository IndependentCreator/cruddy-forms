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
        let html = `<${data.element} class="${data.name}"`;

        // Add attributes.
        for ( const [ key, value ] of data.stringAttributes.entries() ) {
            if ( key.toLowerCase() !== "checked" ) {
                html += ` ${key.toLowerCase()}="${value}"`;
            }
        }

        // Add boolean attributes.
        for ( const attribute of data.booleanAttributes ) {
            html += ` ${attribute}`;
        }

        // Write the element value and close the element.
        if ( data.element === "input" && data.inputType === "checkbox" ) {
            const name = data.stringAttributes.get("name");
            if (name) {
                const checked = values.get(name) === "true" ? " checked" : "";
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
            const name = data.stringAttributes.get("name");
            const content = name ? values.get(name) || "" : "";
            html += `${content}</textarea>`;
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
        else if ( (!data.inputType || ![ "checkbox", "hidden" ].includes( data.inputType ) )
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

    /** Extract a list of ElementData objects from the current typebox schema. */
    getElementDataFromSchema( lang?: string ): ElementData[] {
        const elementData = new Array<ElementData>();
        Object.entries( this.schema.properties ).forEach( ( [ name, props ] ) => {
            let element, elementValue, hint, inputType, label;

            // Set up the name as an html attribute.
            let stringAttributes = new Map<string, string>();
            stringAttributes.set( "name", name );

            // Automatically create an id from the name and optional suffix.
            const id = `${ name }_${ this.options?.idSuffix ?? "" }`;
            stringAttributes.set( "id", id );

            // Setup the "required" attribute.
            const booleanAttributes = new Array<string>();
            const required = this.schema.required?.includes( name ) ?? false;
            if ( required ) {
                booleanAttributes.push( "required" );
            }

            // Handle other element properties and attributes.
            for ( const [ key, value ] of Object.entries( props ) ) {
                if ( key === "element" ) {
                    element = `${ value }`;
                }
                else if ( key === "hint" ) {
                    hint = lang ? value[ lang ] : `${ value }`;
                }
                else if ( key === "label" ) {
                    label = lang ? value[lang] : `${ value }`;
                }
                else if ( key === "placeholder" ) {
                    stringAttributes.set( key, lang ? value[ lang ] : `${ value }`);
                }
                else if ( key === "endpoint" ) {
                    const val = lang ? value[ lang ] : `${ value }`; 
                    stringAttributes.set( "data-" + key, `${ val }` );
                }
                else if ( key === "elementValue" ) {
                    elementValue = `${ value }`;
                    stringAttributes.set( "value", `${ value }` );
                }
                else if ( key === "inputType" ) {
                    inputType = `${ value }`;
                    stringAttributes.set( "type", `${ value }` );
                }
                else if ( typeof value === "boolean" && value ) {
                    booleanAttributes.push( key );
                }
                else if ( key !== "type" ) { // Ignore typebox type
                    stringAttributes.set( key, `${ value }` );
                }
            }

            if ( !element ) {
                throw Error( "Invalid schema - element is required" );
            }

            if ( !inputType ) {
                throw Error( "Invalid schema - inputType is required" );
            }

            // Create a default label from the name if label wasn't provided.
            label ||= name.slice( 0, 1 ).toUpperCase() + name.slice( 1 );

            stringAttributes = HTMLBuilder.applyDefaultAttributes( element, inputType, stringAttributes );

            elementData.push( {
                booleanAttributes,
                element,
                elementValue,
                hint,
                id,
                inputType,
                label,
                name,
                stringAttributes
            } );
        } );
        return elementData;
    }
}
