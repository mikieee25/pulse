export const EQUIPMENT_FILTER_STATUSES = [
  "Active",
  "Expiring soon",
  "For Replacement",
  "Broken",
  "Retired",
] as const;
export type EquipmentFilterStatus =
  "" | (typeof EQUIPMENT_FILTER_STATUSES)[number];
export type EquipmentAssignmentFilter = "" | "unassigned";

export type EquipmentFilters = {
  q: string;
  division: string;
  brand: string;
  status: EquipmentFilterStatus;
  assignment: EquipmentAssignmentFilter;
  page: number;
  pageSize?: number;
};

type SearchInput =
  URLSearchParams | Record<string, string | string[] | undefined>;

function valueOf(input: SearchInput, key: string) {
  if (input instanceof URLSearchParams) return input.get(key) || "";
  const value = input[key];
  return (Array.isArray(value) ? value[0] : value) || "";
}

function textValue(input: SearchInput, key: string) {
  return valueOf(input, key).trim();
}

export function parseEquipmentFilters(input: SearchInput): EquipmentFilters {
  const status = textValue(input, "status");
  const page = Number.parseInt(textValue(input, "page"), 10);
  const requestedPageSize = Number.parseInt(textValue(input, "pageSize"), 10);
  return {
    q: textValue(input, "q"),
    division: textValue(input, "division"),
    brand: textValue(input, "brand"),
    status: (EQUIPMENT_FILTER_STATUSES as readonly string[]).includes(status)
      ? (status as EquipmentFilterStatus)
      : "",
    assignment:
      textValue(input, "assignment") === "unassigned" ? "unassigned" : "",
    page: Number.isInteger(page) && page > 0 ? page : 1,
    pageSize: [10, 25, 50].includes(requestedPageSize) ? requestedPageSize : 25,
  };
}

export function equipmentFiltersQuery(
  filters: EquipmentFilters,
  category?: string
) {
  const query = new URLSearchParams();
  const categoryValue = category?.trim() || "";
  if (categoryValue) query.set("category", categoryValue);
  if (filters.q) query.set("q", filters.q);
  if (filters.division) query.set("division", filters.division);
  if (filters.brand) query.set("brand", filters.brand);
  if (filters.status) query.set("status", filters.status);
  if (filters.assignment) query.set("assignment", filters.assignment);
  if (filters.page > 1) query.set("page", String(filters.page));
  if (filters.pageSize && filters.pageSize !== 25)
    query.set("pageSize", String(filters.pageSize));
  return query.toString();
}
