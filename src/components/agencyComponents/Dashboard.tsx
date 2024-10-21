import { FaCheck, FaProjectDiagram, FaUsers } from "react-icons/fa";

import useAgencyStats from "@/hooks/useAgencyStats";
import { useSelector } from "react-redux";
import { RootState } from "@/app/reduxUtils/store";

const AgencyDashboardComponent = () => {
  const user = useSelector((state: RootState) => state.user.user);

  const { stats, loading, error } = useAgencyStats(user?.id);

  return (
    <div className="h-full w-full flex flex-col gap-5 overflow-x-hidden overflow-y-auto lg:overflow-hidden">
      <div className="grid md:grid-cols-3 gap-3 md:gap-5">
        <CardStats
          title="Total Posted Jobs"
          subtitle="Total posted jobs"
          value={stats?.total_job_postings?.toString() || "0"}
          icon={<FaProjectDiagram size={80} />}
        />
        <CardStats
          title="Total Number of Applicants"
          subtitle="Total number of applicants"
          value={stats?.total_job_applications?.toString() || "0"}
          icon={<FaUsers size={80} />}
        />
        <CardStats
          title="Total Accepted Applications"
          subtitle="Total number of accepted applications"
          value={stats?.total_accepted_applications?.toString() || "0"}
          icon={<FaCheck size={80} />}
        />
      </div>
      <div className="h-full w-full mt-10 pb-20">
        <div className="w-full flex justify-between items-center mb-5"></div>
      </div>
    </div>
  );
};

export default AgencyDashboardComponent;

interface CardStatsProps {
  title: string;
  subtitle: string;
  value: string;
  icon: React.ReactNode;
}

const CardStats: React.FC<CardStatsProps> = ({
  title,
  subtitle,
  value,
  icon,
}) => {
  return (
    <div className="bg-white shadow-lg flex justify-between rounded-xl p-3 md:px-5 md:py-7">
      <div className="w-full">
        <h2 className="text-3xl md:text-5xl font-bold text-[#007057]">
          {value}
        </h2>
        <h3 className="text-lg md:text-2xl font-semibold text-[#007057]">
          {title}
        </h3>
        {/* <h4 className="text-md text-slate-400">{subtitle}</h4> */}
      </div>
      <div className="self-end w-full flex justify-end text-xl text-[#007057]">
        {icon}
      </div>
    </div>
  );
};
