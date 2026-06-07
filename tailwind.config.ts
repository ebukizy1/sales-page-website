import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "oklch(1 0 0)",
        foreground: "oklch(0.129 0.042 264.695)",
        card: "oklch(1 0 0)",
        "card-foreground": "oklch(0.129 0.042 264.695)",
        popover: "oklch(1 0 0)",
        "popover-foreground": "oklch(0.129 0.042 264.695)",
        primary: "oklch(0.208 0.042 265.755)",
        "primary-foreground": "oklch(0.984 0.003 247.858)",
        secondary: "oklch(0.968 0.007 247.896)",
        "secondary-foreground": "oklch(0.208 0.042 265.755)",
        muted: "oklch(0.968 0.007 247.896)",
        "muted-foreground": "oklch(0.554 0.046 257.417)",
        accent: "oklch(0.968 0.007 247.896)",
        "accent-foreground": "oklch(0.208 0.042 265.755)",
        destructive: "oklch(0.577 0.245 27.325)",
        "destructive-foreground": "oklch(0.984 0.003 247.858)",
        border: "oklch(0.929 0.013 255.508)",
        input: "oklch(0.929 0.013 255.508)",
        ring: "oklch(0.704 0.04 256.788)",
        chart: {
          "1": "oklch(0.646 0.222 41.116)",
          "2": "oklch(0.6 0.118 184.704)",
          "3": "oklch(0.398 0.07 227.392)",
          "4": "oklch(0.828 0.189 84.429)",
          "5": "oklch(0.769 0.188 70.08)",
        },
        sidebar: {
          DEFAULT: "oklch(0.984 0.003 247.858)",
          foreground: "oklch(0.129 0.042 264.695)",
          primary: "oklch(0.208 0.042 265.755)",
          "primary-foreground": "oklch(0.984 0.003 247.858)",
          accent: "oklch(0.968 0.007 247.896)",
          "accent-foreground": "oklch(0.208 0.042 265.755)",
          border: "oklch(0.929 0.013 255.508)",
          ring: "oklch(0.704 0.04 256.788)",
        },
      },
      borderRadius: {
        sm: "calc(var(--radius) - 4px)",
        md: "calc(var(--radius) - 2px)",
        lg: "var(--radius)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
        "3xl": "calc(var(--radius) + 12px)",
        "4xl": "calc(var(--radius) + 16px)",
      },
    },
  },
  plugins: [],
};
export default config;
