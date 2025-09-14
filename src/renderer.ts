/**
 * Main TXML/TSS renderer
 */

import { ImVec4 } from '@mori2003/jsimgui';
import { TXMLElement, RenderContext, EventHandler, Logger } from './types.js';
import { parseTXML } from './xml-parser.js';
import { parseTSS } from './tss-parser.js';
import { StateManager } from './state-manager.js';
import { StyleEngine } from './style-engine.js';
import { WidgetRenderers } from './widget-renderers.js';

export interface ImGuiInstance {
  Begin: (name: string, p_open?: boolean[], flags?: number) => boolean;
  End: () => void;
  Text: (text: string) => void;
  Button: (label: string) => boolean;
  InputText: (label: string, buf: string[], buf_size: number) => boolean;
  SliderFloat: (label: string, v: number[], v_min: number, v_max: number) => boolean;
  Checkbox: (label: string, v: boolean[]) => boolean;
  SameLine: (offset_from_start_x?: number, spacing?: number) => void;
  Spacing: () => void;
  Separator: () => void;
  SetNextWindowSize: (size: [number, number], cond?: number) => void;
  SetNextItemWidth: (item_width: number) => void;
  TextColored: (col: [number, number, number, number], text: string) => void;
  InputTextWithHint: (label: string, hint: string, buf: string[], buf_size: number) => boolean;
  CreateContext: () => void;
  StyleColorsDark: () => void;
  PushStyleColor?: (col: number, r: number, g: number, b: number, a: number) => void;
  PopStyleColor?: (count: number) => void;
  Col?: {
    Button: number;
    Text: number;
    ButtonText: number;
  };
  ImVec4?: new (x: number, y: number, z: number, w: number) => ImVec4;
}

export interface ImGuiImplWebInstance {
  Init: (canvas: HTMLCanvasElement) => Promise<void>;
  NewFrame: () => void;
  Render: () => void;
}

export class TXMLTSSRenderer {
  private stateManager: StateManager;
  private widgetRenderers: WidgetRenderers;
  private eventHandlers = new Map<string, EventHandler>();
  private logger: Logger | null = null;
  private imgui: ImGuiInstance | null = null;
  private imguiImplWeb: ImGuiImplWebInstance | null = null;

  constructor(logger?: Logger) {
    this.stateManager = new StateManager();
    this.widgetRenderers = new WidgetRenderers(logger);
    if (logger) this.logger = logger;
  }

  /**
   * Inject or replace logger at runtime
   */
  setLogger(logger: Logger): void {
    this.logger = logger;
    // Recreate widget renderers with new logger
    this.widgetRenderers = new WidgetRenderers(logger);
  }

  /**
   * Register an event handler
   */
  registerEventHandler(name: string, callback: (...args: any[]) => void): void {
    this.eventHandlers.set(name, { name, callback });
  }

  /**
   * Test event handler invocation (for testing purposes)
   */
  testEventHandler(name: string): void {
    const handler = this.eventHandlers.get(name);
    if (handler) {
      handler.callback();
    }
  }

  /**
   * Set ImGui instances for dependency injection
   */
  setImGui(imgui: ImGuiInstance, imguiImplWeb: ImGuiImplWebInstance): void {
    this.imgui = imgui;
    this.imguiImplWeb = imguiImplWeb;
    this.widgetRenderers.setImGui(imgui);
  }

  /**
   * Parse and render TXML with TSS styling
   */
  render(txml: string, tss: string = ''): void {
    try {
      this.logger?.startFrame();
      
      if (!txml || !txml.trim()) {
        console.warn('Empty TXML provided');
        return;
      }
      
      if (!this.imgui || !this.imguiImplWeb) {
        const warnMessage = 'ImGui not initialized. Cannot render without ImGui context.';
        console.warn(warnMessage);
        this.logger?.logImGui?.(`// Warning: ${warnMessage}`);
        return;
      }
      
      // Parse TXML
      const xmlElement = parseTXML(txml);
      if (!xmlElement) {
        console.error('Failed to parse TXML');
        return;
      }
      
      // Parse TSS
      const stylesheet = parseTSS(tss);
      if (!stylesheet) {
        console.error('Failed to parse TSS');
        return;
      }
      
      // Create style engine
      const styleEngine = new StyleEngine(stylesheet);
      
      // Set style engine on widget renderers
      this.widgetRenderers.setStyleEngine(styleEngine);
      
      // Begin frame
      this.stateManager.beginFrame();
      
      // Create render context
      const context = this.stateManager.createContext(stylesheet, this.eventHandlers);
      if (!context) {
        console.error('Failed to create render context');
        return;
      }
      
      // Render the XML
      this.renderElement(xmlElement, context, styleEngine, []);
      
      // End frame
      this.stateManager.endFrame();
      this.logger?.endFrame();
      this.logger?.flush?.();
      
         } catch (error) {
       const errorMessage = error instanceof Error ? error.message : String(error);
       console.error('TXML/TSS render error:', errorMessage);
       this.logger?.logImGui(`// Error: ${errorMessage}`);
     }
  }

  /**
   * Render a single element
   */
  private renderElement(element: TXMLElement, context: RenderContext, styleEngine: StyleEngine, path: string[] = []): void {
    if (!element || !context) {
      console.error('Invalid element or context');
      return;
    }
    
    // Build the current path for this element
    const currentPath = [...path, element.tag];
    
    let computedStyle;
    try {
      computedStyle = styleEngine.computeStyle(element, currentPath);
    } catch (e) {
      const msg = e instanceof Error ? e.stack || e.message : String(e);
      console.error('Style compute error for element:', element.tag, element.attributes, msg);
      this.logger?.logImGui?.(`// Style error on <${element.tag}> ${JSON.stringify(element.attributes)}: ${msg}`);
      computedStyle = {};
    }
    
    try {
      // Update the context path for this element
      const oldPath = context.currentPath;
      context.currentPath = currentPath;
      
      this.widgetRenderers.render(element, context, computedStyle, styleEngine);
      
      // Restore the old path
      context.currentPath = oldPath;
    } catch (e) {
      const msg = e instanceof Error ? e.stack || e.message : String(e);
      console.error('Render error for element:', element.tag, element.attributes, msg);
      this.logger?.logImGui?.(`// Render error on <${element.tag}> ${JSON.stringify(element.attributes)}: ${msg}`);
    }
  }

  /**
   * Get current state for debugging
   */
  getState(): Map<string, any> {
    return this.stateManager['state'];
  }

  /**
   * Clear all state
   */
  clearState(): void {
    this.stateManager['state'].clear();
  }
}

export function createRenderer(): TXMLTSSRenderer {
  return new TXMLTSSRenderer();
}
