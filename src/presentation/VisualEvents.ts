import type { BoardState, BoosterId, LegalMove, MoveQuality, ProductInstance, ResolutionResult } from "../domain/types";

export interface CellPoint {
  x: number;
  y: number;
}

export interface ResolutionVisualEvent {
  before: BoardState;
  after: BoardState;
  move: LegalMove;
  movedProduct: ProductInstance | null;
  result: ResolutionResult;
  quality: MoveQuality;
}

export interface BoosterVisualEvent {
  boosterId: BoosterId;
  label: string;
}

export type BoardEffectKind = "move" | "snap" | "pair" | "clear" | "combo" | "reveal" | "booster" | "invalid" | "win";

