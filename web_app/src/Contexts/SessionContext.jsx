import { createContext, useContext, useState } from "react";

const SessionContext = createContext();
// Create the Provider Component
export function SessionProvider({ children }) {
  const [code, setCode] = useState();

  // Function to clear the error
  const clearCode = () => setCode(null);

  return (
    <SessionContext.Provider value={{ code, setCode, clearCode }}>
      {children}
    </SessionContext.Provider>
  );
}

// Create a custom hook to make it super easy to use anywhere
export const useSession = () => useContext(SessionContext);
