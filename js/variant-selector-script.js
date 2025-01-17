const VariantSelector = (
  config = {
    base: {
      currency: "USD",
      domain: "shapermint.com",
      vendor: "shopify",
      store: "shapermint",
      environment: "production",
    },
    product: {
      slug: "",
      vendorId: "",
      quantity: 1,
      color: undefined,
      size: undefined,
      attributes_definition: [],
      attributes: {},
    },
    triggers: {
      buyNow: "",
    },
  }
) => {
  const ATTRIBUTES = {
    Color: "Color",
    Size: "Size",
  };

  let state = {
    product: undefined,
  };

  const Utils = {
    forEachElement: (selector, callback) => {
      const array = document.querySelectorAll(selector);

      if (array?.length) {
        Array.prototype.forEach.call(array, (element) => {
          callback(element);
        });
      }
    },
    setLoading: () => {
      const loading = document.createElement("div");
      loading.innerHTML = `
        <style>
          .new__loader,
          .new__loader:before,
          .new__loader:after {
            border-radius: 50%;
            width: 2.5em;
            height: 2.5em;
            -webkit-animation-fill-mode: both;
            animation-fill-mode: both;
            -webkit-animation: load7 1.8s infinite ease-in-out;
            animation: load7 1.8s infinite ease-in-out;
          }
          .new__loader {
            color: #000000;
            font-size: 10px;
            margin: 10px auto 50px;
            position: relative;
            text-indent: -9999em;
            -webkit-transform: translateZ(0);
            -ms-transform: translateZ(0);
            transform: translateZ(0);
            -webkit-animation-delay: -0.16s;
            animation-delay: -0.16s;
          }
          .new__loader:before,
          .new__loader:after {
            content: '';
            position: absolute;
            top: 0;
          }
          .new__loader:before {
            left: -3.5em;
            -webkit-animation-delay: -0.32s;
            animation-delay: -0.32s;
          }
          .new__loader:after {
            left: 3.5em;
          }
          @-webkit-keyframes load7 {
            0%,
            80%,
            100% {
              box-shadow: 0 2.5em 0 -1.3em;
            }
            40% {
              box-shadow: 0 2.5em 0 0;
            }
          }
          @keyframes load7 {
            0%,
            80%,
            100% {
              box-shadow: 0 2.5em 0 -1.3em;
            }
            40% {
              box-shadow: 0 2.5em 0 0;
            }
          }

          .loading-overlay {
            position: fixed;
            top: 0;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(0, 0, 0, 0.7);
            transition: opacity 500ms;
            opacity: 1;
            z-index: 111;
            width: 100%;
          }
          .popup {
            margin: 20% auto;
            padding: 40px;
            background: #fff;
            border-radius: 5px;
            width: 30%;
            min-width: 300px;
            position: relative;
            transition: all 5s ease-in-out;
            text-align: center;
          }

          .popup h2 {
            margin-top: 0;
            color: #333;
            font-family: Tahoma, Arial, sans-serif;
          }

          .popup .content {
            max-height: 30%;
            overflow: auto;
          }
        </style>

        <div class="loading-overlay">
          <div class="popup">
            <div class="new__loader"></div>
            <div class="content">
                Checking availability...		
            </div>
          </div>
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
                price: variant.price,
                salePrice: variant.price,
                compare_at_price: variant.compare_at_price,
                unit_price: variant.price,
                category: product.category?.name ?? "Product",
                variant: product.vendor_product.variations_id[variant.id] ?? "",
                sku: variant.sku,
                image: variant.images[0]?.src ?? "",
                quantity,
              },
            ],
          },
        },
      });
    },
    fetchProducts: async () => {
      const vendorId =
        typeof config.product.vendorId === "function"
          ? config.product.vendorId()
          : config.product.vendorId;

      if (vendorId) {
        const product = await TrafiProducts.byVendor.getProduct(vendorId);

        state.product = product;

        console.log("VariantSelector: Successfully fetched Product");

        return;
      }

      if (!config.product.slug) {
        throw new Error("VariantSelector: No slug or vendorId");
      }

      const product = await TrafiProducts.bySlug.getProduct(
        config.product.slug
      );

      state.product = product;

      console.log("VariantSelector: Successfully fetched Product");
    },
    setupTriggers: (onAction) => {
      if (!config.triggers?.buyNow) {
        throw new Error("VariantSelector: No triggers");
      }

      Utils.forEachElement(config.triggers.buyNow, (element) => {
        element.removeEventListener("click", () => {});

        element.addEventListener("click", (event) => {
          event.preventDefault();
          onAction();
        });
      });

      console.log("VariantSelector: Successfully setup triggers");
    },
  };

  const checkout = async () => {
    if (!state.product) throw new Error("VariantSelector: No Product");

    const quantity =
      typeof config.product.quantity === "function"
        ? config.product.quantity()
        : config.product.quantity;

    if (!quantity) throw new Error("VariantSelector: No quantity");

    const { attributes_definition, attributes } = config.product;

    if (attributes_definition.length && Object.keys(attributes).length) {
      attributesToValue = attributes_definition.reduce(
        (result, attributeName) => {
          const variant = attributes[attributeName];
          const value = typeof variant === "function" ? variant() : variant;

          if (!value) {
            throw new Error(`VariantSelector: No ${attributeName}`);
          }

          result[attributeName] = value;
          return result;
        },
        {}
      );
    } else {
      const color =
        typeof config.product.color === "function"
          ? config.product.color()
          : config.product.color;

      if (!color) throw new Error("VariantSelector: No color");

      const size =
        typeof config.product.size === "function"
          ? config.product.size()
          : config.product.size;

      if (!size) throw new Error("VariantSelector: No size");

      attributesToValue[ATTRIBUTES.Color] = color;
      attributesToValue[ATTRIBUTES.Size] = size;
    }

    Utils.setLoading();

    const variantFound =
      state.product.variations_definition.product_variations.find((variant) => {
        const isTheRightVariant = variant.variation_attributes.every(
          (attribute) => {
            const value = attributesToValue[attribute.name];

            if (value) return attribute.value === value;

            return false;
          }
        );
        return isTheRightVariant;
      });

    if (!variantFound) {
      console.warn("VariantSelector: No variant found");
    }

    const variant =
      variantFound ?? state.product.variations_definition.product_variations[0];

    console.log(variant);

    const productSelected = {
      product: state.product,
      variant,
      quantity,
    };

    Utils.trackAddToCart(productSelected);

    await TrafiCheckout.checkout.buyNow(productSelected);
  };

  const init = async () => {
    if (!config.base) {
      throw new Error("VariantSelector: base config is required");
    }

    if (!TrafiCheckout || !TrafiProducts)
      throw new Error(
        "VariantSelector: TrafiCheckout & and TrafiProducts dependencies are required"
      );

    TrafiCheckout.init(config.base);
    TrafiProducts.init(config.base);

    await Utils.fetchProducts();

    Utils.setupTriggers(checkout);

    console.log("VariantSelector: Successfully set config");
  };

  init();

  return {
    checkout,
  };
};
