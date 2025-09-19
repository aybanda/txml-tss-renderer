// TSS (Trema Style Sheets) parser

import { TSSRule, TSSVariable, TSSStylesheet, SUPPORTED_PROPERTIES } from './types.js';

export class TSSParseError extends Error {
  constructor(message: string, public line?: number, public column?: number) {
    super(message);
    this.name = 'TSSParseError';
  }
}

export class TSSParser {
  private pos = 0;
  private line = 1;
  private column = 1;

  constructor(private tss: string) {}

  parse(): TSSStylesheet {
    const variables = new Map<string, string>();
    const rules: TSSRule[] = [];

    this.skipWhitespace();

    while (this.pos < this.tss.length) {
      if (this.tss.startsWith('scope', this.pos)) {
        // TSS scope block for variables
        this.parseScopeBlock(variables);
      } else if (this.tss[this.pos] === '@') {
        // At-rule (like @media, @import, etc.)
        this.parseAtRule();
      } else {
        // TSS rule
        const rule = this.parseRule(variables);
        if (rule) {
          rules.push(rule);
        }
      }
      this.skipWhitespace();
    }

    return { variables, rules };
  }

  private parseScopeBlock(variables: Map<string, string>): void {
    // Skip 'scope'
    this.pos += 5;
    this.column += 5;
    
    this.skipWhitespace();
    
    if (!this.consume('{')) {
      throw new TSSParseError('Expected { after scope', this.line, this.column);
    }
    
    while (this.pos < this.tss.length && this.tss[this.pos] !== '}') {
      this.skipWhitespace();
      
      if (this.tss[this.pos] === '}') break;
      
      // Parse TSS variable declaration: name: value;
      const variable = this.parseTSSVariable();
      variables.set(variable.name, variable.value);
      
      this.skipWhitespace();
    }
    
    if (!this.consume('}')) {
      throw new TSSParseError('Expected } after scope block', this.line, this.column);
    }
  }

  private parseTSSVariable(): TSSVariable {
    const name = this.parseIdentifier();
    
    if (!this.consume(':')) {
      throw new TSSParseError('Expected : after variable name', this.line, this.column);
    }

    this.skipWhitespace();
    const value = this.parseValue();
    
    if (!this.consume(';')) {
      throw new TSSParseError('Expected ; after variable value', this.line, this.column);
    }

    return { name, value };
  }

  private parseRule(variables: Map<string, string>): TSSRule | null {
    const selector = this.parseSelector();
    if (!selector) return null;

    if (!this.consume('{')) {
      throw new TSSParseError('Expected { after selector', this.line, this.column);
    }

    const properties = this.parseProperties(variables);

    if (!this.consume('}')) {
      throw new TSSParseError('Expected } after properties', this.line, this.column);
    }

    const specificity = this.calculateSpecificity(selector);

    return { selector, properties, specificity };
  }

  private parseSelector(): string {
    const start = this.pos;
    
    // Find the opening brace
    while (this.pos < this.tss.length && this.tss[this.pos] !== '{') {
      this.pos++;
      this.column++;
    }
    
    return this.tss.slice(start, this.pos).trim();
  }

  private parseProperties(variables: Map<string, string> = new Map()): Record<string, string> {
    const properties: Record<string, string> = {};
    
    while (this.pos < this.tss.length && this.tss[this.pos] !== '}') {
      this.skipWhitespace();
      
      if (this.tss[this.pos] === '}') break;
      
      const name = this.parseIdentifier();
      
      if (!this.consume(':')) {
        throw new TSSParseError('Expected : after property name', this.line, this.column);
      }
      
      this.skipWhitespace();
      let value = this.parseValue();
      
      // Substitute variables in the value
      value = this.substituteVariables(value, variables);
      
      if (!SUPPORTED_PROPERTIES.includes(name as any)) {
        console.warn(`Unknown property: ${name}`, this.line, this.column);
      }
      
      properties[name] = value;
      
      if (!this.consume(';')) {
        throw new TSSParseError('Expected ; after property value', this.line, this.column);
      }
      
      this.skipWhitespace();
    }
    
    return properties;
  }

