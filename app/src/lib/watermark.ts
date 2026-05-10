import { s3Key } from "~/lib/s3";

/** S3 key for the active watermark PNG. */
export const WATERMARK_KEY = s3Key("watermarks/active.png");
