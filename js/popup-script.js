let defaultConfig = {
  name: "TrafiPopup",
  triggered_by: ".openPopup",
  title: "CONGRATULATIONS!",
  subtitle: "You have unlocked a <b>special offer!</b>",
  label: "Hurry! This FREE gift item is going FAST.",
  image:
    "https://cdn.shopify.com/s/files/1/0912/0596/files/konjac_1_607a6a43-e9d7-4087-aded-14fe74842e33.jpg?v=1692224035",
  price: "FREE",
  compare_at_price: "$9.95",
  buttons: {
    accept: {
      text: "Yes, I want this!",
      class: "",
      onClick: () => {},
      trigger: "",
    },
    decline: {
      text: "No thanks",
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
                              cursor: pointer;
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

                            .pp_decline {
                              background: white;
                              border: 1px solid #FFC700;
                            }

                            .pp_buttons button:hover {
                              background: #FFD800;
                            }

                            .pp_title {
                              font-size: 16px;
                              line-height: 24px;
                              text-transform: uppercase;
                              font-weight: bold;
                              color: #457a41;
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
                              color: #457a41;
                            }

                            .pp_image {
                              margin-bottom: 10px;
                              border: 2px solid rgb(69, 122, 65);
                              border-radius: 20px;
                              width: 80%;
                              height: auto;
                            }

                            .css-141nkgt {
                              position: relative;
                              bottom: 250px;
                              margin-bottom: -40px;
                              left: 40%;
                            }

                            .css-nnhxy {
                              background-color: rgb(186, 83, 80);
                              width: 70px;
                              height: 70px;
                              border-radius: 50%;
                              display: flex;
                              flex-direction: column;
                              -webkit-box-align: center;
                              align-items: center;
                              -webkit-box-pack: center;
                              justify-content: center;
                            }
                            .css-vgmnak {
                              font-size: 14px;
                              line-height: 18px;
                              color: white;
                              text-decoration: line-through;
                              margin-right: 5px;
                            }
                            .css-101f6se {
                              font-size: 14px;
                              line-height: 18px;
                              color: white;
                              margin-right: 5px;
                              font-weight: bold;
                            }
                            </style>
                            <div class="loading-overlay">
                              <div class="popup">
                                <div class="content">
                                    <h2 class="pp_title">${config.title}</h2>
                                    <h3 class="pp_subtitle">${config.subtitle}</h2>
                                    <h6 class="pp_label">${config.label}</h6>
                                    <img class="pp_image" src="${config.image}" alt="Popup Image" />
                                    <div class="css-141nkgt"><div class="css-nnhxy"><div class="css-vgmnak">${config.compare_at_price}</div><div class="css-101f6se">${config.price}</div></div></div>
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
