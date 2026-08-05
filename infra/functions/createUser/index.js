const { Client, Databases, Users, ID } = require("node-appwrite");

module.exports = async ({ req, res, log, error }) => {
  // Extract inputs
  let payload;
  try {
    payload = JSON.parse(req.payload);
  } catch (err) {
    return res.json({ success: false, error: "Invalid JSON payload" }, 400);
  }

  const { name, role } = payload;
  if (!name || !role) {
    return res.json({ success: false, error: "Name and role are required" }, 400);
  }

  const APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
  const APPWRITE_PROJECT_ID = process.env.APPWRITE_PROJECT_ID;
  const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY;
  const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || "imssa-media";
  const USERS_COLLECTION = "users";

  if (!APPWRITE_PROJECT_ID || !APPWRITE_API_KEY) {
    return res.json({ success: false, error: "Server configuration error: missing API key or Project ID." }, 500);
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

    log(`Creating user: ${syntheticEmail}`);

    // Create user in Appwrite Auth
    const authUser = await appwriteUsers.create(
      ID.unique(),
      syntheticEmail,
      undefined,
      paddedPassword,
      name
    );

    log(`Auth User Created: ${authUser.$id}`);

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

    log("User document created in Database");

    return res.json({ success: true, passkey, name, role });
  } catch (err) {
    error("Failed to create user: " + err.message);
    return res.json({ success: false, error: err.message || "Failed to create user." }, 500);
  }
};
