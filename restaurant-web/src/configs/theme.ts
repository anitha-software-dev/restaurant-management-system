export const theme = {
    colors: {
        primary: "#ea580c", // Vibrant Orange
        secondary: "#0c6a69", // Teal from original
        background: "#f3f4f6", // Light Gray
        white: "#ffffff",
        text: {
            primary: "#1f2937",
            secondary: "#4b5563",
            light: "#9ca3af"
        },
        success: "#10b981",
        danger: "#ef4444",
        warning: "#f59e0b",
        glass: "rgba(255, 255, 255, 0.8)"
    },
    shadows: {
        sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        glass: "0 8px 32px 0 rgba(31, 38, 135, 0.15)"
    },
    borderRadius: {
        md: "0.375rem",
        lg: "0.5rem",
        xl: "1rem",
        full: "9999px"
    },
    spacing: {
        xs: "0.25rem",
        sm: "0.5rem",
        md: "1rem",
        lg: "1.5rem",
        xl: "2rem"
    },
    typography: {
        fontFamily: "'Poppins', sans-serif",
        heading: {
            fontWeight: 700,
            fontSize: "1.25rem"
        },
        body: {
            fontSize: "0.875rem"
        },
        caption: {
            fontSize: "0.75rem"
        }
    },
    glassmorphism: {
        background: "rgba(255, 255, 255, 0.65)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(255, 255, 255, 0.18)",
        boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.15)"
    }
};
