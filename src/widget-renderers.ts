/**
 * Widget renderers for TXML elements to TXML elements to ImGui calls
 */

import { ImVec4 } from '@mori2003/jsimgui';
import { TXMLElement, RenderContext, WidgetRenderer, ComputedStyle, Logger } from './types.js';

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

export class WidgetRenderers {
  private renderers = new Map<string, WidgetRenderer>();
  private logger: Logger | null;
  private imgui: ImGuiInstance | null = null;
  private styleEngine: any = null;

  constructor(logger?: Logger) {
    this.logger = logger ?? null;
    this.setupRenderers();
  }

  setImGui(imgui: ImGuiInstance): void {
    // Runtime type validation
    if (typeof imgui !== 'object' || imgui === null) {
      throw new Error(`setImGui: imgui must be an object, got ${typeof imgui}`);
    }
    
    this.imgui = imgui;
  }

  setStyleEngine(styleEngine: any): void {
    this.styleEngine = styleEngine;
  }

  private setupRenderers(): void {
    this.renderers.set('App', this.renderApp.bind(this));
    this.renderers.set('Head', this.renderHead.bind(this));
    this.renderers.set('Body', this.renderBody.bind(this));
    this.renderers.set('Window', this.renderWindow.bind(this));
    this.renderers.set('Text', this.renderText.bind(this));
    this.renderers.set('Button', this.renderButton.bind(this));
    this.renderers.set('InputText', this.renderInputText.bind(this));
    this.renderers.set('SliderFloat', this.renderSliderFloat.bind(this));
    this.renderers.set('Checkbox', this.renderCheckbox.bind(this));
    this.renderers.set('SameLine', this.renderSameLine.bind(this));
    this.renderers.set('Spacing', this.renderSpacing.bind(this));
    this.renderers.set('Separator', this.renderSeparator.bind(this));
  }

