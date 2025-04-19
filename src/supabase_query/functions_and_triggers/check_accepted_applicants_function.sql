CREATE OR REPLACE FUNCTION public.check_accepted_applicants()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Update accepted_applicants count in JobPostings based on JobApplications changes
  -- This part seems okay, but ensure it accurately reflects your desired logic.
  -- Consider if this should run only when NEW.application_status changes to 'accepted'.
  UPDATE "JobPostings"
  SET accepted_applicants = (
    SELECT COUNT(*)
    FROM "JobApplications"
    WHERE job_posting_id = NEW.job_posting_id
    AND application_status = 'accepted'
  )
  WHERE job_posting_id = NEW.job_posting_id;

  -- Check if accepted_applicants meets required number and close posting if needed
  -- Corrected 'status' to 'job_status'
  UPDATE "JobPostings"
  SET job_status = 'closed' -- Corrected column name
  WHERE job_posting_id = NEW.job_posting_id
  AND accepted_applicants >= number_of_applicants
  AND job_status = 'open'; -- Corrected column name (Assuming 'open' is a valid status)
  -- If your active status is different (e.g., 'approved', 'active'), adjust 'open' accordingly.

  RETURN NEW; -- Return NEW for AFTER trigger is conventional but often ignored. Consider NULL if appropriate.
END;
$function$
;


-- Note: Ensure the trigger definition remains correct:
-- Name: job_applications_accepted_trigger
-- Table: JobApplications
-- Function: check_accepted_applicants
-- Events: AFTER UPDATE
-- Orientation: ROW
-- Condition: (new.application_status = 'accepted'::text) -- This condition seems redundant if the function logic handles it, but okay.

-- add triggger

CREATE TRIGGER job_applications_accepted_trigger
AFTER UPDATE
ON "JobApplications"
FOR EACH ROW
WHEN (NEW.application_status = 'accepted'::text)
EXECUTE FUNCTION public.check_accepted_applicants();
-- Note: The trigger condition checks if the application status is 'accepted' before executing the function.
-- This is a good practice to ensure the function only runs when necessary.
-- Ensure the trigger is created after the function definition.
-- If the trigger already exists, you may need to drop it first or use CREATE OR REPLACE TRIGGER.