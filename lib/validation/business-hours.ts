export const DAYS_OF_WEEK = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

export type DayHours = {
  is_open: boolean;
  open_time: string | null;
  close_time: string | null;
};

export type BusinessHours = Record<DayOfWeek, DayHours>;

export type BusinessHoursInput = Partial<
  Record<DayOfWeek, { is_open?: unknown; open_time?: unknown; close_time?: unknown }>
>;

export type BusinessHoursValidation = {
  errors: Partial<Record<DayOfWeek, string>>;
  values: BusinessHours;
};

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

function normalizeTime(value: unknown) {
  const time = String(value ?? "").trim();
  return time || null;
}

function emptyDay(): DayHours {
  return { is_open: false, open_time: null, close_time: null };
}

export function createDefaultBusinessHours(): BusinessHours {
  return DAYS_OF_WEEK.reduce((schedule, day) => {
    schedule[day] = emptyDay();
    return schedule;
  }, {} as BusinessHours);
}

function minutes(value: string) {
  const [hours, mins] = value.split(":").map(Number);
  return hours * 60 + mins;
}

export function validateBusinessHours(
  input: BusinessHoursInput,
): BusinessHoursValidation {
  const values = createDefaultBusinessHours();
  const errors: BusinessHoursValidation["errors"] = {};

  for (const day of DAYS_OF_WEEK) {
    const entry = input[day];
    if (!entry) continue;

    const isOpen = entry.is_open === true;
    const openTime = normalizeTime(entry.open_time);
    const closeTime = normalizeTime(entry.close_time);
    values[day] = {
      is_open: isOpen,
      open_time: isOpen ? openTime : null,
      close_time: isOpen ? closeTime : null,
    };

    if (!isOpen) continue;
    if (!openTime || !closeTime) {
      errors[day] = "Opening and closing times are required for open days.";
      continue;
    }
    if (!timePattern.test(openTime) || !timePattern.test(closeTime)) {
      errors[day] = "Use valid times in 24-hour format.";
      continue;
    }
    if (minutes(closeTime) <= minutes(openTime)) {
      errors[day] = "Closing time must be later than opening time.";
    }
  }

  return { errors, values };
}

export function isBusinessHoursInput(value: unknown): value is BusinessHoursInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.keys(value).every((key) =>
    DAYS_OF_WEEK.includes(key as DayOfWeek),
  );
}