  private parseValue(): string {
    const start = this.pos;
    
    // Handle quoted strings
    if (this.tss[this.pos] === '"' || this.tss[this.pos] === "'") {
      const quote = this.tss[this.pos];
      this.pos++;
      this.column++;
      
      while (this.pos < this.tss.length && this.tss[this.pos] !== quote) {
        if (this.tss[this.pos] === '\n') {
          this.line++;
          this.column = 1;
        } else {
          this.column++;
        }
        this.pos++;
      }
      
      if (this.pos < this.tss.length) {
        this.pos++;
        this.column++;
      }
      
      return this.tss.slice(start + 1, this.pos - 1);
    }
    
    // Handle unquoted values
    while (this.pos < this.tss.length && 
           this.tss[this.pos] !== ';' && 
           this.tss[this.pos] !== '}' && 
           !/\s/.test(this.tss[this.pos])) {
      this.pos++;
      this.column++;
    }
    
    return this.tss.slice(start, this.pos).trim();
  }

  private parseIdentifier(): string {
    const start = this.pos;
    
    while (this.pos < this.tss.length && 
           /[a-zA-Z0-9_-]/.test(this.tss[this.pos])) {
      this.pos++;
      this.column++;
    }
    
    return this.tss.slice(start, this.pos);
  }

  private parseAtRule(): void {
    // Skip @rules for now (like @media, @import)
    while (this.pos < this.tss.length && this.tss[this.pos] !== ';' && this.tss[this.pos] !== '{') {
      this.pos++;
      this.column++;
    }
    
    if (this.tss[this.pos] === '{') {
      // Skip the entire block
      let depth = 1;
      this.pos++;
      this.column++;
      
      while (this.pos < this.tss.length && depth > 0) {
        if (this.tss[this.pos] === '{') depth++;
        else if (this.tss[this.pos] === '}') depth--;
        
        if (this.tss[this.pos] === '\n') {
          this.line++;
          this.column = 1;
        } else {
          this.column++;
        }
        this.pos++;
      }
    } else {
      // Skip to semicolon
      while (this.pos < this.tss.length && this.tss[this.pos] !== ';') {
        this.pos++;
        this.column++;
      }
      if (this.pos < this.tss.length) {
        this.pos++;
        this.column++;
      }
    }
  }

  private calculateSpecificity(selector: string): number {
    // Simple specificity calculation: tag=1, class=10, id=100
    let specificity = 0;
    
    const parts = selector.split(/\s+/);
    for (const part of parts) {
      if (part.startsWith('#')) specificity += 100;
      else if (part.startsWith('.')) specificity += 10;
      else if (part.match(/^[a-zA-Z]/)) specificity += 1;
    }
    
    return specificity;
  }

  private skipWhitespace(): void {
    while (this.pos < this.tss.length) {
      if (/\s/.test(this.tss[this.pos])) {
        if (this.tss[this.pos] === '\n') {
          this.line++;
          this.column = 1;
        } else {
          this.column++;
        }
        this.pos++;
      } else if (this.tss.startsWith('/*', this.pos)) {
        // Skip CSS comments
        this.pos += 2;
        this.column += 2;
        while (this.pos < this.tss.length && !this.tss.startsWith('*/', this.pos)) {
          if (this.tss[this.pos] === '\n') {
            this.line++;
            this.column = 1;
          } else {
            this.column++;
          }
          this.pos++;
        }
        if (this.tss.startsWith('*/', this.pos)) {
          this.pos += 2;
          this.column += 2;
        }
      } else {
        break;
      }
    }
  }

  private substituteVariables(value: string, variables: Map<string, string>): string {
    // Replace variable references with their values
    let result = value;
    for (const [varName, varValue] of variables) {
      // Replace variable references (e.g., "red" -> "0xCC0000FF")
      const regex = new RegExp(`\\b${varName}\\b`, 'g');
      result = result.replace(regex, varValue);
    }
    return result;
  }

  private consume(expected: string): boolean {
    if (this.tss.startsWith(expected, this.pos)) {
      this.pos += expected.length;
      this.column += expected.length;
      return true;
    }
    return false;
  }
}

export function parseTSS(tss: string): TSSStylesheet {
  const parser = new TSSParser(tss);
  return parser.parse();
}





