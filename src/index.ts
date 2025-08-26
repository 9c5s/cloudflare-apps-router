/**
 * このWorkerに期待される環境変数のインターフェース。
 * wrangler.jsoncでバインディングを追加した後、`npm run cf-typegen`を実行すると
 * グローバルな`Env`型が自動的に更新される。
 */

// パスとそれに対応するCloudflare Pagesのホスト名をマッピングする
// 新しいアプリケーションを追加する場合はこのオブジェクトに追記する
const origins: Record<string, string> = {
	"timetable-maker": "timetable-maker.pages.dev",
	// app2: "app2.pages.dev",
	// app3: "app3.pages.dev",
};

export default {
	/**
	 * Workerのメインとなるfetchハンドラ
	 * @param request - 受信リクエスト
	 * @param _env - 環境変数(未使用)
	 * @param _ctx - 実行コンテキスト(未使用)
	 * @returns 送信されるレスポンス
	 */
	async fetch(
		request: Request,
		_env: Env,
		_ctx: ExecutionContext,
	): Promise<Response> {
		const url = new URL(request.url);

		// URLパスの最初のセグメント(例:"timetable-maker")を取得する
		// パスが"/timetable-maker/foo"の場合"timetable-maker"が得られる
		const firstPathSegment = url.pathname.split("/")[1];

		// マッピングされた転送先のホストが存在するか確認する
		const targetHost = origins[firstPathSegment];

		// 一致するアプリケーションがない場合404エラーを返す
		// デフォルトのページに転送することも可能
		if (!targetHost) {
			return new Response("Application not found.", {
				status: 404,
				headers: { "Content-Type": "text/plain" },
			});
		}

		// 転送先の新しいURLを構築する
		// 元のパスから最初のセグメント(例:"/timetable-maker")を削除する
		const newPath = url.pathname.replace(`/${firstPathSegment}`, "") || "/";
		const newUrl = new URL(newPath + url.search, `https://${targetHost}`);

		// 元のリクエストを複製して転送用のリクエストを作成する
		const newRequest = new Request(newUrl, {
			method: request.method,
			headers: request.headers,
			body: request.body,
			redirect: "manual",
		});

		// 転送先へリクエストを送信する
		return fetch(newRequest);
	},
} satisfies ExportedHandler<Env>;
