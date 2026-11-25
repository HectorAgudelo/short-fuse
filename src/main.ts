import Phaser from "phaser";
import { GameScene } from "./scenes/GameScene";
import { MatchOverScene } from "./scenes/MatchOverScene";
import { TitleScene } from "./scenes/TitleScene";

new Phaser.Game({
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: "#20242b",
  parent: "game",
  scene: [TitleScene, GameScene, MatchOverScene],
});
