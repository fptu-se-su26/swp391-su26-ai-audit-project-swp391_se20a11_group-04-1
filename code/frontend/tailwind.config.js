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
        // ── DevTrack AI — Premium Deep Teal Palette ──
        "primary":                  "var(--project-theme, #1E707D)",
        "primary-hover":            "var(--project-theme-hover, #278A99)",
        "primary-dark":             "var(--project-theme-dark, #165964)",
        "primary-light":            "var(--project-theme-light, #D7EEF1)",
        "accent-glow":              "var(--project-theme-hover, #4EC6D8)",

        // Semantic
        "success":                  "#22C55E",
        "success-bg":               "#F0FDF4",
        "success-border":           "#BBF7D0",
        "warning":                  "#F59E0B",
        "warning-bg":               "#FFFBEB",
        "warning-border":           "#FDE68A",
        "danger":                   "#EF4444",
        "danger-bg":                "#FEF2F2",
        "danger-border":            "#FECACA",
        "info":                     "#3B82F6",
        "info-bg":                  "#EFF6FF",
        "info-border":              "#BFDBFE",

        // Surface & Background
        "background":               "#F1F5F9",
        "surface":                  "#F1F5F9",
        "surface-bright":           "#F1F5F9",
        "surface-container-lowest": "#FFFFFF",
        "surface-container":        "#EBF5F7",
        "surface-container-low":    "#F0F9FA",
        "surface-container-high":   "#EBF5F7",
        "surface-container-highest":"#D9E7E4",
        "surface-elevated":         "#EBF5F7",

        // Border
        "outline-variant":          "#D9E7E4",
        "outline":                  "#D9E7E4",
        "border-light":             "#EBF5F7",

        // Text
        "on-surface":               "#1F2937",
        "on-surface-variant":       "#6B7280",
        "on-primary":               "#FFFFFF",
        "on-background":            "#1F2937",
        "secondary":                "#6B7280",
        "text-mid":                 "#374151",
        "text-muted":               "#9CA3AF",

        // Status / error passthrough
        "error":                    "#EF4444",
        "error-container":          "#FEF2F2",
        "on-error":                 "#FFFFFF",
        "on-error-container":       "#EF4444",

        // Legacy compat aliases
        "primary-container":        "var(--project-theme, #1E707D)",
        "on-primary-container":     "#FFFFFF",
        "primary-fixed":            "var(--project-theme-light, #D7EEF1)",
        "primary-fixed-dim":        "#BFDEEA",
        "on-primary-fixed":         "var(--project-theme, #1E707D)",
        "on-primary-fixed-variant": "var(--project-theme-dark, #165964)",
        "secondary-container":      "var(--project-theme-light, #D7EEF1)",
        "on-secondary-container":   "var(--project-theme, #1E707D)",
        "tertiary":                 "var(--project-theme-hover, #278A99)",
        "tertiary-fixed":           "var(--project-theme-light, #D7EEF1)",
        "on-tertiary":              "#FFFFFF",
        "on-tertiary-fixed":        "var(--project-theme, #1E707D)",
        "surface-dim":              "#D9E7E4",
        "surface-variant":          "#EBF5F7",
        "surface-tint":             "var(--project-theme, #1E707D)",
        "on-secondary":             "#FFFFFF",
        "inverse-surface":          "#1F2937",
        "inverse-on-surface":       "#F8FAFC",
        "inverse-primary":          "var(--project-theme-hover, #4EC6D8)",
      },
      borderRadius: {
        "DEFAULT": "12px",
        "sm":  "8px",
        "md":  "12px",
        "lg":  "16px",
        "xl":  "20px",
        "2xl": "24px",
        "full": "9999px",
        "badge": "6px",
        "pill": "14px",
        "logo": "14px",
        "bezel-outer": "2rem",
        "bezel-inner": "calc(2rem - 0.375rem)"
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
        "body-lg": ["Outfit", "sans-serif"],
        "label-md": ["JetBrains Mono", "monospace"],
        "headline-md": ["Outfit", "sans-serif"],
        "body-md": ["Outfit", "sans-serif"],
        "headline-lg-mobile": ["Outfit", "sans-serif"],
        "display-lg": ["Outfit", "sans-serif"],
        "headline-sm": ["Outfit", "sans-serif"]
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
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        slideDown: {
          '0%': { opacity: '0', maxHeight: '0' },
          '100%': { opacity: '1', maxHeight: '600px' },
        },
        btnIdle: {
          '0%, 100%': { boxShadow: '0 8px 20px rgba(30,112,125,0.25), 0 16px 40px rgba(30,112,125,0.15), inset 0 1px 0 rgba(255,255,255,0.35)' },
          '50%': { boxShadow: '0 8px 20px rgba(30,112,125,0.25), 0 16px 40px rgba(30,112,125,0.15), inset 0 1px 0 rgba(255,255,255,0.35), 0 0 12px rgba(78,198,216,0.15)' },
        },
      },
      animation: {
        shimmer: 'shimmer 3s infinite linear',
        fadeIn: 'fadeIn 0.2s ease-out',
        slideUp: 'slideUp 0.3s ease-out',
        slideDown: 'slideDown 0.3s ease-out',
        btnIdle: 'btnIdle 4.5s ease-in-out infinite',
      },
      transitionTimingFunction: {
        "spring": "cubic-bezier(0.34, 1.56, 0.64, 1)",
        "ios": "cubic-bezier(0.32,0.72,0,1)"
      }
    },
  },
  plugins: [],
}
