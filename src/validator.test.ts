import { Type } from "@sinclair/typebox";
import { describe, expect, it } from "vitest";

import { FormInputText } from "./types.js";
import { Validator } from "./validator.js";

// @vitest-environment node

describe( "Validator Test Suite", function () {
    const schema = Type.Object( {
        password: Type.String( { 
            element: "input",
            inputType: "password",
            minLength: 4 } satisfies FormInputText ),
        username: Type.String( {
            element: "input",
            inputType: "text",
            maxLength: 6, } satisfies FormInputText ),
    } );
    const validator = new Validator( schema );
    describe( "Validator Tests", function () {
        
        it( "tests formData validInput", function() {
            const formData = new FormData();
            formData.set( "password", "mypassword" );
            formData.set( "username", "myuser" );
            const result = validator.validateFormData( formData );
            expect( result.valid ).toBe( true );
        } );
        it( "tests formData missing field", function() {
            const formData = new FormData();
            formData.set( "password", "mypassword" );
            const result = validator.validateFormData( formData );
            expect( result.valid ).toBe( false );
        } );

        it( "tests formData minLength", function() {
            const formData = new FormData();
            formData.set( "password", "123" );
            formData.set( "username", "myuser" );
            const result = validator.validateFormData( formData );
            expect( result.valid ).toBe( false );
        } );

        it( "tests formData maxLength", function() {
            const formData = new FormData();
            formData.set( "password", "mypassword" );
            formData.set( "username", "1234567" );
            const result = validator.validateFormData( formData );
            expect( result.valid ).toBe( false );
        } );
        it( "tests object validInput", function() {
            const data = { password: "mypassword", username: "myuser" };
            const result = validator.validateObject( data );
            expect( result.valid ).toBe( true );
        } );

        it( "tests object minLength", function() {
            const data = { password: "123", username: "myuser" };
            const result = validator.validateObject( data );
            expect( result.valid ).toBe( false );
        } );

        it( "tests object maxLength", function() {
            const data = { password: "mypassword", username: "1234567" };
            const result = validator.validateObject( data );
            expect( result.valid ).toBe( false );
        } );
        it( "tests object missing field", function() {
            const data = { password: "mypassword" };
            const result = validator.validateObject( data );
            expect( result.valid ).toBe( false );
        } );

    } );
} );
