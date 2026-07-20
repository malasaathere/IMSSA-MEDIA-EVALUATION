import { account, databases } from "../lib/appwrite";
import { ID, OAuthProvider } from "appwrite";

const APPWRITE_DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "imssa-media";
const PIN_SALT = "IMSSA_SECURE_SALT_2026"; // Ensure 8+ chars

/**
 * Pads a 4-digit PIN to meet Appwrite's 8-character password requirement.
 */
export function getPaddedPin(pin: string) {
  return `${pin}0000`;
}

export async function loginWithGoogle() {
  const redirectUrl = typeof window !== 'undefined' ? window.location.origin + "/login/callback" : "http://localhost:3000/login/callback";
  return account.createOAuth2Session(OAuthProvider.Google, redirectUrl, redirectUrl);
}

export async function loginOrSignupWithPin(pin: string) {
  if (pin.length !== 4 || !/^\d+$/.test(pin)) {
    throw new Error("PIN must be exactly 4 digits.");
  }

  const syntheticEmail = `${pin}@imssa.local`;
  const paddedPassword = getPaddedPin(pin);

  try {
    const { Query } = await import("appwrite");
    // Always check if the PIN exists in our database first
    const existingProfiles = await databases.listDocuments(APPWRITE_DB_ID, "users", [
      Query.equal("passkey", pin)
    ]);

    if (existingProfiles.total === 0) {
      throw new Error("Your passkey is not authorized. Please contact an administrator.");
    }
    
    const dbUser = existingProfiles.documents[0];
    let isNew = false;

    // Check if auth account already exists by trying to log in
    try {
      await account.createEmailPasswordSession(syntheticEmail, paddedPassword);
    } catch (error: any) {
      // 401 could mean they don't exist yet, try to create them
      try {
        await account.create(ID.unique(), syntheticEmail, paddedPassword);
        await account.createEmailPasswordSession(syntheticEmail, paddedPassword);
        const user = await account.get();
        await databases.updateDocument(APPWRITE_DB_ID, "users", dbUser.$id, {
          authUserId: user.$id
        });
        isNew = true;
      } catch (signupError: any) {
        if (signupError.code === 409) {
           throw new Error("Invalid credentials. Please check your PIN.");
        }
        throw new Error(signupError.message || "Failed to create your account.");
      }
    }

    return { 
      success: true, 
      isNew,
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
