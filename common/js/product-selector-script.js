const ProductSelector = {
  config: {
    triggered_by: "",
    image_selector: "",
    default_selected: 0,
    products: {
      slugs: [],
      extra_products: [],
      extras: [],
      triggers: [],
      elementsToMark: [],
      //TODO Remove this TBYB hardcoded price
      try_before_you_buy_price: 49,
    },
  },
  state: {
    products: [],
    product_selected: undefined,
    extra_products: {},
  },
  _: {
    forEachElement: (className, callback) => {
      const array = document.getElementsByClassName(className);

      if (array?.length) {
        Array.prototype.forEach.call(array, (element) => {
          callback(element);
        });
      }
    },
    setLoading: () => {
      const loading = document.createElement("div");
      loading.id = "teLoadingSpinner";
      loading.innerHTML = `
                    <style>
                      .te-css-1b8tvgl {
                        position: fixed;
                        top: 0px;
                        left: 0px;
                        z-index: 999999999;
                        height: 100vh;
                        width: 100vw;
                        background-color: rgba(0, 0, 0, 0.2);
                        display: flex;
                        -webkit-box-align: center;
                        align-items: center;
                        -webkit-box-pack: center;
                        justify-content: center;
                      }
                      .te-css-1xvl8o4 {
                        border-right: 2px solid transparent;
                        border-bottom: 2px solid transparent;
                        border-left: 2px solid transparent;
                        border-image: initial;
                        border-top: 2px solid black;
                        border-radius: 50%;
                        animation: 1s linear 0s infinite normal none running spin;
                      }
                    </style>
                    <div opacity="0.2" class="te-css-1b8tvgl">
                      <div class="te-css-1xvl8o4" style="width: 60px; height: 60px"></div>
                    </div>
      `;

      document.body.appendChild(loading);

      window.addEventListener(
        "pageshow",
        function () {
          document.body.removeChild(loading);
        },
        false
      );
    },
    stopLoading: () => {
      const loading = document.getElementById("teLoadingSpinner");
      if (loading) {
        loading.remove();
      }
    },
    trackAddToCart: ({ product, variant, quantity }) => {
      window.dataLayer = window.dataLayer || [];

      window.dataLayer.push({
        event: "enhanceEcom addToCart",
        ecommerce: {
          currencyCode: "USD",
          add: {
            products: [
              {
                brand: product.vendor,
                name: product.title,
                id: product.vendor_product.product_id,
                uuid: product.id,
                variant_uuid: variant.id,
                price: product.try_before_you_buy
                  ? ProductSelector.config.products.try_before_you_buy_price
                  : variant.price,
                salePrice: variant.price,
                compare_at_price: variant.compare_at_price,
                unit_price: variant.price,
                category: product.category?.name ?? "Product",
                variant: product.vendor_product.variations_id[variant.id] ?? "",
                sku: variant.sku,
                image: variant.images[0]?.src ?? "",
                try_before_you_buy: product.try_before_you_buy,
                quantity,
              },
            ],
          },
        },
      });
    },
    trackProductView: ({ product, variant, quantity }) => {
      window.dataLayer = window.dataLayer || [];

      window.dataLayer.push({
        event: "enhanceEcom productView",
        ecommerce: {
          url: window.location.href,
          detail: {
            products: [
              {
                brand: product.vendor,
                name: product.title,
                id: product.vendor_product.product_id,
                uuid: product.id,
                variant_uuid: variant.id,
                price: product.try_before_you_buy
                  ? ProductSelector.config.products.try_before_you_buy_price
                  : variant.price,
                salePrice: variant.price,
                compare_at_price: variant.compare_at_price,
                unit_price: variant.price,
                category: product.category?.name ?? "Product",
                variant: product.vendor_product.variations_id[variant.id] ?? "",
                sku: variant.sku,
                image: variant.images[0]?.src ?? "",
                quantity,
                try_before_you_buy: product.try_before_you_buy,
              },
            ],
          },
        },
      });
    },
    fetchProducts: async () => {
      const products = await TrafiProducts.bySlug.getProducts([
        ...new Set(ProductSelector.config.products.slugs),
      ]);

      ProductSelector.state.products = products.reduce((acc, product) => {
        acc[product.slug] = product;
        return acc;
      }, {});

      const extraProductsSlugs = [
        ...new Set(
          ProductSelector.config.products.extra_products?.flatMap(
            (product) => product
          )
        ),
      ];
      if (extraProductsSlugs.length > 0) {
        const extraProducts = await TrafiProducts.bySlug.getProducts(
          extraProductsSlugs
        );
        const extraProductsMap = extraProducts.reduce((acc, product) => {
          acc[product.slug] = product;
          return acc;
        }, {});

        ProductSelector.state.extra_products = extraProductsMap;
      }

      console.log("ProductSelector: Successfully fetched Products");
    },
    onSelect: (trigger) => {
      const index = ProductSelector.config.products.triggers.indexOf(trigger);
      const slug = ProductSelector.config.products.slugs[index];
      const product = ProductSelector.state.products[slug];

      if (!product) {
        throw new Error(
          "ProductSelector: error selecting product, it doenst exist on product list"
        );
      }

      ProductSelector.state.product_selected = {
        product,
        //TODO: make this configurable
        variant: product.variations_definition.product_variations[0],
        quantity: 1,
        extra_products: ProductSelector.config.products.extra_products[index],
        ...ProductSelector.config.products.extras[index],
      };

      ProductSelector._.trackProductView(
        ProductSelector.state.product_selected
      );

      if (ProductSelector.config.image_selector) {
        const newImage =
          ProductSelector.state.product_selected.product.images[0].src;

        ProductSelector._.forEachElement(
          ProductSelector.config.image_selector,
          (imageElement) => {
            imageElement.src = newImage;
            imageElement.srcset = newImage;
          }
        );
      }

      const elementClassToMark =
        ProductSelector.config.products.elementsToMark[index];

      ProductSelector.config.products.elementsToMark?.forEach((element) => {
        ProductSelector._.forEachElement(element, (element) =>
          element.classList.remove("selected")
        );
      });

      ProductSelector._.forEachElement(elementClassToMark, (element) =>
        element.classList.add("selected")
      );

      console.log(
        "ProductSelector: Successfully selected product:",
        ProductSelector.state.product_selected
      );
    },
    getQuantity: () => {},
    checkout: async () => {
      try {
        if (!ProductSelector.state.product_selected) {
          throw new Error("No product selected");
        }

        ProductSelector._.setLoading();

        const quantity =
          typeof ProductSelector.state.product_selected.quantity === "function"
            ? ProductSelector.state.product_selected.quantity()
            : ProductSelector.state.product_selected.quantity;

        const productSelected = {
          ...ProductSelector.state.product_selected,
          quantity,
        };

        ProductSelector._.trackAddToCart(productSelected);

        if (productSelected.extra_products) {
          const extraProducts = productSelected.extra_products
            .map((slug) => {
              if (ProductSelector.state.extra_products[slug]) {
                return {
                  product: ProductSelector.state.extra_products[slug],
                  variant:
                    ProductSelector.state.extra_products[slug]
                      .variations_definition.product_variations[0],
                  quantity: 1,
                };
              }
              return undefined;
            })
            .filter((product) => Boolean(product));

          const items = [productSelected, ...extraProducts];

          await TrafiCheckout.checkout.buyNow(items);
          return;
        }

        await TrafiCheckout.checkout.buyNow(productSelected);
      } catch (error) {
        ProductSelector._.stopLoading();
        console.error("TE-ProductSelector-Checkout [Error]", error);
      }
    },
    setupTriggers: () => {
      ProductSelector.config.products.triggers?.forEach((trigger) => {
        ProductSelector._.forEachElement(trigger, (element) => {
          element.removeEventListener("click", () => {});
        });

        ProductSelector._.forEachElement(trigger, (element) => {
          element.addEventListener("click", (event) => {
            event.preventDefault();
            ProductSelector._.onSelect(trigger);
            if (!ProductSelector.config.triggered_by) {
              ProductSelector._.checkout();
            }
          });
        });
      });

      if (ProductSelector.config.triggered_by) {
        ProductSelector._.forEachElement(
          ProductSelector.config.triggered_by,
          (element) => {
            element.removeEventListener("click", () => {});

            element.addEventListener("click", (event) => {
              event.preventDefault();
              ProductSelector._.checkout();
            });
          }
        );
      }

      console.log("ProductSelector: Successfully setup triggers");
    },
  },
  init: async ({ base, ...configOverride }) => {
    if (!base) throw new Error("ProductSelector: base is required");

    if (!TrafiCheckout || !TrafiProducts)
      throw new Error(
        "ProductSelector: TrafiCheckout & and TrafiProducts dependencies are required"
      );

    TrafiCheckout.init(base);
    TrafiProducts.init(base);

    ProductSelector.config = {
      ...ProductSelector.config,
      ...configOverride,
      products: {
        ...ProductSelector.config.products,
        ...configOverride.products,
      },
    };

    await ProductSelector._.fetchProducts();

    ProductSelector._.setupTriggers();

    if (typeof ProductSelector.config.default_selected === "number") {
      ProductSelector._.onSelect(
        ProductSelector.config.products.triggers[
          ProductSelector.config.default_selected
        ]
      );
    }

    console.log("ProductSelector: Successfully set config");
  },
  checkout: async () => ProductSelector._.checkout(),
};

const CreateNewProductSelector = (config) => {
  const ProductSelectorReplica = { ...ProductSelector };

  ProductSelectorReplica.init(config);

  return ProductSelectorReplica;
};
