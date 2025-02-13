import { FaCheck, FaProjectDiagram, FaUsers } from "react-icons/fa";

import useAgencyStats from "@/hooks/useAgencyStats";
import { useSelector } from "react-redux";
import { RootState } from "@/app/reduxUtils/store";
import { useEffect } from "react";
import { moaExpirationChecker } from "@/app/api/users";
import {
  insertNotification,
  notificationCheckerToSendForSMS,
  updateNotification,
} from "@/app/api/notificationsIUD";
import { validatePhoneNumber } from "@/utils/compUtils";

const AgencyDashboardComponent = () => {
  const user = useSelector((state: RootState) => state.user.user);

  const { stats } = useAgencyStats(user?.id);

  const handleSmsSend = async (message: string, phone: string) => {
    if (!message || !phone) return;

    // Validate phone number format
    if (!validatePhoneNumber(phone)) {
      console.error(
        "Invalid phone number format. Must be in +639********* format"
      );
      return;
    }

    try {
      const response = await fetch("/api/send-sms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone, message }),
      });

      await response.json();

      if (response.ok) {
        // console.log("Message sent successfully!");
      }
    } catch (error) {
      // console.error("Error sending SMS:", error);
    }
  };

  useEffect(() => {
    let isSubscribed = true; // For cleanup

    const checkMoaExpiration = async () => {
      if (!user?.id || !isSubscribed) return;

      const isMoaExpired = await moaExpirationChecker(user.id);

      if (isMoaExpired && isSubscribed) {
        const notifData = await notificationCheckerToSendForSMS(user.id);

        if (!notifData) {
          // No notification exists, create new one
          await insertNotification({
            receiver_id: user.id,
            message: "Your MOA has been expired!",
            is_notif_sent: true,
          });

          // Send SMS for the first time
          await handleSmsSend(
            "Your MOA has been expired!",
            user.user_metadata?.contact_number
          );
        } else if (!notifData.is_notif_sent) {
          // Update notification to mark as sent first
          await updateNotification(notifData.notification_id, {
            is_notif_sent: true,
          });

          // Then send SMS
          await handleSmsSend(
            "Your MOA has been expired!",
            user.user_metadata?.contact_number
          );
        }
      }
    };

    checkMoaExpiration();

    return () => {
      isSubscribed = false; // Cleanup subscription
    };
  }, [user?.id]); // Only depend on user.id instead of entire user object

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
