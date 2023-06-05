module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',

    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        tsconfigRootDir: __dirname,

        ecmaFeatures: {
            jsx: true,
            globalReturn: false,
        },

        project: [
            './tsconfig.json'
        ]
    },

    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'next/core-web-vitals'
    ],

    plugins: [
        '@typescript-eslint'
    ],

    env: {
        es6: true,
        node: true,
        browser: true,
        amd: true
    },

    globals: {
        $: true,
        require: true,
        process: true
    },

    ignorePatterns: [
        'node_modules/*',
        '.next/',
        '.eslintrc.js',
        'next.config.js',
        'commitlint.config.js'
    ],

    settings: {
        react: {
            version: 'detect',
        },
    },

    rules: {
        semi: [
            'warn',
            'never'
        ],

        'no-plusplus': 'off',
        'implicit-arrow-linebreak': 'off',
        'operator-linebreak': 'off',

        'arrow-body-style': 'off',
        'no-param-reassign': 'off',
        'consistent-return': 'off',
        'function-paren-newline': 'off',
        'no-mixed-spaces-and-tabs': 'off',

        'eol-last': 'warn',

        'linebreak-style': [
            'error',
            'unix'
        ],

        '@typescript-eslint/consistent-type-definitions': [
            'warn',
            'interface'
        ],

        'react-hooks/exhaustive-deps': 'off',

        '@typescript-eslint/no-unused-vars': 'warn',
        '@typescript-eslint/explicit-function-return-type': 'warn',

        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-this-alias': 'off',
        '@typescript-eslint/unbound-method': 'off',
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/no-explicit-any': 'off',

        '@typescript-eslint/naming-convention': [
            'error',
            {
                selector: 'interface',
                format: [
                    'PascalCase'
                ],
                custom: {
                    regex: 'I[A-Z]',
                    match: true
                }
            }
        ],

        'react/no-unescaped-entities': [
            'error',
            {
                'forbid': [
                    '<',
                    '>',
                    '{',
                    '}'
                ]
            }
        ],

        'prefer-const': 'warn',

        'max-len': [
            'warn',
            {
                code: 125
            }
        ],

        indent: [
            'warn',
            4
        ],

        'dot-notation': 'warn',
        'no-continue': 'warn',
        'no-dupe-else-if': 'error',

        'block-spacing': [
            'error',
            'never'
        ],

        'no-spaced-func': 'error',

        'object-curly-spacing': [
            'error',
            'always'
        ],

        'no-trailing-spaces': [
            'error',
            {
                'ignoreComments': false
            }
        ],

        'quotes': [
            'warn',
            'single'
        ],

        'no-return-await': [
            'error'
        ]
    },

    overrides: [
        {
            files: [
                '*.js',
                '*.ts',
                '*.tsx'
            ],

            rules: {
                'indent': [
                    'warn',
                    4,
                    {
                        'SwitchCase': 1
                    }
                ]
            }
        }
    ]
}
