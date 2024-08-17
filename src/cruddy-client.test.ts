import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CruddyForm } from "./cruddy-client.js";

// @vitest-environment happy-dom

describe( "CruddyForm", () => {
    let cruddy: CruddyForm;

    beforeEach( () => {
        cruddy = new CruddyForm();
    } );

    afterEach( () => {
        vi.restoreAllMocks();
    } );

    describe( "handlePasswordReveal", () => {
        it( "should toggle password visibility", () => {
            const passwordInput = document.createElement( "input" );
            passwordInput.type = "password";
            const showButton = document.createElement( "button" );
            showButton.className = "button-password-show";
            const hideButton = document.createElement( "button" );
            hideButton.className = "button-password-hide";
      
            const container = document.createElement( "div" );
            container.appendChild( passwordInput );
            container.appendChild( showButton );
            container.appendChild( hideButton );

            document.body.appendChild( container );

            cruddy.handlePasswordReveal( { target: showButton } as unknown as Event );
            expect( passwordInput.type ).toBe( "text" );
            expect( hideButton.style.display ).toBe( "flex" );
            expect( showButton.style.display ).toBe( "none" );

            cruddy.handlePasswordReveal( { target: hideButton } as unknown as Event );
            expect( passwordInput.type ).toBe( "password" );
            expect( hideButton.style.display ).toBe( "none" );
            expect( showButton.style.display ).toBe( "flex" );
        } );
    } );

    describe( "callEndpoint", () => {
        it( "should handle 422 response", async () => {
            const input = document.createElement( "input" );
            input.id = "testInput";
            input.setAttribute( "data-endpoint", "/test-endpoint/" );
            input.value = "test";

            const requirementsNode = document.createElement( "div" );
            requirementsNode.className = "requirements";
            cruddy.requirementsNodes.set( "testInput", requirementsNode );
            cruddy.requirements.set( "testInput", "Original requirement" );

            const container = document.createElement( "div" );
            container.appendChild( input );
            container.appendChild( requirementsNode );
            document.body.appendChild( container );

            const setCustomValiditySpy = vi.spyOn( input, "setCustomValidity" );
            const reportValiditySpy = vi.spyOn( input, "reportValidity" );

            global.fetch = vi.fn().mockResolvedValue( {
                json: () => Promise.resolve( { message: "Validation error" } ),
                status: 422,
            } ) as any;

            await cruddy.callEndpoint( input );

            expect( setCustomValiditySpy ).toHaveBeenCalledWith( "Validation error" );
            expect( reportValiditySpy ).toHaveBeenCalled();
            expect( cruddy.errorValues.get( "testInput" ) ).toBe( "test" );
            expect( requirementsNode.innerHTML ).toBe( "Validation error" );
        } );
    } );
} );