<script>
	import { cn } from '$lib/utils.js';
	import BackgroundCard from '$lib/components/ui/patterns/background-card/index.js';
	import { Button } from '$lib/components/ui/primitives/button/index.js';
	import { ScrollArea } from '$lib/components/ui/primitives/scroll-area/index.js';
	import MessageSquareIcon from '@lucide/svelte/icons/message-square';
	import SendIcon from '@lucide/svelte/icons/send';
	import SpinnerIcon from '@lucide/svelte/icons/loader';
	import SunIcon from '@lucide/svelte/icons/sun';
	import BatteryIcon from '@lucide/svelte/icons/battery-charging';
	import BarChartIcon from '@lucide/svelte/icons/bar-chart-3';
	import { marked } from 'marked';

	marked.setOptions({ breaks: true, gfm: true });

	const QUICK_PROMPTS = [
		{
			label: 'Duck Curve',
			icon: SunIcon,
			query: 'Explain the current duck curve pattern. How does solar generation ramp up and down today, and what does the evening ramp look like? What are the implications for grid operators?'
		},
		{
			label: 'Batteries',
			icon: BatteryIcon,
			query: 'Analyze battery storage dispatch today. When are batteries charging vs discharging? How do they relate to solar generation and evening peak demand?'
		},
		{
			label: 'Summary',
			icon: BarChartIcon,
			query: 'Give a concise summary of today\'s California grid conditions. Cover current demand, generation mix, renewable performance, and any notable patterns or concerns.'
		}
	];

	let {
		messages = $bindable([]),
		loading = false,
		onsend,
		class: className,
		...restProps
	} = $props();

	let inputValue = $state('');
	let textareaRef = $state(null);

	function autoResize() {
		if (!textareaRef) return;
		textareaRef.style.height = 'auto';
		textareaRef.style.height = Math.min(textareaRef.scrollHeight, 120) + 'px';
	}

	function handleSubmit(e) {
		e.preventDefault();
		const text = inputValue.trim();
		if (!text || loading) return;
		inputValue = '';
		if (textareaRef) textareaRef.style.height = 'auto';
		onsend?.(text);
	}

	function handleKeydown(e) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSubmit(e);
		}
	}
</script>

<BackgroundCard
	title="Chat"
	icon={MessageSquareIcon}
	class={cn('flex max-h-full flex-col gap-3 overflow-hidden', className)}
	{...restProps}
>
	<ScrollArea class="min-h-0 flex-1">
		<div class="flex flex-col gap-3 pr-3">
			{#if messages.length === 0}
				<div class="flex flex-col items-center gap-3 py-6">
					<p class="text-muted-foreground text-center text-sm">
						Ask Newton about the California grid
					</p>
					<div class="flex flex-wrap justify-center gap-1.5">
						{#each QUICK_PROMPTS as prompt}
							<Button
								variant="outline"
								size="sm"
								disabled={loading}
								onclick={() => onsend?.(prompt.query)}
							>
								<prompt.icon class="size-3" aria-hidden="true" />
								{prompt.label}
							</Button>
						{/each}
					</div>
				</div>
			{:else}
				{#each messages as msg (msg.id)}
					<div
						class={cn(
							'rounded-md px-3 py-2 text-sm',
							msg.role === 'user'
								? 'bg-secondary text-secondary-foreground ml-8'
								: 'bg-atai-neutral/10 text-foreground mr-8 border border-atai-neutral/20'
						)}
					>
						{#if msg.role === 'assistant'}
							<div class="prose-sm prose-invert leading-relaxed [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-0.5 [&_strong]:text-foreground">
								{@html marked(msg.text)}
							</div>
						{:else}
							<p class="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
						{/if}
						<span class="text-[10px] opacity-50">
							{new Date(msg.timestamp).toLocaleTimeString('en-US', {
								hour12: false,
								hour: '2-digit',
								minute: '2-digit'
							})}
						</span>
					</div>
				{/each}
				{#if loading}
					<div class="bg-muted mr-8 flex items-center gap-2 rounded-md px-3 py-2">
						<SpinnerIcon class="text-muted-foreground size-4 animate-spin" />
						<span class="text-muted-foreground text-sm">Analyzing...</span>
					</div>
				{/if}
			{/if}
		</div>
	</ScrollArea>

	<form class="flex items-end gap-2" onsubmit={handleSubmit}>
		<textarea
			bind:this={textareaRef}
			bind:value={inputValue}
			oninput={autoResize}
			onkeydown={handleKeydown}
			placeholder="Ask about the grid..."
			rows="1"
			class={cn(
				'border-input bg-transparent ring-ring/50 placeholder:text-muted-foreground flex-1 resize-none rounded-xs border px-3 py-2 text-sm outline-none transition-colors',
				'focus-visible:border-ring focus-visible:ring-[3px]'
			)}
		></textarea>
		<Button
			type="submit"
			size="icon"
			disabled={loading || !inputValue.trim()}
			aria-label="Send message"
		>
			<SendIcon class="size-4" />
		</Button>
	</form>
</BackgroundCard>
