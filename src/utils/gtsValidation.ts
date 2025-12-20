export const validateGTS = (
  data: any
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  if (!data) return { isValid: false, errors: ["No data provided"] };

  // Validate Section A
  const requiredFieldsSectionA = [
    "contact_numbers",
    "civil_status",
    "sex",
    "birth_date",
    "region",
    "province",
    "location_of_residence",
  ];

  for (const field of requiredFieldsSectionA) {
    if (!data[field]) {
      errors.push(`Section A: ${field.replace(/_/g, " ")}`);
    }
  }

  // Validate Section D
  if (!data.employment_status) {
    errors.push("Section D: employment status");
  } else {
    if (
      data.employment_status === "No" ||
      data.employment_status === "Never Employed"
    ) {
      if (
        !data.unemployment_reasons ||
        data.unemployment_reasons.length === 0
      ) {
        errors.push("Section D: unemployment reasons");
      }
    } else {
      // Employed
      if (!data.present_employment_status)
        errors.push("Section D: present employment status");
      if (!data.present_occupation)
        errors.push("Section D: present occupation");
      if (!data.agency) errors.push("Section D: agency/company name");
      if (!data.major_line_of_business)
        errors.push("Section D: major line of business");
      if (!data.place_of_work) errors.push("Section D: place of work");
      if (!data.is_first_time_job_after_college)
        errors.push("Section D: is first time job after college");

      if (data.is_first_time_job_after_college === "Yes") {
        if (
          !data.staying_on_job_reasons ||
          data.staying_on_job_reasons.length === 0
        )
          errors.push("Section D: reasons for staying on job");
        if (!data.is_first_job_related_to_course)
          errors.push("Section D: is first job related to course");
        if (data.is_first_job_related_to_course === "Yes") {
          if (
            !data.first_job_related_to_course_reasons ||
            data.first_job_related_to_course_reasons.length === 0
          )
            errors.push("Section D: reasons first job related to course");
        }
      } else if (data.is_first_time_job_after_college === "No") {
        if (!data.leaving_job_reasons || data.leaving_job_reasons.length === 0)
          errors.push("Section D: reasons for changing job");
        if (
          !data.staying_duration_in_first_job ||
          data.staying_duration_in_first_job.length === 0
        )
          errors.push("Section D: duration of stay in first job");
      }

      if (
        !data.first_job_found_through ||
        data.first_job_found_through.length === 0
      )
        errors.push("Section D: how first job was found");
      if (
        !data.duration_before_first_job ||
        data.duration_before_first_job.length === 0
      )
        errors.push("Section D: how long to land first job");
      if (
        !data.job_levels?.first_job ||
        data.job_levels.first_job.length === 0
      ) {
        errors.push("Section D: first job level position");
      }

      // If it's NOT their first job, they must also specify their current job level
      // If it IS their first job, 'first_job' covers it, so 'current_job' is optional/redundant
      if (data.is_first_time_job_after_college === "No") {
        if (
          !data.job_levels?.current_job ||
          data.job_levels.current_job.length === 0
        ) {
          errors.push("Section D: current job level position");
        }
      }

      if (!data.initial_gross_first_job)
        errors.push("Section D: initial gross monthly earning");
      if (!data.is_curriculum_relevant_in_first_job)
        errors.push("Section D: is curriculum relevant in first job");

      if (data.is_curriculum_relevant_in_first_job === "Yes") {
        if (
          !data.learned_competencies ||
          data.learned_competencies.length === 0
        )
          errors.push("Section D: learned competencies");
      }
      if (!data.suggestions) errors.push("Section D: suggestions");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const isGTSComplete = (data: any): boolean => {
  return validateGTS(data).isValid;
};
