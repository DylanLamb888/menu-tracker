export type AnnotationTool = "pen" | "text" | "checkmark" | "highlight";

export interface Point {
  x: number;
  y: number;
}

export interface PenData {
  type: "pen";
  points: Point[];
  strokeWidth: number;
}

export interface TextData {
  type: "text";
  x: number;
  y: number;
  content: string;
  fontSize: number;
}

export interface CheckmarkData {
  type: "checkmark";
  x: number;
  y: number;
  size: number;
}

export interface HighlightData {
  type: "highlight";
  x: number;
  y: number;
  width: number;
  height: number;
}

export type AnnotationData = PenData | TextData | CheckmarkData | HighlightData;

export interface AnnotationWithAuthor {
  id: string;
  versionId: string;
  pageNumber: number;
  authorId: string;
  authorName: string;
  tool: AnnotationTool;
  color: string;
  data: AnnotationData;
  createdAt: Date;
}

export const ANNOTATION_COLORS = {
  coral: "#E07A5F",
  blue: "#3B82F6",
  black: "#3D2E2E",
} as const;

export type AnnotationColor = (typeof ANNOTATION_COLORS)[keyof typeof ANNOTATION_COLORS];
