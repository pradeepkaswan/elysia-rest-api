import { Elysia, t } from "elysia";
import { createDb } from "./db";
import { faker } from "@faker-js/faker";

const app = new Elysia()
  .decorate("db", createDb())
  .get("/", (context) => "Hello Elysia")
  .post("/seed", ({ db }) => {
    console.log("Seeding database with test data");

    const insertUserQuery = db.prepare(
      "INSERT INTO users (first_name, last_name, email, about) VALUES ($first_name, $last_name, $email, $about) RETURNING *",
    );

    for (let i = 0; i < 100; i++) {
      insertUserQuery.run({
        $first_name: faker.person.firstName(),
        $last_name: faker.person.lastName(),
        $email: faker.internet.email(),
        $about: faker.lorem.paragraph(),
      });
    }

    return "done";
  })
  .get(
    "/users",
    ({ db, query }) => {
      const limit = query.limit;
      console.log(`getting the list of users: ${limit}`);
      return db
        .query("SELECT * FROM users order by created_at desc LIMIT $limit")
        .all({ $limit: limit });
    },
    { query: t.Object({ limit: t.Numeric() }) },
  )
  .get(
    "/users/:id",
    ({ db, params }) => {
      const userId = params.id;
      console.log(`getting user by id: ${userId}`);
      return db.query("SELECT * FROM users WHERE user_id = $user_id").get({
        $user_id: userId,
      });
    },
    {
      params: t.Object({ id: t.Numeric() }),
    },
  )
  .post(
    "/users",
    ({ db, body }) => {
      const insertUserQuery = db.prepare(
        "INSERT INTO users (first_name, last_name, email, about) VALUES ($first_name, $last_name, $email, $about) RETURNING *",
      );

      return insertUserQuery.get({
        $first_name: body.first_name,
        $last_name: body.last_name,
        $email: body.email,
        $about: body.about || null,
      });
    },
    {
      body: t.Object({
        first_name: t.String(),
        last_name: t.String(),
        email: t.String(),
        about: t.Optional(t.String()),
      }),
    },
  )
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}: ${app.server?.port}`,
);
