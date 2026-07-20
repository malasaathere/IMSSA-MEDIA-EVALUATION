import { ID, Query } from "appwrite";
import { databases } from "../lib/appwrite";

const APPWRITE_DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "imssa-media";

export async function submitRegistrationRequest(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const requestedRole = formData.get("requestedRole") as string;
  const reason = formData.get("reason") as string;
  
  const requestedEvents = formData.getAll("requestedEvents") as string[];

  if (!name || !email || !requestedRole) {
    return { error: "Name, email, and requested role are required." };
  }

  try {
    // Check if the email already exists in PENDING or APPROVED state
    const existingRequests = await databases.listDocuments(APPWRITE_DB_ID, "user_requests", [
      Query.equal("email", email)
    ]);

    if (existingRequests.total > 0) {
      const activeRequest = existingRequests.documents.find(
        (doc) => doc.status === "PENDING_APPROVAL" || doc.status === "APPROVED"
      );
      if (activeRequest) {
        return { error: "A request for this email already exists or is already approved." };
      }
    }

    await databases.createDocument(
      APPWRITE_DB_ID,
      "user_requests",
      ID.unique(),
      {
        name,
        email,
        requestedRole,
        requestedEvents,
        reason: reason || "",
        status: "PENDING_APPROVAL"
      }
    );

    return { success: true };
  } catch (error: any) {
    console.error("Error submitting registration request:", error);
    return { error: error.message || "Failed to submit request. Please try again." };
  }
}

export async function listUserRequests(statusFilter?: string) {
  try {
    const queries = [Query.orderDesc("$createdAt")];
    if (statusFilter && statusFilter !== "ALL") {
      queries.push(Query.equal("status", statusFilter));
    }
    
    const response = await databases.listDocuments(APPWRITE_DB_ID, "user_requests", queries);
    return { requests: response.documents };
  } catch (error: any) {
    console.error("Error listing user requests:", error);
    return { error: error.message || "Failed to list requests." };
  }
}

export async function approveUserRequest(requestId: string, adminUserId: string) {
  try {
    const request = await databases.getDocument(APPWRITE_DB_ID, "user_requests", requestId);
    
    if (request.status !== "PENDING_APPROVAL") {
      return { error: "Request is not in a pending state." };
    }

    await databases.updateDocument(APPWRITE_DB_ID, "user_requests", requestId, {
      status: "APPROVED",
      reviewedById: adminUserId,
      reviewedAt: new Date().toISOString(),
    });

    await databases.createDocument(APPWRITE_DB_ID, "users", ID.unique(), {
      email: request.email,
      name: request.name,
      status: "ACTIVE",
    });
    
    return { success: true };
  } catch (error: any) {
    console.error("Error approving request:", error);
    return { error: error.message || "Failed to approve request." };
  }
}

export async function rejectUserRequest(requestId: string, adminUserId: string) {
  try {
    await databases.updateDocument(APPWRITE_DB_ID, "user_requests", requestId, {
      status: "REJECTED",
      reviewedById: adminUserId,
      reviewedAt: new Date().toISOString(),
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error rejecting request:", error);
    return { error: error.message || "Failed to reject request." };
  }
}
