import SuperAdminClientRouter from "@/components/SuperAdminClientRouter";

export async function generateStaticParams() {
  return [
    { idName: "dashboard" },
    { idName: "jobinteraction" },
    { idName: "validation" },
    { idName: "users" },
    { idName: "manage" },
    { idName: "profile" },
    { idName: "orgchart" },
    { idName: "calendar" },
    { idName: "gts" },
  ];
}

export default function SuperAdminSlugPage() {
  return <SuperAdminClientRouter />;
}
