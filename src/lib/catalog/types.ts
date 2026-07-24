/**
 * Catalog domain — Locations, Treadmills, Equipment.
 *
 * חוזה משותף בין UI ל־data layer. הרשומות שייכות ל־user יחיד (single-user app);
 * שדה owner_id מיועד לגישור עתידי ל־Supabase RLS. כרגע מאוכלס לערך קבוע ב־mock.
 *
 * כל רשומה תומכת ב:
 *   - soft delete (deleted_at)
 *   - archive (is_active = false, deleted_at = null)
 *   - restore (deleted_at = null, is_active = true)
 * כדי לא לשבור היסטוריה, פריטים בארכיון או במחיקה נשארים ניתנים ל־lookup לפי id.
 */

export type LocationType =
  | "gym_kibbutz"
  | "gym"
  | "home"
  | "hotel"
  | "workplace"
  | "outdoor_route"
  | "park"
  | "trail"
  | "city_area"
  | "custom";

export type EquipmentType =
  | "dumbbells"
  | "barbell"
  | "plates"
  | "bench"
  | "machine"
  | "cable"
  | "pullup_bar"
  | "dip_bar"
  | "band"
  | "kettlebell"
  | "trx"
  | "mat"
  | "cardio"
  | "custom";

export type EquipmentAvailability =
  | "available"
  | "temporarily_unavailable"
  | "maintenance"
  | "removed"
  | "unknown";

export type WeightUnit = "kg" | "lb";

/** רשומת בסיס משותפת לכל האוסף. */
export interface CatalogRecordBase {
  id: string;
  owner_id: string;
  is_favorite: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  /** null = לא מחוק. אם מלא = ב־recycle bin, אך עדיין קיים לגישה מ־lookup. */
  deleted_at: string | null;
}

export interface TrainingLocation extends CatalogRecordBase {
  name: string;
  location_type: LocationType;
  country_code: string | null;
  city: string | null;
  area: string | null;
  address: string | null;
  description: string | null;
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
  is_default: boolean;
}

export interface TreadmillProfile extends CatalogRecordBase {
  location_id: string;
  display_name: string;
  machine_number: string | null;
  manufacturer: string | null;
  model: string | null;
  serial_number: string | null;
  visual_description: string | null;
  /** data-URL קטן (עד 500KB) או URL חיצוני. */
  image_url: string | null;
  notes: string | null;
  first_used_at: string | null;
  last_used_at: string | null;
}

export interface EquipmentItem extends CatalogRecordBase {
  location_id: string;
  name: string;
  equipment_type: EquipmentType;
  manufacturer: string | null;
  model: string | null;
  /** כמות פריטים זהים באותו מקום (למשל 4 זוגות של אותה משקולת). */
  quantity: number;
  min_weight: number | null;
  max_weight: number | null;
  weight_increment: number | null;
  unit: WeightUnit | null;
  availability_status: EquipmentAvailability;
  image_url: string | null;
  notes: string | null;
}

/** DTO ליצירה — ה־layer מייצר id/timestamps/owner. */
export type NewLocation = Omit<
  TrainingLocation,
  "id" | "owner_id" | "created_at" | "updated_at" | "deleted_at" | "is_active" | "is_favorite" | "is_default"
> &
  Partial<Pick<TrainingLocation, "is_favorite" | "is_default">>;

export type NewTreadmill = Omit<
  TreadmillProfile,
  | "id"
  | "owner_id"
  | "created_at"
  | "updated_at"
  | "deleted_at"
  | "is_active"
  | "is_favorite"
  | "first_used_at"
  | "last_used_at"
> &
  Partial<Pick<TreadmillProfile, "is_favorite">>;

export type NewEquipment = Omit<
  EquipmentItem,
  "id" | "owner_id" | "created_at" | "updated_at" | "deleted_at" | "is_active" | "is_favorite"
> &
  Partial<Pick<EquipmentItem, "is_favorite">>;

/** מצב סינון עבור רשימות ציוד. */
export interface EquipmentFilters {
  types: EquipmentType[];
  availability: EquipmentAvailability[];
  favoritesOnly: boolean;
  /** "active" = פעילים בלבד (ברירת מחדל); "archived" = ארכיון בלבד; "all" = כולם. */
  visibility: "active" | "archived" | "all";
}

export const EMPTY_EQUIPMENT_FILTERS: EquipmentFilters = {
  types: [],
  availability: [],
  favoritesOnly: false,
  visibility: "active",
};

export interface LocationFilters {
  favoritesOnly: boolean;
  types: LocationType[];
  visibility: "active" | "archived" | "all";
}

export const EMPTY_LOCATION_FILTERS: LocationFilters = {
  favoritesOnly: false,
  types: [],
  visibility: "active",
};

/** תוצאת validation של דמיון-שם — לצורך אזהרת כפילות בלי חסימה. */
export interface DuplicateWarning<T> {
  hasSimilar: boolean;
  existing: T[];
}
