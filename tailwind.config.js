/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/renderer/index.html",
        "./src/renderer/src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'tv-bg': "#0E1116",
                'tv-panel': "#151A21",
                'tv-elevated': "#1B222C",
                'tv-border': "rgba(0,209,255,0.15)",
                'tv-accent': "#00D1FF",
                'tv-accentSoft': "rgba(0,209,255,0.08)",
                'tv-success': "#22C55E",
                'tv-danger': "#EF4444",
                'tv-warning': "#F59E0B",
                'tv-textPrimary': "#E6EDF3",
                'tv-textMuted': "#8B98A5",
            },
            spacing: {
                1: "4px",
                2: "8px",
                3: "12px",
                4: "16px",
                5: "20px",
                6: "24px",
                8: "32px",
                10: "40px",
                12: "48px",
                16: "64px",
                20: "80px",
                24: "96px",
            },
            borderRadius: {
                sm: "8px",
                md: "10px",
                lg: "14px",
                xl: "18px",
                full: "999px",
            },
            borderWidth: {
                DEFAULT: "1px",
                2: "2px",
                3: "3px",
            },
            fontFamily: {
                display: ["Rajdhani", "sans-serif"],
                body: ["Inter", "sans-serif"],
                timer: ["Orbitron", "sans-serif"],
            },
            fontSize: {
                xs: "12px",
                sm: "14px",
                base: "16px",
                lg: "20px",
                xl: "24px",
                "2xl": "32px",
                "3xl": "40px",
                "4xl": "56px",
                "5xl": "72px",
            },
            boxShadow: {
                panel: "0 4px 18px rgba(0,0,0,0.35)",
                glow: "0 0 0 1px rgba(0,209,255,0.4)",
            },
            animation: {
                fadeIn: "fadeIn .4s ease-out",
                rise: "rise .35s ease-out",
                pulseAccent: "pulseAccent 2s infinite",
                timerTick: "timerTick 1s linear infinite",
            },
            keyframes: {
                fadeIn: {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
                rise: {
                    "0%": { transform: "translateY(12px)", opacity: "0" },
                    "100%": { transform: "translateY(0)", opacity: "1" },
                },
                pulseAccent: {
                    "0%,100%": { boxShadow: "0 0 0 0 rgba(0,209,255,0.4)" },
                    "50%": { boxShadow: "0 0 0 6px rgba(0,209,255,0)" },
                },
                timerTick: {
                    "0%": { transform: "scale(1)" },
                    "50%": { transform: "scale(1.04)" },
                    "100%": { transform: "scale(1)" },
                }
            },
            willChange: {
                transform: "transform",
            }
        },
    },
    plugins: [],
}
