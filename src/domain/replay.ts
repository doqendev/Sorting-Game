import { applyMoveAndResolve, cloneBoard, createBoardState } from "./board";
import { hashBoard } from "./solver";
import type { BoardState, LevelConfig, MoveAction, ReplayRecord } from "./types";

export function exportReplay(state: BoardState): ReplayRecord {
  return {
    schemaVersion: 1,
    levelId: state.levelId,
    seed: state.seed,
    moves: state.moveHistory.map((move) => ({ ...move })),
    boosters: [],
    finalStateHash: hashBoard(state)
  };
}

export function playReplay(level: LevelConfig, replay: ReplayRecord): BoardState {
  if (level.levelId !== replay.levelId || level.seed !== replay.seed) {
    throw new Error("Replay does not match level id and seed.");
  }
  const state = createBoardState(level);
  for (const move of replay.moves) {
    applyMoveAndResolve(state, move, move.timestamp);
  }
  return state;
}

export function appendMoveToReplay(replay: ReplayRecord, move: MoveAction, state: BoardState): ReplayRecord {
  const next = structuredClone(replay) as ReplayRecord;
  next.moves.push({ ...move });
  next.finalStateHash = hashBoard(state);
  return next;
}

export function cloneReplayState(state: BoardState): BoardState {
  return cloneBoard(state);
}
