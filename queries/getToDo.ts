export function getToDo(): Promise<{ pages: { name: string }[] }> {
  return fetch("/api/pages").then((res) => res.json());
}
