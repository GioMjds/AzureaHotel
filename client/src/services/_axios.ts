import axios from "axios";

axios.defaults.withCredentials = true;

export const API = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

export const ADMIN = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/master`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

export const guest = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/guest`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

export const staff = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/staff`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

export const booking = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/booking`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

export const reservation = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/reservation`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

export const room = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/property`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

export const payment = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/payment`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

export const area = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/property`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

export const amenity = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/property`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

export const transaction = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/transaction`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

export const food = axios.create({
  baseURL: `http://192.168.54.155:5000/Admin`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});