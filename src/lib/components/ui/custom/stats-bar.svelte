<script>
	import { cn } from '$lib/utils.js';
	import Badge from '$lib/components/ui/primitives/badge/index.js';

	let { stats = null, class: className, ...restProps } = $props();
</script>

{#if stats}
	<div class={cn('flex items-center gap-4 font-mono text-xs', className)} {...restProps}>
		<span class="text-muted-foreground">
			Demand: <span class="text-foreground">{(stats.currentDemand / 1000).toFixed(1)}k</span> MW
		</span>
		<span class="text-muted-foreground">
			Peak: <span class="text-foreground">{(stats.peakDemand / 1000).toFixed(1)}k</span> MW
		</span>
		<span class="text-muted-foreground">
			Solar: <Badge variant="outline" class="bg-[#facc15]/20 font-mono text-[10px]">
				{(stats.solar / 1000).toFixed(1)}k MW
			</Badge>
		</span>
		<span class="text-muted-foreground">
			Wind: <Badge variant="outline" class="bg-[#60a5fa]/20 font-mono text-[10px]">
				{(stats.wind / 1000).toFixed(1)}k MW
			</Badge>
		</span>
		<span class="text-muted-foreground">
			Renewables: <span class="text-atai-good">{stats.renewablePct}%</span>
		</span>
		<span class="text-muted-foreground">{stats.time} PT</span>
	</div>
{/if}
