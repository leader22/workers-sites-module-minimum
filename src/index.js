// @ts-check
import { getAssetFromKV } from "@cloudflare/kv-asset-handler";

// @ts-ignore: This is external, generated by worker
import manifestJSON from "__STATIC_CONTENT_MANIFEST";
const assetManifest = JSON.parse(manifestJSON);

export default {
  /**
   * @param {Request} request
   * @param {{ __STATIC_CONTENT: any }} env
   * @param {{ waitUntil: any }} ctx
   */
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api")) {
      return new Response(manifestJSON);
    }

    const options = {
      ASSET_NAMESPACE: env.__STATIC_CONTENT,
      ASSET_MANIFEST: assetManifest,
    };

    try {
      const asset = await getAssetFromKV(
        {
          request,
          // bind is required to ensure calling context!
          waitUntil: ctx.waitUntil.bind(ctx),
        },
        options
      );

      console.log("ASSET", asset);

      return asset;
    } catch (err) {
      console.error("NOT_FOUND", err);
      try {
        const notFoundPage = new Request(`${url.origin}/404.html`, request);
        let notFoundResponse = await getAssetFromKV(
          {
            request: notFoundPage,
            waitUntil: ctx.waitUntil,
          },
          options
        );

        return new Response(notFoundResponse.body, {
          ...notFoundResponse,
          status: 404,
        });
      } catch (err) {
        console.error("UNEXPECTED", err);
        console.error(err.stack);
        return new Response(err.toString(), { status: 500 });
      }
    }
  },
};
