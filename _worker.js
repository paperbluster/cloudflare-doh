/**
 * 单一路由 DoH 转发：将指定路径的请求转发到 Google DoH，供 AdGuard Home 等作为上游使用。
 * 部署后在 AdGuard Home 上游填写：https://你的域名/路由字符串
 */

// 上游 DoH 固定为 Google
const UPSTREAM_DOH_URL = 'https://dns.google/dns-query';

// 未配置时的默认路由路径（不含首斜杠）
const DEFAULT_ROUTE = 'dns-query';

/**
 * 从 env 读取路由字符串并规范化（去首尾空格、去掉首部斜杠）
 * @param {Object} env - Cloudflare Worker 环境
 * @returns {string} 路由路径，如 "dns-query"
 */
function getRoute(env) {
	let route = DEFAULT_ROUTE;
	if (env && env.DOH_ROUTE != null && String(env.DOH_ROUTE).trim() !== '') {
		route = String(env.DOH_ROUTE).trim().replace(/^\/+/, '') || DEFAULT_ROUTE;
	}
	return route;
}

/**
 * 路径是否匹配当前配置的路由（精确匹配 /route 或 /route/）
 * @param {string} path - URL pathname
 * @param {string} route - 路由字符串
 * @returns {boolean}
 */
function pathMatchesRoute(path, route) {
	const prefix = '/' + route;
	return path === prefix || path === prefix + '/';
}

/**
 * 非 DoH 请求统一返回 404，不返回任何可被扫描的特征内容
 */
function notFound() {
	return new Response(null, { status: 404 });
}

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);
		const path = url.pathname;
		const route = getRoute(env);

		if (!pathMatchesRoute(path, route)) {
			return notFound();
		}

		const targetUrl = UPSTREAM_DOH_URL + url.search;
		const forwardHeaders = new Headers(request.headers);
		forwardHeaders.set('Host', 'dns.google');
		const newRequest = new Request(targetUrl, {
			method: request.method,
			headers: forwardHeaders,
			body: request.body,
			redirect: 'follow',
		});
		return fetch(newRequest);
	},
};
