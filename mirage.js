import { default as x, createServer, Model } from "miragejs";

export function makeServer({ environment = "test" } = {}) {
  const server = createServer({
    environment,
    models: {
      page: Model,
    },

    seeds(server) {
      server.create("page", { name: "Tasks" });
      server.create("page", { name: "Articles" });
      server.create("page", { name: "Links" });
      server.create("page", { name: "Finance" });
      server.create("page", { name: "Books" });
      server.create("page", { name: "Health" });
    },

    routes() {
      this.namespace = "/api";

      this.get("/pages", (schema) => {
        return schema.pages.all();
      });

      this.post("/page/new", (schema, req) => {
        return schema.pages.create({ name: "untitled" });
      });

      // resets the namespace to the root
      this.namespace = ""; // or this.namespace = "/"
      this.passthrough(); // now this will pass through everything not handled to the current domain (e.g. localhost:3000)
    },
  });

  return server;
}
