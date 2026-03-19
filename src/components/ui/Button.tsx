import React from "react";
import { cn } from "../../lib/utils";
import { motion, type HTMLMotionProps } from "framer-motion";

interface ButtonProps extends HTMLMotionProps<"button"> {
    variant?: "primary" | "secondary" | "danger" | "outline";
    isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    className,
    variant = "primary",
    isLoading,
    children,
    disabled,
    ...props
}) => {
    const baseStyles = "px-8 py-4 font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-sm md:text-base mc-btn font-pixel";

    const variants = {
        primary: "bg-[var(--mc-primary)] text-black hover:bg-[var(--mc-primary-dark)]", // Diamond Blue
        secondary: "bg-[var(--mc-card)] text-white hover:bg-[#4b4b4b]", // Stone Grey
        danger: "bg-[var(--mc-danger)] text-white hover:bg-[var(--mc-danger-dark)]", // Redstone Red
        outline: "bg-transparent text-white border-2 border-white/20 hover:bg-white/10"
    };

    return (
        <motion.button
            whileTap={{ scale: 0.98 }}
            className={cn(baseStyles, variants[variant], className)}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <span className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full" />
            ) : children}
        </motion.button>
    );
};
