const TrafiProducts = {
  config: {
    /**
     * One of 'shopify' or 'big_commerce'
     * @type String
     */
    vendor: "shopify",
    /**
     * One of 'the-spa-dr' or 'thespadr-dev'
     * @type String
     */
    store: "the-spa-dr",
    /**
     * One of 'production' or 'stage'
     * @type String
     */
    environment: "production",
    /**
     * Products public endpoint
     * @type String
     */
    api_by_trafi: "https://api.{environment}.trafilea.io/products",
    /**
     * Products by Vendor public endpoint
     * @type String
     */
    api_by_vendor:
      "https://api.{environment}.trafilea.io/vendors/{vendor}/stores/{store}/products/{product_id}",
  },
  _: {
    buildByVendorUrl: (productId) =>
      TrafiProducts.config.api_by_vendor
        .replace("{environment}", TrafiProducts.config.environment)
        .replace("{vendor}", TrafiProducts.config.vendor)
        .replace("{store}", TrafiProducts.config.store)
        .replace("{product_id}", productId),
    buildTrafiUrl: (productId) =>
      TrafiProducts.config.api_by_trafi
        .replace("{environment}", TrafiProducts.config.environment)
        .concat(`/${productId}`),
    baseQuery: async (product_id, byVendor) => {
      if (!product_id) throw new Error("Product ID is required");

      const url = byVendor
        ? TrafiProducts._.buildByVendorUrl(product_id)
        : TrafiProducts._.buildTrafiUrl(product_id);

      const controller = new AbortController();

      setTimeout(() => controller.abort("Timeout"), 5500);

      try {
        const response = await fetch(url, {
          signal: controller.signal,
          method: "GET",
          headers: {
            "content-type": "application/json",
          },
        });

        return response.json();
      } catch (error) {
        if (controller.signal.aborted) {
          console.warn("Retrying get product after 5500ms timeout");

          const retryController = new AbortController();

          setTimeout(() => retryController.abort("Retry Timeout"), 6000);

          const response = await fetch(url, {
            signal: controller.signal,
            method: "GET",
            headers: {
              "content-type": "application/json",
            },
          });

          return response.json();
        }

        console.error("TrafiProducts: baseQuery Error", JSON.stringify(error));
      }
    },
    slugQuery: async (slug) => {
      try {
        if (!slug) throw new Error("Slug is required");

        const url = TrafiProducts.config.api_by_trafi
          .replace("{environment}", TrafiProducts.config.environment)
          .concat(`?slug=${slug}&store=${TrafiProducts.config.store}`);

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "content-type": "application/json",
          },
        });

        const responseJson = await response.json();

        if (responseJson.status_code === 404)
          throw new Error(responseJson.message);

        return responseJson;
      } catch (error) {
        console.error("TrafiProducts: slugQuery ERROR:", JSON.stringify(error));
      }
    },
    multipleQuery: (product_ids, byVendor) => {
      if (!product_ids?.length) throw new Error("Product IDs are required");

      return Promise.all(
        product_ids.map(async (product_id) =>
          TrafiProducts._.baseQuery(product_id, byVendor)
        )
      );
    },
  },
  init: (configOverride) => {
    TrafiProducts.config = { ...TrafiProducts.config, ...configOverride };
    console.log("Products Init with [STORE]:" + TrafiProducts.config.store);
  },
  getProduct: (productId) => TrafiProducts._.baseQuery(productId, false),
  getProducts: (productIds) => TrafiProducts._.multipleQuery(productIds, false),
  bySlug: {
    getProduct: (slug) => TrafiProducts._.slugQuery(slug),
    getProducts: (slugs) => {
      if (!slugs?.length) throw new Error("Slugs are required");

      return Promise.all(
        slugs.map(async (slug) => TrafiProducts._.slugQuery(slug))
      );
    },
  },
  byVendor: {
    getProduct: (productId) => TrafiProducts._.baseQuery(productId, true),
    getProducts: (productIds) =>
      TrafiProducts._.multipleQuery(productIds, true),
  },
};
