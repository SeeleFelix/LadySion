/**
 * 🧩 NodeFlow框架工厂
 */

import { NodeFlow } from './node-flow.ts';
import { INodeFlow } from '../../public/interfaces.ts';

export function createNodeFlow(): INodeFlow {
  return new NodeFlow();
} 