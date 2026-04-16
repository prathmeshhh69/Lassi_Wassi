/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.25rem",
        lg: "2rem",
        xl: "2.5rem"
      }
    },
    extend: {
      colors: {
        primary: "#FF6B35",
        dark: "#111827",
        light: "#F9FAFB",
        accent: "#FFE66D"
      },
      fontFamily: {
        sans: ["Inter", "Poppins", "system-ui", "sans-serif"]
      },
      transitionProperty: {
        "colors-transform": "background-color, border-color, color, fill, stroke, transform, box-shadow"
      },
      transitionTimingFunction: {
        "soft-out": "cubic-bezier(0.22, 0.61, 0.36, 1)"
      }
    }
  },
  plugins: []
};

