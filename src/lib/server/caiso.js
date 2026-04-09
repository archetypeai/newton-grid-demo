const BASE_URL = 'https://www.caiso.com/outlook/history';

function todayStr() {
	// CAISO uses Pacific time
	const now = new Date();
	const pt = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
	const y = pt.getFullYear();
	const m = String(pt.getMonth() + 1).padStart(2, '0');
	const d = String(pt.getDate()).padStart(2, '0');
	return `${y}${m}${d}`;
}

function parseCSV(text) {
	const lines = text.trim().split('\n');
	const headers = lines[0].split(',');
	return lines.slice(1).map((line) => {
		const values = line.split(',');
		const row = {};
		headers.forEach((h, i) => {
			const key = h.trim();
			const val = values[i]?.trim();
			row[key] = key === 'Time' ? val : val === '' ? null : Number(val);
		});
		return row;
	});
}

export async function fetchDemand(date) {
	const dateStr = date || todayStr();
	const res = await fetch(`${BASE_URL}/${dateStr}/demand.csv`);
	if (!res.ok) throw new Error(`CAISO demand fetch failed: ${res.status}`);
	return parseCSV(await res.text());
}

export async function fetchSupply(date) {
	const dateStr = date || todayStr();
	const res = await fetch(`${BASE_URL}/${dateStr}/fuelsource.csv`);
	if (!res.ok) throw new Error(`CAISO supply fetch failed: ${res.status}`);
	return parseCSV(await res.text());
}

export function computeStats(demand, supply) {
	const latestDemand = [...demand].reverse().find((d) => d['Current demand'] != null);
	const latestSupply = [...supply].reverse().find((s) => s['Solar'] != null);

	const currentDemand = latestDemand?.['Current demand'] ?? 0;
	const peakDemand = Math.max(...demand.map((d) => d['Current demand'] ?? 0));
	const solar = latestSupply?.['Solar'] ?? 0;
	const wind = latestSupply?.['Wind'] ?? 0;
	const totalSupply = latestSupply
		? Object.entries(latestSupply)
				.filter(([k]) => k !== 'Time')
				.reduce((s, [, v]) => s + Math.max(0, v ?? 0), 0)
		: 0;
	const renewableTotal = solar + wind + (latestSupply?.['Geothermal'] ?? 0) +
		(latestSupply?.['Biomass'] ?? 0) + (latestSupply?.['Biogas'] ?? 0) +
		(latestSupply?.['Small hydro'] ?? 0) + (latestSupply?.['Large Hydro'] ?? 0);
	const renewablePct = totalSupply > 0 ? ((renewableTotal / totalSupply) * 100).toFixed(1) : '0';

	return {
		currentDemand,
		peakDemand,
		solar,
		wind,
		renewablePct,
		totalSupply,
		time: latestDemand?.Time ?? '--:--'
	};
}

export function formatGridDataForNewton(demand, supply) {
	const stats = computeStats(demand, supply);

	// Recent demand (last 12 entries = 1 hour)
	const recentDemand = demand.slice(-12).map((d) =>
		`${d.Time} | Demand: ${d['Current demand'] ?? '?'}MW | Forecast: ${d['Day ahead forecast'] ?? '?'}MW`
	);

	// Recent supply (last 12 entries)
	const recentSupply = supply.slice(-12).map((s) => {
		const parts = Object.entries(s)
			.filter(([k, v]) => k !== 'Time' && v != null && v !== 0)
			.map(([k, v]) => `${k}: ${v}MW`)
			.join(', ');
		return `${s.Time} | ${parts}`;
	});

	// Peak solar/wind for the day
	const peakSolar = Math.max(...supply.map((s) => s['Solar'] ?? 0));
	const peakWind = Math.max(...supply.map((s) => s['Wind'] ?? 0));

	return (
		`California ISO (CAISO) Grid Data — ${new Date().toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles' })}\n` +
		`Current: Demand ${stats.currentDemand}MW | Solar ${stats.solar}MW | Wind ${stats.wind}MW | Renewables ${stats.renewablePct}%\n` +
		`Peak today: Demand ${stats.peakDemand}MW | Solar ${peakSolar}MW | Wind ${peakWind}MW\n` +
		`Total supply: ${stats.totalSupply}MW | Last update: ${stats.time} PT\n\n` +
		`Recent demand (5-min intervals, last hour):\n${recentDemand.join('\n')}\n\n` +
		`Recent supply mix (5-min intervals, last hour):\n${recentSupply.join('\n')}`
	);
}
