/**
 * Core types for TXML/TSS renderer
 */

export interface TXMLElement {
  tag: string;
  attributes: Record<string, string>;
  children: (TXMLElement | string)[];
  parent?: TXMLElement;
}

export interface TSSRule {
  selector: string;
  properties: Record<string, string>;
  specificity: number;
}

export interface TSSVariable {
  name: string;
  value: string;
}

export interface TSSStylesheet {
  variables: Map<string, string>;
  rules: TSSRule[];
}

export interface WidgetState {
  id: string;
  value: any;
  lastFrame: number;
}

export interface EventHandler {
  name: string;
  callback: (...args: any[]) => void;
}

export interface RenderContext {
  state: Map<string, WidgetState>;
  eventHandlers: Map<string, EventHandler>;
  stylesheet: TSSStylesheet;
  frameNumber: number;
  currentPath: string[];
}

export interface WidgetRenderer {
  (element: TXMLElement, context: RenderContext, computedStyle?: ComputedStyle, styleEngine?: any): void;
}

export interface StyleValue {
  type: 'color' | 'number' | 'string' | 'boolean';
  value: any;
}

export interface ComputedStyle {
  [property: string]: StyleValue;
}

// Supported TXML tags
export const SUPPORTED_TAGS = [
  'App', 'Head', 'Body', 'Window', 'Text', 'Button', 'InputText', 
  'SliderFloat', 'Checkbox', 'SameLine', 'Spacing', 'Separator'
] as const;

export type SupportedTag = typeof SUPPORTED_TAGS[number];

// Supported TSS properties
export const SUPPORTED_PROPERTIES = [
  'color', 'text-color', 'background-color', 'width', 'height', 'padding', 'margin',
  'font-size', 'border-radius', 'opacity'
] as const;

export type SupportedProperty = typeof SUPPORTED_PROPERTIES[number];

// Logger interface for capturing generated calls
export interface Logger {
  startFrame(): void;
  endFrame(): void;
  logImGui(callText: string): void;
  logDom?(callText: string): void;
  flush?(): void;
  getBuffer?(): string[];
}


