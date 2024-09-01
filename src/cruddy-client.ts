export class CruddyForm extends HTMLElement {
    changeHandler;
    errorValues: Map<string, string>;
    /** Wrapper for handleChange to use with event listeners */
    handleChangeWrapper = ( event: Event ) => {
        void this.handleChange( event );
    };
    /** Wrapper for handleInput to use with event listeners */
    handleInputWrapper = ( event: Event ) => {
        void this.handleInput( event );
    };
    inputHandler;
    passwordRevealHandler;

    requirements: Map<string, string>;

    requirementsNodes: Map<string, HTMLElement>;

    constructor() {
        super();
        this.changeHandler = this.handleChange.bind( this );
        this.errorValues = new Map<string, string>();
        this.inputHandler = this.handleInput.bind( this );
        this.passwordRevealHandler = this.handlePasswordReveal.bind( this );
        this.requirementsNodes = new Map<string, HTMLElement>();
        this.requirements = new Map<string, string>();

        // Handle all elements that have type password
        this.querySelectorAll( "[type]" ).forEach( ( element ) => {
            if ( element instanceof HTMLInputElement ) {
                if ( element.getAttribute( "type" ) === "password" ) {
                    // If the password input has sibling buttons, register them to reveal/unreveal 
                    if ( element.parentNode ) {
                        for ( const btn of [ ".button-password-hide", ".button-password-show" ] ) {
                            const buttonNode = element.parentNode.querySelector( btn );
                            if ( buttonNode instanceof HTMLElement ) {
                                buttonNode.addEventListener( "click", this.passwordRevealHandler );
                                buttonNode.click();
                            }
                        }
                    }
                }
            }
        } );

        // Handle all elements that have the data-endpoint attribute.
        this.querySelectorAll( "[data-endpoint]" ).forEach( ( element ) => {
            if ( element instanceof HTMLInputElement ) {
                // Store the initial contents of the requirements message.
                if ( element.parentNode ) {
                    const requirementsNode = element.parentNode.querySelector( "div.requirements" );
                    if ( requirementsNode && requirementsNode instanceof HTMLElement ) {
                        this.requirementsNodes.set( element.id, requirementsNode );
                        this.requirements.set( element.id, requirementsNode.innerHTML );
                    }
                }

                // Register listeners.
                element.addEventListener( "input", this.handleInputWrapper );
                element.addEventListener( "change", this.handleChangeWrapper );
            }
        } );
    }

    async callEndpoint( element: HTMLInputElement ): Promise<void> {
        const url = element.getAttribute( "data-endpoint" ) + element.value;
        try {
            const response = await fetch( url );
            if ( response.status === 422 ) {
                const data = await response.json() as { message: string };
                if ( data.message ) {
                    element.setCustomValidity( data.message );
                    this.errorValues.set( element.id, element.value );
                    const requirementsNode = this.requirementsNodes.get( element.id );
                    if ( requirementsNode ) {
                        requirementsNode.innerHTML = data.message;
                    }

                    element.focus();
                } else {
                    element.setCustomValidity( "" );
                }

                element.reportValidity();
            }
        } catch ( error ) {
            console.error( "Error calling endpoint:", error );
        }
    }

    /** Call the remote validator when the entered value has changed. */
    async handleChange( event: Event ) {
        if ( !( event.target instanceof HTMLInputElement ) ) {
            return;
        }

        const element = event.target;
        if ( !element.validity.valid ) {
            return;
        }

        await this.callEndpoint( element );
    }

    /** Reset the error message once the user starts editing. */
    async handleInput( event: Event ) {
        if ( !( event.target instanceof HTMLInputElement ) ) {
            return;
        }

        event.target.setCustomValidity( "" );
        if ( event.target.value === this.errorValues.get( event.target.id ) ) {
            await this.callEndpoint( event.target );
        }

        const requirementsNode = this.requirementsNodes.get( event.target.id );
        const requirementsHTML = this.requirements.get( event.target.id );
        if ( requirementsNode && requirementsHTML ) {
            requirementsNode.innerHTML = requirementsHTML;
        }
    }

    handlePasswordReveal( event: Event ) {
        if ( !( event.target instanceof SVGElement ) && !( event.target instanceof HTMLElement ) ) {
            return;
        }

        if ( event.target.parentNode?.parentNode ) {
            // Find the password input and toggle it between password and text
            const input = event.target.parentNode.parentNode.querySelector( "[type]" );
            if ( input instanceof HTMLInputElement ) {
                if ( input.type === "password" ) {
                    input.type = "text";
                } else {
                    input.type = "password";
                }

                // Find the buttons for show and hide and toggle them
                const buttonHide = event.target.parentNode.parentNode.querySelector( ".button-password-hide" );
                const buttonShow = event.target.parentNode.parentNode.querySelector( ".button-password-show" );
                if ( buttonHide instanceof HTMLElement && buttonShow instanceof HTMLElement ) {
                    buttonHide.style.display = ( input.type === "text" ) ? "flex" : "none";
                    buttonShow.style.display = ( input.type === "text" ) ? "none" : "flex";
                }
            }
        }
    }
}

customElements.define( "cruddy-form", CruddyForm );
