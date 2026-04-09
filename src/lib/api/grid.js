export async function fetchGridData() {
	const res = await fetch('/api/grid');
	if (!res.ok) throw new Error('Failed to fetch grid data');
	return res.json();
}

export async function analyzeGrid(query) {
	const res = await fetch('/api/analyze', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ query })
	});
	if (!res.ok) {
		const err = await res.json().catch(() => ({}));
		throw new Error(err.error || 'Analysis failed');
	}
	return res.json();
}
