import { ValidationError } from "./errors.js";

export function normalizeDate(input) {
  if (!input) return null;

  let date;
  if (input instanceof Date) {
    date = input;
  }
  else if (/^\d{4}-\d{2}-\d{2}/.test(input)) {
    date = new Date(input);
  }
  else if (/^\d{4}\/\d{2}\/\d{2}$/.test(input)) {
    const [y, m, d] = input.split("/");
    date = new Date(`${y}-${m}-${d}`);
  }
  else {
    throw new ValidationError({ message: "Unsupported date format"});
  }

  if (isNaN(date.getTime())) {
    throw new ValidationError({ message: "Invalid date" });
  }

  return date;
}