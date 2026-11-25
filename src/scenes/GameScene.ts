import Phaser from "phaser";
import { advanceAiTurn, createAiTurnState, type AiTurnState } from "../core/ai";
import {
  advanceRoundFlow,
  createRoundFlowState,
  startMatch,
  type MatchState,
  type RoundFlowState,
} from "../core/match";
import { createRng } from "../core/rng";
import {
  lockInPlayer,
  startRound,
  takePlayerCharge,
  type RoundState,
} from "../core/round";
import { getChargeShake } from "../core/shake";
import {
  advanceTickTimer,
  createTickTimer,
  getRoundOutcomeCue,
  type TickTimerState,
} from "../core/sound";
import {
  advanceDecisionTimer,
  createDecisionTimer,
  getTimerProgress,
  shouldShowTimerWarning,
  stopDecisionTimer,
  type DecisionTimerState,
} from "../core/timer";
import { playRoundOutcomeFeedback, playSoundCue } from "./GameAudio";
import {
  drawActionButtons,
  drawRoundPanels,
  updateRoundDisplay,
  type RoundDisplay,
} from "./GameSceneUi";

export type GameSceneData = {
  seed?: number;
};

const INITIAL_SEED = 54321;
const MILLISECONDS_PER_SECOND = 1000;
const TIMER_BAR_X = 400;
const TIMER_BAR_Y = 562;
const TIMER_BAR_WIDTH = 470;
const TIMER_BAR_HEIGHT = 18;
const TIMER_BAR_INSET = 2;
const TIMER_NORMAL_COLOR = 0x38bdf8;
const TIMER_WARNING_COLOR = 0xef4444;

export class GameScene extends Phaser.Scene {
  private matchSeed: number = INITIAL_SEED;
  private matchState: MatchState;
  private roundState: RoundState;
  private decisionTimer: DecisionTimerState;
  private tickTimer: TickTimerState;
  private aiTurnState: AiTurnState;
  private roundFlow: RoundFlowState;
  private roundDisplay?: RoundDisplay;
  private timerBarFill?: Phaser.GameObjects.Rectangle;

  constructor() {
    super({ key: "GameScene" });
    this.matchState = startMatch();
    this.roundState = startRound(createRng(INITIAL_SEED));
    this.decisionTimer = createDecisionTimer();
    this.tickTimer = createTickTimer(this.roundState);
    this.aiTurnState = createAiTurnState();
    this.roundFlow = createRoundFlowState();
  }

  init(data?: GameSceneData): void {
    this.matchSeed = data?.seed ?? INITIAL_SEED;
  }

  create(): void {
    this.matchState = startMatch();
    this.roundState = startRound(createRng(this.matchSeed));
    this.decisionTimer = createDecisionTimer();
    this.tickTimer = createTickTimer(this.roundState);
    this.aiTurnState = createAiTurnState();
    this.roundFlow = createRoundFlowState();

    this.renderRoundScreen();
    this.bindKeyboardControls();
  }

  update(_time: number, deltaMs: number): void {
    const elapsedSeconds = deltaMs / MILLISECONDS_PER_SECOND;
    if (!this.roundFlow.isShowingResult) {
      this.updateDecisionTimer(elapsedSeconds);
      this.updateTickSound(elapsedSeconds);
      this.updateAiTurn(elapsedSeconds);
    }
    this.updateRoundFlow(elapsedSeconds);
  }

  private renderRoundScreen(): void {
    this.children.removeAll();
    this.drawBombCode(this.roundState.code);
    this.drawRoundResultBanner();
    this.roundDisplay = drawRoundPanels(
      this,
      this.roundState,
      this.matchState.playerFuse,
      this.matchState.aiFuse,
    );
    updateRoundDisplay(this.roundDisplay, this.roundState, this.aiTurnState);
    drawActionButtons(
      this,
      () => this.handleTakeCharge(),
      () => this.handleLockIn(),
    );
    this.drawTimerBar();
    this.refreshTimerBar();
  }

  private updateDecisionTimer(elapsedSeconds: number): void {
    const step = advanceDecisionTimer(
      this.decisionTimer,
      this.roundState,
      elapsedSeconds,
    );
    this.decisionTimer = step.timer;
    if (step.hasExpired) {
      this.roundState = step.round;
      this.shakeForLatestCharge(this.roundState.playerCharges);
      this.refreshRoundDisplay();
    }
    this.refreshTimerBar();
  }

  private updateTickSound(elapsedSeconds: number): void {
    const step = advanceTickTimer(
      this.tickTimer,
      this.roundState,
      elapsedSeconds,
    );
    this.tickTimer = step.timer;
    if (step.shouldPlayTick) {
      playSoundCue(this, "tick");
    }
  }

  private updateAiTurn(elapsedSeconds: number): void {
    const previousAiCount = this.roundState.aiCharges.length;
    const step = advanceAiTurn(
      this.aiTurnState,
      this.roundState,
      elapsedSeconds,
    );
    this.aiTurnState = step.aiTurn;
    if (step.hasChanged) {
      this.roundState = step.round;
      if (this.roundState.aiCharges.length > previousAiCount) {
        this.shakeForLatestCharge(this.roundState.aiCharges);
      }
      this.refreshRoundDisplay();
    }
  }

