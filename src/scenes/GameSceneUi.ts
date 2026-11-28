import Phaser from "phaser";
import type { AiTurnState } from "../core/ai";
import { FUSE_SIZE } from "../core/config";
import type { RoundState } from "../core/round";

const PANEL_CENTER_X = 240;
const PANEL_WIDTH = 424;
const PANEL_HEIGHT = 176;
const BUTTON_WIDTH = 204;
const BUTTON_HEIGHT = 76;
const BUTTON_Y = 652;

export type RoundDisplay = {
  playerTotalText: Phaser.GameObjects.Text;
  playerChargesText: Phaser.GameObjects.Text;
  aiTotalText: Phaser.GameObjects.Text;
  aiChargesText: Phaser.GameObjects.Text;
  aiTauntText: Phaser.GameObjects.Text;
};
type AiDisplay = {
  chargesText: string;
  totalText: string;
};
// Draws both player panels stacked for portrait play and returns dynamic texts.
export function drawRoundPanels(
  scene: Phaser.Scene,
  round: RoundState,
  playerFuse: number,
  aiFuse: number,
): RoundDisplay {
  const playerText = drawPlayerPanel(scene, round, playerFuse);
  const aiText = drawAiPanel(scene, round, aiFuse);
  const aiTauntText = drawAiTauntText(scene);

  return {
    ...playerText,
    ...aiText,
    aiTauntText,
  };
}
// Updates the panel text and AI taunt after a player or AI step.
export function updateRoundDisplay(
  display: RoundDisplay,
  round: RoundState,
  aiTurn: AiTurnState,
): void {
  display.playerTotalText.setText(`Total: ${round.playerTotal}`);
  display.playerChargesText.setText(
    `Charges: ${round.playerCharges.join(" + ")}`,
  );
  const aiDisplay = formatAiDisplay(round, aiTurn.isHiddenChargeRevealed);
  display.aiTotalText.setText(`Total: ${aiDisplay.totalText}`);
  display.aiChargesText.setText(`Charges: ${aiDisplay.chargesText}`);
  display.aiTauntText.setText(
    aiTurn.currentTaunt ? `"${aiTurn.currentTaunt}"` : "",
  );
}
// Draws large touch-friendly action buttons and connects them to controls.
export function drawActionButtons(
  scene: Phaser.Scene,
  onTakeCharge: () => void,
  onLockIn: () => void,
): void {
  drawButton(scene, 130, BUTTON_Y, "Take charge", 0x2563eb, onTakeCharge);
  drawButton(scene, 350, BUTTON_Y, "Lock in", 0x16a34a, onLockIn);
}
function drawPlayerPanel(
  scene: Phaser.Scene,
  round: RoundState,
  fuseRemaining: number,
): {
  playerTotalText: Phaser.GameObjects.Text;
  playerChargesText: Phaser.GameObjects.Text;
} {
  scene.add
    .rectangle(PANEL_CENTER_X, 266, PANEL_WIDTH, PANEL_HEIGHT, 0x28303a)
    .setStrokeStyle(2, 0x3b82f6);
  scene.add
    .text(PANEL_CENTER_X, 200, "YOU", {
      fontFamily: "Arial",
      fontSize: "22px",
      fontStyle: "bold",
      color: "#93c5fd",
    })
    .setOrigin(0.5);
  const playerTotalText = scene.add
    .text(PANEL_CENTER_X, 242, `Total: ${round.playerTotal}`, {
      fontFamily: "Arial",
      fontSize: "32px",
      fontStyle: "bold",
      color: "#ffffff",
    })
    .setOrigin(0.5);
  const playerChargesText = scene.add
    .text(PANEL_CENTER_X, 284, `Charges: ${round.playerCharges.join(" + ")}`, {
      fontFamily: "Arial",
      fontSize: "20px",
      color: "#cbd5e1",
      align: "center",
      wordWrap: { width: 396 },
    })
    .setOrigin(0.5);
  drawFuseRow(scene, PANEL_CENTER_X, 326, fuseRemaining);
  return { playerTotalText, playerChargesText };
}
function drawAiPanel(
  scene: Phaser.Scene,
  round: RoundState,
  fuseRemaining: number,
): {
  aiTotalText: Phaser.GameObjects.Text;
  aiChargesText: Phaser.GameObjects.Text;
} {
  const aiDisplay = formatAiDisplay(round, false);
  scene.add
    .rectangle(PANEL_CENTER_X, 462, PANEL_WIDTH, PANEL_HEIGHT, 0x352932)
    .setStrokeStyle(2, 0xf97316);
  scene.add
    .text(PANEL_CENTER_X, 396, "ROOKIE (AI)", {
      fontFamily: "Arial",
      fontSize: "22px",
      fontStyle: "bold",
      color: "#fdba74",
    })
    .setOrigin(0.5);
  const aiTotalText = scene.add
    .text(PANEL_CENTER_X, 438, `Total: ${aiDisplay.totalText}`, {
      fontFamily: "Arial",
      fontSize: "32px",
      fontStyle: "bold",
      color: "#ffffff",
    })
    .setOrigin(0.5);
  const aiChargesText = scene.add
    .text(PANEL_CENTER_X, 480, `Charges: ${aiDisplay.chargesText}`, {
      fontFamily: "Arial",
      fontSize: "20px",
      color: "#cbd5e1",
      align: "center",
      wordWrap: { width: 396 },
    })
    .setOrigin(0.5);
  drawFuseRow(scene, PANEL_CENTER_X, 522, fuseRemaining);
  return { aiTotalText, aiChargesText };
}
function drawAiTauntText(scene: Phaser.Scene): Phaser.GameObjects.Text {
  return scene.add
    .text(PANEL_CENTER_X, 580, "", {
      fontFamily: "Arial",
      fontSize: "20px",
      fontStyle: "italic",
      color: "#fdba74",
      align: "center",
      wordWrap: { width: PANEL_WIDTH },
    })
    .setOrigin(0.5);
}
function formatAiDisplay(
  round: RoundState,
  isHiddenChargeRevealed: boolean,
): AiDisplay {
  const isChargeHidden = !isHiddenChargeRevealed;
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
function drawFuseRow(
  scene: Phaser.Scene,
  centerX: number,
  centerY: number,
  fuseRemaining: number,
): void {
  scene.add
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
    scene.add
      .rectangle(segmentX, centerY, 38, 18, fillColor)
      .setStrokeStyle(2, 0xffffff);
  }
}
function drawButton(
  scene: Phaser.Scene,
  centerX: number,
  centerY: number,
  label: string,
  fillColor: number,
  onClick: () => void,
): void {
  scene.add
    .rectangle(centerX, centerY, BUTTON_WIDTH, BUTTON_HEIGHT, fillColor)
    .setStrokeStyle(2, 0xffffff)
    .setInteractive({ useHandCursor: true })
    .on("pointerdown", onClick);
  scene.add
    .text(centerX, centerY, label, {
      fontFamily: "Arial",
      fontSize: "24px",
      fontStyle: "bold",
      color: "#ffffff",
    })
    .setOrigin(0.5);
}