  render(element: TXMLElement, context: RenderContext, computedStyle?: ComputedStyle, styleEngine?: any): void {
    // Runtime type validation
    if (typeof element !== 'object' || element === null || Array.isArray(element)) {
      throw new Error(`render: element must be a TXMLElement object, got ${typeof element}`);
    }
    
    if (!element.tag || typeof element.tag !== 'string') {
      throw new Error(`render: element.tag must be a string, got ${typeof element.tag}`);
    }
    
    if (typeof context !== 'object' || context === null) {
      throw new Error(`render: context must be a RenderContext object, got ${typeof context}`);
    }
    
    console.log(`WidgetRenderers.render called for: ${element.tag}`);
    const renderer = this.renderers.get(element.tag);
    if (renderer) {
      try {
        console.log(`Calling renderer for: ${element.tag}`);
        renderer(element, context, computedStyle, styleEngine);
        console.log(`Renderer completed for: ${element.tag}`);
      } catch (error) {
        console.error(`Render error for element: ${element.tag}`, error);
        console.error(`Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
        // Continue rendering other elements even if one fails
      }
    } else {
      console.warn(`No renderer for tag: ${element.tag}`);
    }
  }

  private renderApp(element: TXMLElement, context: RenderContext, _computedStyle?: ComputedStyle, styleEngine?: any): void {
    // App is the root container, render children
    this.renderChildren(element, context, styleEngine);
  }

  private renderHead(_element: TXMLElement, _context: RenderContext, _computedStyle?: ComputedStyle, _styleEngine?: any): void {
    // Head contains metadata, skip rendering for now
  }

  private renderBody(element: TXMLElement, context: RenderContext, _computedStyle?: ComputedStyle, styleEngine?: any): void {
    // Body is the main content area, render children
    this.renderChildren(element, context, styleEngine);
  }

  private renderWindow(element: TXMLElement, context: RenderContext, _computedStyle?: ComputedStyle, styleEngine?: any): void {
    if (!this.imgui) return;
    const title = element.attributes.title || 'Window';
    const style = this.getComputedStyle(element, context);
    
    // Apply window styling if needed
    if (style.width && style.width.type === 'number') {
      this.logger?.logImGui(`ImGui.SetNextWindowSize([${style.width.value}, ${style.height?.value || 200}], ImGui.Cond.Once);`);
      this.imgui.SetNextWindowSize([style.width.value, style.height?.value || 200], 1); // 1 = ImGui.Cond.Once
    }
    
    this.logger?.logImGui(`ImGui.Begin(${JSON.stringify(title)});`);
    const opened = this.imgui.Begin(title);
    if (opened) {
      try {
        this.renderChildren(element, context, styleEngine);
      } catch (error) {
        console.error('Error rendering window children:', error);
      }
    }
    
    // Always call End() to match Begin(), even if there was an error
    this.logger?.logImGui('ImGui.End();');
    this.imgui.End();
  }

  private renderText(element: TXMLElement, _context: RenderContext, _computedStyle?: ComputedStyle, _styleEngine?: any): void {
    if (!this.imgui) return;
    const text = this.getTextContent(element);
    
    // For now, skip TextColored to avoid the $$ property error
    // TODO: Fix TextColored color parameter format for jsimgui
    this.logger?.logImGui(`ImGui.Text(${JSON.stringify(text)});`);
    this.imgui.Text(text);
  }

  private renderButton(element: TXMLElement, context: RenderContext, computedStyle?: ComputedStyle, _styleEngine?: any): void {
    if (!this.imgui) return;
    const text = this.getTextContent(element);
    const style = computedStyle || this.getComputedStyle(element, context);
    
    // Apply button styling
    if (style.width && style.width.type === 'number') {
      this.logger?.logImGui(`ImGui.SetNextItemWidth(${style.width.value});`);
      this.imgui.SetNextItemWidth(style.width.value);
    }
    
    // Apply button color styling using ImGui color constants
    let colorPushed = false;
    if (style['button-color'] && style['button-color'].type === 'color') {
      const colorValue = style['button-color'].value;
      
      // Convert color to RGBA values
      const r = ((colorValue >> 16) & 0xff) / 255;
      const g = ((colorValue >> 8) & 0xff) / 255;
      const b = (colorValue & 0xff) / 255;
      const a = ((colorValue >> 24) & 0xff) / 255;
      
      // Use ImGui color constants if available
      if (this.imgui.PushStyleColor && this.imgui.Col?.Button !== undefined) {
        this.logger?.logImGui(`ImGui.PushStyleColor(ImGui.Col.Button, ${r}, ${g}, ${b}, ${a});`);
        this.imgui.PushStyleColor(this.imgui.Col.Button, r, g, b, a);
        colorPushed = true;
      }
    }
    
    this.logger?.logImGui(`ImGui.Button(${JSON.stringify(text)});`);
    const clicked = this.imgui.Button(text);
    
    // Pop the color if we pushed it
    if (colorPushed && this.imgui.PopStyleColor) {
      this.logger?.logImGui('ImGui.PopStyleColor(1);');
      this.imgui.PopStyleColor(1);
    }
    
    if (clicked && element.attributes.onClick) {
      this.handleEvent(element.attributes.onClick, context);
    }
  }

  private renderInputText(element: TXMLElement, context: RenderContext, _computedStyle?: ComputedStyle, _styleEngine?: any): void {
    if (!this.imgui) return;
    const id = this.generateId(element, context);
    const state = context.state.get(id) || { id, value: '', lastFrame: context.frameNumber };
    
    const label = element.attributes.label || '';
    const hint = element.attributes.hint || '';
    const style = this.getComputedStyle(element, context);
    
    // Apply input styling
    if (style.width && style.width.type === 'number') {
      this.logger?.logImGui(`ImGui.SetNextItemWidth(${style.width.value});`);
      this.imgui.SetNextItemWidth(style.width.value);
    }
    
    let value = state.value || '';
    const valueArray = [value];
    this.logger?.logImGui(`ImGui.InputTextWithHint(${JSON.stringify(label)}, ${JSON.stringify(hint)}, /* value */ , 256);`);
    const changed = this.imgui.InputTextWithHint(label, hint, valueArray, 256);
    
    if (changed) {
      state.value = valueArray[0];
      state.lastFrame = context.frameNumber;
      context.state.set(id, state);
    }
  }

  private renderSliderFloat(element: TXMLElement, context: RenderContext, _computedStyle?: ComputedStyle, _styleEngine?: any): void {
    if (!this.imgui) return;
    const id = this.generateId(element, context);
    const state = context.state.get(id) || { id, value: 0.5, lastFrame: context.frameNumber };
    
    const label = element.attributes.label || '';
    const min = parseFloat(element.attributes.min || '0');
    const max = parseFloat(element.attributes.max || '1');
    const style = this.getComputedStyle(element, context);
    
    // Apply slider styling
    if (style.width && style.width.type === 'number') {
      this.logger?.logImGui(`ImGui.SetNextItemWidth(${style.width.value});`);
      this.imgui.SetNextItemWidth(style.width.value);
    }
    
    const valueRef = [typeof state.value === 'number' ? state.value : 0.5];
    this.logger?.logImGui(`ImGui.SliderFloat(${JSON.stringify(label)}, ${valueRef[0]}, ${min}, ${max});`);
    const changed = this.imgui.SliderFloat(label, valueRef, min, max);
    
    if (changed) {
      state.value = valueRef[0];
      state.lastFrame = context.frameNumber;
      context.state.set(id, state);
    }
  }

  private renderCheckbox(element: TXMLElement, context: RenderContext, _computedStyle?: ComputedStyle, _styleEngine?: any): void {
    if (!this.imgui) return;
    const id = this.generateId(element, context);
    const state = context.state.get(id) || { id, value: false, lastFrame: context.frameNumber };
    
    const label = element.attributes.label || '';
    const checkedRef = [Boolean(state.value)];
    this.logger?.logImGui(`ImGui.Checkbox(${JSON.stringify(label)}, ${checkedRef[0]});`);
    const changed = this.imgui.Checkbox(label, checkedRef);
    
    if (changed) {
      state.value = checkedRef[0];
      state.lastFrame = context.frameNumber;
      context.state.set(id, state);
    }
  }

  private renderSameLine(element: TXMLElement, _context: RenderContext): void {
    if (!this.imgui) return;
    const offset = parseFloat(element.attributes.offset || '0');
    const spacing = parseFloat(element.attributes.spacing || '-1');
    this.logger?.logImGui(`ImGui.SameLine(${offset}, ${spacing});`);
    this.imgui.SameLine(offset, spacing);
  }

  private renderSpacing(_element: TXMLElement, _context: RenderContext): void {
    if (!this.imgui) return;
    this.logger?.logImGui('ImGui.Spacing();');
    this.imgui.Spacing();
  }

  private renderSeparator(_element: TXMLElement, _context: RenderContext): void {
    if (!this.imgui) return;
    this.logger?.logImGui('ImGui.Separator();');
    this.imgui.Separator();
  }

  private renderChildren(element: TXMLElement, context: RenderContext, styleEngine?: any): void {
    const oldPath = [...context.currentPath];
    context.currentPath.push(element.tag);
    
    for (const child of element.children) {
      try {
        if (typeof child === 'string') {
          // Text content - render as text
          if (child.trim() && this.imgui) {
            this.imgui.Text(child.trim());
          }
        } else {
          // Element - render recursively with computed styles
          let computedStyle;
          try {
            computedStyle = styleEngine?.computeStyle(child, context.currentPath) || {};
          } catch (e) {
            console.error('Style compute error for child element:', child.tag, e);
            computedStyle = {};
          }
          
          // Add error boundary around individual child rendering
          try {
            this.render(child, context, computedStyle, styleEngine);
          } catch (renderError) {
            const errorMessage = renderError instanceof Error ? renderError.message : String(renderError);
            console.error(`Failed to render child element: ${child.tag}`, renderError);
            // Continue rendering other children even if one fails
            this.logger?.logImGui(`// Error: Failed to render ${child.tag} - ${errorMessage}`);
          }
        }
      } catch (childError) {
        const errorMessage = childError instanceof Error ? childError.message : String(childError);
        console.error(`Critical error rendering child:`, childError);
        // Continue with next child - don't let one failure break everything
        this.logger?.logImGui(`// Critical Error: Child rendering failed - ${errorMessage}`);
      }
    }
    
    context.currentPath = oldPath;
  }


  private getTextContent(element: TXMLElement): string {
    return element.children
      .filter(child => typeof child === 'string')
      .join('')
      .trim();
  }

  private getComputedStyle(element: TXMLElement, context: RenderContext): ComputedStyle {
    if (!this.styleEngine) {
      return {};
    }
    
    try {
      return this.styleEngine.computeStyle(element, context.currentPath) || {};
    } catch (error) {
      console.error('Error computing style for element:', element.tag, error);
      return {};
    }
  }

  private generateId(element: TXMLElement, context: RenderContext): string {
    // Generate stable ID based on element path
    const path = [...context.currentPath, element.tag];
    return path.join('/');
  }

  private handleEvent(eventName: string, context: RenderContext): void {
    const handler = context.eventHandlers.get(eventName);
    if (handler) {
      handler.callback();
    } else {
      console.warn(`No event handler found for: ${eventName}`);
    }
  }

}

export function createWidgetRenderers(): WidgetRenderers {
  return new WidgetRenderers();
}
