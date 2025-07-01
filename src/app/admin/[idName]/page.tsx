import AdminClientRouter from "@/components/AdminClientRouter";

export async function generateStaticParams() {
  return [
    { idName: "dashboard" },
    { idName: "alumni" },
    { idName: "reports" },
    { idName: "profile" },
    { idName: "orgchart" },
    { idName: "calendar" },
  ];
}

export default function AdminSlugPage() {
  return <AdminClientRouter />;
}
