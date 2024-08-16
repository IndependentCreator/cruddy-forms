module.exports = {
    extends: [ "plugin:perfectionist/recommended-alphabetical" ],
    rules: {
        "@typescript-eslint/indent": [
            2,
            4,
            {
                CallExpression: { arguments: "first" },
                FunctionDeclaration: { parameters: "first" },
            },
        ],
        "@typescript-eslint/lines-between-class-members": "off",
        "@typescript-eslint/no-unused-vars": [ "error", { args: "none" } ],
        "@typescript-eslint/quotes": [ 2, "double", "avoid-escape" ],
        "array-bracket-spacing": [ 2, "always" ],
        "computed-property-spacing": [ 2, "always" ],
        curly: [ "error", "all" ],
        "import/no-unresolved": "off",
        "import/prefer-default-export": "off",
        indent: [
            2,
            4,
            {
                CallExpression: { arguments: "first" },
                FunctionDeclaration: { parameters: "first" },
            },
        ],
        "lines-between-class-members": "off",
        "no-console": "off",
        "no-multiple-empty-lines": [ 2, { max: 1, maxBOF: 0, maxEOF: 0 } ],
        "no-unused-vars": [ "error", { args: "none" } ],
        "no-use-before-define": [ 2, { functions: false } ],
        "object-curly-spacing": [ 2, "always" ],
        quotes: [ 2, "double", "avoid-escape" ],
        "semi": "error",
        "space-in-parens": [ 2, "always" ],
        "template-curly-spacing": [ 2, "always" ],
    },
};
