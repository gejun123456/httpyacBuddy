import { ControllerInfo } from '../types';

export interface ControllerParser {
  parse(source: string, filePath: string): ControllerInfo | null;
}
