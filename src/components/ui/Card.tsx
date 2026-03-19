import React from "react";
import { cn } from "../../lib/utils";
import { motion, type HTMLMotionProps } from "framer-motion";

export const Card: React.FC<HTMLMotionProps<"div">> = ({ className, children, ...props }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.1 }}
            className={cn(
                "bg-[var(--mc-card)] text-white mc-border p-6",
                className
            )}
            {...props}
        >
            {children}
        </motion.div>
    );
};
