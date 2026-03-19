import React from "react";

interface MinecraftToggleProps {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    isLoading?: boolean;
    onLabel?: string;
    offLabel?: string;
}

export const MinecraftToggle: React.FC<MinecraftToggleProps> = ({
    label,
    checked,
    onChange,
    isLoading = false,
    onLabel = "ON",
    offLabel = "OFF",
}) => {
    return (
        <div
            className={`
                bg-[#c6c6c6] border-4 border-black p-3 flex flex-col items-center gap-3 relative
                opacity-${isLoading ? '50' : '100'}
                pointer-events-${isLoading ? 'none' : 'auto'}
            `}
            style={{
                boxShadow: "inset -4px -4px 0px 0px rgba(0,0,0,0.2), inset 4px 4px 0px 0px rgba(255,255,255,0.5)"
            }}
        >
            <span className="font-bold text-black font-pixel text-lg">{label}</span>

            <button
                onClick={() => onChange(!checked)}
                className={`
                    w-24 h-12 relative cursor-pointer border-4 border-black transition-colors duration-200
                    ${checked ? 'bg-[var(--mc-success)]' : 'bg-[var(--mc-danger)]'}
                `}
                style={{
                    boxShadow: "inset -4px -4px 0px 0px rgba(0,0,0,0.4), inset 4px 4px 0px 0px rgba(255,255,255,0.4)"
                }}
            >
                {/* Lever Base */}
                <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 h-2 bg-black/40 rounded-full" />

                {/* Lever Handle */}
                <div
                    className={`
                        absolute top-1/2 -translate-y-1/2 w-8 h-8 bg-[#8b8b8b] border-2 border-black
                        transition-all duration-200 ease-out
                        ${checked ? 'right-1' : 'left-1'}
                    `}
                    style={{
                        boxShadow: "inset 2px 2px 0px 0px rgba(255,255,255,0.5), inset -2px -2px 0px 0px rgba(0,0,0,0.5), 2px 2px 4px rgba(0,0,0,0.4)"
                    }}
                />

                <span className={`
                    absolute top-1/2 -translate-y-1/2 font-bold font-pixel text-shadow-sm text-white
                    ${checked ? 'left-2' : 'right-2'}
                `}>
                    {checked ? onLabel : offLabel}
                </span>
            </button>
        </div>
    );
};
