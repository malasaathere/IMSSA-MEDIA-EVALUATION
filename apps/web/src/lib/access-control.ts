export type WorkspaceRole =
  | "ADMIN"
  | "CHIEF_COORDINATOR"
  | "MARKETING_COORDINATOR"
  | "DESIGNER"
  | "VIDEO_EDITOR"
  | "MEDIA_DIRECTOR"
  | "CONTENT_WRITER"
  | "WRITER";

export function normalizeRoles(roles: string[] = []): string[] {
  return roles.map((role) => role.trim().toUpperCase().replace(/\s+/g, "_"));
}

const routeRoles: Array<{ prefix: string; roles: WorkspaceRole[] }> = [
  { prefix: "/admin", roles: ["ADMIN"] },
  { prefix: "/analytics", roles: ["ADMIN", "CHIEF_COORDINATOR"] },
  { prefix: "/designer", roles: ["ADMIN", "DESIGNER", "VIDEO_EDITOR"] },
  { prefix: "/director", roles: ["ADMIN", "MEDIA_DIRECTOR"] },
  { prefix: "/marketing-plan", roles: ["ADMIN", "MARKETING_COORDINATOR", "CONTENT_WRITER", "WRITER"] },
  { prefix: "/writer", roles: ["ADMIN", "MARKETING_COORDINATOR", "CONTENT_WRITER", "WRITER"] },
  { prefix: "/calendar", roles: ["ADMIN", "MARKETING_COORDINATOR", "DESIGNER", "VIDEO_EDITOR", "MEDIA_DIRECTOR", "CONTENT_WRITER", "WRITER"] },
  { prefix: "/profile", roles: ["ADMIN", "CHIEF_COORDINATOR", "MARKETING_COORDINATOR", "DESIGNER", "VIDEO_EDITOR", "MEDIA_DIRECTOR", "CONTENT_WRITER", "WRITER"] },
  { prefix: "/", roles: ["ADMIN", "MARKETING_COORDINATOR"] },
];

export function canAccessPath(pathname: string, roles: string[] = []): boolean {
  const normalized = normalizeRoles(roles);
  if (normalized.includes("ADMIN")) return true;
  const rule = routeRoles.find(({ prefix }) => prefix === "/" ? pathname === "/" : pathname.startsWith(prefix));
  return rule ? rule.roles.some((role) => normalized.includes(role)) : true;
}

export function primaryRoleLabel(roles: string[] = []): string {
  const normalized = normalizeRoles(roles);
  const priority = ["ADMIN", "CHIEF_COORDINATOR", "MARKETING_COORDINATOR", "MEDIA_DIRECTOR", "DESIGNER", "VIDEO_EDITOR", "CONTENT_WRITER", "WRITER"];
  const role = priority.find((candidate) => normalized.includes(candidate));
  return role ? role.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()) : "Team Member";
}

export function isChiefCommentator(roles: string[] = []): boolean {
  return normalizeRoles(roles).includes("CHIEF_COORDINATOR");
}

function eventKey(value: string = ""): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "").replace(/\d+$/g, "");
}

export function matchesAuthorizedEvent(item: any, authorizedEvents: string[] = []): boolean {
  const itemEvent = eventKey(item?.campaign || item?.eventName || item?.eventId || "");
  return Boolean(itemEvent) && authorizedEvents.some((event) => eventKey(event) === itemEvent);
}

export function canEditMarketingPlan(plan: any, roles: string[] = [], authorizedEvents: string[] = []): boolean {
  const normalized = normalizeRoles(roles);
  if (normalized.includes("ADMIN")) return true;
  if (normalized.includes("CHIEF_COORDINATOR")) return false;
  if (!normalized.includes("MARKETING_COORDINATOR")) return false;
  return matchesAuthorizedEvent(plan, authorizedEvents);
}
