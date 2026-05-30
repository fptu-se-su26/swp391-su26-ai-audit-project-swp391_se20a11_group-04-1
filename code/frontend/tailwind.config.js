/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "tertiary-fixed-dim": "#ffb596",
        "primary-container": "#0f52ba",
        "on-tertiary-container": "#ffc0a7",
        "primary-fixed": "#d9e2ff",
        "background": "#f7f9fb",
        "surface-variant": "#e0e3e5",
        "on-secondary-fixed": "#0b1c30",
        "on-surface-variant": "#434653",
        "on-primary-fixed": "#001945",
        "on-secondary-fixed-variant": "#38485d",
        "on-tertiary-fixed": "#360f00",
        "on-surface": "#191c1e",
        "surface-container-high": "#e6e8ea",
        "secondary": "#505f76",
        "surface-bright": "#f7f9fb",
        "tertiary-fixed": "#ffdbcd",
        "primary-fixed-dim": "#b0c6ff",
        "surface-container-lowest": "#ffffff",
        "tertiary": "#732900",
        "on-tertiary": "#ffffff",
        "on-secondary-container": "#54647a",
        "surface-tint": "#1d59c1",
        "on-tertiary-fixed-variant": "#7d2d00",
        "outline-variant": "#c3c6d5",
        "on-error": "#ffffff",
        "secondary-fixed": "#d3e4fe",
        "primary": "#003c90",
        "surface-container-low": "#f2f4f6",
        "on-primary-fixed-variant": "#00419c",
        "on-background": "#191c1e",
        "on-primary": "#ffffff",
        "inverse-on-surface": "#eff1f3",
        "on-secondary": "#ffffff",
        "inverse-primary": "#b0c6ff",
        "inverse-surface": "#2d3133",
        "surface-dim": "#d8dadc",
        "on-error-container": "#93000a",
        "secondary-fixed-dim": "#b7c8e1",
        "secondary-container": "#d0e1fb",
        "on-primary-container": "#bcceff",
        "surface-container-highest": "#e0e3e5",
        "surface-container": "#eceef0",
        "error": "#ba1a1a",
        "outline": "#737784",
        "tertiary-container": "#993900",
        "error-container": "#ffdad6",
        "surface": "#f7f9fb"
      },
      borderRadius: {
        "DEFAULT": "0.125rem",
        "lg": "0.25rem",
        "xl": "0.5rem",
        "full": "0.75rem"
      },
      spacing: {
        "gutter": "24px",
        "stack_md": "16px",
        "margin_desktop": "32px",
        "margin_mobile": "16px",
        "stack_lg": "24px",
        "sidebar_width": "280px",
        "stack_sm": "8px",
        "topbar_height": "64px"
      },
      fontFamily: {
        "body-lg": ["Inter", "sans-serif"],
        "label-md": ["JetBrains Mono", "monospace"],
        "headline-md": ["Inter", "sans-serif"],
        "body-md": ["Inter", "sans-serif"],
        "headline-lg-mobile": ["Inter", "sans-serif"],
        "display-lg": ["Inter", "sans-serif"],
        "headline-sm": ["Inter", "sans-serif"]
      },
      fontSize: {
        "body-lg": ["16px", { "lineHeight": "24px", "fontWeight": "400" }],
        "label-md": ["12px", { "lineHeight": "16px", "letterSpacing": "0.05em", "fontWeight": "500" }],
        "headline-md": ["24px", { "lineHeight": "32px", "fontWeight": "600" }],
        "body-md": ["14px", { "lineHeight": "20px", "fontWeight": "400" }],
        "headline-lg-mobile": ["28px", { "lineHeight": "36px", "fontWeight": "700" }],
        "display-lg": ["36px", { "lineHeight": "44px", "letterSpacing": "-0.02em", "fontWeight": "700" }],
        "headline-sm": ["20px", { "lineHeight": "28px", "fontWeight": "600" }]
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(400%)' },
        }
      },
      animation: {
        shimmer: 'shimmer 3s infinite linear',
      }
    },
  },
  plugins: [],
}
