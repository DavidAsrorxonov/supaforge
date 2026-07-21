"use client";

import * as React from "react";

export default function Home() {
  const [status, setStatus] = React.useState("...checking");

  React.useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`)
      .then((res) => res.json())
      .then((data) => setStatus(data.status))
      .catch(() => setStatus("...error"));
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">Supaforge</h1>
      <p className="mt-4 text-gray-500">API status: {status}</p>
    </main>
  );
}
