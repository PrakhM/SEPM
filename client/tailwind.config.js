/**
 * FinTrack design system — Tailwind v4.
 *
 * Loaded from src/index.css via `@config`. This file is the source of truth
 * for the raw palette: every hex value below is literal and final.
 *
 * Semantic tokens (bg, surface, border, text, and the DEFAULT/light/dark/
 * subtle/on-subtle/contrast keys on each accent) are wired to CSS custom
 * properties so light and dark mode can swap values with no duplicated
 * utilities. The raw scales stay static here as literals; src/index.css
 * declares which value each mode selects, and repeats those hexes because
 * Tailwind v4 inlines config colours instead of emitting `--color-*`
 * properties. Keep the two in sync — src/index.css carries a comment marking
 * each one's scale step.
 */

/** Wrap a theme CSS variable so a semantic token follows the active mode. */
const themed = (name) => `var(${name})`;

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  // Honoured by the compat layer; src/index.css also declares the matching
  // `@custom-variant dark` so the variant resolves under Tailwind v4.
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        /**
         * Primary — deep blue-teal. Conveys trust and calm, and deliberately
         * avoids the "finance is green" cliché. #0F766E is exactly teal-700.
         */
        primary: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E', // base — primary actions, links, active states
          800: '#115E59',
          900: '#134E4A',
          DEFAULT: themed('--c-primary'),
          light: themed('--c-primary-light'), // hover
          dark: themed('--c-primary-dark'), // active
          subtle: themed('--c-primary-subtle'), // tinted backgrounds
          // NOTE: quoted kebab-case is REQUIRED here. Tailwind v4's @config
          // compat layer does not kebab-case camelCase colour keys - a key
          // `onSubtle` would only ever match `text-primary-onSubtle`.
          'on-subtle': themed('--c-primary-on-subtle'), // text/icon ON `subtle`
          contrast: themed('--c-primary-contrast'), // text on primary
        },

        /**
         * Neutral — 10 steps, off-white (#F8FAFC) through off-black (#0F172A).
         * No step is pure #FFF or pure #000, so text-on-surface never becomes
         * harsh. Built on a cool slate base to sit beside the teal primary.
         */
        neutral: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },

        /** Semantic greys — resolve to the right neutral step per mode. */
        bg: {
          DEFAULT: themed('--c-bg'),
          subtle: themed('--c-bg-subtle'),
          inverse: themed('--c-bg-inverse'),
        },
        surface: {
          DEFAULT: themed('--c-surface'),
          raised: themed('--c-surface-raised'),
        },
        border: {
          DEFAULT: themed('--c-border'),
          strong: themed('--c-border-strong'),
        },
        text: {
          DEFAULT: themed('--c-text'),
          secondary: themed('--c-text-secondary'),
          tertiary: themed('--c-text-tertiary'),
          inverse: themed('--c-text-inverse'),
        },

        /** Success — income, positive deltas, under budget. */
        success: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          900: '#064E3B',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669', // base
          700: '#047857',
          DEFAULT: themed('--c-success'),
          light: themed('--c-success-light'),
          dark: themed('--c-success-dark'),
          subtle: themed('--c-success-subtle'),
          'on-subtle': themed('--c-success-on-subtle'),
          contrast: themed('--c-success-contrast'),
        },

        /** Danger — expenses, overrun budget, negative balance. */
        danger: {
          50: '#FFF1F2',
          100: '#FFE4E6',
          900: '#881337',
          300: '#FDA4AF',
          400: '#FB7185',
          500: '#F43F5E',
          600: '#E11D48', // base
          700: '#BE123C',
          DEFAULT: themed('--c-danger'),
          light: themed('--c-danger-light'),
          dark: themed('--c-danger-dark'),
          subtle: themed('--c-danger-subtle'),
          'on-subtle': themed('--c-danger-on-subtle'),
          contrast: themed('--c-danger-contrast'),
        },

        /** Warning — budget at 80-100%, approaching a threshold. */
        warning: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          900: '#78350F',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B', // base
          600: '#D97706',
          700: '#B45309',
          DEFAULT: themed('--c-warning'),
          light: themed('--c-warning-light'),
          dark: themed('--c-warning-dark'),
          subtle: themed('--c-warning-subtle'),
          'on-subtle': themed('--c-warning-on-subtle'),
          contrast: themed('--c-warning-contrast'),
        },

        /**
         * Info — AI-generated content. Indigo/violet sits outside the
         * green/amber/red functional set so AI output is recognisable.
         */
        info: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8', // base
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          900: '#312E81',
          DEFAULT: themed('--c-info'),
          light: themed('--c-info-light'),
          dark: themed('--c-info-dark'),
          subtle: themed('--c-info-subtle'),
          'on-subtle': themed('--c-info-on-subtle'),
          contrast: themed('--c-info-contrast'),
        },
      },

      fontFamily: {
        sans: [
          'Inter Variable',
          'Inter',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        // Explicitly requested for money columns; pairs with `tabular-nums`.
        numeric: ['Inter Variable', 'Inter', 'system-ui', 'sans-serif'],
      },

      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      },

      /**
       * One radius per element class, applied uniformly:
       * cards = rounded-card (lg), inputs/buttons = rounded-control (md).
       */
      borderRadius: {
        control: '0.5rem',
        card: '0.75rem',
        pill: '9999px',
      },

      boxShadow: {
        card: '0 1px 2px 0 rgb(15 23 42 / 0.06), 0 1px 3px 0 rgb(15 23 42 / 0.08)',
        'card-raised':
          '0 4px 6px -1px rgb(15 23 42 / 0.08), 0 2px 4px -2px rgb(15 23 42 / 0.06)',
      },
    },
  },
  plugins: [],
};
