import { useEffect, useState } from "react";

function NetworkStatus() {
  const [online, setOnline] = useState(() => typeof navigator === "undefined" ? true : navigator.onLine);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return (
    <div className={`network-status ${online ? "is-online" : "is-offline"}`} role="status" aria-live="polite">
      <span className="network-status-dot" />
      {online ? "Online" : "Offline — local mode"}
    </div>
  );
}

export default NetworkStatus;
