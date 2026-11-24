import Phaser from "phaser";
import { FUSE_SIZE } from "../core/config";
import { startMatch, type MatchState } from "../core/match";
import { createRng } from "../core/rng";
import {
  lockInPlayer,
  startRound,
  takePlayerCharge,
  type RoundState,
} from "../core/round";

const INITIAL_SEED = 1;

// Formats the AI's charges and visible total, hiding the hidden charge during the player's turn.
function formatAiDisplay(round: RoundState): {
  chargesText: string;
  totalText: string;
} {
  const isChargeHidden = round.turn === "player";
  const chargeLabels: string[] = [];
  let visibleTotal = 0;

  for (let index = 0; index < round.aiCharges.length; index += 1) {
    if (isChargeHidden && index === round.aiHiddenChargeIndex) {
      chargeLabels.push("??");
    } else {
      const charge = round.aiCharges[index];
      chargeLabels.push(String(charge));
      visibleTotal += charge;
    }
  }

  let totalText = `${visibleTotal}`;
  if (isChargeHidden) {
    totalText = `${visibleTotal} + ??`;
  }

  return {
    chargesText: chargeLabels.join(" + "),
    totalText,
  };
}

export class GameScene extends Phaser.Scene {
  private matchState: MatchState;
  private roundState: RoundState;
  private playerTotalText?: Phaser.GameObjects.Text;
  private playerChargesText?: Phaser.GameObjects.Text;
  private aiTotalText?: Phaser.GameObjects.Text;
  private aiChargesText?: Phaser.GameObjects.Text;

  constructor() {
    super({ key: "GameScene" });
    this.matchState = startMatch();
    this.roundState = startRound(createRng(INITIAL_SEED));
  }

  create(): void {
    this.matchState = startMatch();
    this.roundState = startRound(createRng(INITIAL_SEED));

    this.drawBombCode(this.roundState.code);
    this.drawPlayerPanel(this.roundState, this.matchState.playerFuse);
    this.drawAiPanel(this.roundState, this.matchState.aiFuse);
    this.drawActionButtons();
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
    this.playerTotalText?.setText(`Total: ${this.roundState.playerTotal}`);
    this.playerChargesText?.setText(
      `Charges: ${this.roundState.playerCharges.join(" + ")}`,
    );
    const aiDisplay = formatAiDisplay(this.roundState);
    this.aiTotalText?.setText(`Total: ${aiDisplay.totalText}`);
    this.aiChargesText?.setText(`Charges: ${aiDisplay.chargesText}`);
  }

  private bindKeyboardControls(): void {
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

  private drawPlayerPanel(round: RoundState, fuseRemaining: number): void {
    const centerX = 215;
    this.add
      .rectangle(centerX, 300, 310, 220, 0x28303a)
      .setStrokeStyle(2, 0x3b82f6);
    this.add
      .text(centerX, 215, "YOU", {
        fontFamily: "Arial",
        fontSize: "22px",
        fontStyle: "bold",
        color: "#93c5fd",
      })
      .setOrigin(0.5);
    this.playerTotalText = this.add
      .text(centerX, 265, `Total: ${round.playerTotal}`, {
        fontFamily: "Arial",
        fontSize: "34px",
        fontStyle: "bold",
        color: "#ffffff",
      })
      .setOrigin(0.5);
    this.playerChargesText = this.add
      .text(centerX, 315, `Charges: ${round.playerCharges.join(" + ")}`, {
        fontFamily: "Arial",
        fontSize: "20px",
        color: "#cbd5e1",
      })
      .setOrigin(0.5);
    this.drawFuseRow(centerX, 370, fuseRemaining);
  }

  private drawAiPanel(round: RoundState, fuseRemaining: number): void {
    const centerX = 585;
    const aiDisplay = formatAiDisplay(round);
    this.add
      .rectangle(centerX, 300, 310, 220, 0x352932)
      .setStrokeStyle(2, 0xf97316);
    this.add
      .text(centerX, 215, "ROOKIE (AI)", {
        fontFamily: "Arial",
        fontSize: "22px",
        fontStyle: "bold",
        color: "#fdba74",
      })
      .setOrigin(0.5);
    this.aiTotalText = this.add
      .text(centerX, 265, `Total: ${aiDisplay.totalText}`, {
        fontFamily: "Arial",
        fontSize: "34px",
        fontStyle: "bold",
        color: "#ffffff",
      })
      .setOrigin(0.5);
    this.aiChargesText = this.add
      .text(centerX, 315, `Charges: ${aiDisplay.chargesText}`, {
        fontFamily: "Arial",
        fontSize: "20px",
        color: "#cbd5e1",
      })
      .setOrigin(0.5);
    this.drawFuseRow(centerX, 370, fuseRemaining);
  }

  private drawFuseRow(
    centerX: number,
    centerY: number,
    fuseRemaining: number,
  ): void {
    this.add
      .text(centerX - 85, centerY, "Fuse:", {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#cbd5e1",
      })
      .setOrigin(0.5);

    for (let index = 0; index < FUSE_SIZE; index += 1) {
      const isLit = index < fuseRemaining;
      const fillColor = isLit ? 0xf59e0b : 0x3f4756;
      const segmentX = centerX - 20 + index * 48;
      this.add
        .rectangle(segmentX, centerY, 38, 18, fillColor)
        .setStrokeStyle(2, 0xffffff);
    }
  }

  private drawActionButtons(): void {
    this.drawButton(270, 505, "Take charge", 0x2563eb, () => {
      this.handleTakeCharge();
    });
    this.drawButton(530, 505, "Lock in", 0x16a34a, () => {
      this.handleLockIn();
    });
  }

  private drawButton(
    centerX: number,
    centerY: number,
    label: string,
    fillColor: number,
    onClick: () => void,
  ): void {
    this.add
      .rectangle(centerX, centerY, 210, 58, fillColor)
      .setStrokeStyle(2, 0xffffff)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", onClick);
    this.add
      .text(centerX, centerY, label, {
        fontFamily: "Arial",
        fontSize: "24px",
        fontStyle: "bold",
        color: "#ffffff",
      })
      .setOrigin(0.5);
  }
}
