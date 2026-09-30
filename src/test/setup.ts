import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
});

// jsdom не реализует <dialog>.showModal() и Popover API.
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
}

if (!HTMLElement.prototype.showPopover) {
  const open = new WeakSet<HTMLElement>();
  HTMLElement.prototype.showPopover = function showPopover(this: HTMLElement) {
    open.add(this);
    this.dataset.popoverOpen = '';
  };
  HTMLElement.prototype.hidePopover = function hidePopover(this: HTMLElement) {
    open.delete(this);
    delete this.dataset.popoverOpen;
  };
  const matches = Element.prototype.matches;
  Element.prototype.matches = function (this: Element, selector: string) {
    if (selector === ':popover-open') return open.has(this as HTMLElement);
    return matches.call(this, selector);
  } as typeof Element.prototype.matches;
}
