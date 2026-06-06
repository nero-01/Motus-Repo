export interface OCRSpaceLine {
  LineText?: string;
  Words?: Array<{ WordText?: string; Confidence?: string }>;
}

export interface OCRSpaceParsedResult {
  ParsedText?: string;
  ErrorMessage?: string;
  FileParseExitCode?: number;
  TextOrientation?: string;
  TextOverlay?: {
    Lines?: OCRSpaceLine[];
  };
}

export interface OCRSpaceResponse {
  OCRExitCode?: number;
  IsErroredOnProcessing?: boolean;
  ErrorMessage?: string | string[];
  ProcessingTimeInMilliseconds?: string;
  ParsedResults?: OCRSpaceParsedResult[];
}

export interface OCRResult {
  text: string;
  confidence?: number;
}
