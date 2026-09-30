import {
  normalizeCaptureDatabaseV1
} from "../../../contracts/capture-database-v1.js";

export function exportCaptureDatabaseJsonV1(
  input
) {
  const database =
    normalizeCaptureDatabaseV1(input);

  return JSON.stringify(
    database,
    null,
    2
  );
}

export function importCaptureDatabaseJsonV1(
  jsonText
) {
  if (typeof jsonText !== "string") {
    throw new TypeError(
      "Capture Database JSON input must be a string"
    );
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch (error) {
    throw new SyntaxError(
      "Invalid Capture Database JSON: " +
        error.message
    );
  }

  return normalizeCaptureDatabaseV1(
    parsed
  );
}
