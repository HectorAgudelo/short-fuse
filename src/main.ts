import Phaser from "phaser";
import { GameScene } from "./scenes/GameScene";
import { MatchOverScene } from "./scenes/MatchOverScene";
import { TitleScene } from "./scenes/TitleScene";

new Phaser.Game({
  type: Phaser.AUTO,
  width: 480,
  height: 800,
  backgroundColor: "#20242b",
  parent: "game",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [TitleScene, GameScene, MatchOverScene],
});
