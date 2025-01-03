import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                indigo: {
                  50: '#74A352',
                  100: '#74A3525',
                  200: '#74A352',
                  300: '#74A352',
                  400: '#74A352',
                  500: '#74A352',
                  600: '#74A352',
                  700: '#567E3A',
                  800: '#567E3A',
                  900: '#567E3A',
                },
            }
        },
        
    },

    plugins: [forms],
};
