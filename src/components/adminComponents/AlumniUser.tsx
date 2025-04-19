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
        return;
      }

      // Define headers explicitly to know the column count and for uppercasing
      const headers = ["Full name", "Employment status", "Agency", "Gender"];
      const numColumns = headers.length;

      // Convert headers to uppercase
      const uppercaseHeaders = headers.map((header) => header.toUpperCase());

      const reportData = alumniData.map((user) => {
        // Map data according to the original headers order (keys are case-sensitive)
        return {
          "Full name": `${user.last_name || ""}, ${user.first_name || ""}${
            user.middle_name ? " " + user.middle_name.charAt(0) + "." : ""
          }`,
          "Employment status": user.present_employment_status || "N/A",
          Agency: user.agency || "N/A",
          Gender: user.gender || "N/A",
        };
      });

      // Generate CSV data part using PapaParse
      // Use the original headers for mapping keys, but tell PapaParse to use the uppercase ones for the output header row
      const csvData = Papa.unparse(reportData, {
        columns: headers, // Use original headers for data mapping
        header: false, // We will manually add the uppercase header row
      });

      // Create the title row
      const titleRow = `"ARO Report"${",".repeat(numColumns - 1)}\n`;

      // Create the uppercase header row
      // Ensure headers with commas or quotes are handled correctly by Papa.unparse logic (or manually quote them)
      const headerRow = uppercaseHeaders.map((h) => `"${h}"`).join(",") + "\n";

      // Prepend the title row and header row to the CSV data
      const csvContentWithTitleAndHeader = titleRow + headerRow + csvData;

      // Create Blob with the modified content
      const blob = new Blob([csvContentWithTitleAndHeader], {
        type: "text/csv;charset=utf-8;",
      });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      // Keep the original filename logic
      link.setAttribute(
        "download",
        `ARO_Report_${programFilter || "all"}_${batchYearFilter || "all"}_${
          new Date().toISOString().split("T")[0]
        }.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Failed to generate report.");
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
        <div className="w-full grid grid-cols-3 place-items-center lg:flex lg:justify-start gap-3">
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

          <div className="flex-grow"></div>

          <div className="flex gap-3">
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

            <Pagination
              isCompact
              showControls
              showShadow
              color="default"
              page={page}
              total={totalPages}
              className={`${
                (usersData.length === 0 || rowsPerPage > usersData.length) &&
                "hidden"
              } flex justify-center items-center`}
              onChange={(newPage) => setPage(newPage)}
            />
          </div>
        </div>
      </div>

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
            items={usersData}
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
                      <TableCell className="text-center">
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
