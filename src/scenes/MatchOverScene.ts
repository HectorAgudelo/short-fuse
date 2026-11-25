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
    const isPlayerWinner = this.winner === "player";
    const winnerLabel = isPlayerWinner
      ? "You win the match!"
      : "Rookie wins the match!";
    const winnerColor = isPlayerWinner ? "#4ade80" : "#f87171";

    this.add
      .text(400, 265, "MATCH OVER", {
        fontFamily: "Arial",
        fontSize: "48px",
        fontStyle: "bold",
        color: "#ffffff",
      })
      .setOrigin(0.5);
    this.add
      .text(400, 335, winnerLabel, {
        fontFamily: "Arial",
        fontSize: "28px",
        fontStyle: "bold",
        color: winnerColor,
      })
      .setOrigin(0.5);
  }
}
