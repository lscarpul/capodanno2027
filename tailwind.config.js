export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: { extend: {
    colors: {
      ink: { 950: "#0B0F19", 900: "#121828", 800: "#1a2238" },
      gold: { 100: "#f6e9c9", 200: "#efd59e", 300: "#E2B866", 400: "#d4a24c", 500: "#b98a33", 600: "#8f6620" },
      hot: "#FF4D8D",
      violet: "#8B6CFF",
    },
    fontFamily: {
      sans: ['"Inter"', "system-ui", "sans-serif"],
      display: ['"Unbounded"', '"Inter"', "system-ui", "sans-serif"],
      mono: ['"JetBrains Mono"', "ui-monospace", "Menlo", "monospace"],
    },
  } },
};
