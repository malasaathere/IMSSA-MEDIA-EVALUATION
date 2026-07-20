import { Client, Databases, Users } from "node-appwrite";

export const APPWRITE_DB_ID = "imssa-media";

export function createAdminClient() {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://sgp.cloud.appwrite.io/v1")
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!);

  return {
    get users() {
      return new Users(client);
    },
    get databases() {
      return new Databases(client);
    },
  };
}
