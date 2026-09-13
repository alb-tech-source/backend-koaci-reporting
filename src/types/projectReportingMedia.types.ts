import { z } from "zod";
import {
  createProjectReportingMediaBodySchema,
  presignProjectReportingMediaSchema,
  updateProjectReportingMediaSchema,
  listProjectReportingMediaQuerySchema,
} from "../modules/projectReportingMedia/projectReportingMedia.validation.js";

export type PresignProjectReportingMediaInput = z.infer<
  typeof presignProjectReportingMediaSchema
>;

export type CreateProjectReportingMediaInput = z.infer<
  typeof createProjectReportingMediaBodySchema
> & {
  uploaded_by: string;
};

export type UpdateProjectReportingMediaInput = z.infer<
  typeof updateProjectReportingMediaSchema
>;

export type ListProjectReportingMediaQuery = z.infer<
  typeof listProjectReportingMediaQuerySchema
>;
