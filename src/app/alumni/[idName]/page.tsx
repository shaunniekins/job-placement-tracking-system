// app/alumni/[idName]/page.tsx

import AlumniClientRouter from "@/components/AlumniClientRouter";

export async function generateStaticParams() {
  return [
    { idName: "dashboard" },
    { idName: "placement" },
    { idName: "notifications" },
    { idName: "profile" },
    { idName: "orgchart" },
    { idName: "calendar" },
  ];
}

export default function AlumniSlugPage() {
  return <AlumniClientRouter />;
}
