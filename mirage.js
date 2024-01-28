import {
  createServer,
  Model,
  hasMany,
  belongsTo,
  JSONAPISerializer,
  RestSerializer,
} from "miragejs";
import { NOTE_STATUS } from "./constant/constant";

const ApplicationSerializer = RestSerializer.extend({});

export function makeServer({ environment = "test" } = {}) {
  const server = createServer({
    environment,
    models: {
      page: Model.extend({
        notes: hasMany(),
      }),
      note: Model.extend({
        page: belongsTo(),
      }),
    },
    serializers: {
      application: ApplicationSerializer,
      includeNotes: ApplicationSerializer.extend({
        include: ["notes"],
      }),
    },

    seeds(server) {
      const pages = [
        "Tasks",
        "Articles",
        "Links",
        "Finance",
        "Books",
        "Health",
      ];
      pages.forEach((page) => {
        const createdPage = server.create("page", { name: page });
        Array.from({ length: 8 }).forEach((_, index) => {
          server.create("note", {
            title: `${page} note ${index + 1}`,
            description: `description - ${index + 1}`,
            page: createdPage,
            status:
              Object.values(NOTE_STATUS)[
                index % Object.values(NOTE_STATUS).length
              ],
          });
        });
      });
    },

    routes() {
      this.namespace = "/api";
      this.timing = 500;

      this.get("/pages", (schema) => {
        return schema.pages.all();
      });

      this.post("/page/new", (schema, req) => {
        return schema.pages.create({ name: "" });
      });

      this.get("/page/:id", function (schema, req) {
        const {
          params: { id },
        } = req;
        const pageData = schema.pages.find(id);
        const serializedPageData = this.serialize(pageData, "include-notes");
        return serializedPageData;
      });

      this.patch("/page/:id", function (schema, req) {
        const {
          params: { id },
          requestBody,
        } = req;
        const parsedBody = JSON.parse(requestBody);
        const page = schema.pages.find(id);
        const updatedPage = page.update({ name: parsedBody.title });
        return updatedPage;
      });

      this.post("note/new", (schema, req) => {
        const { requestBody } = req;
        const parsedBody = JSON.parse(requestBody);
        const { pageId, noteStatusKey } = parsedBody;
        const page = schema.pages.find(pageId);
        return schema.notes.create({
          title: "",
          description: "",
          page,
          status: NOTE_STATUS[noteStatusKey],
        });
      });

      // resets the namespace to the root
      this.namespace = ""; // or this.namespace = "/"
      this.passthrough(); // now this will pass through everything not handled to the current domain (e.g. localhost:3000)
    },
  });

  return server;
}
