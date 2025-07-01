import AgencyClientRouter from "@/components/AgencyClientRouter";

export async function generateStaticParams() {
  return [
    { idName: "dashboard" },
    { idName: "managejobpostings" },
    { idName: "applicants" },
    { idName: "notifications" },
    { idName: "profile" },
  ];
}

export default function AgencySlugPage() {
  return <AgencyClientRouter />;
}
