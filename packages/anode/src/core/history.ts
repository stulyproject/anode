import { LinkKind, SocketKind } from './elements';

export type HistoryAction =
  | {
      type: 'MOVE_ENTITY';
      id: number;
      from: { x: number; y: number };
      to: { x: number; y: number };
    }
  | { type: 'MOVE_GROUP'; id: number; from: { x: number; y: number }; to: { x: number; y: number } }
  | {
      type: 'CREATE_ENTITY';
      id: number;
      inner: any;
      position: { x: number; y: number };
      parentId: number | null;
    }
  | {
      type: 'DROP_ENTITY';
      id: number;
      inner: any;
      position: { x: number; y: number };
      parentId: number | null;
    }
  | {
      type: 'CREATE_LINK';
      id: number;
      from: number;
      to: number;
      kind: LinkKind;
      inner?: any;
    }
  | {
      type: 'DROP_LINK';
      id: number;
      from: number;
      to: number;
      kind: LinkKind;
      inner?: any;
    }
  | {
      type: 'UPDATE_LINK';
      id: number;
      from: { old: number; new: number };
      to: { old: number; new: number };
      waypoints?: { old: { x: number; y: number }[]; new: { x: number; y: number }[] };
    }
  | { type: 'ADD_TO_GROUP'; groupId: number; entityId: number; oldParentId: number | null }
  | { type: 'REMOVE_FROM_GROUP'; groupId: number; entityId: number; oldParentId: number | null }
  | {
      type: 'CREATE_SOCKET';
      id: number;
      entityId: number;
      kind: SocketKind;
      name: string;
      offset: { x: number; y: number };
    }
  | {
      type: 'DROP_SOCKET';
      id: number;
      entityId: number;
      kind: SocketKind;
      name: string;
      offset: { x: number; y: number };
    }
  | { type: 'FROM_JSON'; data: any };

export interface Command {
  do: HistoryAction[];
  undo: HistoryAction[];
  label?: string;
  timestamp: number;
}

export class HistoryManager {
  undoStack: Command[] = [];
  redoStack: Command[] = [];
  private maxHistory: number = 100;

  push(command: Command) {
    this.undoStack.push(command);
    this.redoStack = [];
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
  }

  toJSON() {
    return {
      undoStack: this.undoStack,
      redoStack: this.redoStack
    };
  }

  fromJSON(data: any) {
    this.undoStack = data.undoStack || [];
    this.redoStack = data.redoStack || [];
  }
}
