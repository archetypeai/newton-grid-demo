<script>
	import { cn } from '$lib/utils.js';
	import BackgroundCard from '$lib/components/ui/patterns/background-card/index.js';
	import { Button } from '$lib/components/ui/primitives/button/index.js';
	import ZapIcon from '@lucide/svelte/icons/zap';
	import Maximize2Icon from '@lucide/svelte/icons/maximize-2';

	let { supply = [], onexpand, class: className, ...restProps } = $props();

	// Major sources to chart (skip zero/negligible)
	const SOURCES = [
		{ key: 'Solar', color: '#facc15' },
		{ key: 'Wind', color: '#60a5fa' },
		{ key: 'Natural Gas', color: '#f97316' },
		{ key: 'Large Hydro', color: '#34d399' },
		{ key: 'Imports', color: '#a78bfa' },
		{ key: 'Nuclear', color: '#f472b6' },
		{ key: 'Batteries', color: '#22d3ee' },
		{ key: 'Geothermal', color: '#ef4444' },
		{ key: 'Small hydro', color: '#6ee7b7' },
		{ key: 'Biomass', color: '#a3a3a3' }
	];

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

	// Compute stacked areas — positive sources stack up, negative stack down from zero
	let stackedData = $derived.by(() => {
		if (!supply.length) return [];
		return supply.map((row, i) => {
			let posY = 0;
			let negY = 0;
			const layers = [];
			for (const src of SOURCES) {
				const val = row[src.key] ?? 0;
				if (val >= 0) {
					layers.push({ key: src.key, color: src.color, y0: posY, y1: posY + val });
					posY += val;
				} else {
					layers.push({ key: src.key, color: src.color, y0: negY + val, y1: negY });
					negY += val;
				}
			}
			return { index: i, time: row.Time, posTotal: posY, negTotal: negY, layers };
		});
	});

	let yMax = $derived(Math.max(1, ...stackedData.map((d) => d.posTotal)) * 1.05);
	let yMin = $derived(Math.min(0, ...stackedData.map((d) => d.negTotal)) * 1.05);

	function x(i) { return PAD.left + (i / Math.max(1, supply.length - 1)) * plotW; }
	function y(val) { return PAD.top + plotH - ((val - yMin) / (yMax - yMin || 1)) * plotH; }

	// Build SVG area paths per source
	let areaPaths = $derived.by(() => {
		if (stackedData.length < 2) return [];
		return SOURCES.map((src, srcIdx) => {
			const top = stackedData.map((d, i) => `${x(i)},${y(d.layers[srcIdx].y1)}`).join(' L');
			const bottom = [...stackedData].reverse().map((d, i) =>
				`${x(stackedData.length - 1 - i)},${y(d.layers[srcIdx].y0)}`
			).join(' L');
			return { key: src.key, color: src.color, d: `M${top} L${bottom} Z` };
		});
	});

	let yTicks = $derived.by(() => {
		const range = yMax - yMin;
		const step = range > 40000 ? 10000 : range > 20000 ? 5000 : 2000;
		const ticks = [];
		const start = Math.floor(yMin / step) * step;
		for (let v = start; v <= yMax; v += step) ticks.push(v);
		return ticks;
	});

	// X axis time labels (5 evenly spaced)
	let xLabels = $derived.by(() => {
		if (!supply.length) return [];
		const count = 5;
		return Array.from({ length: count }, (_, i) => {
			const idx = Math.round((i / (count - 1)) * (supply.length - 1));
			return { x: x(idx), label: supply[idx]?.Time ?? '' };
		});
	});
</script>

<BackgroundCard
	title="California Supply Mix"
	icon={ZapIcon}
	class={cn('flex max-h-full flex-col gap-3 overflow-hidden', className)}
	{...restProps}
>
	<p class="text-muted-foreground text-[10px]">Source: CAISO Today's Outlook · 5-min intervals · Pacific Time</p>
	<div class="flex items-center gap-1">
		<div class="flex flex-wrap gap-x-3 gap-y-1">
			{#each SOURCES.slice(0, 7) as src}
				<div class="flex items-center gap-1">
					<div class="size-2 rounded-full" style:background={src.color}></div>
					<span class="text-muted-foreground text-[10px]">{src.key}</span>
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
		{#if stackedData.length < 2}
			<p class="text-muted-foreground py-8 text-center text-sm">Loading...</p>
		{:else}
			<svg viewBox="0 0 {W} {H}" width={W} height={H}>
				<!-- Y grid + labels -->
				{#each yTicks as tick}
					<line x1={PAD.left} y1={y(tick)} x2={W - PAD.right} y2={y(tick)} stroke="var(--color-border)" stroke-width="0.5" />
					<text x={PAD.left - 6} y={y(tick) + 3} text-anchor="end" fill="var(--color-muted-foreground)" font-size="9" font-family="var(--font-mono)">
						{(tick / 1000).toFixed(0)}k
					</text>
				{/each}

				<!-- Zero line -->
				{#if yMin < 0}
					<line x1={PAD.left} y1={y(0)} x2={W - PAD.right} y2={y(0)} stroke="var(--color-muted-foreground)" stroke-width="1" opacity="0.5" stroke-dasharray="4,3" />
					<text x={PAD.left - 6} y={y(0) + 3} text-anchor="end" fill="var(--color-muted-foreground)" font-size="9" font-family="var(--font-mono)" font-weight="bold">0</text>
				{/if}

				<!-- Stacked areas -->
				{#each areaPaths as area}
					<path d={area.d} fill={area.color} opacity="0.6">
						<title>{area.key}</title>
					</path>
				{/each}

				<!-- X labels -->
				{#each xLabels as lbl}
					<text x={lbl.x} y={H - 5} text-anchor="middle" fill="var(--color-muted-foreground)" font-size="9" font-family="var(--font-mono)">
						{lbl.label}
					</text>
				{/each}
			</svg>
		{/if}
	</div>
</BackgroundCard>
