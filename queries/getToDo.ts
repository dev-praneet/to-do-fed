import callAPI from "../utils/callAPI";

export function getToDo(): Promise<{ pages: { name: string }[] }> {
  return callAPI({ endPoint: "/pages" });
}

export function addPage() {
  return callAPI({ endPoint: "/page/new", method: "POST" });
}
