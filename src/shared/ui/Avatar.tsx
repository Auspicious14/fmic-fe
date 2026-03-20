import { avatarPalette } from "@/shared/lib/utils";

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const { bg, color } = avatarPalette(name);
  
  function getInitials(name: string): string {
    if (!name) return "";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  }

  return (
    <div 
      style={{ 
        width: size, 
        height: size, 
        borderRadius: "50%", 
        background: bg, 
        color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Syne', sans-serif",
        fontSize: size * 0.36,
        fontWeight: 700,
        flexShrink: 0,
        border: '0.5px solid rgba(255,255,255,0.05)'
      }}
    >
      {getInitials(name)}
    </div>
  );
}
