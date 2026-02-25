import { env, createExecutionContext, waitOnExecutionContext, SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import worker from '../_worker.js';

describe('DoH 转发 worker', () => {
	it('根路径返回 404（不暴露特征）', async () => {
		const request = new Request('http://example.com/');
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(404);
	});

	it('未匹配路由的路径返回 404', async () => {
		const request = new Request('http://example.com/other');
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(404);
	});

	it('默认路由 /dns-query 会转发到上游（非 404）', async () => {
		const response = await SELF.fetch('http://example.com/dns-query?dns=AAABAAABAAAAAAAAAAA');
		expect(response.status).not.toBe(404);
	});
});
