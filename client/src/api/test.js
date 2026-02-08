import api from "./api";

export const getUsers = async () => {
  const res = await api.get(`/users`);
  return res.data;
};

export const getSellers = async () => {
  const res = await api.get(`/sellers`);
  return res.data;
};
