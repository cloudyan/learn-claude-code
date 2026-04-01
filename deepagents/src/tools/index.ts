import { bashTool } from "./bash.ts";
import { editFileTool } from "./edit-file.ts";
import { listFilesTool } from "./list-files.ts";
import { planTool, readPlanTool } from "./plan.ts";
import { readFileTool } from "./read-file.ts";
import { searchTextTool } from "./search-text.ts";
import { writeFileTool } from "./write-file.ts";

export const basicTools = [listFilesTool, readFileTool];

export const codingTools = [
  listFilesTool,
  searchTextTool,
  readFileTool,
  writeFileTool,
  editFileTool,
  bashTool,
  planTool,
  readPlanTool,
];

export const deepAgentTools = [
  listFilesTool,
  searchTextTool,
  bashTool,
  planTool,
  readPlanTool,
];
