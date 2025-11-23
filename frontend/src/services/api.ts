import axios from "axios";

const API = "http://localhost:3000";

// GET initial data (products, materials, businesses)
export async function getInitData() {
  try {
    const res = await axios.get(`${API}/init`);
    return res.data;
  } catch (err) {
    console.error("Failed to load /init data", err);
    throw err;
  }
}

// POST event logs only. Accepts any shape compatible with backend Event schema.
export async function postEvent(event: any) {
  try {
    await axios.post(`${API}/event`, event);
  } catch (err) {
    console.warn("Failed to post event", err);
  }
}
