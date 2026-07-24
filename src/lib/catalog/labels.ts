/**
 * Human labels for enums — עברית, RTL.
 * מרוכזים בקובץ אחד כדי לאפשר החלפה עתידית ל־i18n מבלי לגעת ב־UI פרטני.
 */
import type {
  EquipmentAvailability,
  EquipmentType,
  LocationType,
  WeightUnit,
} from "./types";

export const LOCATION_TYPE_LABEL: Record<LocationType, string> = {
  gym_kibbutz: "חדר כושר בקיבוץ",
  gym: "חדר כושר",
  home: "בית",
  hotel: "מלון",
  workplace: "מקום עבודה",
  outdoor_route: "מסלול חוץ",
  park: "פארק",
  trail: "שביל",
  city_area: "עיר או אזור",
  custom: "מקום מותאם אישית",
};

export const LOCATION_TYPES_ORDERED: LocationType[] = [
  "gym_kibbutz",
  "gym",
  "home",
  "hotel",
  "workplace",
  "outdoor_route",
  "park",
  "trail",
  "city_area",
  "custom",
];

export const EQUIPMENT_TYPE_LABEL: Record<EquipmentType, string> = {
  dumbbells: "משקולות יד",
  barbell: "מוט",
  plates: "פלטות",
  bench: "ספסל",
  machine: "מכונה",
  cable: "כבל או פולי",
  pullup_bar: "מתח",
  dip_bar: "מקבילים",
  band: "גומיות",
  kettlebell: "קטלבל",
  trx: "TRX",
  mat: "מזרן",
  cardio: "ציוד אירובי",
  custom: "מותאם אישית",
};

export const EQUIPMENT_TYPES_ORDERED: EquipmentType[] = [
  "dumbbells",
  "barbell",
  "plates",
  "bench",
  "machine",
  "cable",
  "pullup_bar",
  "dip_bar",
  "band",
  "kettlebell",
  "trx",
  "mat",
  "cardio",
  "custom",
];

export const AVAILABILITY_LABEL: Record<EquipmentAvailability, string> = {
  available: "זמין",
  temporarily_unavailable: "לא זמין זמנית",
  maintenance: "תחזוקה",
  removed: "הוסר",
  unknown: "לא ידוע",
};

export const AVAILABILITY_ORDERED: EquipmentAvailability[] = [
  "available",
  "temporarily_unavailable",
  "maintenance",
  "removed",
  "unknown",
];

export const AVAILABILITY_TONE: Record<
  EquipmentAvailability,
  "success" | "warning" | "info" | "default"
> = {
  available: "success",
  temporarily_unavailable: "warning",
  maintenance: "info",
  removed: "default",
  unknown: "default",
};

export const WEIGHT_UNIT_LABEL: Record<WeightUnit, string> = {
  kg: "ק״ג",
  lb: "ליברה",
};
