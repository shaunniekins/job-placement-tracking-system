"use client";

import { Key, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/app/reduxUtils/store";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  SelectItem,
  Select,
  Button,
  Spinner,
  Tabs,
  Tab,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@nextui-org/react";
import useUsers from "@/hooks/useUsers";
import { supabaseAdmin } from "@/utils/supabase";
import useBatchYears from "@/hooks/useBatchYears";
import { IoAdd, IoAddOutline } from "react-icons/io5";
import { EyeSlashFilledIcon } from "../../../public/icons/EyeSlashFilledIcon";
import { EyeFilledIcon } from "../../../public/icons/EyeFilledIcon";
import { colleges, programs } from "@/app/api/collegeAndProgramData";
import Papa from "papaparse";
import { supabase } from "@/utils/supabase";

interface AlumniReportDataRPC {
  user_id: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  gender?: string;
  present_employment_status?: string;
  agency?: string;
  program?: string; // Add program field to the interface
}

const AlumniUserComponent = () => {
  const [page, setPage] = useState(1);
  const rowsPerPage = 13;
  const [searchInput, setSearchInput] = useState("");
  const [programFilter, setProgramFilter] = useState("all");
  const [batchYearFilter, setBatchYearFilter] = useState("all");
  const [batchYearFormatted, setBatchYearFormatted] = useState<any[]>([]);
  const user = useSelector((state: RootState) => state.user.user);
  const userCollege = user?.user_metadata?.college;

  const [collegePrograms, setCollegePrograms] = useState<any[]>([]);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  useEffect(() => {
    if (userCollege) {
      const filtered = programs
        .filter((p) => p.college === userCollege)
        .map((p) => ({ key: p.key, label: p.label }));
      setCollegePrograms([{ key: "all", label: "All Programs" }, ...filtered]);
    } else {
      setCollegePrograms([{ key: "all", label: "All Programs" }]);
    }
  }, [userCollege]);

  const {
    usersData,
    totalUserEntries,
    isLoadingUsers,
    fetchAndSubscribeUsers,
  } = useUsers(
    rowsPerPage,
    page,
    "alumni",
    "approved",
    userCollege,
    searchInput,
    batchYearFilter,
    programFilter
  );

  const totalPages = Math.ceil(totalUserEntries / rowsPerPage);

  const { batchYears, isBatchYearsLoading } = useBatchYears();

  useEffect(() => {
    const formattedData = batchYears.map((item: any) => ({
      key: item.batch_year.toString(),
      label: item.batch_year.toString(),
    }));

    formattedData.unshift({ key: "all", label: "All" });

    setBatchYearFormatted(formattedData);
  }, [batchYears]);

  useEffect(() => {
    if (usersData && usersData.length > 0) {
      const sortedData = [...usersData].sort((a, b) => {
        const lastNameA = a.meta_data?.last_name?.toLowerCase() || "";
        const lastNameB = b.meta_data?.last_name?.toLowerCase() || "";
        return lastNameA.localeCompare(lastNameB);
      });
    }
  }, [usersData]);

  const fetchFilteredAlumniForReport = async (): Promise<
    AlumniReportDataRPC[]
  > => {
    const args = {
      filter_college: userCollege && userCollege !== "all" ? userCollege : null,
      filter_program:
        programFilter && programFilter !== "all" ? programFilter : null,
      filter_batch_year:
        batchYearFilter && batchYearFilter !== "all" ? batchYearFilter : null,
      search_term: searchInput || null,
    };

    const { data, error } = await supabase.rpc(
      "get_filtered_alumni_report_data",
      args
    );

    if (error) {
      console.error("Error fetching alumni for report via RPC:", error);
      alert(`Failed to fetch report data: ${error.message}`);
      return [];
    }
    return (data as AlumniReportDataRPC[]) || [];
  };

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    try {
      const alumniData = await fetchFilteredAlumniForReport();

      if (alumniData.length === 0) {
        alert("No data found for the selected filters.");
        setIsGeneratingReport(false);
        return;
      }

      // Group alumni by gender
      const maleAlumni = alumniData.filter(
        (user) => user.gender?.toLowerCase() === "male"
      );
      const femaleAlumni = alumniData.filter(
        (user) => user.gender?.toLowerCase() === "female"
      );

      // Sort both groups alphabetically by last name
      const sortAlumni = (a: AlumniReportDataRPC, b: AlumniReportDataRPC) => {
        const lastNameA = a.last_name || "";
        const lastNameB = b.last_name || "";
        return lastNameA.localeCompare(lastNameB);
      };

      maleAlumni.sort(sortAlumni);
      femaleAlumni.sort(sortAlumni);

      // Define headers as requested
      const headers = [
        "No.",
        "Name",
        "STATUS\n(Employed / Unemployed / Not Responded)",
        "PROGRAM",
        "AGENCY EMPLOYED",
      ];
      const numColumns = headers.length;

      // Convert column headers to uppercase
      const uppercaseHeaders = headers.map((header) => header.toUpperCase());

      // Helper function to properly capitalize names
      const properCapitalize = (name: string) => {
        if (!name) return "";
        return name
          .split(" ")
          .map(
            (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          )
          .join(" ");
      };

      // Process male alumni data with properly capitalized names
      const maleData = maleAlumni.map((user, index) => {
        const firstName = properCapitalize(user.first_name || "");
        const lastName = properCapitalize(user.last_name || "");
        const middleInitial = user.middle_name
          ? properCapitalize(user.middle_name.charAt(0)) + "."
          : "";

        return {
          "No.": index + 1, // Just use the number without quotes
          Name: `${lastName}, ${firstName}${
            middleInitial ? " " + middleInitial : ""
          }`,
          "STATUS\n(Employed / Unemployed / Not Responded":
            user.present_employment_status || "Not Responded",
          PROGRAM: user.program?.toUpperCase() || "N/A",
          "AGENCY EMPLOYED": user.agency || "N/A",
        };
      });

      // Process female alumni data with properly capitalized names
      const femaleData = femaleAlumni.map((user, index) => {
        const firstName = properCapitalize(user.first_name || "");
        const lastName = properCapitalize(user.last_name || "");
        const middleInitial = user.middle_name
          ? properCapitalize(user.middle_name.charAt(0)) + "."
          : "";

        return {
          "No.": index + 1, // Just use the number without quotes
          Name: `${lastName}, ${firstName}${
            middleInitial ? " " + middleInitial : ""
          }`,
          "STATUS\n(Employed / Unemployed / Not Responded":
            user.present_employment_status || "Not Responded",
          PROGRAM: user.program?.toUpperCase() || "N/A",
          "AGENCY EMPLOYED": user.agency || "N/A",
        };
      });

      // Get college name for title
      let collegeTitle = "ARO Report";
      if (userCollege) {
        const collegeObj = colleges.find((c) => c.key === userCollege);
        if (collegeObj) {
          collegeTitle = collegeObj.label;
        }
      }

      // Generate CSV content directly with better formatting
      let csvContent = "";

      // Create title row that spans all columns using comma separators for empty cells
      // This format helps Excel interpret it as merged cells.
      csvContent += `"${collegeTitle}",,,,\n`; // Title spans 5 columns

      // Create the header row. Ensure multi-line headers are quoted.
      csvContent += `"NO.","NAME","STATUS\n(EMPLOYED / UNEMPLOYED / NOT RESPONDED)","PROGRAM","AGENCY EMPLOYED"\n`;

      // Add male section if there are male alumni
      if (maleAlumni.length > 0) {
        csvContent += `"MALE",,,,\n`; // Male heading spans 5 columns
        for (let i = 0; i < maleData.length; i++) {
          const user = maleData[i];
          // Output the number directly without quotes for the first column
          csvContent += `${i + 1},"${user.Name}","${
            user["STATUS\n(Employed / Unemployed / Not Responded"]
          }","${user.PROGRAM}","${user["AGENCY EMPLOYED"]}"\n`;
        }
        csvContent += "\n"; // Extra line between sections
      }

      // Add female section if there are female alumni
      if (femaleAlumni.length > 0) {
        csvContent += `"FEMALE",,,,\n`; // Female heading spans 5 columns
        for (let i = 0; i < femaleData.length; i++) {
          const user = femaleData[i];
          // Output the number directly without quotes for the first column
          csvContent += `${i + 1},"${user.Name}","${
            user["STATUS\n(Employed / Unemployed / Not Responded"]
          }","${user.PROGRAM}","${user["AGENCY EMPLOYED"]}"\n`;
        }
      }

      // Create and download the file
      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);

      // Update filename to include college name
      const collegeAbbrev = userCollege ? userCollege.toUpperCase() : "ALL";
      link.setAttribute(
        "download",
        `${collegeAbbrev}_Report_${programFilter || "all"}_${
          batchYearFilter || "all"
        }_${new Date().toISOString().split("T")[0]}.csv`
      );

      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error generating report:", error);
      alert(
        `Failed to generate report: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const columns = [
    { key: "full_name", label: "Full Name" },
    { key: "program", label: "Program" },
    { key: "employment_status", label: "Employment Status" },
    { key: "job_alignment", label: "Job Alignment" },
    { key: "scholarship", label: "Scholarship" },
  ];

  if (isLoadingUsers) {
    return (
      <div className="h-full w-full flex justify-center items-center">
        <Spinner color="success" />
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col gap-2">
      <div className="w-full flex flex-col md:flex-row justify-between items-center gap-3">
        <div className="w-full grid grid-cols-1 place-items-center lg:flex lg:justify-between gap-3">
          <div className="w-full flex gap-3 items-center">
            <Select
              items={batchYearFormatted}
              label="Year"
              disallowEmptySelection={true}
              size="sm"
              className={`max-w-32`}
              defaultSelectedKeys={["all"]}
              value={batchYearFilter}
              onChange={(e) => setBatchYearFilter(e.target.value)}
            >
              {batchYearFormatted.map((item) => (
                <SelectItem key={item.key}>{item.label}</SelectItem>
              ))}
            </Select>

            <Button
              color="success"
              size="sm"
              className="text-white"
              onClick={handleGenerateReport}
              isLoading={isGeneratingReport}
            >
              {isGeneratingReport ? "Generating..." : "REPORT FOR ARO"}
            </Button>
          </div>

          {/* <div className="flex-grow"></div> */}

          <div className="w-full flex justify-end gap-3">
            <Select
              items={collegePrograms}
              label="Program Filter"
              disallowEmptySelection={true}
              size="sm"
              className={`max-w-xs`}
              defaultSelectedKeys={["all"]}
              selectedKeys={new Set([programFilter])}
              onSelectionChange={(keys) => {
                if (keys instanceof Set) {
                  const selectedKey = Array.from(keys)[0];
                  if (typeof selectedKey === "string") {
                    setProgramFilter(selectedKey);
                  }
                }
              }}
            >
              {collegePrograms.map((program) => (
                <SelectItem key={program.key}>{program.label}</SelectItem>
              ))}
            </Select>

            <Input
              size="sm"
              className="max-w-60"
              label="Search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        </div>
      </div>
      <Pagination
        isCompact
        showControls
        showShadow
        color="default"
        page={page}
        total={totalPages}
        className={`self-end ${usersData.length === 0 && "hidden"}`}
        onChange={(newPage) => setPage(newPage)}
      />

      <div className="flex h-full w-full overflow-y-auto relative">
        <Table
          fullWidth
          layout="auto"
          isHeaderSticky={true}
          aria-label="Job Applications Table"
          classNames={{
            wrapper: "h-full bg-[#F4FFFC] border-2 border-[#008B47]",
          }}
          className="h-full w-full flex items-center justify-center"
        >
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn
                key={column.key}
                className="bg-[#008B47] text-white text-center whitespace-nowrap flex-nowrap"
              >
                {column.label}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody
            items={usersData.slice().sort((a, b) => {
              const lastNameA = a.meta_data?.last_name?.toLowerCase() || "";
              const lastNameB = b.meta_data?.last_name?.toLowerCase() || "";
              return lastNameA.localeCompare(lastNameB);
            })}
            emptyContent={"No data to display."}
            loadingContent={<Spinner color="success" />}
          >
            {(item) => (
              <TableRow
                key={item.id}
                className="text-center hover:bg-green-100"
              >
                {(columnKey) => {
                  if (columnKey === "full_name") {
                    return (
                      <TableCell className="text-center">
                        {item.meta_data.first_name} {item.meta_data.last_name}
                      </TableCell>
                    );
                  }

                  if (columnKey === "program") {
                    return (
                      <TableCell className="text-center uppercase">
                        {item.meta_data.program || "N/A"}
                      </TableCell>
                    );
                  }

                  if (columnKey === "employment_status") {
                    return (
                      <TableCell className="text-center">
                        {item.meta_data.is_currently_employed === "yes"
                          ? "Employed"
                          : "Currently Unemployed"}
                      </TableCell>
                    );
                  }

                  if (columnKey === "job_alignment") {
                    return (
                      <TableCell className="text-center uppercase">
                        {!item.meta_data.is_course_aligned_with_job
                          ? "N/A"
                          : item.meta_data.is_course_aligned_with_job}
                      </TableCell>
                    );
                  }

                  if (columnKey === "scholarship") {
                    return (
                      <TableCell className="text-center uppercase">
                        {item.meta_data.scholarship === "n/a"
                          ? "N/A"
                          : item.meta_data.scholarship}
                      </TableCell>
                    );
                  }

                  return (
                    <TableCell className="text-center">
                      {item[columnKey as keyof typeof item]}
                    </TableCell>
                  );
                }}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AlumniUserComponent;
