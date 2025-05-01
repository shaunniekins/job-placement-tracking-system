"use client";

import { useEffect, useState } from "react";
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
  Input,
} from "@nextui-org/react";
import useUsers from "@/hooks/useUsers";
import useBatchYears from "@/hooks/useBatchYears";
import { colleges, programs } from "@/app/api/collegeAndProgramData";
import { supabase } from "@/utils/supabase";
import { capitalizeWords } from "@/utils/compUtils";

interface AlumniReportDataRPC {
  user_id: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  gender?: string;
  present_employment_status?: string;
  agency?: string;
  program?: string;
}

const AlumniUserComponent = () => {
  const [page, setPage] = useState(1);
  const rowsPerPage = 16;
  const [searchInput, setSearchInput] = useState("");
  const [programFilter, setProgramFilter] = useState("all");
  const [batchYearFilter, setBatchYearFilter] = useState("all");
  const [batchYearFormatted, setBatchYearFormatted] = useState<any[]>([]);
  const user = useSelector((state: RootState) => state.user.user);
  const userCollege = user?.user_metadata?.college;
  const userType = user?.user_metadata?.faculty_type;
  const isProgramChair = userType === "Program Chair";
  const isARO = userType === "ARO";

  const [collegePrograms, setCollegePrograms] = useState<any[]>([]);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [usersData, setUsersData] = useState<any[]>([]);

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

  const { usersData: initialUsersData, totalUserEntries } = useUsers(
    rowsPerPage,
    page,
    "alumni",
    "approved",
    userCollege,
    searchInput,
    batchYearFilter,
    programFilter
  );

  useEffect(() => {
    // Reset user data when filters change to ensure clean filtering
    setUsersData([]);

    // Reset to page 1 when filters change
    if (page !== 1) {
      setPage(1);
    }
  }, [batchYearFilter, programFilter, searchInput]);

  useEffect(() => {
    const fetchGtsData = async () => {
      if (initialUsersData && initialUsersData.length > 0) {
        const userIds = initialUsersData.map((user) => user.id);
        const { data: gtsData, error } = await supabase
          .from("GraduateTracerStudy")
          .select("alumni_id, agency")
          .in("alumni_id", userIds);

        if (!error && gtsData) {
          const gtsMap: Record<string, string> = {};
          gtsData.forEach((item) => {
            gtsMap[item.alumni_id] = item.agency;
          });

          const updatedUsersData = initialUsersData.map((user) => ({
            ...user,
            gtsAgency: gtsMap[user.id] || "",
          }));

          setUsersData(updatedUsersData);
        }
      }
    };

    fetchGtsData();
  }, [initialUsersData]);

  const totalPages = Math.ceil(totalUserEntries / rowsPerPage);

  const { batchYears } = useBatchYears();

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
    // console.log("Fetching all alumni data for report with filters:", {
    //   college: userCollege,
    //   program: programFilter,
    //   batchYear: batchYearFilter,
    //   searchTerm: searchInput || null,
    // });

    const args = {
      filter_college: userCollege && userCollege !== "all" ? userCollege : null,
      filter_program:
        programFilter && programFilter !== "all" ? programFilter : null,
      filter_batch_year:
        batchYearFilter && batchYearFilter !== "all" ? batchYearFilter : null,
      search_term: searchInput || null,
    };

    try {
      const { data, error } = await supabase.rpc(
        "get_filtered_alumni_report_data",
        args
      );

      if (error) {
        console.error("Error fetching alumni for report via RPC:", error);
        alert(`Failed to fetch report data: ${error.message}`);
        return [];
      }

      // console.log(`RPC returned ${data?.length || 0} alumni records`);

      if (data && data.length > 0) {
        const userIds = data.map((item: any) => item.user_id);

        const { data: gtsData, error: gtsError } = await supabase
          .from("GraduateTracerStudy")
          .select("alumni_id, agency")
          .in("alumni_id", userIds);

        // console.log(`Found ${gtsData?.length || 0} GTS records for the alumni`);

        if (!gtsError && gtsData) {
          const gtsMap: Record<string, string> = {};
          gtsData.forEach((item) => {
            gtsMap[item.alumni_id] = item.agency;
          });

          const enrichedData = data.map((item: any) => ({
            ...item,
            agency: gtsMap[item.user_id] || item.agency || "N/A",
          }));

          // console.log(
          //   `Returning ${enrichedData.length} enriched alumni records for the report`
          // );
          return enrichedData;
        } else if (gtsError) {
          console.error("Error fetching GTS data:", gtsError);
        }
      }

      return (data as AlumniReportDataRPC[]) || [];
    } catch (err) {
      console.error("Exception in fetchFilteredAlumniForReport:", err);
      return [];
    }
  };

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    try {
      const alumniData = await fetchFilteredAlumniForReport();
      // console.log(
      //   `Retrieved ${alumniData.length} total alumni records for report generation`
      // );

      if (alumniData.length === 0) {
        alert("No data found for the selected filters.");
        setIsGeneratingReport(false);
        return;
      }

      // Improved gender filtering with safety checks
      const maleAlumni = alumniData.filter(
        (user) => user.gender?.toLowerCase() === "male"
      );
      const femaleAlumni = alumniData.filter(
        (user) => user.gender?.toLowerCase() === "female"
      );
      // Add category for alumni with unknown/unspecified gender
      const unknownGenderAlumni = alumniData.filter(
        (user) =>
          !user.gender ||
          !["male", "female"].includes(user.gender.toLowerCase())
      );

      // console.log(
      //   `Gender distribution: Males: ${maleAlumni.length}, Females: ${femaleAlumni.length}, Unknown: ${unknownGenderAlumni.length}`
      // );

      const sortAlumni = (a: AlumniReportDataRPC, b: AlumniReportDataRPC) => {
        const lastNameA = a.last_name || "";
        const lastNameB = b.last_name || "";
        return lastNameA.localeCompare(lastNameB);
      };

      maleAlumni.sort(sortAlumni);
      femaleAlumni.sort(sortAlumni);
      unknownGenderAlumni.sort(sortAlumni);

      // Format all alumni data, including those with unknown gender
      const properCapitalize = (name: string) => {
        if (!name) return "";
        return name
          .split(" ")
          .map(
            (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          )
          .join(" ");
      };

      const formatUserData = (user: AlumniReportDataRPC, index: number) => {
        const firstName = properCapitalize(user.first_name || "");
        const lastName = properCapitalize(user.last_name || "");
        const middleInitial = user.middle_name
          ? properCapitalize(user.middle_name.charAt(0)) + "."
          : "";

        return {
          "No.": index + 1,
          Name: `${lastName}, ${firstName}${
            middleInitial ? " " + middleInitial : ""
          }`,
          "STATUS\n(Employed / Unemployed / Not Responded":
            user.present_employment_status || "Not Responded",
          PROGRAM: user.program?.toUpperCase() || "N/A",
          "AGENCY EMPLOYED": user.agency || "N/A",
        };
      };

      const maleData = maleAlumni.map((user, index) =>
        formatUserData(user, index)
      );
      const femaleData = femaleAlumni.map((user, index) =>
        formatUserData(user, index)
      );
      const unknownGenderData = unknownGenderAlumni.map((user, index) =>
        formatUserData(user, index)
      );

      // Generate the report with college title
      let collegeTitle = "ARO Report";
      if (userCollege) {
        const collegeObj = colleges.find((c) => c.key === userCollege);
        if (collegeObj) {
          collegeTitle = collegeObj.label;
        }
      }

      let csvContent = "";
      csvContent += `"${collegeTitle}",,,,\n`;
      csvContent += `"NO.","NAME","STATUS\n(EMPLOYED / UNEMPLOYED / NOT RESPONDED)","PROGRAM","AGENCY EMPLOYED"\n`;
      // csvContent += `"Total Alumni: ${alumniData.length}",,,,\n\n`;

      if (maleAlumni.length > 0) {
        csvContent += `"MALE (${maleAlumni.length})",,,,\n`;
        for (let i = 0; i < maleData.length; i++) {
          const user = maleData[i];
          csvContent += `${i + 1},"${user.Name}","${
            user["STATUS\n(Employed / Unemployed / Not Responded"]
          }","${user.PROGRAM}","${user["AGENCY EMPLOYED"]}"\n`;
        }
        csvContent += "\n";
      }

      if (femaleAlumni.length > 0) {
        csvContent += `"FEMALE (${femaleAlumni.length})",,,,\n`;
        for (let i = 0; i < femaleData.length; i++) {
          const user = femaleData[i];
          csvContent += `${i + 1},"${user.Name}","${
            user["STATUS\n(Employed / Unemployed / Not Responded"]
          }","${user.PROGRAM}","${user["AGENCY EMPLOYED"]}"\n`;
        }
        csvContent += "\n";
      }

      // Add section for alumni with unknown gender
      if (unknownGenderAlumni.length > 0) {
        csvContent += `"UNSPECIFIED GENDER (${unknownGenderAlumni.length})",,,,\n`;
        for (let i = 0; i < unknownGenderData.length; i++) {
          const user = unknownGenderData[i];
          csvContent += `${i + 1},"${user.Name}","${
            user["STATUS\n(Employed / Unemployed / Not Responded"]
          }","${user.PROGRAM}","${user["AGENCY EMPLOYED"]}"\n`;
        }
      }

      // Create and download the CSV file
      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);

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

      // console.log(`CSV report generated with all ${alumniData.length} records`);
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

  const columns = isProgramChair
    ? [
        { key: "full_name", label: "Full Name" },
        { key: "employment_status", label: "Employment Status" },
        { key: "job_alignment", label: "Job Alignment" },
        { key: "agency", label: "Agency" },
      ]
    : [
        { key: "full_name", label: "Full Name" },
        { key: "program", label: "Program" },
        { key: "employment_status", label: "Employment Status" },
        { key: "job_alignment", label: "Job Alignment" },
        { key: "scholarship", label: "Scholarship" },
      ];

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

            {(isProgramChair || isARO) && (
              <Button
                color="success"
                size="sm"
                className="text-white"
                onClick={handleGenerateReport}
                isLoading={isGeneratingReport}
              >
                {isGeneratingReport
                  ? "Generating..."
                  : isProgramChair
                  ? "REPORT FOR PC"
                  : "REPORT FOR ARO"}
              </Button>
            )}
          </div>

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
        className="self-end"
        onChange={(newPage) => setPage(newPage)}
      />

      <div className="mt-2 flex h-full w-full overflow-y-auto relative">
        <Table
          fullWidth
          layout="auto"
          isHeaderSticky={true}
          aria-label="Job Applications Table"
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
                      <TableCell className="text-center whitespace-nowrap">
                        {capitalizeWords(item.meta_data.first_name || "")}{" "}
                        {capitalizeWords(item.meta_data.last_name || "")}
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
                          : "Unemployed"}
                      </TableCell>
                    );
                  }

                  if (columnKey === "job_alignment") {
                    return (
                      <TableCell className="text-center">
                        {!item.meta_data.is_course_aligned_with_job
                          ? "N/A"
                          : item.meta_data.is_course_aligned_with_job === "yes"
                          ? "Aligned"
                          : "Not Aligned"}
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

                  if (columnKey === "agency") {
                    return (
                      <TableCell className="text-center">
                        {item.gtsAgency || "N/A"}
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
