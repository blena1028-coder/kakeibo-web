import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17201b",
        paper: "#f8f7f2",
        moss: "#496f5d",
        mint: "#dcefe5",
        coral: "#e1785f",
        lemon: "#f1c857",
        sky: "#9ac8d6"
      },
      boxShadow: {
        soft: "0 12px 30px rgba(23, 32, 27, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;
