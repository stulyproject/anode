import { LinkKind, SocketKind, type LinkStyling } from './elements';

/**
 * Defines all possible atomic mutations that can be recorded in history.
 * Each action includes the data necessary to both execute ('do')
 * and revert ('undo') the change.
 */
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
      styling?: LinkStyling;
      inner?: any;
    }
  | {
      type: 'DROP_LINK';
      id: number;
      from: number;
      to: number;
      kind: LinkKind;
      styling?: LinkStyling;
      inner?: any;
    }
  | {
      type: 'UPDATE_LINK';
      id: number;
      from: { old: number; new: number };
      to: { old: number; new: number };
      waypoints?: { old: { x: number; y: number }[]; new: { x: number; y: number }[] };
    }
  | {
      type: 'UPDATE_LINK_STYLING';
      id: number;
      from: LinkStyling;
      to: LinkStyling;
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

/**
 * A single transaction in the history stack, potentially containing
 * multiple atomic actions (if recorded via a batch).
 */
export interface Command {
  /** Array of actions to perform during 'redo'. */
  do: HistoryAction[];

  /** Array of actions to perform during 'undo'. */
  undo: HistoryAction[];

  /** A human-readable label for the transaction. */
  label?: string;

  /** ISO timestamp of when the command was recorded. */
  timestamp: number;
}

/**
 * Manages the undo/redo stacks for the Anode Context.
 * Tracks discrete mutations and provides serialization for session persistence.
 */
export class HistoryManager {
  /** The stack of commands that can be undone. */
  undoStack: Command[] = [];

  /** The stack of commands that can be reapplied (cleared on new mutation). */
  redoStack: Command[] = [];
  private maxHistory: number = 100;

  /**
   * Pushes a new command to the undo stack.
   * Clears the redo stack to prevent branch divergence.
   */
  push(command: Command) {
    this.undoStack.push(command);
    this.redoStack = [];
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
  }

  /** Serializes the history stack for persistence. */
  toJSON() {
    return {
      undoStack: this.undoStack,
      redoStack: this.redoStack
    };
  }

  /** Restores the history stack from a serialized object. */
  fromJSON(data: any) {
    this.undoStack = data.undoStack || [];
    this.redoStack = data.redoStack || [];
  }
}
