/**
 * SidebarRail — narrow icon-only rail.
 * Uses IconBtn + Ico primitives. Width: 44px.
 */
import { IconBtn } from "@/app/components/primitives/IconBtn";
import { Ico } from "@/app/components/primitives/icons";
import type { IcoKey } from "@/app/components/primitives/icons";

export interface RailItem {
  key: string;
  icon: IcoKey;
  label: string;
  active?: boolean;
  danger?: boolean;
}

export interface SidebarRailProps {
  items?: RailItem[];
  bottom?: RailItem[];
  onSelect?: (key: string) => void;
}

const DEFAULT_ITEMS: RailItem[] = [
  { key: "hub", icon: "hub", label: "Hub" },
  { key: "containers", icon: "container", label: "Workspaces" },
  { key: "files", icon: "files", label: "Files" },
  { key: "branch", icon: "branch", label: "Branch" },
  { key: "search", icon: "search", label: "Search" },
];

const DEFAULT_BOTTOM: RailItem[] = [{ key: "settings", icon: "settings", label: "Settings" }];

export function SidebarRail({
  items = DEFAULT_ITEMS,
  bottom = DEFAULT_BOTTOM,
  onSelect,
}: SidebarRailProps) {
  return (
    <div
      style={{
        width: "2.75rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: "0.5rem",
        paddingBottom: "0.5rem",
        gap: "0.125rem",
      }}
    >
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.125rem" }}>
        {items.map((item) => (
          <IconBtn
            key={item.key}
            title={item.label}
            active={item.active}
            danger={item.danger}
            onClick={() => onSelect?.(item.key)}
          >
            {Ico[item.icon]}
          </IconBtn>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.125rem" }}>
        {bottom.map((item) => (
          <IconBtn
            key={item.key}
            title={item.label}
            active={item.active}
            danger={item.danger}
            onClick={() => onSelect?.(item.key)}
          >
            {Ico[item.icon]}
          </IconBtn>
        ))}
      </div>
    </div>
  );
}
