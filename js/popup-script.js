let defaultConfig = {
  name: "TrafiPopup",
  triggered_by: "",
  title: "CONGRATULATIONS!",
  subtitle: "You have unlocked a special offer!",
  label: "Hurry! This FREE gift item is going FAST.",
  image:
    "https://cdn.shopify.com/s/files/1/0509/6331/6893/files/Free-Gift-Image.png?v=1628190919",
  buttons: {
    accept: {
      text: "Add to Cart",
      class: "",
      onClick: () => {},
      trigger: "",
    },
    decline: {
      text: "No Thanks",
      class: "",
      onClick: () => {},
      trigger: "",
    },
  },
};

const TrafiPopup = (overrideConfig = defaultConfig) => {
  const config = { ...(defaultConfig ?? {}), ...overrideConfig };
  const forEachElement = (trigger, callback) => {
    const array = document.querySelectorAll(trigger);

    if (array?.length) {
      Array.prototype.forEach.call(array, (element) => {
        callback(element);
      });
    }
  };

  const open = () => {
    const popup = document.createElement("div");
    popup.id = config.name;
    popup.innerHTML = `
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
                            padding: 20px;
                            background: #fff;
                            border-radius: 5px;
                            width: 100%;
                            max-width: 350px;
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
                            .pp_buttons {
                              display: flex;
                              flex-direction: column;
                              gap: 16px;
                            }
                            .pp_buttons button {
                              height: 50px;
                              padding: 0px 10px;
                              justify-content: center;
                              align-items: center;
                              gap: 15px;
                              flex-shrink: 0;
                              border-radius: 10px;
                              background: #FFC700;
                              border-width: 0px;
                              color: #202020;
                              text-align: center;
                              font-family: Montserrat;
                              font-size: 16px;
                              font-style: normal;
                              font-weight: 700;
                              line-height: 22px;
                            }
                            .pp_buttons button:hover {
                              background: #FFD800;
                            }
                            .pp_title {
                              font-size: 16px;
                              line-height: 24px;
                              text-transform: uppercase;
                              font-weight: bold;
                              color: rgb(69, 122, 65);
                            }
                            .pp_subtitle {
                              color: rgb(41, 41, 41);
                              font-size: 16px;
                              line-height: 24px;
                              font-weight: 400;
                              text-align: center;
                              margin-bottom: 10px;
                            }
                            .pp_label {
                              font-size: 14px;
                              line-height: 22px;
                              font-weight: 500;
                              color: rgb(69, 122, 65);
                            }
                            .pp_image {
                              width: 100%;
                              height: auto;
                              margin-bottom: 10px;
                            }
                            </style>
                            <div class="loading-overlay">
                              <div class="popup">
                                <div class="content">
                                    <h2 class="pp_title">${config.title}</h2>
                                    <h3 class="pp_subtitle">${config.subtitle}</h2>
                                    <h6 class="pp_label">${config.label}</h6>
                                    <img class="pp_image" src="${config.image}" alt="Popup Image" />
                                    <div class="pp_buttons">
                                      <button class="pp_accept ${config.buttons.accept.class}">${config.buttons.accept.text}</button>
                                      <button class="pp_decline ${config.buttons.decline.class}">${config.buttons.decline.text}</button>
                                    </div>
                                </div>
                              </div>
                            </div>`;

    document.body.appendChild(popup);

    window.addEventListener(
      "pageshow",
      function () {
        popup.remove();
      },
      false
    );

    return popup;
  };

  forEachElement(config.triggered_by, (element) => {
    element.addEventListener("click", (event) => {
      event.preventDefault();

      const popup = open();

      if (config.buttons.accept.onClick) {
        popup.querySelector(".pp_accept").addEventListener("click", () => {
          config.buttons.accept.onClick();
        });
      }

      if (config.buttons.decline.onClick) {
        popup.querySelector(".pp_decline").addEventListener("click", () => {
          config.buttons.decline.onClick();
        });
      }

      return popup;
    });
  });

  return {
    close: () => {
      document.getElementById(config.name)?.remove();
    },
  };
};
