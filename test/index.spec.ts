import {
	createExecutionContext,
	env,
	waitOnExecutionContext,
} from "cloudflare:test";
import { describe, expect, it, vi } from "vitest";
import worker from "../src/index";

// `fetch`グローバル関数をモック化する
// これによりテストが実際のネットワークリクエストを送信するのを防ぐ
vi.stubGlobal("fetch", vi.fn());

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

describe("Router Worker", () => {
	it("timetable-makerへのリクエストを正しくルーティングすること", async () => {
		const request = new IncomingRequest(
			"http://example.com/timetable-maker/some/path",
		);
		const ctx = createExecutionContext();
		// `env`オブジェクトは`cloudflare:test`から提供され、`worker-configuration.d.ts`で定義されたグローバルな`Env`型を持つ
		await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		// fetchが正しい転送先URLで呼び出されたか検証する
		expect(fetch).toHaveBeenCalledWith(
			expect.objectContaining({
				url: "https://timetable-maker.pages.dev/some/path",
			}),
		);
	});

	it("未知のルートに対して404を返すこと", async () => {
		const request = new IncomingRequest("http://example.com/unknown-app");
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(404);
		expect(await response.text()).toBe("Application not found.");
	});

	it("ルートパスへのアクセスに対して404を返すこと", async () => {
		const request = new IncomingRequest("http://example.com/");
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(404);
	});
});
