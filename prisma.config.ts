// Prisma 7 config. The CLI does NOT auto-load .env, so we import dotenv here
// and hand the datasource URL to Prisma explicitly.
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
