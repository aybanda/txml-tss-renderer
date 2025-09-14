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

  constructor(logger?: Logger) {
    this.logger = logger ?? null;
    this.setupRenderers();
  }

  setImGui(imgui: ImGuiInstance): void {
    this.imgui = imgui;
  }

  setStyleEngine(_styleEngine: any): void {
    // Store style engine for use in rendering (currently unused)
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
    const renderer = this.renderers.get(element.tag);
    if (renderer) {
      renderer(element, context, computedStyle, styleEngine);
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
      this.renderChildren(element, context, styleEngine);
    }
    this.logger?.logImGui('ImGui.End();');
    this.imgui.End();
  }

  private renderText(element: TXMLElement, context: RenderContext, computedStyle?: ComputedStyle, _styleEngine?: any): void {
    if (!this.imgui) return;
    const text = this.getTextContent(element);
    const style = computedStyle || this.getComputedStyle(element, context);
    
    if ((style.color && style.color.type === 'color') || (style['text-color'] && style['text-color'].type === 'color')) {
      const colorValue = style['text-color'] || style.color;
      const color = this.intToImVec4(colorValue.value);
      this.logger?.logImGui(`ImGui.TextColored([${color.x?.toFixed?.(3) ?? ''}, ${color.y?.toFixed?.(3) ?? ''}, ${color.z?.toFixed?.(3) ?? ''}, ${color.w?.toFixed?.(3) ?? ''}], ${JSON.stringify(text)});`);
      // Use PushStyleColor for text elements (more reliable than TextColored)
      const textCol = this.imgui?.Col?.Text ?? 4;
      this.imgui.PushStyleColor?.(textCol, color.x, color.y, color.z, color.w);
      this.imgui.Text(text);
      this.imgui.PopStyleColor?.(1);
    } else {
      this.logger?.logImGui(`ImGui.Text(${JSON.stringify(text)});`);
      this.imgui.Text(text);
    }
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
    
    // Apply button styling (background and text colors)
    let pushedColors = 0;
    
    // Apply background color if specified
    if (style['background-color'] && style['background-color'].type === 'color') {
      const bgColor = this.intToImVec4(style['background-color'].value);
      this.logger?.logImGui(`ImGui.PushStyleColor(ImGuiCol.Button, [${bgColor.x?.toFixed?.(3) ?? ''}, ${bgColor.y?.toFixed?.(3) ?? ''}, ${bgColor.z?.toFixed?.(3) ?? ''}, ${bgColor.w?.toFixed?.(3) ?? ''}]);`);
      // Try to use the actual ImGui color constants, fallback to hardcoded values
      // ImGuiCol_Button = 0, ImGuiCol_ButtonHovered = 1, ImGuiCol_ButtonActive = 2
      const buttonCol = this.imgui?.Col?.Button ?? 0;
      this.imgui?.PushStyleColor?.(buttonCol, bgColor.x, bgColor.y, bgColor.z, bgColor.w);
      pushedColors++;
    }
    
    // Apply text color if specified - use ButtonText instead of Text for buttons
    if (style.color && style.color.type === 'color') {
      const textColor = this.intToImVec4(style.color.value);
      this.logger?.logImGui(`ImGui.PushStyleColor(ImGuiCol.ButtonText, [${textColor.x?.toFixed?.(3) ?? ''}, ${textColor.y?.toFixed?.(3) ?? ''}, ${textColor.z?.toFixed?.(3) ?? ''}, ${textColor.w?.toFixed?.(3) ?? ''}]);`);
      // Use ButtonText color constant for button text
      // ImGuiCol_ButtonText = 5 (this is the correct constant for button text)
      const buttonTextCol = this.imgui?.Col?.ButtonText ?? 5;
      this.imgui?.PushStyleColor?.(buttonTextCol, textColor.x, textColor.y, textColor.z, textColor.w);
      pushedColors++;
    }
    
    this.logger?.logImGui(`ImGui.Button(${JSON.stringify(text)});`);
    const clicked = this.imgui.Button(text);
    
    // Pop all pushed colors
    if (pushedColors > 0) {
      this.logger?.logImGui(`ImGui.PopStyleColor(${pushedColors});`);
      this.imgui?.PopStyleColor?.(pushedColors);
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
        this.render(child, context, computedStyle, styleEngine);
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

  private getComputedStyle(_element: TXMLElement, _context: RenderContext): ComputedStyle {
    // This would use the style engine to compute styles
    // For now, return empty style
    return {};
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

  private intToImVec4(color: number): ImVec4 {
    const r = ((color >> 16) & 0xff) / 255;
    const g = ((color >> 8) & 0xff) / 255;
    const b = (color & 0xff) / 255;
    const a = ((color >> 24) & 0xff) / 255;
    
    // Use ImVec4 from ImGui if available, otherwise create a simple object
    if (this.imgui?.ImVec4) {
      return new this.imgui.ImVec4(r, g, b, a);
    } else {
      // Fallback for when ImGui is not initialized - create a mock ImVec4
      const mockVec4 = { x: r, y: g, z: b, w: a } as any;
      mockVec4._ptr = null; // Add the required _ptr property
      return mockVec4;
    }
  }
}

export function createWidgetRenderers(): WidgetRenderers {
  return new WidgetRenderers();
}
