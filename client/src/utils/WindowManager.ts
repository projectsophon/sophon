import EventEmitter from 'events';
import { WorldCoords } from './Coordinates';

export const enum GameWindowZIndex {
  Toggler = 3,
  MenuBar = 4,
  Modal = 1000,
}

/*
  technically these should be number | null since this thing will init before
  the first mousemove event, but the probability of this mattering is so low idc
*/

// these should be relative to window
export type MousePos = {
  x: number;
  y: number;
};

export enum WindowManagerEvent {
  StateChanged = 'StateChanged',
  MiningCoordsUpdate = 'MiningCoordsUpdate',
}

export enum CursorState {
  Normal,
  TargetingExplorer,
  TargetingForces,
}

// the purpose of this class is to manage all ui pane events
// TODO wire all the mouse events from the game into this guy
class WindowManager extends EventEmitter {
  static instance: WindowManager;
  private mousePos: MousePos;
  private mousedownPos: MousePos | null;

  private lastZIndex: number;
  private cursorState: CursorState;

  private shiftPressed: boolean;

  private constructor() {
    super();
    this.mousePos = { x: 0, y: 0 };
    this.mousedownPos = null;
    this.lastZIndex = 0;

    this.shiftPressed = false;
  }

  static getInstance(): WindowManager {
    if (!WindowManager.instance) {
      WindowManager.instance = new WindowManager();
    }

    return WindowManager.instance;
  }

  static initialize(): WindowManager {
    const terminalEmitter = new WindowManager();

    return terminalEmitter;
  }

  // getters
  getClickDelta(): MousePos {
    if (!this.mousedownPos) return { x: 0, y: 0 };
    else
      return {
        x: this.mousePos.x - this.mousedownPos.x,
        y: this.mousePos.y - this.mousedownPos.y,
      };
  }

  getIndex(): number {
    this.lastZIndex++;
    return this.lastZIndex + GameWindowZIndex.Modal;
  }

  getCursorState(): CursorState {
    return this.cursorState;
  }

  // setters / mutators
  setCursorState(newstate: CursorState): void {
    this.cursorState = newstate;
    this.emit(WindowManagerEvent.StateChanged, newstate);
  }

  acceptInputForTarget(input: WorldCoords): void {
    if (this.cursorState !== CursorState.TargetingExplorer) return;
    this.emit(WindowManagerEvent.MiningCoordsUpdate, input);
    this.setCursorState(CursorState.Normal);
  }
}

export default WindowManager;
