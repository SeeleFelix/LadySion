/**
 * 🧩 命令模式接口和基础实现
 */

export interface Command {
  execute(): void;
  undo(): void;
  redo(): void;
  canExecute(): boolean;
  canUndo(): boolean;
  canRedo(): boolean;
}

export abstract class BaseCommand implements Command {
  private executed = false;
  private undone = false;

  abstract doExecute(): void;
  abstract doUndo(): void;

  execute(): void {
    if (!this.canExecute()) {
      // 如果是第一次执行且canExecute()返回false，尝试执行并捕获具体错误
      if (!this.executed) {
        try {
          this.doExecute();
          this.executed = true;
          this.undone = false;
          return;
        } catch (error) {
          throw error; // 传播具体的错误信息
        }
      }
      throw new Error('命令无法执行');
    }
    
    this.doExecute();
    this.executed = true;
    this.undone = false;
  }

  undo(): void {
    if (!this.canUndo()) {
      throw new Error('命令无法撤销');
    }
    
    this.doUndo();
    this.undone = true;
  }

  redo(): void {
    if (!this.canRedo()) {
      throw new Error('命令无法重做');
    }
    
    this.doExecute();
    this.undone = false;
  }

  canExecute(): boolean {
    return !this.executed;
  }

  canUndo(): boolean {
    return this.executed && !this.undone;
  }

  canRedo(): boolean {
    return this.executed && this.undone;
  }
}

export class BatchCommand extends BaseCommand {
  constructor(private commands: Command[]) {
    super();
  }

  override canExecute(): boolean {
    return super.canExecute() && this.commands.every(cmd => cmd.canExecute());
  }

  doExecute(): void {
    for (const command of this.commands) {
      command.execute();
    }
  }

  doUndo(): void {
    // 反向撤销
    for (let i = this.commands.length - 1; i >= 0; i--) {
      this.commands[i].undo();
    }
  }
} 