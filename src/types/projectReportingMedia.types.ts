import { z } from "zod";
import {
  createProjectReportingMediaBodySchema,
  updateProjectReportingMediaSchema,
  listProjectReportingMediaQuerySchema,
} from "../modules/projectReportingMedia/projectReportingMedia.validation.js";

export type CreateProjectReportingMediaInput = z.infer<
  typeof createProjectReportingMediaBodySchema
> & {
  buffer: Buffer;
  mime_type: string;
  uploaded_by: string;
};

export type UpdateProjectReportingMediaInput = z.infer<
  typeof updateProjectReportingMediaSchema
>;

export type ListProjectReportingMediaQuery = z.infer<
  typeof listProjectReportingMediaQuerySchema
>;
