import Phaser from "phaser";

export type MatchOverData = {
  winner?: "player" | "ai" | null;
};

export class MatchOverScene extends Phaser.Scene {
  private winner: "player" | "ai" | null = null;

  constructor() {
    super({ key: "MatchOverScene" });
  }

  init(data: MatchOverData): void {
    this.winner = data.winner ?? null;
  }

  create(): void {
    this.drawResultCard();
    this.drawPlayAgainButton();
    this.bindKeyboardShortcuts();
  }

  private drawResultCard(): void {
    const isPlayerWinner = this.winner === "player";
    const winnerLabel = isPlayerWinner
      ? "You win the match!"
      : "Rookie wins the match!";
    const winnerColor = isPlayerWinner ? "#4ade80" : "#f87171";

    this.add
      .rectangle(400, 235, 440, 170, 0x2c323d)
      .setStrokeStyle(3, 0xf59e0b);
    this.add
      .text(400, 205, "MATCH OVER", {
        fontFamily: "Arial",
        fontSize: "48px",
        fontStyle: "bold",
        color: "#ffffff",
      })
      .setOrigin(0.5);
    this.add
      .text(400, 268, winnerLabel, {
        fontFamily: "Arial",
        fontSize: "28px",
        fontStyle: "bold",
        color: winnerColor,
      })
      .setOrigin(0.5);
  }

  private drawPlayAgainButton(): void {
    this.add
      .rectangle(400, 405, 220, 60, 0x2563eb)
      .setStrokeStyle(2, 0xffffff)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        this.startNewMatch();
      });
    this.add
      .text(400, 405, "Play again", {
        fontFamily: "Arial",
        fontSize: "24px",
        fontStyle: "bold",
        color: "#ffffff",
      })
      .setOrigin(0.5);
  }

  private startNewMatch(): void {
    this.scene.start("GameScene", { seed: Date.now() });
  }

  private bindKeyboardShortcuts(): void {
    this.input.keyboard?.removeAllListeners("keydown-ENTER");
    this.input.keyboard?.on("keydown-ENTER", () => {
      this.startNewMatch();
    });
  }
}
