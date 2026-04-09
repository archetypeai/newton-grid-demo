import { json } from '@sveltejs/kit';
import { fetchDemand, fetchSupply, computeStats } from '$lib/server/caiso.js';

export async function GET() {
	try {
		const [demand, supply] = await Promise.all([fetchDemand(), fetchSupply()]);
		const stats = computeStats(demand, supply);
		return json({ demand, supply, stats });
	} catch (err) {
		return json({ error: err.message }, { status: 500 });
	}
}
