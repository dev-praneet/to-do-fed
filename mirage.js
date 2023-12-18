import {
  createServer,
  Model,
  hasMany,
  belongsTo,
  JSONAPISerializer,
  RestSerializer,
} from "miragejs";

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
        Array.from({ length: 5 }).forEach((_, index) => {
          server.create("note", {
            title: `${page} note ${index}`,
            page: createdPage,
          });
        });
      });
    },

    routes() {
      this.namespace = "/api";
      this.timing = 2000;

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

      // resets the namespace to the root
      this.namespace = ""; // or this.namespace = "/"
      this.passthrough(); // now this will pass through everything not handled to the current domain (e.g. localhost:3000)
    },
  });

  return server;
}
