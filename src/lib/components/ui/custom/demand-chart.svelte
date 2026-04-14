<script>
	import { cn } from '$lib/utils.js';
	import BackgroundCard from '$lib/components/ui/patterns/background-card/index.js';
	import { Button } from '$lib/components/ui/primitives/button/index.js';
	import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
	import Maximize2Icon from '@lucide/svelte/icons/maximize-2';

	const SERIES = [
		{ key: 'Current demand', color: '#22d3ee', label: 'Actual' },
		{ key: 'Day ahead forecast', color: '#a78bfa', label: 'Day-ahead' },
		{ key: 'Hour ahead forecast', color: '#6b7280', label: 'Hour-ahead' }
	];

	let { demand = [], onexpand, class: className, ...restProps } = $props();

	let containerRef = $state(null);
	let W = $state(800);
	let H = $state(300);
	const PAD = { top: 10, right: 10, bottom: 25, left: 50 };

	$effect(() => {
		if (!containerRef) return;
		const ro = new ResizeObserver((entries) => {
			const { width, height } = entries[0].contentRect;
			if (width > 0 && height > 0) { W = width; H = height; }
		});
		ro.observe(containerRef);
		return () => ro.disconnect();
	});

	let plotW = $derived(W - PAD.left - PAD.right);
	let plotH = $derived(H - PAD.top - PAD.bottom);

	let yMin = $derived(Math.min(...demand.flatMap((d) => SERIES.map((s) => d[s.key] ?? Infinity)).filter((v) => v !== Infinity)) * 0.9 || 0);
	let yMax = $derived(Math.max(...demand.flatMap((d) => SERIES.map((s) => d[s.key] ?? 0))) * 1.05 || 1);

	function x(i) { return PAD.left + (i / Math.max(1, demand.length - 1)) * plotW; }
	function yScale(val) { return PAD.top + plotH - ((val - yMin) / (yMax - yMin || 1)) * plotH; }

	let linePaths = $derived(
		SERIES.map((s) => {
			const points = demand
				.map((d, i) => (d[s.key] != null ? `${x(i)},${yScale(d[s.key])}` : null))
				.filter(Boolean);
			return { ...s, d: points.length > 1 ? 'M' + points.join(' L') : '' };
		})
	);

	let yTicks = $derived.by(() => {
		const range = yMax - yMin;
		const step = range > 30000 ? 10000 : range > 15000 ? 5000 : 2000;
		const ticks = [];
		const start = Math.ceil(yMin / step) * step;
		for (let v = start; v <= yMax; v += step) ticks.push(v);
		return ticks;
	});

	let xLabels = $derived.by(() => {
		if (!demand.length) return [];
		const count = 5;
		return Array.from({ length: count }, (_, i) => {
			const idx = Math.round((i / (count - 1)) * (demand.length - 1));
			return { x: x(idx), label: demand[idx]?.Time ?? '' };
		});
	});
</script>

<BackgroundCard
	title="California Demand"
	icon={TrendingUpIcon}
	class={cn('flex max-h-full flex-col gap-3 overflow-hidden', className)}
	{...restProps}
>
	<p class="text-muted-foreground text-[10px]">Source: CAISO Today's Outlook · 5-min intervals · Pacific Time</p>
	<div class="flex items-center gap-1">
		<div class="flex gap-4">
			{#each SERIES as s}
				<div class="flex items-center gap-1">
					<div class="h-0.5 w-3 rounded-full" style:background={s.color}></div>
					<span class="text-muted-foreground text-[10px]">{s.label}</span>
				</div>
			{/each}
		</div>
		{#if onexpand}
			<div class="ml-auto">
				<Button variant="ghost" size="icon-sm" aria-label="Fullscreen" onclick={onexpand}>
					<Maximize2Icon class="size-3.5" />
				</Button>
			</div>
		{/if}
	</div>

	<div bind:this={containerRef} class="min-h-0 w-full flex-1">
		{#if demand.length < 2}
			<p class="text-muted-foreground py-8 text-center text-sm">Loading...</p>
		{:else}
			<svg viewBox="0 0 {W} {H}" width={W} height={H}>
				{#each yTicks as tick}
					<line x1={PAD.left} y1={yScale(tick)} x2={W - PAD.right} y2={yScale(tick)} stroke="var(--color-border)" stroke-width="0.5" />
					<text x={PAD.left - 6} y={yScale(tick) + 3} text-anchor="end" fill="var(--color-muted-foreground)" font-size="9" font-family="var(--font-mono)">
						{(tick / 1000).toFixed(0)}k MW
					</text>
				{/each}

				{#each linePaths as line}
					{#if line.d}
						<path d={line.d} fill="none" stroke={line.color} stroke-width="1.5" opacity="0.8">
							<title>{line.label}</title>
						</path>
					{/if}
				{/each}

				{#each xLabels as lbl}
					<text x={lbl.x} y={H - 5} text-anchor="middle" fill="var(--color-muted-foreground)" font-size="9" font-family="var(--font-mono)">
						{lbl.label}
					</text>
				{/each}
			</svg>
		{/if}
	</div>
</BackgroundCard>
