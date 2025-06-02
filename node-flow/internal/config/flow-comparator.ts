/**
 * 🧩 工作流图对比器
 */

import { FlowGraph } from '@node-flow/internal/config/flow-graph.ts';
import { NodePosition } from '../../public/types.ts';
import { Node } from '@node-flow/internal/core/node.ts';

export enum ChangeType {
  ADDED = 'added',
  REMOVED = 'removed',
  MODIFIED = 'modified'
}

export interface NodeSnapshot {
  id: string;
  name: string;
  type: string;
  position: NodePosition;
}

export interface NodeChange {
  type: ChangeType;
  nodeId: string;
  oldValue?: NodeSnapshot;
  newValue?: NodeSnapshot;
}

export interface ConnectionChange {
  type: ChangeType;
  from: string;
  to: string;
}

export interface MetadataChange {
  type: ChangeType;
  key: string;
  oldValue?: any;
  newValue?: any;
}

export class FlowDiff {
  public nodeChanges: NodeChange[] = [];
  public connectionChanges: ConnectionChange[] = [];
  public metadataChanges: MetadataChange[] = [];

  isEmpty(): boolean {
    return this.nodeChanges.length === 0 && 
           this.connectionChanges.length === 0 && 
           this.metadataChanges.length === 0;
  }

  generateReport(): string {
    const lines: string[] = [];
    
    if (this.isEmpty()) {
      return 'No changes detected.';
    }

    // 节点变化
    if (this.nodeChanges.length > 0) {
      lines.push('Node Changes:');
      for (const change of this.nodeChanges) {
        switch (change.type) {
          case ChangeType.ADDED:
            lines.push(`  + Added node '${change.nodeId}' (${change.newValue?.name})`);
            break;
          case ChangeType.REMOVED:
            lines.push(`  - Removed node '${change.nodeId}' (${change.oldValue?.name})`);
            break;
          case ChangeType.MODIFIED:
            lines.push(`  ~ Modified node '${change.nodeId}':`);
            if (change.oldValue?.name !== change.newValue?.name) {
              lines.push(`    Name: '${change.oldValue?.name}' -> '${change.newValue?.name}'`);
            }
            if (change.oldValue?.position.x !== change.newValue?.position.x || 
                change.oldValue?.position.y !== change.newValue?.position.y) {
              lines.push(`    Position: (${change.oldValue?.position.x}, ${change.oldValue?.position.y}) -> (${change.newValue?.position.x}, ${change.newValue?.position.y})`);
            }
            break;
        }
      }
      lines.push('');
    }

    // 连接变化
    if (this.connectionChanges.length > 0) {
      lines.push('Connection Changes:');
      for (const change of this.connectionChanges) {
        switch (change.type) {
          case ChangeType.ADDED:
            lines.push(`  + Added connection '${change.from}' -> '${change.to}'`);
            break;
          case ChangeType.REMOVED:
            lines.push(`  - Removed connection '${change.from}' -> '${change.to}'`);
            break;
        }
      }
      lines.push('');
    }

    // 元数据变化
    if (this.metadataChanges.length > 0) {
      lines.push('Metadata Changes:');
      for (const change of this.metadataChanges) {
        switch (change.type) {
          case ChangeType.ADDED:
            lines.push(`  + Added ${change.key}: '${change.newValue}'`);
            break;
          case ChangeType.REMOVED:
            lines.push(`  - Removed ${change.key}: '${change.oldValue}'`);
            break;
          case ChangeType.MODIFIED:
            lines.push(`  ~ Modified ${change.key}: '${change.oldValue}' -> '${change.newValue}'`);
            break;
        }
      }
    }

    return lines.join('\n');
  }
}

export class FlowComparator {
  compare(graphA: FlowGraph, graphB: FlowGraph): FlowDiff {
    const diff = new FlowDiff();

    this.compareNodes(graphA, graphB, diff);
    this.compareConnections(graphA, graphB, diff);
    this.compareMetadata(graphA, graphB, diff);

    return diff;
  }

