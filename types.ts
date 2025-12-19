import { Color } from 'three';

export enum TreeState {
  SCATTERED = 'SCATTERED',
  TREE_SHAPE = 'TREE_SHAPE'
}

export interface OrnamentData {
  id: number;
  type: 'box' | 'sphere' | 'star';
  scatterPos: [number, number, number];
  treePos: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  color: Color;
  weight: number; // 0.1 (light) to 1.0 (heavy), affects morph speed
}

export const COLORS = {
  EMERALD_DEEP: "#00241B",
  EMERALD_LITE: "#0B4F3C",
  GOLD_METALLIC: "#D4AF37",
  GOLD_ROSE: "#E6C288",
  WHITE_WARM: "#FFFDD0",
  RED_VELVET: "#4a0404"
};