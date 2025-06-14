// AnimaWeave Dynamic Graph Executor Types

export enum ExecutionStatus {
  Success = "success",
  Error = "error"
}

export interface FateEcho {
  status: ExecutionStatus;
  outputs: string; // JSON serialized
  getOutputs(): Record<string, unknown>;
}
