import { account, databases } from "../lib/appwrite";

const APPWRITE_DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "imssa-media";

/**
 * Pads a passkey to meet Appwrite's 8-character password requirement.
 */
export function getPaddedPin(pin: string) {
  return pin.padEnd(8, "0");
}

export async function loginOrSignupWithPin(pin: string) {
  const normalizedPasskey = pin.trim().toLowerCase();
  if (normalizedPasskey.length < 4 || normalizedPasskey.length > 20 || !/^[a-z0-9_-]+$/.test(normalizedPasskey)) {
    throw new Error("Passkey must be 4–20 letters, numbers, hyphens, or underscores.");
  }

  const syntheticEmail = `${normalizedPasskey}@imssa.local`;
  const paddedPassword = getPaddedPin(normalizedPasskey);

  try {
    // Appwrite rejects a new email/password session while another user session is
    // active in this browser. Clear it so users can reliably switch workspaces.
    try {
      await account.deleteSession("current");
    } catch {
      // No active session is the normal state on the login page.
    }

    const { Query } = await import("appwrite");
    // Always check if the PIN exists in our database first
    const existingProfiles = await databases.listDocuments(APPWRITE_DB_ID, "users", [
      Query.equal("passkey", normalizedPasskey)
    ]);

    if (existingProfiles.total === 0) {
      throw new Error("Your passkey is not authorized. Please contact an administrator.");
    }
    
    const dbUser = existingProfiles.documents[0];
    if (String(dbUser.status || "ACTIVE").toUpperCase() !== "ACTIVE") {
      throw new Error("This account is inactive. Please contact an administrator.");
    }
    // Every authorized profile must already have a matching Appwrite Auth account.
    // Account creation is handled by the admin service, never by the public login page.
    try {
      await account.createEmailPasswordSession(syntheticEmail, paddedPassword);
    } catch (error: any) {
      if (error?.code === 401) {
        throw new Error("This passkey exists, but its Appwrite login credential does not match. Ask an administrator to reset this account passkey.");
      }
      if (error?.code === 429) {
        throw new Error("Too many login attempts. Wait a minute and try again.");
      }
      if (!error?.code || error?.code === 0) {
        throw new Error("The login service could not connect to Appwrite. Check your internet connection and try again.");
      }
      throw new Error(error.message || "Appwrite could not complete the login.");
    }

    const authenticatedUser = await account.get();
    if (dbUser.authUserId && authenticatedUser.$id !== dbUser.authUserId) {
      await account.deleteSession("current");
      throw new Error("This passkey is linked to a different account. Ask an administrator to repair the account link.");
    }

    return { 
      success: true, 
      isNew: false,
      user: {
        name: dbUser.name,
        roles: dbUser.roles || []
      }
    };
  } catch (error: any) {
    throw new Error(error.message || "An unexpected error occurred during login.");
  }
}

export async function logout() {
  try {
    await account.deleteSession("current");
  } catch (error) {
    console.error("Logout failed", error);
  }
}

export async function getCurrentUser() {
  try {
    const user = await account.get();
    
    try {
      const { Query } = await import("appwrite");
      // Find the user's roles from our database
      const existingProfiles = await databases.listDocuments(APPWRITE_DB_ID, "users", [
        Query.equal("authUserId", user.$id)
      ]);
      
      let roles: string[] = [];
      let name = user.name || "";
      
      if (existingProfiles.total > 0) {
        roles = existingProfiles.documents[0].roles || [];
        name = existingProfiles.documents[0].name || name;
      }
      
      return { ...user, roles, name };
    } catch (dbError) {
      console.error("Failed to fetch user roles from database", dbError);
      return { ...user, roles: [] as string[] };
    }
  } catch (error) {
    return null;
  }
}
