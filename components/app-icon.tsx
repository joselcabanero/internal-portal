import {
  ChartLine,
  Compass,
  GraduationCap,
  LayoutDashboard,
  Telescope,
  type LucideIcon,
} from "lucide-react";
import type { AppIconName } from "@/lib/apps";

const ICONS: Record<AppIconName, LucideIcon> = {
  "layout-dashboard": LayoutDashboard,
  telescope: Telescope,
  compass: Compass,
  "graduation-cap": GraduationCap,
  "chart-line": ChartLine,
};

export function AppIcon({
  name,
  className,
}: {
  name: AppIconName;
  className?: string;
}) {
  const Icon = ICONS[name];
  return <Icon className={className} aria-hidden />;
}
