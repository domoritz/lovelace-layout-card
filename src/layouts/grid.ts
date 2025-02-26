import { css, html } from "lit-element";
import {
  CardConfig,
  CardConfigGroup,
  LovelaceCard,
  GridViewConfig,
} from "../types";
import { BaseLayout } from "./base-layout";

class GridLayout extends BaseLayout {
  _mediaQueries: Array<MediaQueryList | null> = [];
  _layoutMQs: Array<MediaQueryList | null> = [];
  _config: GridViewConfig;

  async setConfig(config: GridViewConfig) {
    await super.setConfig(config);

    for (const card of this._config.cards) {
      if (
        typeof card.view_layout?.show !== "string" &&
        card.view_layout?.show?.mediaquery
      ) {
        const mq = window.matchMedia(`${card.view_layout.show.mediaquery}`);
        this._mediaQueries.push(mq);
        mq.addEventListener("change", () => this._placeCards());
      } else {
        this._mediaQueries.push(null);
      }
    }

    if (this._config.layout?.mediaquery) {
      for (const [query, layout] of Object.entries(
        this._config.layout?.mediaquery
      )) {
        const mq = window.matchMedia(query);
        this._layoutMQs.push(mq);
        mq.addEventListener("change", () => this._setGridStyles());
      }
    }
    this._setGridStyles();
  }

  async updated(changedProperties) {
    await super.updated(changedProperties);
    if (changedProperties.has("cards") || changedProperties.has("_editMode")) {
      this._placeCards();
    }
  }

  async firstUpdated() {
    this._setGridStyles();
  }

  _setGridStyles() {
    const root = this.shadowRoot.querySelector("#root") as HTMLElement;
    if (!root) return;
    const addStyles = (layout) => {
      for (const [key, value] of Object.entries(layout)) {
        if (key.startsWith("grid"))
          root.style.setProperty(key, (value as any) as string);
      }
    };

    root.style.cssText = "";

    if (this._config.layout) addStyles(this._config.layout);

    for (const q of this._layoutMQs) {
      if (q.matches) {
        addStyles(this._config.layout.mediaquery[q.media]);
        break;
      }
    }
  }

  _shouldShow(card: LovelaceCard, config: CardConfig, index: number) {
    if (!super._shouldShow(card, config, index)) return false;

    const mq = this._mediaQueries[index];
    if (!mq) return true;
    if (mq.matches) return true;
    return false;
  }

  _placeCards() {
    const root = this.shadowRoot.querySelector("#root");
    while (root.firstChild) root.removeChild(root.firstChild);
    let cards: CardConfigGroup[] = this.cards.map((card, index) => {
      const config = this._config.cards[index];
      return {
        card,
        config,
        index,
        show: this._shouldShow(card, config, index),
      };
    });

    for (const card of cards.filter((c) => this.lovelace?.editMode || c.show)) {
      const el = this.getCardElement(card);
      for (const [key, value] of Object.entries(
        card.config?.view_layout ?? {}
      )) {
        if (key.startsWith("grid")) el.style.setProperty(key, value as string);
      }
      root.appendChild(el);
    }
  }

  render() {
    return html` <div id="root"></div>
      ${this._render_fab()}`;
  }
  static get styles() {
    return [
      this._fab_styles,
      css`
        :host {
          padding-top: 4px;
          height: 100%;
          box-sizing: border-box;
        }
        #root {
          display: grid;
          margin-left: 4px;
          margin-right: 4px;
          justify-content: stretch;
        }
        #root > * {
          margin: var(--masonry-view-card-margin, 4px 4px 8px);
        }
      `,
    ];
  }
}

customElements.define("grid-layout", GridLayout);
