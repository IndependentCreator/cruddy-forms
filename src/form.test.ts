import { Type } from "@sinclair/typebox";
import { TreeWalker } from "happy-dom";
import { describe, expect, it } from "vitest";

import { Form } from "./form.js";
import { HTMLBuilder } from "./htmlBuilder.js";
import { parseHTML, validateHTML } from "./htmlBuilder.test.js";
import { FormInputText } from "./types.js";

// @vitest-environment happy-dom 

function normalizeWhitespace(str: string): string {
    return str.replace(/\s+/g, ' ').trim();
}

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

        function testLocalizedForm(lang: string, expectedLabels: Record<string, string>, expectedHints: Record<string, string>) {
            return async function () {
                const html = form.getHTML({}, lang);
                const valid = await validateHTML(html);
                expect(valid).toBeTruthy();
                const doc = parseHTML(html);

                for (const [fieldName, expectedLabel] of Object.entries(expectedLabels)) {
                    const labelElement = doc.querySelector(`div.${fieldName} > label[for="${fieldName}_"]`);
                    expect(labelElement, `Label for ${fieldName} not found`).not.toBeNull();
                    expect(normalizeWhitespace(labelElement?.textContent || "")).toBe(expectedLabel);
                }

                for (const [fieldName, expectedHint] of Object.entries(expectedHints)) {
                    const hintElement = doc.querySelector(`div.${fieldName} > div.requirements`);
                    expect(hintElement, `Hint for ${fieldName} not found`).not.toBeNull();
                    expect(normalizeWhitespace(hintElement?.textContent || "")).toBe(expectedHint);
                }
            };
        }

        it("tests form generation with English labels and hints", testLocalizedForm(
            "en",
            {
                email: "Email label",
                password: "Password label"
            },
            {
                email: "e.g. me@example.com",
                password: "EN: Passwords must contain 6 or more characters."
            }
        ));

        it("tests form generation with Spanish labels and hints", testLocalizedForm(
            "es",
            {
                email: "Etiqueta de correo electrónico",
                password: "Etiqueta de contraseña"
            },
            {
                email: "ej. yo@ejemplo.com",
                password: "ES: Las contraseñas deben contener 6 o más caracteres."
            }
        ));

        it("tests form generation with French labels and hints", testLocalizedForm(
            "fr",
            {
                email: "Étiquette de courriel",
                password: "Étiquette de mot de passe"
            },
            {
                email: "ex. moi@exemple.com",
                password: "FR: Les mots de passe doivent contenir 6 caractères ou plus."
            }
        ));
    });
});