  private compareNodes(graphA: FlowGraph, graphB: FlowGraph, diff: FlowDiff): void {
    const nodesA = new Map<string, Node>();
    const nodesB = new Map<string, Node>();

    graphA.getAllNodes().forEach(node => nodesA.set(node.id, node));
    graphB.getAllNodes().forEach(node => nodesB.set(node.id, node));

    // 检查删除的节点
    for (const [id, node] of nodesA) {
      if (!nodesB.has(id)) {
        diff.nodeChanges.push({
          type: ChangeType.REMOVED,
          nodeId: id,
          oldValue: this.nodeToSnapshot(node, graphA)
        });
      }
    }

    // 检查新增的节点
    for (const [id, node] of nodesB) {
      if (!nodesA.has(id)) {
        diff.nodeChanges.push({
          type: ChangeType.ADDED,
          nodeId: id,
          newValue: this.nodeToSnapshot(node, graphB)
        });
      }
    }

    // 检查修改的节点
    for (const [id, nodeB] of nodesB) {
      const nodeA = nodesA.get(id);
      if (nodeA) {
        const snapshotA = this.nodeToSnapshot(nodeA, graphA);
        const snapshotB = this.nodeToSnapshot(nodeB, graphB);

        if (!this.nodeSnapshotsEqual(snapshotA, snapshotB)) {
          diff.nodeChanges.push({
            type: ChangeType.MODIFIED,
            nodeId: id,
            oldValue: snapshotA,
            newValue: snapshotB
          });
        }
      }
    }
  }

  private compareConnections(graphA: FlowGraph, graphB: FlowGraph, diff: FlowDiff): void {
    const connectionsA = new Set(graphA.getAllConnections().map(c => `${c.from}->${c.to}`));
    const connectionsB = new Set(graphB.getAllConnections().map(c => `${c.from}->${c.to}`));

    // 检查删除的连接
    for (const connStr of connectionsA) {
      if (!connectionsB.has(connStr)) {
        const [from, to] = connStr.split('->');
        diff.connectionChanges.push({
          type: ChangeType.REMOVED,
          from,
          to
        });
      }
    }

    // 检查新增的连接
    for (const connStr of connectionsB) {
      if (!connectionsA.has(connStr)) {
        const [from, to] = connStr.split('->');
        diff.connectionChanges.push({
          type: ChangeType.ADDED,
          from,
          to
        });
      }
    }
  }

  private compareMetadata(graphA: FlowGraph, graphB: FlowGraph, diff: FlowDiff): void {
    const metaA = graphA.metadata || {};
    const metaB = graphB.metadata || {};

    const allKeys = new Set([...Object.keys(metaA), ...Object.keys(metaB)]);

    for (const key of allKeys) {
      const valueA = (metaA as any)[key];
      const valueB = (metaB as any)[key];

      if (valueA === undefined && valueB !== undefined) {
        // 新增
        diff.metadataChanges.push({
          type: ChangeType.ADDED,
          key,
          newValue: valueB
        });
      } else if (valueA !== undefined && valueB === undefined) {
        // 删除
        diff.metadataChanges.push({
          type: ChangeType.REMOVED,
          key,
          oldValue: valueA
        });
      } else if (valueA !== valueB) {
        // 修改
        diff.metadataChanges.push({
          type: ChangeType.MODIFIED,
          key,
          oldValue: valueA,
          newValue: valueB
        });
      }
    }
  }

  private nodeToSnapshot(node: Node, graph: FlowGraph): NodeSnapshot {
    return {
      id: node.id,
      name: node.name,
      type: node.type,
      position: graph.getNodePosition(node.id) || { x: 0, y: 0 }
    };
  }

  private nodeSnapshotsEqual(a: NodeSnapshot, b: NodeSnapshot): boolean {
    return a.name === b.name &&
           a.type === b.type &&
           a.position.x === b.position.x &&
           a.position.y === b.position.y;
  }
} 