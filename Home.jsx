import React, { useState } from "react";
import PosturePalNavbar from "./Navbar";
import PostureTracker from "./PostureTracker";

export default function App() {
  const [alerts, setAlerts] = useState([]);

  // mark one read
  const markRead = (id) => setAlerts((a) => a.map(x => x.id === id ? { ...x, read: true } : x));
  const markAllRead = () => setAlerts((a) => a.map(x => ({ ...x, read: true })));

  return (
    <>
      <PosturePalNavbar alerts={alerts} onMarkRead={markRead} onMarkAllRead={markAllRead} />
      <PostureTracker pushAlert={setAlerts} />
    </>
  );
}
