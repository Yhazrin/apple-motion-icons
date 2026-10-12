/*!
 * motion-icon-element.js — <motion-icon> for pages that would rather write markup.
 * Load after the runtime layers (dist/motion-icons.js already includes it).
 *
 *   <motion-icon name="bell" size="28"></motion-icon>                 tap → bounce
 *   <motion-icon name="heart" pose="on" trigger="tap" action="toggle"></motion-icon>
 *   <motion-icon name="refresh" trigger="hover" action="spin" label="刷新"></motion-icon>
 *
 * Attributes: name, size (px or CSS length), pose, weight, trigger (tap | hover | none),
 * action (verb to play on trigger; "toggle" uses the recipe's toggle pair), label
 * (accessible name; without it the icon is decorative). Light DOM, so page CSS and
 * `color` reach the strokes. The instance is destroyed when the element disconnects.
 */
(function (root) {
  'use strict';
  const M = root.MotionIcon;
  if (!M || !root.customElements || root.customElements.get('motion-icon')) return;

  const length = v => (v && /^\d+(\.\d+)?$/.test(v) ? +v : v || undefined);

  class MotionIconElement extends root.HTMLElement {
    static get observedAttributes() { return ['name', 'size', 'pose', 'weight', 'label']; }

    connectedCallback() {
      if (!this.style.display) this.style.display = 'inline-flex';
      this.mount();
      this.addEventListener('click', this);
      this.addEventListener('pointerenter', this);
    }

    disconnectedCallback() {
      this.removeEventListener('click', this);
      this.removeEventListener('pointerenter', this);
      this.unmount();
    }

    attributeChangedCallback(attr, before, after) {
      if (!this.icon || before === after) return;
      if (attr === 'pose' && after) this.icon.setPose(after);
      else if (attr === 'size') this.icon.element.style.setProperty('--mi-size', typeof length(after) === 'number' ? after + 'px' : after);
      else if (attr === 'label') this.describe();
      else this.mount();
    }

    get recipe() { return M.recipes[this.getAttribute('name')]; }

    mount() {
      this.unmount();
      if (!this.recipe) return;
      const pose = this.getAttribute('pose') || undefined;
      const weight = this.getAttribute('weight') || undefined;
      this.icon = M.create(this, this.getAttribute('name'), {size: length(this.getAttribute('size')), pose, weight});
      this.describe();
    }

    unmount() {
      this.icon?.destroy();
      this.icon = null;
    }

    describe() {
      const label = this.getAttribute('label');
      if (label) { this.setAttribute('role', 'img'); this.setAttribute('aria-label', label); }
      else { this.removeAttribute('role'); this.removeAttribute('aria-label'); }
    }

    handleEvent(event) {
      const trigger = this.getAttribute('trigger') || 'tap';
      if (!this.icon || trigger === 'none') return;
      if ((event.type === 'click') !== (trigger === 'tap')) return;
      if (event.type === 'pointerenter' && event.pointerType === 'touch') return;
      const verb = this.getAttribute('action');
      if (verb === 'toggle') this.icon.toggle();
      else if (verb) this.icon.play(verb);
      else if (this.recipe.actions.bounce) this.icon.play('bounce');
      else this.icon.tap();
    }

    play(verb, ...args) { return this.icon?.play(verb, ...args); }
    stop() { return this.icon?.stop(); }
    drive(verb, value) { return this.icon?.drive(verb, value); }
    setPose(pose, options) { return this.icon?.setPose(pose, options); }
    toggle() { return this.icon?.toggle(); }
  }

  root.customElements.define('motion-icon', MotionIconElement);
  M.Element = MotionIconElement;
})(typeof window !== 'undefined' ? window : globalThis);
