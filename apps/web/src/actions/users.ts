"use server";

import { Client, Databases, Users, ID } from "node-appwrite";

const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "";
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY || "";
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "imssa-media";
const USERS_COLLECTION = "users";

export async function createUser(name: string, role: string) {
  if (!APPWRITE_API_KEY) {
    throw new Error("Server configuration error: missing API key.");
  }

  const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setKey(APPWRITE_API_KEY);

  const databases = new Databases(client);
  const appwriteUsers = new Users(client);

  try {
    // Generate a random 4-digit PIN
    const passkey = Math.floor(1000 + Math.random() * 9000).toString();
    const syntheticEmail = `${passkey}@imssa.local`;
    const paddedPassword = `${passkey}0000`; // Must be 8 characters

    // Create user in Appwrite Auth
    const authUser = await appwriteUsers.create(
      ID.unique(),
      syntheticEmail,
      null,
      paddedPassword,
      name
    );

    // Create record in `users` collection
    await databases.createDocument(
      DATABASE_ID,
      USERS_COLLECTION,
      ID.unique(),
      {
        authUserId: authUser.$id,
        name: name,
        email: syntheticEmail,
        passkey: passkey,
        roles: [role]
      }
    );

    return { success: true, passkey, name, role };
  } catch (error: any) {
    console.error("Failed to create user:", error);
    return { success: false, error: error.message || "Failed to create user." };
  }
}
