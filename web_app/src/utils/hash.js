export const generateSecureHash = async (P) => {
  const response = await fetch("http://localhost:3000/utils/generate-hash", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: P }),
  });

  if (!response.ok) {
    console.log("No hash returned");
    return null;
  }
  const data = await response.json();
  return data.hash;
};
