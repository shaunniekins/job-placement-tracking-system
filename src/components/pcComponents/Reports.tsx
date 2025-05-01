import { useState, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Button,
  Spinner,
  Tooltip,
  Chip,
} from "@nextui-org/react";
import { useSelector } from "react-redux";
import { RootState } from "@/app/reduxUtils/store";
import useUsers from "@/hooks/useUsers";
import { formatDocumentKey, capitalizeWords } from "@/utils/compUtils";
import { supabase } from "@/utils/supabase";
import { FaFileExport } from "react-icons/fa";
import Papa from "papaparse";

interface BasicInfoCsv {
  "Full Name": string;
  "Contact Number": string; // Already string type, ensuring export respects this
  "Licensure Exam": string;
  "Date Taken": string;
}

interface CertificatesCsv {
  "Full Name": string;
  "Employment Status": string;
  "Awards/Honors": string;
}

const ReportsPC = () => {
  const user = useSelector((state: RootState) => state.user.user);
  const userCollege = user?.user_metadata?.college;

  const [page, setPage] = useState(1);
  const rowsPerPage = 16;
  const [showCertificates, setShowCertificates] = useState(false);
  const [gtsData, setGtsData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Fetch alumni data
  const { usersData, totalUserEntries } = useUsers(
    rowsPerPage,
    page,
    "alumni",
    "approved",
    userCollege
  );

  // Fetch GTS data for the current users
  useEffect(() => {
    const fetchGtsData = async () => {
      if (!usersData.length) return;

      setLoading(true);
      try {
        const userIds = usersData.map((user) => user.id);
        const { data, error } = await supabase
          .from("GraduateTracerStudy")
          .select("*")
          .in("alumni_id", userIds);

        if (error) {
          console.error("Error fetching GTS data:", error);
          return;
        }

        // Create a map of alumni_id to GTS data for quick lookup
        const gtsMap: Record<string, any> = {};
        data?.forEach((item) => {
          gtsMap[item.alumni_id] = item;
        });

        setGtsData(gtsMap);
      } catch (err) {
        console.error("Unexpected error fetching GTS data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGtsData();
  }, [usersData]);

  const totalPages = Math.ceil(totalUserEntries / rowsPerPage);

  // Define columns based on showCertificates state
  const normalColumns = [
    { key: "full_name", label: "Full Name" },
    { key: "contact_number", label: "Contact Number" },
    { key: "examination_name", label: "Licensure Exam" },
    { key: "date_taken", label: "Date Taken" },
  ];

  const certificateColumns = [
    { key: "full_name", label: "Full Name" },
    { key: "employment_status", label: "Employment Status" },
    { key: "awards", label: "Awards/Honors" },
  ];

  const columns = showCertificates ? certificateColumns : normalColumns;

  // Function to fetch all alumni data for export
  const fetchAllAlumniData = async () => {
    setIsExporting(true);
    try {
      // Fetch all alumni users for the college (not just current page)
      const { data: allUsers, error: usersError } = await supabase
        .from("ViewUsers")
        .select("*")
        .eq("meta_data->>user_type", "alumni")
        .eq("meta_data->>account_status", "approved");

      if (usersError) {
        throw usersError;
      }

      // Filter by college if needed
      const filteredUsers = userCollege
        ? allUsers.filter(
            (user) =>
              user.meta_data?.college?.toLowerCase() ===
              userCollege.toLowerCase()
          )
        : allUsers;

      // Get all alumni IDs for GTS data
      const allAlumniIds = filteredUsers.map((user) => user.id);

      // Fetch GTS data for all alumni
      const { data: allGtsData, error: gtsError } = await supabase
        .from("GraduateTracerStudy")
        .select("*")
        .in("alumni_id", allAlumniIds);

      if (gtsError) {
        throw gtsError;
      }

      // Create GTS data lookup map
      const gtsMap: Record<string, any> = {};
      if (allGtsData) {
        allGtsData.forEach((item) => {
          gtsMap[item.alumni_id] = item;
        });
      }

      // Sort users by last name
      const sortedUsers = filteredUsers.sort((a, b) => {
        const lastNameA = a.meta_data?.last_name?.toLowerCase() || "";
        const lastNameB = b.meta_data?.last_name?.toLowerCase() || "";
        return lastNameA.localeCompare(lastNameB);
      });

      return { users: sortedUsers, gtsMap };
    } catch (error) {
      console.error("Error fetching all alumni data:", error);
      return { users: [], gtsMap: {} };
    } finally {
      setIsExporting(false);
    }
  };

  // Function to handle exporting data as CSV
  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const { users, gtsMap } = await fetchAllAlumniData();

      if (users.length === 0) {
        alert("No data to export.");
        setIsExporting(false); // Ensure loading state is reset
        return;
      }

      // Find college name for the header
      const collegeName = userCollege ? userCollege.toUpperCase() : "ALL";

      // Create CSV data based on view type
      if (!showCertificates) {
        // Basic info view
        const csvData: BasicInfoCsv[] = users.map((user) => {
          const gtsRecord = gtsMap[user.id];
          const exams = gtsRecord?.professional_examination || [];

          const formattedExams = exams
            .map((exam: any) => exam.name_of_exam)
            .join("; ");
          const formattedDates = exams
            .map((exam: any) => exam.date_taken)
            .join("; ");

          // Ensure contact number is treated as a string
          const contactNumber = user.meta_data?.contact_number
            ? String(user.meta_data.contact_number) // Explicitly cast to string
            : "N/A";

          return {
            "Full Name": `${capitalizeWords(
              user.meta_data?.last_name || ""
            )}, ${capitalizeWords(user.meta_data?.first_name || "")}`,
            "Contact Number": contactNumber, // Use the string variable
            "Licensure Exam": formattedExams || "N/A",
            "Date Taken": formattedDates || "N/A",
          };
        });

        // Convert to CSV with explicitly typed data
        const csvContent = Papa.unparse({
          fields: [
            "Full Name",
            "Contact Number",
            "Licensure Exam",
            "Date Taken",
          ],
          data: csvData,
        });

        // Add header
        const header = `Reports from ${collegeName}\n\n`;
        const finalCsvContent = header + csvContent;

        downloadCsv(finalCsvContent, collegeName, "Basic");
      } else {
        // Certificates view
        const csvData: CertificatesCsv[] = users.map((user) => {
          const gtsRecord = gtsMap[user.id];
          const educationBackgrounds = gtsRecord?.educational_background || [];

          // Collect all honors/awards
          const allHonors: string[] = [];
          educationBackgrounds.forEach((edu: any) => {
            if (!edu.honors) return;

            if (Array.isArray(edu.honors)) {
              allHonors.push(...edu.honors.filter(Boolean));
            } else if (typeof edu.honors === "string" && edu.honors.trim()) {
              allHonors.push(edu.honors);
            }
          });

          return {
            "Full Name": `${capitalizeWords(
              user.meta_data?.last_name || ""
            )}, ${capitalizeWords(user.meta_data?.first_name || "")}`,
            "Employment Status": gtsRecord?.present_employment_status || "N/A",
            "Awards/Honors": allHonors.join("; ") || "N/A",
          };
        });

        // Convert to CSV with explicitly typed data for certificates
        const csvContent = Papa.unparse({
          fields: ["Full Name", "Employment Status", "Awards/Honors"],
          data: csvData,
        });

        // Add header
        const header = `Reports from ${collegeName}\n\n`;
        const finalCsvContent = header + csvContent;

        downloadCsv(finalCsvContent, collegeName, "Certificates");
      }
    } catch (error) {
      console.error("Error exporting data:", error);
      alert(
        `Failed to export data: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsExporting(false);
    }
  };

  // Helper function to download CSV
  const downloadCsv = (
    content: string,
    collegeName: string,
    reportType: string
  ) => {
    const blob = new Blob([content], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Reports_${collegeName}_${reportType}_${
        new Date().toISOString().split("T")[0]
      }.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-full w-full flex flex-col gap-2">
      <div className="w-full flex justify-between items-center gap-3">
        <Button
          color="success"
          className="text-white"
          onClick={() => setShowCertificates(!showCertificates)}
        >
          {showCertificates ? "Show Basic Info" : "Show Certificates"}
        </Button>

        {/* Export Button */}
        <div className="flex items-center gap-2">
          <Button
            color="success"
            className="text-white"
            startContent={<FaFileExport />}
            onClick={handleExportData}
            isLoading={isExporting}
          >
            Export Data
          </Button>

          <Pagination
            isCompact
            showControls
            showShadow
            color="default"
            page={page}
            total={totalPages}
            className={`${usersData.length === 0 && "hidden"}`}
            onChange={(newPage) => setPage(newPage)}
          />
        </div>
      </div>

      <div className="mt-2 flex h-full w-full overflow-y-auto relative">
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-60 flex items-center justify-center z-10">
            <Spinner color="success" label="Loading GTS data..." />
          </div>
        )}
        <Table
          fullWidth
          layout="auto"
          isHeaderSticky={true}
          aria-label="Reports Table"
          classNames={{
            wrapper:
              "h-full bg-[#F4FFFC] border-2 border-[#008B47] overflow-x-auto",
          }}
          className="h-full w-full flex items-center justify-center"
        >
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn
                key={column.key}
                className="bg-[#008B47] text-white text-center whitespace-nowrap flex-nowrap"
                // Increase width for Full Name column
                style={{
                  width: column.key === "full_name" ? "250px" : "auto",
                }}
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
                      <TableCell
                        className="text-center whitespace-nowrap"
                        style={{ minWidth: "250px" }}
                      >
                        {capitalizeWords(item.meta_data.first_name || "")}{" "}
                        {capitalizeWords(item.meta_data.last_name || "")}
                      </TableCell>
                    );
                  }

                  if (columnKey === "contact_number") {
                    return (
                      <TableCell className="text-center">
                        {item.meta_data.contact_number
                          ? String(item.meta_data.contact_number)
                          : "N/A"}
                      </TableCell>
                    );
                  }

                  if (columnKey === "examination_name") {
                    const gtsRecord = gtsData[item.id];
                    const exams = gtsRecord?.professional_examination || [];

                    if (!exams.length) {
                      return <TableCell className="text-center">N/A</TableCell>;
                    }

                    return (
                      <TableCell className="text-center">
                        {exams.length === 1 ? (
                          exams[0].name_of_exam || "N/A"
                        ) : (
                          <Tooltip
                            content={
                              <div className="px-1 py-2">
                                <div className="text-small font-bold">
                                  Professional Examinations
                                </div>
                                <ul className="list-disc pl-4">
                                  {exams.map((exam: any, i: number) => (
                                    <li key={i} className="text-tiny">
                                      {exam.name_of_exam}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            }
                          >
                            <div className="cursor-help">
                              {exams[0].name_of_exam}
                              <Chip size="sm" className="ml-2">{`+${
                                exams.length - 1
                              }`}</Chip>
                            </div>
                          </Tooltip>
                        )}
                      </TableCell>
                    );
                  }

                  if (columnKey === "date_taken") {
                    const gtsRecord = gtsData[item.id];
                    const exams = gtsRecord?.professional_examination || [];

                    if (!exams.length) {
                      return <TableCell className="text-center">N/A</TableCell>;
                    }

                    return (
                      <TableCell className="text-center">
                        {exams.length === 1 ? (
                          exams[0].date_taken || "N/A"
                        ) : (
                          <Tooltip
                            content={
                              <div className="px-1 py-2">
                                <div className="text-small font-bold">
                                  Dates Taken
                                </div>
                                <ul className="list-disc pl-4">
                                  {exams.map((exam: any, i: number) => (
                                    <li key={i} className="text-tiny">
                                      {exam.date_taken}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            }
                          >
                            <div className="cursor-help">
                              {exams[0].date_taken}
                              <Chip size="sm" className="ml-2">{`+${
                                exams.length - 1
                              }`}</Chip>
                            </div>
                          </Tooltip>
                        )}
                      </TableCell>
                    );
                  }

                  if (columnKey === "employment_status") {
                    const gtsRecord = gtsData[item.id];
                    return (
                      <TableCell className="text-center">
                        {gtsRecord?.present_employment_status || "N/A"}
                      </TableCell>
                    );
                  }

                  if (columnKey === "awards") {
                    const gtsRecord = gtsData[item.id];
                    const educationBackgrounds =
                      gtsRecord?.educational_background || [];

                    // Collect all honors/awards from educational backgrounds
                    // Handle both cases where honors could be a string or potentially an array in the future
                    const allHonors: string[] = [];

                    educationBackgrounds.forEach((edu: any) => {
                      if (!edu.honors) return;

                      // If honors is already an array, spread it
                      if (Array.isArray(edu.honors)) {
                        allHonors.push(...edu.honors.filter(Boolean));
                      } else if (
                        typeof edu.honors === "string" &&
                        edu.honors.trim()
                      ) {
                        // If honors is a string, add it directly
                        allHonors.push(edu.honors);
                      }
                    });

                    if (allHonors.length === 0) {
                      return <TableCell className="text-center">N/A</TableCell>;
                    }

                    return (
                      <TableCell className="text-center">
                        {allHonors.length === 1 ? (
                          allHonors[0]
                        ) : (
                          <Tooltip
                            content={
                              <div className="px-1 py-2">
                                <div className="text-small font-bold">
                                  All Honors & Awards
                                </div>
                                <ul className="list-disc pl-4">
                                  {allHonors.map((honor: string, i: number) => (
                                    <li key={i} className="text-tiny">
                                      {honor}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            }
                          >
                            <div className="cursor-help">
                              {allHonors[0]}
                              <Chip size="sm" className="ml-2">{`+${
                                allHonors.length - 1
                              }`}</Chip>
                            </div>
                          </Tooltip>
                        )}
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

export default ReportsPC;
