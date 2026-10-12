// Type declarations for apple-motion-icons (dist/motion-icons.js / .mjs and the layered assets).

export interface Spring {
  stiffness: number;
  damping: number;
  precision?: number;
}

export type SpringName =
  | 'snap' | 'pop' | 'gentle' | 'slow' | 'settle' | 'draw' | 'fade' | 'exit'
  | 'impact' | 'rebound' | 'swing' | 'track' | 'shake'
  | 'smooth' | 'snappy' | 'bouncy' | 'quick' | 'glide';

/** Named weights scale the optical stroke (light .8 … bold 1.4); a number is used as the factor. */
export type Weight = 'light' | 'regular' | 'medium' | 'semibold' | 'bold' | number;

export interface CreateOptions {
  /** Pixel number or any CSS length. Defaults to the `--mi-size` custom property. */
  size?: number | string;
  /** Pose to start in; defaults to the recipe's first pose. */
  pose?: string;
  weight?: Weight;
  className?: string;
  /** Draw the rounded platter behind the glyph. */
  frame?: boolean;
  /** Return to the pose after one-shot actions (default true). */
  autoReset?: boolean;
  timing?: Partial<Record<string, number>>;
}

export interface MotionIconInstance {
  readonly element: HTMLSpanElement;
  readonly name: string;
  readonly pose: string;
  readonly mode: 'rest' | 'action' | 'loop' | 'drive';
  readonly action: string | null;
  readonly idle: boolean;
  readonly poses: string[];
  readonly actions: string[];
  /** One-shot actions resolve when the icon is back at rest; loops run until stop(). */
  play(action: string): Promise<boolean>;
  stop(): void;
  drive(action: string, value: number): void;
  toggle(): Promise<boolean>;
  tap(): Promise<boolean>;
  setPose(pose: string, options?: {instant?: boolean}): void;
  reset(options?: {pose?: string; instant?: boolean}): void;
  busy(): void;
  progress(value: number): void;
  success(): Promise<boolean>;
  fail(): Promise<boolean>;
  values(): Record<string, number>;
  goal(): Record<string, number>;
  destroy(): void;
}

export interface ActionContext {
  readonly s: Record<string, number>;
  readonly pose: string;
  readonly parts: Record<string, SVGElement>;
  readonly timing: Record<string, number>;
  to(key: string, value: number, spring?: SpringName | Spring, velocity?: number): Promise<boolean>;
  set(values: Record<string, number>): void;
  /** Override the current pose's resting value (e.g. where a clock hand stopped). */
  setGoal(key: string, value: number): void;
  setVelocity(key: string, velocity: number): void;
  claim(...keys: string[]): void;
  loop(frame: (seconds: number) => void): () => void;
  wait(ms: number): Promise<void>;
  alive(): boolean;
  goal(key: string): number;
  press(scale?: number): void;
  shake(): Promise<void>;
  error(): void;
}

export interface Action {
  label?: string;
  /** Pose the action ends in (applied before run). */
  pose?: string;
  /** Pose the action is meant to start from. */
  from?: string;
  loop?: boolean;
  internal?: boolean;
  /** Shared SF-style symbol effect (bounce, wiggle, breathe). */
  effect?: boolean;
  run?(c: ActionContext): void | Promise<void>;
  drive?(c: ActionContext, value: number): void;
}

export interface Recipe {
  svg: string;
  state: Record<string, number>;
  poses: Record<string, Record<string, number>>;
  periodic?: Record<string, number>;
  render(state: Record<string, number>, parts: Record<string, SVGElement>, util: MotionUtil): void;
  actions: Record<string, Action>;
  toggle?: [string, string];
  css?: string;
}

export interface MotionUtil {
  clamp(v: number, min: number, max: number): number;
  clamp01(v: number): number;
  lerp(a: number, b: number, t: number): number;
  lerpPath(a: string, b: string, t: number): string;
  around(scale: number, cx?: number, cy?: number): string;
  aroundXY(sx: number, sy: number, cx?: number, cy?: number): string;
  wave(seconds: number, hz: number): number;
  polar(cx: number, cy: number, r: number, degrees: number): [number, number];
  arc(cx: number, cy: number, r: number, from: number, to: number): string;
  [helper: string]: unknown;
}

export interface AppleContract {
  /** SwiftUI-style spring: response in seconds, dampingFraction 0…1. */
  spring(response: number, dampingFraction?: number): Spring;
  /** Lowest damping fraction any request may use (0.7). */
  readonly floor: number;
  /** Requests raised to the floor since load, in total and per subject. */
  readonly audit: {floor: number; clamped: number; subjects: Record<string, number>};
  /** Shared symbol effects added to every subject that lacks its own verb of that name. */
  readonly effects: Array<'bounce' | 'wiggle' | 'breathe'>;
}

export interface MotionIconAPI {
  create(container: Element, name: string, options?: CreateOptions): MotionIconInstance;
  hud(name: string, options?: CreateOptions & {title?: string}): MotionIconInstance;
  define(name: string, recipe: Recipe): void;
  readonly recipes: Record<string, Recipe>;
  readonly SPRINGS: Record<SpringName, Spring> & Record<string, Spring>;
  readonly TIMING: Record<string, number>;
  readonly util: MotionUtil;
  readonly apple: AppleContract;
  /** The <motion-icon> element class, registered when customElements exists. */
  readonly Element?: CustomElementConstructor;
}

/** Undefined when imported without a DOM (SSR); import it on the client. */
declare const MotionIcon: MotionIconAPI;
export {MotionIcon};
export default MotionIcon;

declare global {
  interface Window { MotionIcon: MotionIconAPI; }
  interface HTMLElementTagNameMap { 'motion-icon': HTMLElement & Pick<MotionIconInstance, 'play' | 'stop' | 'drive' | 'setPose' | 'toggle'> & {icon: MotionIconInstance | null}; }
}