  private updateRoundFlow(elapsedSeconds: number): void {
    const step = advanceRoundFlow(
      this.matchState,
      this.roundState,
      this.roundFlow,
      this.aiTurnState.isTurnComplete,
      elapsedSeconds,
    );
    this.matchState = step.match;
    this.roundState = step.round;
    this.roundFlow = step.flow;

    if (step.outcome === "round-resolved") {
      this.renderRoundScreen();
      const cue = getRoundOutcomeCue(this.roundState, this.matchState);
      playRoundOutcomeFeedback(this, cue);
    } else if (step.outcome === "next-round") {
      this.decisionTimer = createDecisionTimer();
      this.tickTimer = createTickTimer(this.roundState);
      this.aiTurnState = createAiTurnState();
      this.renderRoundScreen();
    } else if (step.outcome === "match-over") {
      this.scene.start("MatchOverScene", {
        winner: this.matchState.matchWinner,
      });
    }
  }

  private handleTakeCharge(): void {
    if (
      this.roundFlow.isShowingResult ||
      this.roundState.turn !== "player" ||
      this.roundState.isPlayerOverloaded
    ) {
      return;
    }
    this.roundState = takePlayerCharge(this.roundState);
    this.shakeForLatestCharge(this.roundState.playerCharges);
    if (this.roundState.isPlayerOverloaded) {
      this.decisionTimer = stopDecisionTimer(this.decisionTimer);
    } else {
      this.decisionTimer = createDecisionTimer();
    }
    this.refreshRoundDisplay();
    this.refreshTimerBar();
  }

  private shakeForLatestCharge(charges: number[]): void {
    const latestCharge = charges[charges.length - 1];
    if (latestCharge === undefined) {
      return;
    }
    const shake = getChargeShake(latestCharge);
    this.cameras.main.shake(shake.durationMs, shake.intensity, true);
  }

  private handleLockIn(): void {
    if (
      this.roundFlow.isShowingResult ||
      this.roundState.turn !== "player" ||
      this.roundState.isPlayerOverloaded
    ) {
      return;
    }
    this.roundState = lockInPlayer(this.roundState);
    this.decisionTimer = stopDecisionTimer(this.decisionTimer);
    this.refreshRoundDisplay();
    this.refreshTimerBar();
  }

  private refreshRoundDisplay(): void {
    if (this.roundDisplay) {
      updateRoundDisplay(this.roundDisplay, this.roundState, this.aiTurnState);
    }
  }

  private drawRoundResultBanner(): void {
    if (!this.roundFlow.resultText) {
      return;
    }
    let color = "#facc15";
    if (this.roundFlow.roundWinner === "player") {
      color = "#4ade80";
    } else if (this.roundFlow.roundWinner === "ai") {
      color = "#f87171";
    }
    this.add
      .text(400, 170, this.roundFlow.resultText, {
        fontFamily: "Arial",
        fontSize: "22px",
        fontStyle: "bold",
        color,
      })
      .setOrigin(0.5);
  }

  private drawTimerBar(): void {
    const fillLeftX = TIMER_BAR_X - TIMER_BAR_WIDTH / 2 + TIMER_BAR_INSET;
    const fillWidth = TIMER_BAR_WIDTH - TIMER_BAR_INSET * 2;
    const fillHeight = TIMER_BAR_HEIGHT - TIMER_BAR_INSET * 2;

    this.add
      .rectangle(
        TIMER_BAR_X,
        TIMER_BAR_Y,
        TIMER_BAR_WIDTH,
        TIMER_BAR_HEIGHT,
        0x2c323d,
      )
      .setStrokeStyle(2, 0xffffff);
    this.timerBarFill = this.add
      .rectangle(
        fillLeftX,
        TIMER_BAR_Y,
        fillWidth,
        fillHeight,
        TIMER_NORMAL_COLOR,
      )
      .setOrigin(0, 0.5);
  }

  private refreshTimerBar(): void {
    if (!this.timerBarFill) {
      return;
    }
    this.timerBarFill.scaleX = getTimerProgress(this.decisionTimer);
    if (shouldShowTimerWarning(this.decisionTimer)) {
      this.timerBarFill.setFillStyle(TIMER_WARNING_COLOR);
    } else {
      this.timerBarFill.setFillStyle(TIMER_NORMAL_COLOR);
    }
  }

  private bindKeyboardControls(): void {
    this.input.keyboard?.removeAllListeners("keydown-SPACE");
    this.input.keyboard?.removeAllListeners("keydown-ENTER");
    this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE, true);
    this.input.keyboard?.on("keydown-SPACE", () => {
      this.handleTakeCharge();
    });
    this.input.keyboard?.on("keydown-ENTER", () => {
      this.handleLockIn();
    });
  }

  private drawBombCode(code: number): void {
    this.add.rectangle(400, 95, 220, 110, 0x2c323d).setStrokeStyle(3, 0xf59e0b);
    this.add
      .text(400, 58, "BOMB CODE", {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#f59e0b",
      })
      .setOrigin(0.5);
    this.add
      .text(400, 108, String(code), {
        fontFamily: "Arial",
        fontSize: "48px",
        fontStyle: "bold",
        color: "#ffffff",
      })
      .setOrigin(0.5);
  }
}
