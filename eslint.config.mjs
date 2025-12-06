import js from '@eslint/js';
import globals from 'globals';

export default [
  // Base recommended config
  js.configs.recommended,
  
  // Custom configuration
  {
    files: ['**/*.{js,mjs,cjs}'],
    
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      }
    },
    
    rules: {
      // Console & Debugging
      'no-console': 'warn',              // Warning untuk console. log
      'no-debugger': 'error',            // Error untuk debugger
      
      // Variables
      'no-unused-vars': 'error',         // Error jika variable tidak dipakai
      'no-var': 'error',                 // Error jika masih pakai var
      'prefer-const': 'error',           // Error jika bisa pakai const tapi pakai let
      
      // Best Practices
      'eqeqeq': ['error', 'always'],     // Harus pakai === bukan ==
      'no-eval': 'error',                // Jangan pakai eval()
      'no-implied-eval': 'error',        // Jangan pakai setTimeout dengan string
      
      // Code Style
      'quotes': ['error', 'single'],     // Pakai single quotes
      'semi': ['error', 'always'],       // Harus pakai semicolon
      'indent': ['error', 2],            // Indentasi 2 spaces
      
      // Modern JavaScript
      'prefer-arrow-callback': 'warn',   // Prefer arrow functions
      'prefer-template': 'warn',         // Prefer template literals
    }
  }
];