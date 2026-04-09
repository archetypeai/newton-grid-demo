<script>
	import Menubar from '$lib/components/ui/patterns/menubar/index.js';
	import { Button } from '$lib/components/ui/primitives/button/index.js';
	import SupplyChart from '$lib/components/ui/custom/supply-chart.svelte';
	import DemandChart from '$lib/components/ui/custom/demand-chart.svelte';
	import StatsBar from '$lib/components/ui/custom/stats-bar.svelte';
	import ChatPanel from '$lib/components/ui/custom/chat-panel.svelte';
	import MinimizeIcon from '@lucide/svelte/icons/minimize-2';
	import { fetchGridData, analyzeGrid } from '$lib/api/grid.js';

	let demand = $state([]);
	let supply = $state([]);
	let stats = $state(null);
	let chatMessages = $state([]);
	let chatLoading = $state(false);
	let expanded = $state(null);
	let intervalId = $state(null);

	async function loadData() {
		try {
			const data = await fetchGridData();
			demand = data.demand;
			supply = data.supply;
			stats = data.stats;
		} catch (err) {
			console.error('Failed to load grid data:', err);
		}
	}

	async function handleChatSend(text) {
		chatMessages = [
			...chatMessages,
			{ id: crypto.randomUUID(), role: 'user', text, timestamp: Date.now() }
		];
		chatLoading = true;

		try {
			const result = await analyzeGrid(text);
			chatMessages = [
				...chatMessages,
				{
					id: crypto.randomUUID(),
					role: 'assistant',
					text: result.analysis,
					timestamp: result.timestamp
				}
			];
		} catch (err) {
			chatMessages = [
				...chatMessages,
				{
					id: crypto.randomUUID(),
					role: 'assistant',
					text: `Error: ${err.message}`,
					timestamp: Date.now()
				}
			];
		} finally {
			chatLoading = false;
		}
	}

	function toggleExpand(panel) {
		expanded = expanded === panel ? null : panel;
	}

	// Load data on mount and refresh every 5 minutes
	$effect(() => {
		loadData();
		intervalId = setInterval(loadData, 5 * 60 * 1000);
		return () => { if (intervalId) clearInterval(intervalId); };
	});
</script>

{#snippet partnerSnippet()}
	<span class="text-muted-foreground font-mono text-sm tracking-wider uppercase">Grid Monitor</span>
{/snippet}

<div
	class="bg-background text-foreground grid h-screen w-screen grid-rows-[auto_1fr] overflow-hidden"
>
	<Menubar partnerLogo={partnerSnippet}>
		<StatsBar {stats} />
	</Menubar>

	<main class="grid grid-cols-2 grid-rows-2 gap-4 overflow-hidden p-4">
		<SupplyChart
			{supply}
			onexpand={() => toggleExpand('supply')}
			class="max-h-full overflow-hidden"
		/>

		<ChatPanel
			bind:messages={chatMessages}
			loading={chatLoading}
			onsend={handleChatSend}
			class="row-span-2 max-h-full"
		/>

		<DemandChart
			{demand}
			onexpand={() => toggleExpand('demand')}
			class="max-h-full overflow-hidden"
		/>
	</main>
</div>

<!-- Fullscreen overlay -->
{#if expanded}
	<div class="bg-background fixed inset-0 z-50 flex flex-col overflow-hidden">
		<div class="border-border flex items-center justify-between border-b px-4 py-2">
			<span class="text-foreground font-mono text-sm uppercase tracking-wider">
				{expanded === 'supply' ? 'Supply Mix' : 'Demand'}
			</span>
			<Button variant="outline" size="sm" onclick={() => (expanded = null)}>
				<MinimizeIcon class="size-3.5" />
				Close
			</Button>
		</div>
		<div class="min-h-0 flex-1 p-4">
			{#if expanded === 'supply'}
				<SupplyChart {supply} class="h-full" />
			{:else}
				<DemandChart {demand} class="h-full" />
			{/if}
		</div>
	</div>
{/if}
