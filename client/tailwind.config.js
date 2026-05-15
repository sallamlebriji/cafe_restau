export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      colors: {
        ink: "#0B0B0F",
        anthracite: "#171717",
        cream: "#F8F5EF",
        beige: "#E9DDC7",
        copper: "#b87333",
        gold: "#C8A96A",
        graphite: "#262626",
        elegant: "#6B7280",
        success: "#16A34A",
        danger: "#DC2626",
        warning: "#F97316"
      },
      boxShadow: {
        soft: "0 18px 45px rgba(17, 17, 17, 0.10)",
        premium: "0 24px 80px rgba(11, 11, 15, 0.16)"
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.35rem"
      },
      screens: {
        xs: "400px"
      }
    }
  },
  plugins: []
};
