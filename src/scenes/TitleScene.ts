import Phaser from "phaser";

const CENTER_X = 240;
const MUTE_OFF_COLOR = 0x334155;
const MUTE_ON_COLOR = 0xdc2626;
const MUTE_REGISTRY_KEY = "isMuted";

export class TitleScene extends Phaser.Scene {
  private muteButtonBg?: Phaser.GameObjects.Rectangle;
  private muteButtonLabel?: Phaser.GameObjects.Text;

  constructor() {
    super({ key: "TitleScene" });
  }

  create(): void {
    const isMuted = Boolean(this.registry.get(MUTE_REGISTRY_KEY));
    this.sound.setMute(isMuted);

    this.drawTitleHeader();
    this.drawPlayButton();
    this.drawMuteButton();
    this.refreshMuteButton(isMuted);
    this.bindKeyboardShortcuts();
  }

  private drawTitleHeader(): void {
    this.add
      .rectangle(CENTER_X, 240, 420, 170, 0x2c323d)
      .setStrokeStyle(3, 0xf59e0b);
    this.add
      .text(CENTER_X, 216, "SHORT FUSE", {
        fontFamily: "Arial",
        fontSize: "48px",
        fontStyle: "bold",
        color: "#ffffff",
      })
      .setOrigin(0.5);
    this.add
      .text(CENTER_X, 278, "Beat the bomb's code without overloading", {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#f59e0b",
        align: "center",
        wordWrap: { width: 380 },
      })
      .setOrigin(0.5);
  }

  private drawPlayButton(): void {
    this.add
      .rectangle(CENTER_X, 440, 280, 76, 0x16a34a)
      .setStrokeStyle(2, 0xffffff)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        this.startNewMatch();
      });
    this.add
      .text(CENTER_X, 440, "Play", {
        fontFamily: "Arial",
        fontSize: "28px",
        fontStyle: "bold",
        color: "#ffffff",
      })
      .setOrigin(0.5);
  }

  private drawMuteButton(): void {
    this.muteButtonBg = this.add
      .rectangle(CENTER_X, 548, 280, 72, MUTE_OFF_COLOR)
      .setStrokeStyle(2, 0xffffff)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        this.toggleMute();
      });
    this.muteButtonLabel = this.add
      .text(CENTER_X, 548, "Mute: OFF", {
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

  private toggleMute(): void {
    const isCurrentlyMuted = Boolean(this.registry.get(MUTE_REGISTRY_KEY));
    const isNextMuted = !isCurrentlyMuted;
    this.registry.set(MUTE_REGISTRY_KEY, isNextMuted);
    this.sound.setMute(isNextMuted);
    this.refreshMuteButton(isNextMuted);
  }

  private refreshMuteButton(isMuted: boolean): void {
    if (!this.muteButtonBg || !this.muteButtonLabel) {
      return;
    }
    this.muteButtonBg.setFillStyle(isMuted ? MUTE_ON_COLOR : MUTE_OFF_COLOR);
    this.muteButtonLabel.setText(isMuted ? "Mute: ON" : "Mute: OFF");
  }

  private bindKeyboardShortcuts(): void {
    this.input.keyboard?.removeAllListeners("keydown-ENTER");
    this.input.keyboard?.removeAllListeners("keydown-M");
    this.input.keyboard?.on("keydown-ENTER", () => {
      this.startNewMatch();
    });
    this.input.keyboard?.on("keydown-M", () => {
      this.toggleMute();
    });
  }
}
