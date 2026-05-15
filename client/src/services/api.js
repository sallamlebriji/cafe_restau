import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api"
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const endpoints = {
  auth: "/auth",
  dashboard: "/dashboard",
  establishments: "/establishments",
  categories: "/categories",
  products: "/products",
  tables: "/tables",
  orders: "/orders",
  reservations: "/reservations",
  customers: "/customers",
  employees: "/employees",
  stocks: "/stocks",
  payments: "/payments",
  deliveries: "/deliveries",
  public: "/public"
};
