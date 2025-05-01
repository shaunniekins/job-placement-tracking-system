import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/utils/supabase";

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  type: "activity" | "job_posting";
  extendedProps: {
    type: "activity" | "job_posting";
    description: string;
    location?: string;
    jobType?: string;
    salary?: string;
    industry?: string;
    agency?: string;
    requirements?: string[];
    applicationDeadline?: string;
  };
}

const useCalendarEvents = (startDate: string, endDate: string) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const parseRequirements = (requirements: any): string[] => {
    // If it's already an array, return it
    if (Array.isArray(requirements)) {
      return requirements;
    }

    // If it's a string, try to parse it as JSON
    if (typeof requirements === "string") {
      try {
        const parsed = JSON.parse(requirements);
        return Array.isArray(parsed) ? parsed : [requirements];
      } catch (e) {
        // If parsing fails, it might be a comma-separated string
        return requirements.split(",").map((item) => item.trim());
      }
    }

    // If it's null or undefined, return an empty array
    if (requirements == null) {
      return [];
    }

    // Any other case, wrap it in an array
    return [String(requirements)];
  };

  const fetchCalendarEvents = useCallback(async () => {
    if (!startDate || !endDate) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch activities for the date range
      const activitiesPromise = supabase
        .from("Activities")
        .select("*")
        .gte("activity_date", startDate)
        .lte("activity_date", endDate);

      // Fetch job postings for the date range (using application_deadline as the date)
      const jobPostingsPromise = supabase
        .from("ViewJobPostingsWithAgencyDetails")
        .select("*")
        .gte("application_deadline", startDate)
        .lte("application_deadline", endDate);

      const [activitiesResponse, jobPostingsResponse] = await Promise.all([
        activitiesPromise,
        jobPostingsPromise,
      ]);

      if (activitiesResponse.error) throw activitiesResponse.error;
      if (jobPostingsResponse.error) throw jobPostingsResponse.error;

      // Format activities as calendar events
      const activityEvents = (activitiesResponse.data || []).map(
        (activity) => ({
          id: `activity-${activity.activity_id}`,
          title: activity.activity_title,
          start: `${activity.activity_date}T00:00:00`,
          type: "activity" as const,
          extendedProps: {
            type: "activity" as const,
            description: activity.activity_description,
            location: activity.activity_location,
          },
        })
      );

      // Format job postings as calendar events
      const jobPostingEvents = (jobPostingsResponse.data || []).map((job) => ({
        id: `job-${job.job_posting_id}`,
        title: `Job: ${job.job_title}`,
        start: `${job.application_deadline}T00:00:00`,
        type: "job_posting" as const,
        extendedProps: {
          type: "job_posting" as const,
          description: job.job_description,
          jobType: job.job_type,
          salary: job.salary_range,
          industry: job.industry,
          agency: job.agency_company_name,
          requirements: parseRequirements(job.requirements), // Safely parse requirements
          applicationDeadline: job.application_deadline,
        },
      }));

      // Combine both types of events
      setEvents([...activityEvents, ...jobPostingEvents]);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || "Error fetching calendar events");
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchCalendarEvents();

    // Set up real-time subscriptions for both tables
    const activitiesChannel = supabase
      .channel("calendar_activities_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "Activities" },
        () => fetchCalendarEvents()
      )
      .subscribe();

    const jobPostingsChannel = supabase
      .channel("calendar_job_postings_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "JobPostings" },
        () => fetchCalendarEvents()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(activitiesChannel);
      supabase.removeChannel(jobPostingsChannel);
    };
  }, [fetchCalendarEvents]);

  return { events, loading, error };
};

export default useCalendarEvents;
