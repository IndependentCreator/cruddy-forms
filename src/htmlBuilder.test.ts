import { Type } from "@sinclair/typebox";
import { HtmlValidate } from "html-validate";
import { beforeEach, describe, expect, it } from "vitest";

import { ElementData, HTMLBuilder } from "./htmlBuilder.js";
import { FormInputCheckbox, FormInputText, FormTextArea } from "./types.js";

// @vitest-environment happy-dom 

const htmlvalidate = new HtmlValidate( {
    elements: [ "html5", ],
    extends: [ "html-validate:recommended" ],
    root: true,
    rules: { "prefer-button": "off", "text-content": "off" },
} );

export async function validateHTML( html: string ) {
    const report= await htmlvalidate.validateString( html );
    for ( const result of report.results ) {
        console.log( html );
        console.log( result.messages );
    }

    return report.valid;
}

import { Window, XMLParser } from "happy-dom";

export function parseHTML( html: string ) {
    const { document } = new Window();
    return XMLParser.parse( document, html );
}

describe( "test html creation functions", function () {
    const booleanAttributes = new Array<string>();

    describe( "Internationalization Tests", function () {
        const i18nSchema = Type.Object( {
            username: Type.String( {
                element: "input",
                endpoint: {
                    en: "/api/validate/username",
                    es: "/es/api/validar/nombre-usuario"
                },
                hint: {
                    en: "Enter your username",
                    es: "Ingrese su nombre de usuario"
                },
                inputType: "text",
                label: {
                    en: "Username",
                    es: "Nombre de usuario"
                },
                placeholder: {
                    en: "Your username",
                    es: "Su nombre de usuario"
                }
            } satisfies FormInputText )
        } );

        it( "should throw an error when lang is not provided for internationalized schema", function () {
            const builder = new HTMLBuilder( i18nSchema );
            expect( () => builder.getElementDataFromSchema() ).toThrow( "Language must be specified for internationalized schema" );
        } );

        it( "should use English localized values when lang is 'en'", function () {
            const builder = new HTMLBuilder( i18nSchema );
            const data = builder.getElementDataFromSchema( "en" );
            expect( data.length ).toBe( 1 );
            const [ username ] = data;

            expect( username.hint ).toBe( "Enter your username" );
            expect( username.label ).toBe( "Username" );
            expect( username.stringAttributes.get( "placeholder" ) ).toBe( "Your username" );
            expect( username.stringAttributes.get( "data-endpoint" ) ).toBe( "/api/validate/username" );
        } );

        it( "should use Spanish localized values when lang is 'es'", function () {
            const builder = new HTMLBuilder( i18nSchema );
            const data = builder.getElementDataFromSchema( "es" );
            expect( data.length ).toBe( 1 );
            const [ username ] = data;

            expect( username.hint ).toBe( "Ingrese su nombre de usuario" );
            expect( username.label ).toBe( "Nombre de usuario" );
            expect( username.stringAttributes.get( "placeholder" ) ).toBe( "Su nombre de usuario" );
            expect( username.stringAttributes.get( "data-endpoint" ) ).toBe( "/es/api/validar/nombre-usuario" );
        } );

        it( "should throw an error when lang is not available", function () {
            const builder = new HTMLBuilder( i18nSchema );
            expect( () => builder.getElementDataFromSchema( "fr" ) ).toThrow( "Language 'fr' is not available in the schema" );
        } );

        it( "should handle non-internationalized schema correctly", function () {
            const nonI18nSchema = Type.Object( {
                email: Type.String( {
                    element: "input",
                    hint: "Enter your email",
                    inputType: "email",
                    label: "Email",
                    placeholder: "example@domain.com"
                } satisfies FormInputText )
            } );

            const builder = new HTMLBuilder( nonI18nSchema );
            const data = builder.getElementDataFromSchema();
            expect( data.length ).toBe( 1 );
            const [ email ] = data;

            expect( email.hint ).toBe( "Enter your email" );
            expect( email.label ).toBe( "Email" );
            expect( email.stringAttributes.get( "placeholder" ) ).toBe( "example@domain.com" );
        } );

        it( "should throw an error for mixed localized and non-localized values", function () {
            const mixedSchema = Type.Object( {
                email: Type.String( {
                    element: "input",
                    hint: "Enter your email",
                    inputType: "email",
                    label: {
                        en: "Email",
                        es: "Correo electrónico"
                    },
                    placeholder: "example@domain.com"
                } satisfies FormInputText )
            } );

            const builder = new HTMLBuilder( mixedSchema );
            expect( () => builder.getElementDataFromSchema() ).toThrow( "Mixed localized and non-localized values are not allowed" );
            expect( () => builder.getElementDataFromSchema( "en" ) ).toThrow( "Mixed localized and non-localized values are not allowed" );
        } );
    } );

    describe( "HTMLBuilder Test Suite", function () {

        const stringAttributes = new Map<string, string>();
        let data = {
            booleanAttributes,
            element: "input",
            elementValue: "the value",
            hint: "the hint",
            id: "id1",
            inputType: "text",
            label: "the label",
            name: "name1",
            stringAttributes,
        };

        beforeEach( () => {
            const booleanAttributes = new Array<string>();
            booleanAttributes.push( "required" );
            const stringAttributes = new Map<string, string>();
            stringAttributes.set( "type", "text" );
            data = {
                booleanAttributes,
                element: "input",
                elementValue: "the value",
                hint: "the hint",
                id: "id1",
                inputType: "text",
                label: "the label",
                name: "name1",
                stringAttributes,
            };
        } );

        it( "test getErrorDivHTML()", function() {
            const errorDetails = [ "Error 1", "Error 2" ];
            const html = HTMLBuilder.getErrorsHTML( "The Errors", errorDetails );
            expect( html ).toBe( `<div class="error">
<span>The Errors:</span>
<ul>
<li>
Error 1</li>
<li>
Error 2</li>
</ul>
</div>` );
        } );

        it( "test getElementHTML()", async function() {
            const html = HTMLBuilder.getElementHTML( data, new Map<string, string>() );
            expect( html ).toBe( '<input class="name1" type="text" required>' );
            const valid = await validateHTML( html );
            expect( valid ).toBeTruthy();
        } );

        it ( "test getHintHTML()", async function() {
            const html = HTMLBuilder.getHintHTML( "The hint" );
            expect( html ).toBe( "<div class=\"requirements\">The hint</div>" );
            const valid = await validateHTML( html );
            expect( valid ).toBeTruthy();
            
            const html2 = HTMLBuilder.getHintHTML( "" );
            expect( html2 ).toBe( "" );
        } );

        it( "test getSubmitButtonHTML()", async function() {
            const html = HTMLBuilder.getSubmitButtonHTML( "Click Me" );
            expect ( html ).toBe( "<div class=\"submit\"><input class=\"button\" type=\"submit\" value=\"Click Me\"></div>" );
            const valid = await validateHTML( html );
            expect( valid ).toBeTruthy();
        } );

        it( "test getFormElementHTML()", function() {
            const html = HTMLBuilder.getFormElementHTML( {
                action: "http//z.co",
                class: "form-class",
                id:"form-id",
                method: "post",
                novalidate: true,
            } );

            expect( html ).toBe( "<form action=\"http//z.co\" class=\"normform form-class\" id=\"form-id\" novalidate method=\"post\">" );
        } );

        it( "test getElementHTML() extra attributes", async function() {
            data.stringAttributes.set( "data-msg", "hi" );
            data.stringAttributes.set( "value", "the value" );
            data.booleanAttributes.push( "data-bool" );
            const html = HTMLBuilder.getElementHTML( data, new Map<string, string>() );
            expect( html ).toBe( '<input class="name1" type="text" data-msg="hi" value="the value" required data-bool>' );
            const valid = await validateHTML( html );
            expect( valid ).toBeTruthy();
        } );

        it ( "test getElementHTMLAfter()", async function () {
            // text inputs get no extra html before
            const html1 = HTMLBuilder.getExtraHTMLAfter( data, {} );
            expect( html1 ).toBe( "" );

            // checkboxes get a label element
            data.inputType = "checkbox";
            const html2 = HTMLBuilder.getExtraHTMLAfter( data, {} );
            expect( html2 ).toBe( "<label for=\"id1\">the label</label>" );
            const valid = await validateHTML( html2 );
            expect( valid ).toBeTruthy();
        } );

        it ( "test applyDefaultAttributes() - text input", function () {
            const attributes = new Map<string, string>();
            const withDefaults = HTMLBuilder.applyDefaultAttributes( "input", "text",  attributes );
            expect( withDefaults.size ).toBe( 6 );
            expect( withDefaults.get( "autocapitalize" ) ).toBe( "off" );
            expect( withDefaults.get( "autocomplete" ) ).toBe( "off" );
            expect( withDefaults.get( "autocorrect" ) ).toBe( "off" );
            expect( withDefaults.get( "placeholder" ) ).toBe( "" );
            expect( withDefaults.get( "spellcheck" ) ).toBe( "false" );
            expect( withDefaults.get( "value" ) ).toBe( "" );
        } );

        it ( "test applyDefaultAttributes() - checkbox input", function () {
            const attributes = new Map<string, string>();
            const withDefaults = HTMLBuilder.applyDefaultAttributes( "input", "checkbox",  attributes );
            expect( withDefaults.size ).toBe( 0 );
        } );

        it ( "test getElementHTMLBefore()", async function () {
            // text inputs get a label element
            const html1 = HTMLBuilder.getExtraHTMLBefore( data );
            expect( html1 ).toBe( "<label for=\"id1\">the label</label>" );
            const valid1 = await validateHTML( html1 );
            expect( valid1 ).toBeTruthy();

            // checkboxes get a hidden input with value set to off
            data.inputType = "checkbox";
            const html2 = HTMLBuilder.getExtraHTMLBefore( data );
            expect( html2 ).toBe( " <input type=\"hidden\" name=\"name1\" value=\"off\">" );
            const valid2 = await validateHTML( html2 );
            expect( valid2 ).toBeTruthy();

        } );
    } );

    describe( "test getElementDataFromSchema()", function () {
        const schema = Type.Object( {
            check1: Type.Boolean( {
                element: "input",
                inputType: "checkbox",
            } satisfies FormInputCheckbox ),
            check2: Type.Boolean( {
                checked: true,
                class: "check2 class",
                element: "input",
                endpoint: "check2 endpoint",
                hint: "check2 hint",
                inputType: "checkbox",
                label: "check2 label",
            } satisfies Required<FormInputCheckbox> ),
            comment: Type.String( {
                element: "textarea",
                inputType: "text",
                maxLength: 50,
                minLength: 5,
            } satisfies FormTextArea ),
            password: Type.String( { 
                element: "input",
                inputType: "password",
            } satisfies FormInputText ),
            realname: Type.Optional( Type.String( {
                element: "input",
                inputType: "text",
            } satisfies FormInputText ) ),
            username: Type.String( {
                autocapitalize: "on",
                autocomplete: "on",
                autocorrect: "on",
                autofocus: true,
                class: "username class",
                element: "input",
                endpoint: "username endpoint",
                hint: "username hint",
                inputType: "text",
                label: "username label",
                maxLength: 6, 
                minLength: 2,
                pattern: "username pattern",
                placeholder: "username placeholder",
                spellcheck: "true",
                value: "username value",
            } satisfies Required<FormInputText> ),
        } );

        let builder = new HTMLBuilder( Type.Object( {} ) );
        let check1: ElementData;
        let check2: ElementData; 
        let comment: ElementData;
        let password: ElementData;
        let realname: ElementData;
        let username: ElementData;

        beforeEach( () => {
            builder = new HTMLBuilder( schema );
            const data = builder.getElementDataFromSchema();
            expect( data.length ).toBe( 6 );
            [ check1, check2, comment, password, realname, username ] = data;
        } );

        it( "test checkbox with minimal attributes", function () {
            expect( check1.element ).toBe( "input" );
            expect( check1.hint ).toBeUndefined();
            expect( check1.inputType ).toBe( "checkbox" );
            expect( check1.label ).toBe( "Check1" );
            expect( check1.booleanAttributes.length ).toBe( 1 );
            expect( check1.booleanAttributes.includes( "required" ) ) .toBe( true );
            expect( check1.booleanAttributes.includes( "checked" ) ).toBe( false );
            expect( check1.stringAttributes.size ).toBeGreaterThan( 0 );
            expect( check1.stringAttributes.get( "hint" ) ).toBeUndefined();
            expect( check1.stringAttributes.get( "data-endpoint" ) ).toBeUndefined();
        } );

        it( "test checkbox with all attributes provided", function () {
            expect( check2.element ).toBe( "input" );
            expect( check2.hint ).toBe( "check2 hint" );
            expect( check2.inputType ).toBe( "checkbox" );
            expect( check2.label ).toBe( "check2 label" );
            expect( check2.booleanAttributes.length ).toBe( 2 );
            expect( check2.booleanAttributes.includes( "required" ) ) .toBe( true );
            expect( check2.booleanAttributes.includes( "checked" ) ).toBe( true );
            expect( check2.stringAttributes.size ).toBeGreaterThan( 0 );
            expect( check2.stringAttributes.get( "hint" ) ).toBeUndefined();
            expect( check2.stringAttributes.get( "data-endpoint" ) ).toBe( "check2 endpoint" );
            expect( check2.stringAttributes.get( "type" ) ).toBe( "checkbox" );
        } );

        it ( "test textarea", function () {
            expect( comment.element ).toBe( "textarea" );
            expect( comment.inputType ).toBe( "text" );
            expect( comment.stringAttributes.size ).toBeGreaterThan( 0 );
            expect( comment.stringAttributes.get( "maxLength" ) ).toBe( "50" );
            expect( comment.stringAttributes.get( "minLength" ) ).toBe( "5" );
        } );
        
        it( "test password with minimal attributes", function () {
            expect( password.stringAttributes.get( "autocapitalize" ) ).toBe( "off" );
            expect( password.stringAttributes.get( "autocomplete" ) ).toBe( "off" );
            expect( password.stringAttributes.get( "autocorrect" ) ).toBe( "off" );
            expect( password.elementValue ).toBeUndefined();
            expect( password.hint ).toBeUndefined();
            expect( password.inputType ).toBe( "password" );
            expect( password.label ).toBe( "Password" );
            expect( password.name ).toBe( "password" );
            expect( password.stringAttributes.get( "class" ) ).toBeUndefined();
            expect( password.stringAttributes.get( "data-endpoint" ) ).toBeUndefined();
            expect( password.stringAttributes.get( "maxLength" ) ).toBeUndefined();
            expect( password.stringAttributes.get( "minLength" ) ).toBeUndefined();
            expect( password.stringAttributes.get( "placeholder" ) ).toBe( "" );
            expect( password.booleanAttributes.includes( "required" ) ).toBeTruthy();
            expect( password.booleanAttributes.length ).toBe( 1 );
            expect( password.stringAttributes.get( "spellcheck" ) ).toBe( "false" );
            expect( password.stringAttributes.get( "type" ) ).toBe( "password" );
        } );

        it( "test optional input", function () {
            expect( realname.name ).toBe( "realname" );
            expect( realname.inputType ).toBe( "text" );
            expect( realname.booleanAttributes.includes( "required" ) ).toBeFalsy();
            expect( realname.stringAttributes.get( "type" ) ).toBe( "text" );
        } );

        it( "test all text input attributes provided", function () {
            expect( username.stringAttributes.get( "autocapitalize" ) ).toBe( "on" );
            expect( username.stringAttributes.get( "autocomplete" ) ).toBe( "on" );
            expect( username.stringAttributes.get( "autocorrect" ) ).toBe( "on" );
            expect( username.elementValue ).toBeUndefined();
            expect( username.hint ).toBe( "username hint" );
            expect( username.inputType ).toBe( "text" );
            expect( username.label ).toBe( "username label" );
            expect( username.name ).toBe( "username" );
            expect( username.stringAttributes.get( "class" ) ).toBe( "username class" );
            expect( username.stringAttributes.get( "data-endpoint" ) ).toBe( "username endpoint" );
            expect( username.stringAttributes.get( "maxLength" ) ).toBe( "6" );
            expect( username.stringAttributes.get( "minLength" ) ).toBe( "2" );
            expect( username.stringAttributes.get( "pattern" ) ).toBe( "username pattern" );
            expect( username.stringAttributes.get( "placeholder" ) ).toBe( "username placeholder" );
            expect( username.booleanAttributes.includes( "required" ) ).toBeTruthy();
            expect( username.booleanAttributes.includes( "autofocus" ) ).toBeTruthy();
            expect( username.stringAttributes.get( "spellcheck" ) ).toBe( "true" );
            expect( username.stringAttributes.get( "type" ) ).toBe( "text" );
        } );
    } );
} );
