import { account, databases } from "../lib/appwrite";
import { ID, OAuthProvider } from "appwrite";

const APPWRITE_DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "imssa-media";
const PIN_SALT = "IMSSA_SECURE_SALT_2026"; // Ensure 8+ chars

/**
 * Pads a 4-digit PIN to meet Appwrite's 8-character password requirement.
 */
export function getPaddedPin(pin: string) {
  return `${pin}${PIN_SALT}`;
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
    // Attempt login first
    await account.createEmailPasswordSession(syntheticEmail, paddedPassword);
    return { success: true, isNew: false };
  } catch (error: any) {
    // If user doesn't exist, check if they are approved
    if (error.code === 401 && error.type === "user_invalid_credentials") {
      throw new Error("Invalid credentials. Please check your PIN.");
    }

    if (error.code === 404 || error.type === "user_not_found" || error.code === 401) {
      // User doesn't exist. Check if they are approved in users collection by passkey
      try {
        const { Query } = await import("appwrite");
        const existingProfiles = await databases.listDocuments(APPWRITE_DB_ID, "users", [
          Query.equal("passkey", pin)
        ]);

        if (existingProfiles.total === 0) {
          throw new Error("Your passkey is not authorized. Please contact an administrator.");
        }

        // They are approved! Create their auth account
        await account.create(ID.unique(), syntheticEmail, paddedPassword);
        
        // Login immediately after creation
        await account.createEmailPasswordSession(syntheticEmail, paddedPassword);

        // Link auth user ID to profile
        const user = await account.get();
        await databases.updateDocument(APPWRITE_DB_ID, "users", existingProfiles.documents[0].$id, {
          authUserId: user.$id
        });

        return { success: true, isNew: true };
      } catch (signupError: any) {
        throw new Error(signupError.message || "Failed to create your account.");
      }
    }
    
    throw error;
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
    return await account.get();
  } catch (error) {
    return null;
  }
}
