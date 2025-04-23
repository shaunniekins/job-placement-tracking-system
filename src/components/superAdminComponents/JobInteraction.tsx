"use client";

import {
  Button,
  Select,
  SelectItem,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@nextui-org/react";
import { useRef, useState } from "react";
import useBatchYears from "@/hooks/useBatchYears";
import { colleges } from "@/app/api/collegeAndProgramData";
import useJobInteractionDefault from "@/hooks/useJobInteractionSelectedProgram";
import useCollegeStats2 from "@/hooks/useCollegeStats2";

import { formatDate } from "@/utils/compUtils";
import { FaPrint } from "react-icons/fa";
import { useReactToPrint } from "react-to-print";

interface CollegeStatsItem {
  college: string;
  program: string;
  batch_year: number;
  total_applications: number;
  total_approved_applications: number;
}

const JobInteractionComponent = () => {
  const [selectedCollege, setSelectedCollege] = useState<string>("");
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

  const handlePrintWrapper = (e: any) => {
    handlePrint();
  };

  return (
    <div className="h-full w-full flex flex-col">
      <div className="w-full flex lg:justify-between gap-3">
        <Button
          color="success"
          size="lg"
          className={`${!selectedProgram && "invisible"} text-white`}
          onPress={() => setSelectedProgram("")}
        >
          {selectedProgram.toUpperCase()}
        </Button>
        <div className="flex justify-end gap-3 w-full">
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
          />
        )}
      </div>
    </div>
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
            items={collegeStats}
            emptyContent="No data to display."
            loadingContent={<Spinner color="success" />}
          >
            {(item: CollegeStatsItem) => (
              <TableRow
                key={`${item.college}-${item.program}`}
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
            )}
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
}: {
  selectedCollege: string;
  selectedProgram: string;
  printRef: React.RefObject<HTMLDivElement>;
}) => {
  const { jobInteractionDataSelectedProgram, loading, error } =
    useJobInteractionDefault(
      selectedCollege.toString().toLowerCase(),
      selectedProgram.toString().toLowerCase()
    );

  const columns = [
    { key: "applicant_name", label: "Name of Applicants" },
    { key: "position", label: "Position" },
    { key: "agency_company_name", label: "Agency" },
    { key: "application_date", label: "Date" },
    { key: "application_status", label: "Status" },
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
                key={`${item.college}-${item.program}`}
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
