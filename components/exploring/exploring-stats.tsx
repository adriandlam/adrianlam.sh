import type { ExploringStats } from "@/lib/exploring";

interface ExploringStatsProps {
	stats: ExploringStats;
}

function formatElevation(meters: number): string {
	if (meters >= 1000) {
		return `${(meters / 1000).toFixed(1)}k`;
	}
	return String(meters);
}

export function ExploringStatsOverlay({ stats }: ExploringStatsProps) {
	return (
		<div className="absolute top-6 right-6 z-10 flex gap-5 max-md:top-4 max-md:right-4 max-md:gap-3">
			<div className="text-right">
				<div className="text-lg tracking-tight font-mono">
					{stats.totalDistance}
				</div>
				<div className="text-xs text-muted-foreground">km hiked</div>
			</div>
			<div className="text-right">
				<div className="text-lg tracking-tight font-mono">
					{formatElevation(stats.totalElevation)}
				</div>
				<div className="text-xs text-muted-foreground">m elev</div>
			</div>
			<div className="text-right">
				<div className="text-lg tracking-tight font-mono">
					{stats.hikeCount}
				</div>
				<div className="text-xs text-muted-foreground">hikes</div>
			</div>
		</div>
	);
}
