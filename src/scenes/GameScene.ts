import Phaser from "phaser";
import { startMatch, type MatchState } from "../core/match";
import { createRng } from "../core/rng";
import {
  lockInPlayer,
  startRound,
  takePlayerCharge,
  type RoundState,
} from "../core/round";
import {
  advanceDecisionTimer,
  createDecisionTimer,
  getTimerProgress,
  shouldShowTimerWarning,
  stopDecisionTimer,
  type DecisionTimerState,
} from "../core/timer";
import {
  drawActionButtons,
  drawRoundPanels,
  updateRoundDisplay,
  type RoundDisplay,
} from "./GameSceneUi";

const INITIAL_SEED = 1;
const MILLISECONDS_PER_SECOND = 1000;
const TIMER_BAR_X = 400;
const TIMER_BAR_Y = 562;
const TIMER_BAR_WIDTH = 470;
const TIMER_BAR_HEIGHT = 18;
const TIMER_BAR_INSET = 2;
const TIMER_NORMAL_COLOR = 0x38bdf8;
const TIMER_WARNING_COLOR = 0xef4444;

export class GameScene extends Phaser.Scene {
  private matchState: MatchState;
  private roundState: RoundState;
  private decisionTimer: DecisionTimerState;
  private roundDisplay?: RoundDisplay;
  private timerBarFill?: Phaser.GameObjects.Rectangle;

  constructor() {
    super({ key: "GameScene" });
    this.matchState = startMatch();
    this.roundState = startRound(createRng(INITIAL_SEED));
    this.decisionTimer = createDecisionTimer();
  }

  create(): void {
    this.matchState = startMatch();
    this.roundState = startRound(createRng(INITIAL_SEED));
    this.decisionTimer = createDecisionTimer();

    this.drawBombCode(this.roundState.code);
    this.roundDisplay = drawRoundPanels(
      this,
      this.roundState,
      this.matchState.playerFuse,
      this.matchState.aiFuse,
    );
    drawActionButtons(
      this,
      () => this.handleTakeCharge(),
      () => this.handleLockIn(),
    );
    this.drawTimerBar();
    this.refreshTimerBar();
    this.bindKeyboardControls();
  }

  update(_time: number, deltaMs: number): void {
    const step = advanceDecisionTimer(
      this.decisionTimer,
      this.roundState,
      deltaMs / MILLISECONDS_PER_SECOND,
    );
    this.decisionTimer = step.timer;
    if (step.hasExpired) {
      this.roundState = step.round;
      this.refreshRoundDisplay();
    }
    this.refreshTimerBar();
  }

  private handleTakeCharge(): void {
    if (
      this.roundState.turn !== "player" ||
      this.roundState.isPlayerOverloaded
    ) {
      return;
    }
    this.roundState = takePlayerCharge(this.roundState);
    if (this.roundState.isPlayerOverloaded) {
      this.decisionTimer = stopDecisionTimer(this.decisionTimer);
    } else {
      this.decisionTimer = createDecisionTimer();
    }
    this.refreshRoundDisplay();
    this.refreshTimerBar();
  }

  private handleLockIn(): void {
    if (
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
      updateRoundDisplay(this.roundDisplay, this.roundState);
    }
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
