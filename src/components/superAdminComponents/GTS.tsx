import React, { useState, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Select,
  SelectItem,
  Button,
  Spinner,
} from "@nextui-org/react";
import { FaDownload } from "react-icons/fa";
import { colleges, programs } from "@/app/api/collegeAndProgramData";
import { IoMdArrowRoundBack } from "react-icons/io";
import { supabase } from "@/utils/supabase";
import * as XLSX from "xlsx";

const GTSComponent = () => {
  const [selectedCollege, setSelectedCollege] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i).map(
    String
  );

  const fetchGTSData = async (programKey: string, year: string) => {
    setIsGenerating(true);
    try {
      // Get the program details
      const programDetail = programs.find((p) => p.key === programKey);
      if (!programDetail) throw new Error("Program not found");

      // First get the GTS data
      const { data: gtsData, error: gtsError } = await supabase
        .from("GraduateTracerStudy")
        .select("*, alumni_id");

      if (gtsError) throw gtsError;

      // Get alumni IDs from GTS data
      const gtsAlumniIds = gtsData.map((gts) => gts.alumni_id);

      // Then get matching alumni who have GTS data
      const { data: alumniData, error: alumniError } = await supabase
        .from("ViewUsers")
        .select("id, email, meta_data")
        .eq("meta_data->>user_type", "alumni")
        .ilike("meta_data->>program", programKey)
        .eq("meta_data->>batch_year", year)
        .in("id", gtsAlumniIds);

      if (alumniError) throw alumniError;

      if (!alumniData || alumniData.length === 0) {
        alert(
          `No alumni with GTS data found for program '${programDetail.label}' and year ${year}`
        );
        return null;
      }

      // Combine alumni data with GTS data
      const combinedData = alumniData.map((alumni) => {
        const gtsEntry = gtsData.find((gts) => gts.alumni_id === alumni.id);
        const meta = alumni.meta_data || {};
        return {
          id: alumni.id,
          email: alumni.email,
          firstName: meta.first_name || "",
          lastName: meta.last_name || "",
          middleName: meta.middle_name || "",
          gts: gtsEntry || null,
        };
      });

      return {
        programName: programDetail.label,
        year,
        data: combinedData,
      };
    } catch (error) {
      console.error("Error fetching GTS data:", error);
      alert(
        `Failed to fetch data. Error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const formatArrayToText = (arr: any[]): string => {
    if (!Array.isArray(arr) || arr.length === 0) return "N/A";
    return arr
      .map((item, index) => {
        if (typeof item === "object") {
          return `${index + 1}. ${Object.entries(item)
            .map(([key, value]) => `${key}: ${value || "N/A"}`)
            .join(", ")}`;
        }
        return item;
      })
      .join("\n");
  };

  const formatObjectToText = (obj: any): string => {
    if (!obj || typeof obj !== "object") return "N/A";
    return Object.entries(obj)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return `${key}: ${value.join(", ") || "N/A"}`;
        }
        return `${key}: ${value || "N/A"}`;
      })
      .join("\n");
  };

  const handleDownload = async (programKey: string) => {
    if (!selectedYear) {
      alert("Please select a year first");
      return;
    }

    try {
      setIsGenerating(true);
      const gtsData = await fetchGTSData(programKey, selectedYear);

      if (!gtsData) {
        setIsGenerating(false);
        return;
      }

      const programDetail = programs.find((p) => p.key === programKey);
      const collegeDetail = colleges.find((c) => c.key === selectedCollege);

      const collegeLabel = collegeDetail?.key.toUpperCase() || "COLLEGE";
      const programLabel = programDetail?.key.toUpperCase() || "PROGRAM";
      const filename =
        `${collegeLabel} REPORT ${programLabel} ${selectedYear}`.trim();

      const headers = [
        "No.",
        "Name",
        "Email",
        "Contact Numbers",
        "Civil Status",
        "Sex",
        "Region",
        "Province",
        "Location of Residence",
        "Educational Background",
        "Professional Examination",
        "Course Reasons",
        "Training After College",
        "Employment Status",
        "Unemployment Reasons",
        "Other Unemployment Reason",
        "Present Employment Status",
        "Present Occupation",
        "Major Line of Business",
        "Place of Work",
        "First Job After College",
        "Staying on Job Reasons",
        "Other Staying on Job Reason",
        "First Job Related to Course",
        "First Job Related Reasons",
        "Other Related Reason",
        "Leaving Job Reasons",
        "Other Leaving Job Reason",
        "Duration in First Job",
        "Other Duration in First Job",
        "First Job Found Through",
        "Other First Job Found Through",
        "Duration Before First Job",
        "Other Duration Before First Job",
        "Job Levels",
        "Initial Gross Monthly Earning",
        "Curriculum Relevant to First Job",
        "Learned Competencies",
        "Other Learned Competencies",
        "Suggestions",
      ];

      const dataRows = gtsData.data.map((alumni: any, index: number) => {
        const gts = alumni.gts || {};
        const fullName = `${alumni.lastName}, ${alumni.firstName} ${
          alumni.middleName ? alumni.middleName.charAt(0) + "." : ""
        }`;

        return [
          index + 1,
          fullName,
          alumni.email,
          gts.contact_numbers || "N/A",
          gts.civil_status || "N/A",
          gts.sex || "N/A",
          gts.region || "N/A",
          gts.province || "N/A",
          gts.location_of_residence || "N/A",
          formatArrayToText(gts.educational_background),
          formatArrayToText(gts.professional_examination),
          formatObjectToText(gts.course_reasons),
          formatArrayToText(gts.training_after_college),
          gts.employment_status || "N/A",
          formatArrayToText(gts.unemployment_reasons),
          gts.other_unemployment_reason || "N/A",
          gts.present_employment_status || "N/A",
          gts.present_occupation || "N/A",
          gts.major_line_of_business || "N/A",
          gts.place_of_work || "N/A",
          gts.is_first_time_job_after_college || "N/A",
          formatArrayToText(gts.staying_on_job_reasons),
          gts.other_staying_on_job_reason || "N/A",
          gts.is_first_job_related_to_course || "N/A",
          formatArrayToText(gts.first_job_related_to_course_reasons),
          gts.other_first_job_related_to_course_reason || "N/A",
          formatArrayToText(gts.leaving_job_reasons),
          gts.other_leaving_job_reason || "N/A",
          formatArrayToText(gts.staying_duration_in_first_job),
          gts.other_staying_duration_in_first_job || "N/A",
          formatArrayToText(gts.first_job_found_through),
          gts.other_first_job_found_through || "N/A",
          formatArrayToText(gts.duration_before_first_job),
          gts.other_duration_before_first_job || "N/A",
          formatObjectToText(gts.job_levels),
          gts.initial_gross_first_job || "N/A",
          gts.is_curriculum_relevant_in_first_job || "N/A",
          formatArrayToText(gts.learned_competencies),
          gts.other_learned_competencies || "N/A",
          gts.suggestions || "N/A",
        ];
      });

      const finalData = [
        [filename], // Row 1: Filename / Title
        headers, // Row 2: Headers
        ...dataRows, // Row 3+: Data
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(finalData);

      // Set column widths (optional, but good for readability)
      const wscols = headers.map(() => ({ wch: 20 }));
      wscols[1] = { wch: 30 }; // Name
      wscols[2] = { wch: 30 }; // Email
      ws["!cols"] = wscols;

      XLSX.utils.book_append_sheet(wb, ws, "GTS Report");
      XLSX.writeFile(wb, `${filename}.xlsx`);
    } catch (error) {
      console.error("Error downloading GTS:", error);
      alert(
        `Error generating reports: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const renderCollegesTable = () => (
    <div className="w-full flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <Select
          label="Select Year"
          color="success"
          className="max-w-xs invisible"
          size="sm"
        >
          {years.map((year) => (
            <SelectItem key={year} value={year}>
              {year}
            </SelectItem>
          ))}
        </Select>
      </div>
      <Table
        aria-label="Colleges table"
        fullWidth
        layout="auto"
        isHeaderSticky={true}
        classNames={{
          wrapper: "h-full bg-[#F4FFFC] border-2 border-[#008B47]",
        }}
        className="h-full w-full flex items-center justify-center"
      >
        <TableHeader>
          <TableColumn className="bg-[#008B47] text-white whitespace-nowrap flex-nowrap">
            College
          </TableColumn>
        </TableHeader>
        <TableBody>
          {colleges.map((college) => (
            <TableRow
              key={college.key}
              className="cursor-pointer hover:bg-green-100 py-5"
              onClick={() => setSelectedCollege(college.key)}
            >
              <TableCell className="py-5">{college.label}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  const renderProgramsTable = () => {
    const collegePrograms = programs.filter(
      (program) => program.college === selectedCollege
    );

    return (
      <div className="w-full flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <Button
            color="success"
            variant="light"
            onClick={() => {
              setSelectedCollege(null);
              setSelectedYear("");
            }}
          >
            <IoMdArrowRoundBack />
            Back to Colleges
          </Button>
          <Select
            label="Select Year"
            color="success"
            size="sm"
            className="max-w-xs"
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            {years.map((year) => (
              <SelectItem key={year} value={year}>
                {year}
              </SelectItem>
            ))}
          </Select>
        </div>
        <Table
          aria-label="Programs table"
          fullWidth
          layout="auto"
          isHeaderSticky={true}
          classNames={{
            wrapper: "h-full bg-[#F4FFFC] border-2 border-[#008B47]",
          }}
          className="h-full w-full flex items-center justify-center"
        >
          <TableHeader>
            <TableColumn className="bg-[#008B47] text-white whitespace-nowrap flex-nowrap">
              Program
            </TableColumn>
            <TableColumn className="w-24 bg-[#008B47] text-white text-center whitespace-nowrap flex-nowrap">
              Export
            </TableColumn>
          </TableHeader>
          <TableBody>
            {collegePrograms.map((program) => (
              <TableRow key={program.key} className="hover:bg-green-100">
                <TableCell>{program.label}</TableCell>
                <TableCell className="text-center">
                  <Button
                    isIconOnly
                    color="success"
                    variant="light"
                    isDisabled={!selectedYear || isGenerating}
                    className="cursor-pointer text-center"
                    onClick={() => handleDownload(program.key)}
                  >
                    {isGenerating ? (
                      <Spinner size="sm" color="success" />
                    ) : (
                      <FaDownload />
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="w-full h-full flex p-4">
      {selectedCollege ? renderProgramsTable() : renderCollegesTable()}
    </div>
  );
};

export default GTSComponent;
