# Cruddy Forms

Cruddy Forms is a TypeScript library for generating HTML forms with built-in validation using TypeBox. It provides a simple and type-safe way to create forms, validate user input, and handle form submissions.

## Features

- Generate HTML forms from TypeBox schemas
- Built-in validation using TypeBox
- Customizable form elements and attributes
- Support for various input types (text, password, checkbox, textarea)
- Easy integration with existing TypeScript projects

## Installation

Install Cruddy Forms using npm:

```bash
npm install cruddy-forms
```

Or using yarn:

```bash
yarn add cruddy-forms
```

Or using pnpm:

```bash
pnpm add cruddy-forms
```

## Adding CruddyForms to Your Site

1. **Add CruddyForms to your project**<br>
   Install the CruddyForms package into your project, using pnpm, yarn, or npm.

2. **Define the schema for your form using TypeBox**<br>
   In your typescript server code, use the TypeBox module to set the constraints you want to enforce for each field in your form, such as minLength or maxLength. Use regular expressions for more complex constraints.

3. **Use CruddyForms to create the HTML for your form**<br>
   In your typescript server code, use the CruddyForms module to convert your TypeBox schema into an HTML form with built-in client-side validation. Serve the form to clients, along with the <a href="https://normform.btxx.org">Normform CSS</a> file.

4. **Use CruddyForms for server-side validation**<br>
   In your typescript server code, use the CruddyForms module to validate form submissions, in case a user bypasses client-side validation.

5. **Add custom server-side validation (Optional)**<br>
   If you need additional server-side validation, e.g. making sure a username is unique, create a REST endpoint and tell CruddyForms about it. CruddyForms will add the endpoint data to the HTML form it generates, for use by cruddy-client.js. Serve cruddy-client.js along with the generated form, so that it will call your endpoint and display relevant error messages.

## Basic Usage

Here's a simple example of how to use Cruddy Forms:

```typescript
import { Type } from "@sinclair/typebox";
import { Form, FormInputText } from "cruddy-forms";

// Define your form schema
const schema = Type.Object({
  username: Type.String({
    element: "input",
    inputType: "text",
    minLength: 3,
    maxLength: 20,
  } as FormInputText),
  password: Type.String({
    element: "input",
    inputType: "password",
    minLength: 8,
  } as FormInputText),
});

// Create a form instance
const form = new Form(schema);

// Generate HTML
const html = form.getHTML();

// Validate form data
const formData = new FormData(/* ... */);
const validationResult = form.validate(formData);

if (validationResult.valid) {
  console.log("Form is valid:", validationResult.data);
} else {
  console.log("Validation errors:", validationResult.errors);
}
```

## API Documentation

### `Form<T extends TObject>`

The main class for creating and managing forms.

#### Constructor

```typescript
constructor(schema: T, buttonLabel?: string, options?: CruddyFormOptions)
```

- `schema`: A TypeBox schema defining the form structure
- `buttonLabel`: (Optional) Label for the submit button
- `options`: (Optional) Configuration options for the form

#### Methods

- `getHTML(values?: Partial<Static<T>>, lang?: string): string`
  Generate HTML for the form
- `getHTMLComponent(values?: Partial<Static<T>>, lang?: string): string`
  Generate HTML for the form wrapped in a custom element
- `validate(formData: FormData, errorHeading?: string): ValidationResult`
  Validate form data
- `validateObject(obj: object, errorHeading?: string): ValidationResult`
  Validate an object against the form schema

### `HTMLBuilder<T extends TObject>`

A utility class for building HTML elements based on a TypeBox schema.

### `Validator<T extends TObject>`

A utility class for validating form data against a TypeBox schema.

## Contributing

Contributions to Cruddy Forms are welcome! Please follow these steps to contribute:

1. Fork the repository
2. Create a new branch for your feature or bug fix
3. Make your changes and commit them with a clear commit message
4. Push your changes to your fork
5. Create a pull request to the main repository

Please ensure your code follows the existing style and includes appropriate tests.

## License

Cruddy Forms is released under the MIT License. See the [LICENSE](LICENSE.md) file for details.
