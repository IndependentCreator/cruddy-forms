import { Type } from "@sinclair/typebox";
import { TreeWalker } from "happy-dom";
import { describe, expect, it } from "vitest";

import { Form } from "./form.js";
import { HTMLBuilder } from "./htmlBuilder.js";
import { parseHTML, validateHTML } from "./htmlBuilder.test.js";
import { FormInputText } from "./types.js";

// @vitest-environment happy-dom 

describe("Form Test Suite", function () {
    const nonLocalizedSchema = Type.Object({
        password: Type.String({
            element: "input",
            inputType: "password",
            minLength: 4
        } satisfies FormInputText),
        username: Type.String({
            element: "input",
            inputType: "text",
            maxLength: 6,
        } satisfies FormInputText),
    });

    const localizedSchema = Type.Object({
        password: Type.String({
            element: "input",
            inputType: "password",
            minLength: 4,
            label: {
                en: "Password",
                es: "Contraseña",
                fr: "Mot de passe"
            },
            hint: {
                en: "Must be at least 4 characters long",
                es: "Debe tener al menos 4 caracteres",
                fr: "Doit contenir au moins 4 caractères"
            }
        } satisfies FormInputText),
        username: Type.String({
            element: "input",
            inputType: "text",
            maxLength: 6,
            label: {
                en: "Username",
                es: "Nombre de usuario",
                fr: "Nom d'utilisateur"
            },
            hint: {
                en: "Maximum 6 characters",
                es: "Máximo 6 caracteres",
                fr: "Maximum 6 caractères"
            }
        } satisfies FormInputText),
    });

    describe("Non-localized Schema Tests", function () {
        const form = new Form(nonLocalizedSchema);

        it("tests getHTML - no options", async function () {
            const html = form.getHTML();
            const valid = await validateHTML(html);
            expect(valid).toBeTruthy();
            const doc = parseHTML(html);
            expect(doc.children.length).toBe(1);
            const tw = new TreeWalker(doc, NodeFilter.SHOW_ELEMENT);
            const formNode = tw.firstChild() as unknown as HTMLElement;
            expect(formNode.nodeName).toBe("FORM");
            // The method attribute should default to post
            const method = formNode.getAttribute("method");
            expect(method).toBe("post");

            // There should be a child div for each input
            // Each input should have a label element and an input element
            // Verify the contents of the password input elements
            const div1 = tw.firstChild() as unknown as HTMLElement;
            expect(div1.getAttribute("class")).toBe("password");
            expect(div1.nodeName).toBe("DIV");
            const label1 = tw.firstChild() as unknown as HTMLElement;
            expect(label1.nodeName).toBe("LABEL");
            const input1 = tw.nextSibling() as unknown as HTMLElement;
            const input1Id = input1.getAttribute("id");
            expect(input1Id).toBe("password_");
            expect(label1.getAttribute("for")).toEqual(input1Id);
            expect(input1.nodeName).toBe("INPUT");
            const attribs1 = {
                autocapitalize: input1.getAttribute("autocapitalize"),
                autocomplete: input1.getAttribute("autocomplete"),
                autocorrect: input1.getAttribute("autocorrect"),
                placeholder: input1.getAttribute("placeholder"),
                spellcheck: input1.getAttribute("spellcheck"),
                value: input1.getAttribute("value")
            };
            expect(attribs1).toEqual(HTMLBuilder.defaultsTextInputs);
            expect(input1.getAttribute("maxlength")).toBeNull();
            expect(input1.getAttribute("minlength")).toBe("4");
            expect(input1.getAttribute("required")).toBe("");
            tw.parentNode();

            // Verify the contents of the username input elements
            const div2 = tw.nextSibling() as unknown as HTMLElement;
            expect(div2.getAttribute("class")).toBe("text");
            expect(div2.nodeName).toBe("DIV");
            const label2 = tw.firstChild() as unknown as HTMLElement;
            expect(label2.nodeName).toBe("LABEL");
            const input2 = tw.nextSibling() as unknown as HTMLElement;
            const input2Id = input2.getAttribute("id");
            expect(input2Id).toBe("username_");
            expect(label2.getAttribute("for")).toEqual(input2Id);
            expect(input2.nodeName).toBe("INPUT");
            const attribs2 = {
                autocapitalize: input2.getAttribute("autocapitalize"),
                autocomplete: input2.getAttribute("autocomplete"),
                autocorrect: input2.getAttribute("autocorrect"),
                placeholder: input2.getAttribute("placeholder"),
                spellcheck: input2.getAttribute("spellcheck"),
                value: input2.getAttribute("value")
            };
            expect(attribs2).toEqual(HTMLBuilder.defaultsTextInputs);
            expect(input2.getAttribute("maxlength")).toBe("6");
            expect(input2.getAttribute("minlength")).toBeNull();
            expect(input2.getAttribute("required")).toBe("");
            tw.parentNode();

            // There should be a div with class="submit"
            const div3 = tw.nextSibling() as unknown as HTMLElement;
            expect(div3.nodeName).toBe("DIV");
            const submitClass = div3.getAttribute("class");
            expect(submitClass).toBe("submit");
            // The submit div should contain a button with type submit and text Submit
            const buttonElement = div3.children[0] as unknown as HTMLElement;
            const buttonType = buttonElement.getAttribute("type");
            expect(buttonType).toBe("submit");
            expect(buttonElement.getAttribute("value")).toBe("Submit");

            // There should be no more child elements within the form
            const div4 = tw.nextSibling();
            expect(div4).toBeNull();
        });

        // Add more tests for non-localized schema as needed
    });

    describe("Localized Schema Tests", function () {
        const form = new Form(localizedSchema);

        it("tests form generation with English labels and hints", async function () {
            const html = form.getHTML({}, "en");
            const valid = await validateHTML(html);
            expect(valid).toBeTruthy();
            const doc = parseHTML(html);
            const tw = new TreeWalker(doc, NodeFilter.SHOW_ELEMENT);
            
            // Check password field
            const passwordDiv = tw.firstChild() as unknown as HTMLElement;
            const passwordLabel = tw.firstChild() as unknown as HTMLElement;
            expect(passwordLabel.textContent).toBe("Password");
            tw.nextSibling(); // Skip input
            const passwordHint = tw.nextSibling() as unknown as HTMLElement;
            expect(passwordHint.textContent).toBe("Must be at least 4 characters long");
            tw.parentNode();

            // Check username field
            const usernameDiv = tw.nextSibling() as unknown as HTMLElement;
            const usernameLabel = tw.firstChild() as unknown as HTMLElement;
            expect(usernameLabel.textContent).toBe("Username");
            tw.nextSibling(); // Skip input
            const usernameHint = tw.nextSibling() as unknown as HTMLElement;
            expect(usernameHint.textContent).toBe("Maximum 6 characters");
        });

        it("tests form generation with Spanish labels and hints", async function () {
            const html = form.getHTML({}, "es");
            const valid = await validateHTML(html);
            expect(valid).toBeTruthy();
            const doc = parseHTML(html);
            const tw = new TreeWalker(doc, NodeFilter.SHOW_ELEMENT);
            
            // Check password field
            const passwordDiv = tw.firstChild() as unknown as HTMLElement;
            const passwordLabel = tw.firstChild() as unknown as HTMLElement;
            expect(passwordLabel.textContent).toBe("Contraseña");
            tw.nextSibling(); // Skip input
            const passwordHint = tw.nextSibling() as unknown as HTMLElement;
            expect(passwordHint.textContent).toBe("Debe tener al menos 4 caracteres");
            tw.parentNode();

            // Check username field
            const usernameDiv = tw.nextSibling() as unknown as HTMLElement;
            const usernameLabel = tw.firstChild() as unknown as HTMLElement;
            expect(usernameLabel.textContent).toBe("Nombre de usuario");
            tw.nextSibling(); // Skip input
            const usernameHint = tw.nextSibling() as unknown as HTMLElement;
            expect(usernameHint.textContent).toBe("Máximo 6 caracteres");
        });

        it("tests form generation with French labels and hints", async function () {
            const html = form.getHTML({}, "fr");
            const valid = await validateHTML(html);
            expect(valid).toBeTruthy();
            const doc = parseHTML(html);
            const tw = new TreeWalker(doc, NodeFilter.SHOW_ELEMENT);
            
            // Check password field
            const passwordDiv = tw.firstChild() as unknown as HTMLElement;
            const passwordLabel = tw.firstChild() as unknown as HTMLElement;
            expect(passwordLabel.textContent).toBe("Mot de passe");
            tw.nextSibling(); // Skip input
            const passwordHint = tw.nextSibling() as unknown as HTMLElement;
            expect(passwordHint.textContent).toBe("Doit contenir au moins 4 caractères");
            tw.parentNode();

            // Check username field
            const usernameDiv = tw.nextSibling() as unknown as HTMLElement;
            const usernameLabel = tw.firstChild() as unknown as HTMLElement;
            expect(usernameLabel.textContent).toBe("Nom d'utilisateur");
            tw.nextSibling(); // Skip input
            const usernameHint = tw.nextSibling() as unknown as HTMLElement;
            expect(usernameHint.textContent).toBe("Maximum 6 caractères");
        });

        // Add more tests for localized schema as needed
    });
});
