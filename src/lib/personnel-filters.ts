export type PersonnelFilters = {
  q: string;
  division: string;
  status: string;
  assignment: "" | "assigned" | "unassigned";
  page: number;
  pageSize: number;
};

type Input = URLSearchParams | Record<string, string | undefined>;
const value = (input: Input, key: string) =>
  (input instanceof URLSearchParams ? input.get(key) : input[key])?.trim() ||
  "";

export function parsePersonnelFilters(input: Input): PersonnelFilters {
  const page = Number.parseInt(value(input, "page"), 10);
  const requestedSize = Number.parseInt(value(input, "pageSize"), 10);
  const assignment = value(input, "assignment");
  return {
    q: value(input, "q"),
    division: value(input, "division"),
    status: value(input, "status"),
    assignment:
      assignment === "assigned" || assignment === "unassigned"
        ? assignment
        : "",
    page: Number.isInteger(page) && page > 0 ? page : 1,
    pageSize: [10, 25, 50].includes(requestedSize) ? requestedSize : 25,
  };
}

export function personnelFiltersQuery(filters: PersonnelFilters) {
  const query = new URLSearchParams();
  if (filters.q) query.set("q", filters.q);
  if (filters.division) query.set("division", filters.division);
  if (filters.status) query.set("status", filters.status);
  if (filters.assignment) query.set("assignment", filters.assignment);
  if (filters.page > 1) query.set("page", String(filters.page));
  if (filters.pageSize !== 25) query.set("pageSize", String(filters.pageSize));
  return query.toString();
}
