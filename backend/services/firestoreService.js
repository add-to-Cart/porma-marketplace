import api from "@/api/index";

export const saveUserToFirestore = async (user) => {
  // POST /api/users will create/merge the user document using server-side admin SDK
  const payload = {
    email: user.email,
    username: user.displayName || user.email?.split("@")[0],
  };
  const res = await api.post(`/users`, payload);
  return res;
};

export const resolveEmailFromUsername = async (identifier) => {
  if (identifier.includes("@")) return identifier;
  const res = await api.get(`/users/resolve-email?identifier=${encodeURIComponent(identifier)}`);
  if (!res || !res.email) throw new Error("No user found with that username.");
  return res.email;
};
