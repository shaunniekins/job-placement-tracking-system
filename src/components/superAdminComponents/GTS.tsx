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
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; // Correct import for jspdf-autotable

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

  const generatePDF = (alumniData: any) => {
    if (!alumniData || !alumniData.gts) return null;

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      let yPos = 15;
      const lineHeight = 7;
      const indent = 14;
      const labelWidth = 80; // Increased label width
      const valueIndent = indent + labelWidth;

      // Helper function to format array of objects
      const formatArrayOfObjects = (arr: any[]): string[] => {
        if (!Array.isArray(arr) || arr.length === 0) return ["N/A"];
        return arr.map((item, index) => {
          const entries = Object.entries(item)
            .map(([key, value]) => `${key}: ${value || "N/A"}`)
            .join(", ");
          return `${index + 1}. ${entries}`;
        });
      };

      // Helper function to format nested object
      const formatNestedObject = (obj: any): string[] => {
        if (!obj || typeof obj !== "object") return ["N/A"];
        return Object.entries(obj).map(([key, value]) => {
          if (Array.isArray(value)) {
            return `${key}: ${value.join(", ") || "N/A"}`;
          }
          return `${key}: ${value || "N/A"}`;
        });
      };

      // Modified addField function to handle complex data
      const addField = (label: string, value: any) => {
        doc.setFontSize(10);
        doc.text(label, indent, yPos);
        doc.text(": ", valueIndent - 5, yPos);

        let lines: string[] = [];
        if (Array.isArray(value) && typeof value[0] === "object") {
          lines = formatArrayOfObjects(value);
        } else if (
          value &&
          typeof value === "object" &&
          !Array.isArray(value)
        ) {
          lines = formatNestedObject(value);
        } else {
          lines = [String(value || "N/A")];
        }

        // Print each line with proper spacing
        lines.forEach((line, index) => {
          if (yPos > 280) {
            doc.addPage();
            yPos = 15;
          }
          doc.text(line, valueIndent, yPos);
          yPos += lineHeight;
        });

        // Add extra spacing after multi-line fields
        if (lines.length > 1) yPos += lineHeight / 2;
      };

      // Title (centered)
      doc.setFontSize(16);
      const title = "Graduate Tracer Study Report";
      const titleWidth =
        (doc.getStringUnitWidth(title) * 16) / doc.internal.scaleFactor;
      doc.text(title, (pageWidth - titleWidth) / 2, yPos);
      yPos += lineHeight * 2;

      // Basic Information
      doc.setFontSize(12);
      doc.text("Personal Information", indent, yPos);
      yPos += lineHeight;

      const fullName = `${alumniData.lastName}, ${alumniData.firstName} ${
        alumniData.middleName ? alumniData.middleName.charAt(0) + "." : ""
      }`;
      addField("Name", fullName);
      addField("Email", alumniData.email);

      // GTS Data - Include all fields
      const gts = alumniData.gts;
      addField("Contact Numbers", gts.contact_numbers);
      addField("Civil Status", gts.civil_status);
      addField("Sex", gts.sex);
      addField("Region", gts.region);
      addField("Province", gts.province);
      addField("Location of Residence", gts.location_of_residence);

      // Educational Background Section
      yPos += lineHeight;
      doc.setFontSize(12);
      doc.text("Educational Background", indent, yPos);
      yPos += lineHeight;
      addField("Educational Background", gts.educational_background);
      addField("Professional Examination", gts.professional_examination);
      addField("Course Reasons", gts.course_reasons);

      // Training Section
      yPos += lineHeight;
      doc.setFontSize(12);
      doc.text("Training and Professional Development", indent, yPos);
      yPos += lineHeight;
      addField("Training After College", gts.training_after_college);

      // Job Levels Section
      yPos += lineHeight;
      doc.setFontSize(12);
      doc.text("Career Progression", indent, yPos);
      yPos += lineHeight;
      addField("Job Levels", gts.job_levels);

      // Employment Information
      yPos += lineHeight;
      doc.setFontSize(12);
      doc.text("Employment Information", indent, yPos);
      yPos += lineHeight;
      addField("Employment Status", gts.employment_status);
      addField("Unemployment Reasons", gts.unemployment_reasons);
      addField("Other Unemployment Reason", gts.other_unemployment_reason);
      addField("Present Employment Status", gts.present_employment_status);
      addField("Present Occupation", gts.present_occupation);
      addField("Major Line of Business", gts.major_line_of_business);
      addField("Place of Work", gts.place_of_work);

      // First Job Information
      yPos += lineHeight;
      doc.setFontSize(12);
      doc.text("First Job Information", indent, yPos);
      yPos += lineHeight;
      addField("First Job After College", gts.is_first_time_job_after_college);
      addField("Staying on Job Reasons", gts.staying_on_job_reasons);
      addField("Other Staying on Job Reason", gts.other_staying_on_job_reason);
      addField(
        "First Job Related to Course",
        gts.is_first_job_related_to_course
      );
      addField(
        "First Job Related Reasons",
        gts.first_job_related_to_course_reasons
      );
      addField(
        "Other Related Reason",
        gts.other_first_job_related_to_course_reason
      );
      addField("Leaving Job Reasons", gts.leaving_job_reasons);
      addField("Other Leaving Job Reason", gts.other_leaving_job_reason);
      addField("Duration in First Job", gts.staying_duration_in_first_job);
      addField(
        "Other Duration in First Job",
        gts.other_staying_duration_in_first_job
      );
      addField("First Job Found Through", gts.first_job_found_through);
      addField(
        "Other First Job Found Through",
        gts.other_first_job_found_through
      );
      addField("Duration Before First Job", gts.duration_before_first_job);
      addField(
        "Other Duration Before First Job",
        gts.other_duration_before_first_job
      );
      addField("Job Levels", gts.job_levels);
      addField("Initial Gross Monthly Earning", gts.initial_gross_first_job);
      addField(
        "Curriculum Relevant to First Job",
        gts.is_curriculum_relevant_in_first_job
      );

      // Competencies and Suggestions
      yPos += lineHeight;
      doc.setFontSize(12);
      doc.text("Competencies and Suggestions", indent, yPos);
      yPos += lineHeight;
      addField("Learned Competencies", gts.learned_competencies);
      addField("Other Learned Competencies", gts.other_learned_competencies);
      addField("Suggestions", gts.suggestions);

      return doc;
    } catch (error) {
      console.error("Error generating PDF:", error);
      return null;
    }
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

      // Get program name for filename
      const programDetail = programs.find((p) => p.key === programKey);

      // Generate individual PDFs for each alumni
      gtsData.data.forEach((alumniData: any) => {
        const doc = generatePDF(alumniData);
        if (doc) {
          const fullName = `${alumniData.lastName}_${alumniData.firstName}`;
          const filename = `GTS_${programDetail?.label.replace(
            /\s+/g,
            "_"
          )}_${selectedYear}_${fullName}.pdf`;
          doc.save(filename);
        }
      });
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
