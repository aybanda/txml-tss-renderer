/**
 * Main TXML/TSS renderer
 */

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
        const errorMessage = 'ImGui not initialized. Call setImGui() first.';
        console.error('TXML/TSS render error:', errorMessage);
        this.logger?.logImGui(`// Error: ${errorMessage}`);
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
      
      // Begin frame
      this.stateManager.beginFrame();
      
      // Create render context
      const context = this.stateManager.createContext(stylesheet, this.eventHandlers);
      if (!context) {
        console.error('Failed to create render context');
        return;
      }
      
      // Render the XML
      this.renderElement(xmlElement, context, styleEngine);
      
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
  private renderElement(element: TXMLElement, context: RenderContext, styleEngine: StyleEngine): void {
    if (!element || !context) {
      console.error('Invalid element or context');
      return;
    }
    
    // Compute styles for this element
    styleEngine.computeStyle(element, context.currentPath);
    
    // Apply styles to ImGui (this would be implemented in the widget renderers)
    // For now, just render the element
    this.widgetRenderers.render(element, context);
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
