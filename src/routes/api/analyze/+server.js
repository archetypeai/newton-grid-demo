import { json } from '@sveltejs/kit';
import { queryNewton } from '$lib/server/newton.js';
import { fetchDemand, fetchSupply, formatGridDataForNewton } from '$lib/server/caiso.js';

export async function POST({ request }) {
	try {
		const { query } = await request.json();
		if (!query) {
			return json({ error: 'Missing query' }, { status: 400 });
		}

		const [demand, supply] = await Promise.all([fetchDemand(), fetchSupply()]);
		const context = formatGridDataForNewton(demand, supply);

		const fullQuery = `${context}\n\n---\n\nUser question: ${query}`;
		const analysis = await queryNewton(fullQuery);

		return json({ analysis, timestamp: Date.now() });
	} catch (err) {
		return json({ error: err.message }, { status: 500 });
	}
}
