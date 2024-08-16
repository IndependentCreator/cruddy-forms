import type { Static, TObject } from "@sinclair/typebox";

import { Value, type ValueError } from "@sinclair/typebox/value";
import { type SchemaInfo, getSchemaInfo, parseFormFields } from "typebox-form-parser";

export interface ValidationResult {
    data: object,
    errors: string[],
    errorsRaw: ValueError[],
    valid: boolean
}

export class Validator<T extends TObject> { 

    schema: T;
    schemaInfo: SchemaInfo<T>;

    constructor( schema: T ) {
        this.schema = schema;
        this.schemaInfo = getSchemaInfo( schema );
    }
    
    validateFormData( formData: FormData ) : ValidationResult {
        const parsedData = parseFormFields( formData, this.schemaInfo );

        // Convert checkbox submissions such as [false, true] to true
        const dataEntries = new Array<[string, unknown]>();
        Object.entries( parsedData ).forEach( ( [ key, value ] ) => {
            let newValue = value;
            if ( Array.isArray( value ) ) {
                if ( value.includes( false ) && value.includes( true ) ) {
                    newValue = true;
                }
            }

            dataEntries.push( [ key, newValue ] );
        } );
        const data: Static<T> = Object.fromEntries( dataEntries );
        return this.validateObject( data );
    }

    validateObject( data: object ) : ValidationResult {
        // Validate the submitted data against the schema.
        const errors = new Array<string>();
        if ( !Value.Check( this.schema, data ) ) {
            const errorsRaw = [ ...Value.Errors( this.schema, data ) ]; 
            for ( const e of errorsRaw ){
                errors.push( `${ e.path.substring( 1 ) }: ${ e.message }` );  
            }

            return { data, errors, errorsRaw, valid: false };
        }

        return {
            data, errors: new Array<string>(), errorsRaw: new Array<ValueError>(), valid: true,
        };
    }
}