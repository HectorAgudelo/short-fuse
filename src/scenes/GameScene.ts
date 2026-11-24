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
  drawActionButtons,
  drawRoundPanels,
  updateRoundDisplay,
  type RoundDisplay,
} from "./GameSceneUi";

const INITIAL_SEED = 1;

export class GameScene extends Phaser.Scene {
  private matchState: MatchState;
  private roundState: RoundState;
  private roundDisplay?: RoundDisplay;

  constructor() {
    super({ key: "GameScene" });
    this.matchState = startMatch();
    this.roundState = startRound(createRng(INITIAL_SEED));
  }

  create(): void {
    this.matchState = startMatch();
    this.roundState = startRound(createRng(INITIAL_SEED));

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
    this.bindKeyboardControls();
  }

  private handleTakeCharge(): void {
    if (
      this.roundState.turn !== "player" ||
      this.roundState.isPlayerOverloaded
    ) {
      return;
    }
    this.roundState = takePlayerCharge(this.roundState);
    this.refreshRoundDisplay();
  }

  private handleLockIn(): void {
    if (
      this.roundState.turn !== "player" ||
      this.roundState.isPlayerOverloaded
    ) {
      return;
    }
    this.roundState = lockInPlayer(this.roundState);
    this.refreshRoundDisplay();
  }

  private refreshRoundDisplay(): void {
    if (this.roundDisplay) {
      updateRoundDisplay(this.roundDisplay, this.roundState);
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
