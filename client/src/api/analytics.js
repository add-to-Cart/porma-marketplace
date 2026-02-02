import api from "./api";

export const getTopSellers = async (limit = 6) => {
  const res = await api.get(`/analytics/top-sellers?limit=${limit}`);
  return res.data || [];
};
