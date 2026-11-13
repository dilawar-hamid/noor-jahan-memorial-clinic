import { useEffect, useState } from "react";
import {
  STORAGE_ERROR_EVENT,
  STORAGE_OK_EVENT,
  isStorageFailing,
} from "../utils/storage";

function StorageAlert() {
  const [failed, setFailed] = useState(isStorageFailing);

  useEffect(() => {
    const on = () => setFailed(true);
    const off = () => setFailed(false);
    window.addEventListener(STORAGE_ERROR_EVENT, on);
    window.addEventListener(STORAGE_OK_EVENT, off);
    return () => {
      window.removeEventListener(STORAGE_ERROR_EVENT, on);
      window.removeEventListener(STORAGE_OK_EVENT, off);
    };
  }, []);

  if (!failed) return null;

  return (
    <div className="storage-alert" role="alert">
      <b>Local storage warning!</b> IndexedDB may be unavailable or a browser
      storage write failed. The app may be using its less robust localStorage
      fallback. Export a backup as soon as possible and do not clear browser data.
    </div>
  );
}

export default StorageAlert;
