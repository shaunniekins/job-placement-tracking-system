"use client";

import {
  Button,
  Input,
  Select,
  SelectItem,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Card,
  CardBody,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ButtonGroup,
} from "@nextui-org/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { MdBarChart } from "react-icons/md";
import { FaFileExport, FaPrint } from "react-icons/fa";
import Papa from "papaparse";

import { EyeFilledIcon } from "../../../public/icons/EyeFilledIcon";
import AlumniProfileModal from "../agencyComponents/AlumniProfileModal";
import { useRef, useState, useEffect, useCallback } from "react";
import useBatchYears from "@/hooks/useBatchYears";
import { colleges } from "@/app/api/collegeAndProgramData";
import useJobInteractionDefault from "@/hooks/useJobInteractionSelectedProgram";
import useCollegeStats2 from "@/hooks/useCollegeStats2";

import { formatDate } from "@/utils/compUtils";
import { useReactToPrint } from "react-to-print";
import { supabase } from "@/utils/supabase";

interface CollegeStatsItem {
  college: string;
  program: string;
  batch_year: number;
  total_applications: number;
  total_approved_applications: number;
}

const JobInteractionComponent = () => {
  // --- FIX: Use "all" as default, not empty string ---
  const [selectedCollege, setSelectedCollege] = useState<string>("all");
  const [selectedProgram, setSelectedProgram] = useState<string>("");
  const [batchYearFilter, setBatchYearFilter] = useState<string>("all");
  const { batchYears } = useBatchYears();
  const { collegeStats, loadingStats } = useCollegeStats2(
    batchYearFilter,
    selectedCollege,
    ""
  );

  const batchYearFormatted = [
    { key: "all", label: "All" },
    ...batchYears.map((item: any) => ({
      key: item.batch_year.toString(),
      label: item.batch_year.toString(),
    })),
  ];

  const allColleges = [{ key: "all", label: "All" }, ...colleges];

  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Data Graphs",
  });

  const [isExporting, setIsExporting] = useState(false);

  const handlePrintWrapper = (e: any) => {
    setIsExporting(true);
    setTimeout(() => {
      handlePrint();
      // Set back to false after printing is initiated
      setTimeout(() => setIsExporting(false), 500);
    }, 100);
  };

  // Add new state variables for alumni profile modal
  const [currentUserId, setCurrentUserId] = useState("");
  const [currentUserType, setCurrentUserType] = useState("");
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");

  const [graphData, setGraphData] = useState<any[]>([]);
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);

  // Add new state variables for filtering
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [agencyFilter, setAgencyFilter] = useState<string>("all");
  const [agencies, setAgencies] = useState<{ key: string; label: string }[]>(
    []
  );

  // ------------------------------------------------------------

  // --- FIX: Fetch correct graph data for selected program ---
  const fetchGraphData = useCallback(async () => {
    try {
      // Always send null if not set, never empty string
      let college =
        !selectedCollege || selectedCollege === "all" ? null : selectedCollege;
      // Ensure program is null if empty string or 'all'
      let program =
        !selectedProgram || selectedProgram === "all" ? null : selectedProgram;
      let batchYear =
        !batchYearFilter || batchYearFilter === "all" ? null : batchYearFilter;

      // Determine filter based on whether a specific program is selected
      const filter = program ? "program" : "college"; // If program is set (not null), filter by program, otherwise by college

      const { data, error } = await supabase.rpc(
        `get_view_stats_by_${filter}`,
        {
          batch_year: batchYear,
          selected_college: college,
          selected_program: program,
        }
      );

      if (error) throw error;

      const formattedData = (data || []).map((item: any) => ({
        name: item.group_name, // group_name is returned by all functions
        applied: item.applied_count || 0,
        interview: item.interview_count || 0,
        exam: item.exam_count || 0,
        accepted: item.accepted_count || 0,
        rejected: item.rejected_count || 0,
      }));

      setGraphData(formattedData);
    } catch (error) {
      console.error("Error fetching graph data:", error);
      setGraphData([]); // Clear data on error
    }
  }, [batchYearFilter, selectedCollege, selectedProgram]);
  // ---------------------------------------------------------

  useEffect(() => {
    fetchGraphData();
  }, [fetchGraphData]);

  // Simplify handleExportData: use current filter
  const handleExportData = () => {
    if (!graphData || graphData.length === 0) return;
    const filter = selectedProgram ? "Program" : "College";
    const csvData = graphData.map((item) => ({
      [filter]: item.name,
      Applied: item.applied,
      Interview: item.interview,
      Exam: item.exam,
      Accepted: item.accepted,
      Rejected: item.rejected,
      "Acceptance Rate": `${((item.accepted / item.applied) * 100 || 0).toFixed(
        2
      )}%`,
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `job_applications_by_${filter.toLowerCase()}_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Improved fetch agencies function with better deduplication
  const fetchAgencies = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("ViewJobPostingsWithAgencyDetails")
        .select("agency_id, agency_company_name")
        .order("agency_company_name")
        .not("agency_company_name", "is", null);

      if (error) throw error;

      // More explicit deduplication approach
      const agencyMap = new Map();
      if (data) {
        data.forEach((item) => {
          if (item.agency_id && !agencyMap.has(item.agency_id)) {
            agencyMap.set(item.agency_id, {
              key: item.agency_id,
              label: item.agency_company_name || "Unknown Agency",
            });
          }
        });
      }

      // Convert map to array and sort by label for better organization
      const formattedAgencies = Array.from(agencyMap.values()).sort((a, b) =>
        a.label.localeCompare(b.label)
      );

      setAgencies([
        { key: "all", label: "All Agencies" },
        ...formattedAgencies,
      ]);
    } catch (error) {
      console.error("Error fetching agencies:", error);
      setAgencies([{ key: "all", label: "All Agencies" }]);
    }
  }, []);

  // Function to generate report based on filters
  const generateReport = useCallback(async () => {
    try {
      // Build the query based on filters
      let query = supabase.from("ViewJobApplicationsWithDetails").select("*");

      // Apply status filter
      if (statusFilter !== "all") {
        query = query.eq("application_status", statusFilter);
      }

      // Apply agency filter
      if (agencyFilter !== "all") {
        query = query.eq("agency_id", agencyFilter);
      }

      // Apply college/program filters if set
      if (selectedProgram) {
        query = query.eq("applicant_program", selectedProgram);
      } else if (selectedCollege && selectedCollege !== "all") {
        query = query.eq("applicant_college", selectedCollege);
      }

      // Apply batch year filter if set
      if (batchYearFilter && batchYearFilter !== "all") {
        query = query.eq("applicant_batch_year", batchYearFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (!data || data.length === 0) {
        alert("No data found for the selected filters.");
        return;
      }

      // Format data for CSV
      const csvData = data.map((item) => ({
        "Applicant Name": `${item.applicant_last_name}, ${item.applicant_first_name}`,
        Program: item.applicant_program?.toUpperCase() || "N/A",
        "Job Title": item.job_title || "N/A",
        Agency: item.agency_company_name || "N/A",
        "Application Date": formatDate(item.application_date),
        Status: item.application_status?.toUpperCase() || "N/A",
      }));

      // Generate and download CSV
      const csv = Papa.unparse(csvData);
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      // Descriptive filename based on filters
      const statusText = statusFilter === "all" ? "all_statuses" : statusFilter;
      const agencyText =
        agencyFilter === "all"
          ? "all_agencies"
          : agencies
              .find((a) => a.key === agencyFilter)
              ?.label.replace(/\s+/g, "_")
              .toLowerCase() || "unknown";

      a.download = `applications_${statusText}_${agencyText}_${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Error generating report. Please try again.");
    }
  }, [
    statusFilter,
    agencyFilter,
    selectedProgram,
    selectedCollege,
    batchYearFilter,
    agencies,
  ]);

  // Load agencies when modal is opened
  useEffect(() => {
    if (isChartModalOpen) {
      fetchAgencies();
    }
  }, [isChartModalOpen, fetchAgencies]);

  return (
    <>
      <AlumniProfileModal
        alumniId={currentUserId}
        setAlumniId={setCurrentUserId}
        openAlumniProfile={isUserProfileOpen}
        setOpenAlumniProfile={setIsUserProfileOpen}
        userType="alumni"
        setUserType={setCurrentUserType}
      />

      {/* Enhanced Chart Modal with filters and report generation */}
      <Modal
        size="2xl"
        isOpen={isChartModalOpen}
        onOpenChange={setIsChartModalOpen}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex items-center justify-between">
                <h2>Application Statistics</h2>
              </ModalHeader>
              <ModalBody>
                <div className="flex flex-col gap-4">
                  {/* Filter controls */}
                  <div className="flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex flex-wrap gap-2 items-center">
                      <Select
                        label="Status Filter"
                        size="sm"
                        className="w-40"
                        defaultSelectedKeys={["all"]}
                        onChange={(e) => setStatusFilter(e.target.value)}
                      >
                        <SelectItem key="all">All Statuses</SelectItem>
                        <SelectItem key="accepted">Accepted</SelectItem>
                        <SelectItem key="rejected">Rejected</SelectItem>
                        <SelectItem key="pending">Pending</SelectItem>
                        <SelectItem key="interview">Interview</SelectItem>
                        <SelectItem key="examination">Examination</SelectItem>
                      </Select>

                      <Select
                        label="Agency Filter"
                        size="sm"
                        className="w-64"
                        defaultSelectedKeys={["all"]}
                        onChange={(e) => setAgencyFilter(e.target.value)}
                      >
                        {agencies.map((agency) => (
                          <SelectItem key={agency.key}>
                            {agency.label}
                          </SelectItem>
                        ))}
                      </Select>
                    </div>

                    <Button
                      color="success"
                      className="text-white"
                      endContent={<FaFileExport />}
                      onClick={generateReport}
                    >
                      Generate Report
                    </Button>
                  </div>

                  {/* Chart */}
                  <Card className="w-full h-[400px]">
                    <CardBody>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={graphData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar
                            dataKey="applied"
                            fill="#8884d8"
                            name="Applied"
                          />
                          <Bar
                            dataKey="interview"
                            fill="#82ca9d"
                            name="Interview"
                          />
                          <Bar dataKey="exam" fill="#ffc658" name="Exam" />
                          <Bar
                            dataKey="accepted"
                            fill="#82ca9d"
                            name="Accepted"
                          />
                          <Bar
                            dataKey="rejected"
                            fill="#ff7c7c"
                            name="Rejected"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardBody>
                  </Card>
                </div>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>

      <div className="h-full w-full flex flex-col">
        <div className="w-full flex lg:justify-between gap-3">
          <Button
            color="success"
            size="lg"
            className={`${!selectedProgram && "invisible"} text-white`}
            onClick={() => setSelectedProgram("")}
          >
            {selectedProgram ? selectedProgram.toUpperCase() : ""}
          </Button>
          <div className="flex justify-end items-center gap-3 w-full">
            <Select
              items={allColleges}
              label="Colleges"
              disallowEmptySelection={true}
              size="sm"
              color="success"
              className={`${selectedProgram && "invisible"} max-w-[28rem]`}
              defaultSelectedKeys={["all"]}
              value={selectedCollege}
              onChange={(e) => setSelectedCollege(e.target.value)}
            >
              {allColleges.map((item) => (
                <SelectItem key={item.key}>{item.label}</SelectItem>
              ))}
            </Select>

            <Select
              items={batchYearFormatted}
              label="Year"
              disallowEmptySelection={true}
              size="sm"
              color="success"
              className={`${selectedProgram && "invisible"} max-w-32`}
              defaultSelectedKeys={["all"]}
              value={batchYearFilter}
              onChange={(e) => setBatchYearFilter(e.target.value)}
            >
              {batchYearFormatted.map((item) => (
                <SelectItem key={item.key}>{item.label}</SelectItem>
              ))}
            </Select>
            <Input
              size="sm"
              color="success"
              className={`${!selectedProgram && "hidden"} max-w-60`}
              label="Search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {/* Chart Button */}
            <Button
              color="success"
              className="text-white"
              startContent={<MdBarChart />}
              onClick={() => setIsChartModalOpen(true)}
            >
              View Stats
            </Button>
            <Button
              color="success"
              endContent={<FaPrint />}
              className={`${!selectedProgram && "hidden"} text-white`}
              onPress={handlePrintWrapper}
            >
              Export
            </Button>
          </div>
        </div>

        {/* Existing Table Section */}
        <div className="h-full flex overflow-y-auto mt-5">
          {!selectedProgram ? (
            <DefaultView
              collegeStats={collegeStats || []}
              setSelectedProgram={setSelectedProgram}
            />
          ) : (
            <SelectedProgramView
              selectedCollege={selectedCollege}
              selectedProgram={selectedProgram}
              printRef={printRef}
              setCurrentUserId={setCurrentUserId}
              setCurrentUserType={setCurrentUserType}
              setIsUserProfileOpen={setIsUserProfileOpen}
              searchInput={searchInput}
              isExporting={isExporting}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default JobInteractionComponent;

const DefaultView = ({
  collegeStats,
  setSelectedProgram,
}: {
  collegeStats: CollegeStatsItem[];
  setSelectedProgram: (program: string) => void;
}) => {
  const columns = [
    { key: "college", label: "College" },
    { key: "program", label: "Program" },
    { key: "total_applications", label: "Number of Job Initiation" },
    { key: "total_approved_applications", label: "Approved" },
  ];

  // Aggregate data by college and program
  const aggregatedStats = collegeStats.reduce(
    (result: CollegeStatsItem[], item) => {
      // Check if we already have this college+program combination
      const existingItemIndex = result.findIndex(
        (i) => i.college === item.college && i.program === item.program
      );

      if (existingItemIndex >= 0) {
        // Update existing entry with summed values
        result[existingItemIndex].total_applications += item.total_applications;
        result[existingItemIndex].total_approved_applications +=
          item.total_approved_applications;
      } else {
        // Add new entry
        result.push({ ...item });
      }

      return result;
    },
    []
  );

  return (
    <div className="h-full w-full flex flex-col gap-3">
      <div className="flex h-full w-full overflow-y-auto">
        <Table
          fullWidth
          layout="auto"
          isHeaderSticky
          aria-label="Specific College Stats Table"
          classNames={{
            wrapper: "h-full bg-[#F4FFFC] border-2 border-[#008B47]",
          }}
          className="h-full w-full flex items-center justify-center"
        >
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn
                key={column.key}
                className="bg-[#008B47] text-white whitespace-nowrap text-center flex-nowrap"
              >
                {column.label}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody
            items={aggregatedStats}
            emptyContent="No data to display."
            loadingContent={<Spinner color="success" />}
          >
            {(item: CollegeStatsItem) => {
              // Find the index of the current item in the array for unique key
              const rowIndex = aggregatedStats.indexOf(item);
              return (
                <TableRow
                  key={`${item.college}-${item.program}-${rowIndex}`}
                  className="text-center hover:bg-green-100"
                >
                  {(columnKey) => (
                    <TableCell
                      className="text-center uppercase w-[25%] py-5 cursor-pointer"
                      onClick={() => setSelectedProgram(item.program)}
                    >
                      {item[columnKey as keyof CollegeStatsItem]}
                    </TableCell>
                  )}
                </TableRow>
              );
            }}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

const SelectedProgramView = ({
  selectedCollege,
  selectedProgram,
  printRef,
  setCurrentUserId,
  setCurrentUserType,
  setIsUserProfileOpen,
  searchInput,
  isExporting,
}: {
  selectedCollege: string;
  selectedProgram: string;
  printRef: React.RefObject<HTMLDivElement>;
  setCurrentUserId: (id: string) => void;
  setCurrentUserType: (type: string) => void;
  setIsUserProfileOpen: (isOpen: boolean) => void;
  searchInput: string;
  isExporting: boolean;
}) => {
  const { jobInteractionDataSelectedProgram, loading, error } =
    useJobInteractionDefault(
      (selectedCollege && selectedCollege !== "all"
        ? selectedCollege
        : ""
      ).toLowerCase(),
      (selectedProgram && selectedProgram !== "all"
        ? selectedProgram
        : ""
      ).toLowerCase(),
      searchInput
    );

  const columns = [
    { key: "applicant_name", label: "Name of Applicants" },
    { key: "position", label: "Position" },
    { key: "agency_company_name", label: "Agency" },
    { key: "application_date", label: "Date" },
    { key: "application_status", label: "Status" },
    // Only include action column if not exporting
    ...(isExporting ? [] : [{ key: "action", label: "Action" }]),
  ];

  return (
    <div className="h-full w-full flex flex-col gap-3" ref={printRef}>
      <div className="flex h-full w-full overflow-y-auto">
        <Table
          fullWidth
          layout="auto"
          isHeaderSticky
          aria-label="Specific College Stats Table"
          classNames={{
            wrapper: "h-full bg-[#F4FFFC] border-2 border-[#008B47]",
          }}
          className="h-full w-full flex items-center justify-center"
        >
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn
                key={column.key}
                className="bg-[#008B47] text-white whitespace-nowrap text-center flex-nowrap"
              >
                {column.label}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody
            items={jobInteractionDataSelectedProgram}
            emptyContent="No data to display."
            loadingContent={<Spinner color="success" />}
          >
            {(item: any) => (
              <TableRow
                // Ensure a unique key, prefer job_application_id
                key={
                  item.job_application_id ?? // Use nullish coalescing
                  `${item.applicant_id}-${item.job_title}-${item.application_date}`
                }
                className="text-center hover:bg-green-100"
              >
                {(columnKey) => {
                  if (columnKey === "applicant_name") {
                    return (
                      <TableCell className="text-center">
                        <h1 className="capitalize">
                          {item.applicant_first_name} {item.applicant_last_name}
                        </h1>
                      </TableCell>
                    );
                  }
                  if (columnKey === "application_date") {
                    return (
                      <TableCell className="text-center">
                        <h1>{formatDate(item.application_date)}</h1>
                      </TableCell>
                    );
                  }
                  if (columnKey === "position") {
                    return (
                      <TableCell className="text-center capitalize">
                        {item.job_title}
                      </TableCell>
                    );
                  }
                  if (columnKey === "action") {
                    return (
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          color="success"
                          startContent={<EyeFilledIcon />}
                          onClick={() => {
                            setCurrentUserId(item.applicant_id);
                            setCurrentUserType("alumni");
                            setIsUserProfileOpen(true);
                          }}
                        >
                          View Profile
                        </Button>
                      </TableCell>
                    );
                  }
                  return (
                    <TableCell className="text-center capitalize py-5">
                      {item[columnKey as keyof any]}
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
