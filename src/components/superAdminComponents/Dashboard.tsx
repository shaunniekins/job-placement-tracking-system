"use client";

import useCollegeStats from "@/hooks/useCollegeStats";
import {
  getKeyValue,
  Image,
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
import { useEffect, useState } from "react";
import useBatchYears from "@/hooks/useBatchYears";
import { programs } from "@/app/api/collegeAndProgramData";

const DashboardComponent = () => {
  const [selectedCollege, setSelectedCollege] = useState<string>("");
  const [selectedProgram, setSelectedProgram] = useState<string>("");

  const colleges = [
    { src: "/images/college-ca.png", name: "CA" },
    { src: "/images/college-cas.png", name: "CAS" },
    { src: "/images/college-cba.jpg", name: "CBA" },
    { src: "/images/college-ccis.jpg", name: "CCIS" },
    { src: "/images/college-ceit.png", name: "CEIT" },
    { src: "/images/college-cte.png", name: "CTE" },
  ];

  const handleImageClick = (collegeName: string) => {
    setSelectedCollege((prevSelectedCollege) =>
      prevSelectedCollege === collegeName ? "" : collegeName
    );
    setSelectedProgram("");
  };

  // there are 3 views:
  // 1. default (no selected college and no selected program)
  // 2. selected college (selected college and no selected program)
  // 3. selected program (selected college and selected program)

  return (
    <div className="h-full w-full flex flex-col">
      <div className="lg:h-44 flex justify-around gap-4 overflow-x-auto overflow-y-hidden lg:overflow-hidden">
        {colleges.map((college, index) => (
          <div
            key={index}
            className={`flex flex-col items-center rounded-xl p-2 border-2 ${
              selectedCollege === college.name
                ? "border-[#008B47]"
                : "border-[#F4FFFC]"
            }`}
            onClick={() => handleImageClick(college.name)}
          >
            <Image
              src={college.src}
              alt={college.name}
              className="w-fulllg:w-24 lg:h-24 cursor-pointer"
            />
            <span className="mt-2 text-center">{college.name}</span>
          </div>
        ))}
      </div>
      <div className="h-full flex overflow-y-auto">
        {!selectedCollege && !selectedProgram && <DefaultView />}
        {selectedCollege && !selectedProgram && (
          <SelectedCollegeView
            selectedCollege={selectedCollege}
            setSelectedProgram={setSelectedProgram}
          />
        )}
        {selectedCollege && selectedProgram && (
          <SelectedProgramView
            selectedCollege={selectedCollege}
            selectedProgram={selectedProgram}
          />
        )}
      </div>
    </div>
  );
};

export default DashboardComponent;

// BarChart component for displaying statistics
const StatsBarChart = ({ data }: { data: any[] }) => {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <Tooltip />
        <Bar dataKey="value" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  );
};

// first view: default
const DefaultView = () => {
  const [batchYearFormatted, setBatchYearFormatted] = useState<any[]>([]);
  const [batchYearFilter, setBatchYearFilter] = useState<string>("all");
  const { batchYears, isBatchYearsLoading } = useBatchYears();
  const { collegeStats, loadingStats, errorStats } =
    useCollegeStats(batchYearFilter);

  const columns = [
    { key: "graduates", label: "Graduates" },
    { key: "scholars", label: "Scholars" },
    { key: "jobAlignment", label: "Job Alignment" },
  ];

  // Function to transform college stats into bar chart data with updated labels
  const formatChartData = (stat: any, metric1: string, metric2: string) => {
    const labels: any = {
      employed_count: "Employed",
      scholarship_count: "Scholar",
      course_aligned_count: "Aligned",
    };

    const totalLabels: any = {
      employed_count: "Unemployed",
      scholarship_count: "Non-scholar",
      course_aligned_count: "Non-aligned",
    };

    return [
      { name: labels[metric1], value: stat[metric1] || 0 },
      {
        name: totalLabels[metric1],
        value: (stat.total_population || 0) - (stat[metric1] || 0),
      },
    ];
  };

  const colleges = [
    { key: "ca", name: "CA" },
    { key: "cas", name: "CAS" },
    { key: "cba", name: "CBA" },
    { key: "ccis", name: "CCIS" },
    { key: "ceit", name: "CEIT" },
    { key: "cte", name: "CTE" },
  ];

  useEffect(() => {
    // Transform the batchYears data
    const formattedData = batchYears.map((item: any) => ({
      key: item.batch_year.toString(),
      label: item.batch_year.toString(),
    }));

    // Append the "all" option
    formattedData.unshift({ key: "all", label: "All" });

    setBatchYearFormatted(formattedData);
  }, [batchYears]);

  return (
    <div className="h-full w-full flex flex-col gap-3 pb-[6.3rem]">
      <div className="w-full grid grid-cols-3 place-items-center lg:flex lg:justify-between gap-3">
        <Select
          items={batchYearFormatted}
          label="Year"
          disallowEmptySelection={true}
          size="sm"
          className="max-w-32"
          defaultSelectedKeys={["all"]}
          value={batchYearFilter}
          onChange={(e) => setBatchYearFilter(e.target.value)}
        >
          {batchYearFormatted.map((item) => (
            <SelectItem key={item.key}>{item.label}</SelectItem>
          ))}
        </Select>
      </div>
      <div className="flex h-full w-full overflow-y-auto">
        <Table
          fullWidth
          layout="auto"
          isHeaderSticky={true}
          aria-label="College Stats Table"
          classNames={{
            wrapper: "h-full bg-[#F4FFFC] border-2 border-[#008B47]",
          }}
          className="h-full w-full flex items-center justify-center"
        >
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn
                key={column.key}
                className="text-center whitespace-nowrap flex-nowrap"
              >
                {column.label}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody
            items={colleges}
            emptyContent={"No data to display."}
            loadingContent={<Spinner color="success" />}
          >
            {(item) => (
              <TableRow key={item.key} className="text-center w-full">
                {(columnKey) => {
                  const stat = (collegeStats ?? []).find(
                    (stat) => stat.college === item.key
                  ) || {
                    college: item.key,
                    employed_count: 0,
                    scholarship_count: 0,
                    course_aligned_count: 0,
                    total_population: 0,
                  };

                  if (columnKey === "graduates") {
                    return (
                      <TableCell className="w-[33.3%] text-center">
                        <h1 className="uppercase">{stat.college}</h1>

                        <StatsBarChart
                          data={formatChartData(
                            stat,
                            "employed_count",
                            "total_population"
                          )}
                        />
                      </TableCell>
                    );
                  }

                  if (columnKey === "scholars") {
                    return (
                      <TableCell className="w-[33.3%] text-center">
                        <h1 className="uppercase">{stat.college}</h1>

                        <StatsBarChart
                          data={formatChartData(
                            stat,
                            "scholarship_count",
                            "total_population"
                          )}
                        />
                      </TableCell>
                    );
                  }

                  if (columnKey === "jobAlignment") {
                    return (
                      <TableCell className="w-[33.3%] text-center">
                        <h1 className="uppercase">{stat.college}</h1>

                        <StatsBarChart
                          data={formatChartData(
                            stat,
                            "course_aligned_count",
                            "total_population"
                          )}
                        />
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

// second view: selected college
const SelectedCollegeView = ({
  selectedCollege,
  setSelectedProgram,
}: {
  selectedCollege: string;
  setSelectedProgram: (program: string) => void;
}) => {
  const [batchYearFormatted, setBatchYearFormatted] = useState<any[]>([]);
  const [batchYearFilter, setBatchYearFilter] = useState<string>("all");
  const { batchYears, isBatchYearsLoading } = useBatchYears();
  const { collegeStats, loadingStats, errorStats } = useCollegeStats(
    batchYearFilter,
    selectedCollege.toString().toLowerCase()
  );

  const columns = [
    { key: "college", label: "College" },
    { key: "graduates", label: "Graduates" },
    { key: "scholarship_count", label: "Scholars" },
    { key: "employed_count", label: "Number of Employed" },
  ];

  const getProgramsByCollege = (selectedCollege: string) => {
    return programs.filter(
      (program) =>
        program.college.toLowerCase() === selectedCollege.toLowerCase()
    );
  };

  const filteredPrograms = getProgramsByCollege(selectedCollege.toLowerCase());

  useEffect(() => {
    // Transform the batchYears data
    const formattedData = batchYears.map((item: any) => ({
      key: item.batch_year.toString(),
      label: item.batch_year.toString(),
    }));

    // Append the "all" option
    formattedData.unshift({ key: "all", label: "All" });

    setBatchYearFormatted(formattedData);
  }, [batchYears]);

  return (
    <div className="h-full w-full flex flex-col gap-3">
      <div className="w-full grid grid-cols-3 place-items-center lg:flex lg:justify-between gap-3">
        <Select
          items={batchYearFormatted}
          label="Year"
          disallowEmptySelection={true}
          size="sm"
          className="max-w-32"
          defaultSelectedKeys={["all"]}
          value={batchYearFilter}
          onChange={(e) => setBatchYearFilter(e.target.value)}
        >
          {batchYearFormatted.map((item) => (
            <SelectItem key={item.key}>{item.label}</SelectItem>
          ))}
        </Select>
      </div>

      <div className="flex h-full w-full overflow-y-auto">
        <Table
          fullWidth
          layout="auto"
          isHeaderSticky={true}
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
                className="text-center whitespace-nowrap flex-nowrap"
              >
                {column.label}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody
            items={filteredPrograms}
            emptyContent="No data to display."
            loadingContent={<Spinner color="success" />}
          >
            {(item) => (
              <TableRow key={item.key} className="text-center w-full">
                {(columnKey) => {
                  const stat = (collegeStats ?? []).find(
                    (stat) =>
                      stat.program.toLowerCase() === item.key.toLowerCase() &&
                      stat.college.toLowerCase() ===
                        selectedCollege.toLowerCase()
                  );

                  const displayStat = stat || {
                    college: selectedCollege,
                    program: item.key,
                    employed_count: 0,
                    scholarship_count: 0,
                    course_aligned_count: 0,
                    total_population: 0,
                  };

                  if (columnKey === "graduates") {
                    return (
                      <TableCell
                        className="text-center cursor-pointer"
                        onClick={() => setSelectedProgram(item.key)}
                      >
                        <h1 className="uppercase">{displayStat.program}</h1>
                      </TableCell>
                    );
                  }

                  return (
                    <TableCell className="text-center uppercase">
                      {displayStat[columnKey as keyof typeof displayStat]}
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

// third view: selected program
const SelectedProgramView = ({
  selectedCollege,
  selectedProgram,
}: {
  selectedCollege: string;
  selectedProgram: string;
}) => {
  const [batchYearFormatted, setBatchYearFormatted] = useState<any[]>([]);
  const [batchYearFilter, setBatchYearFilter] = useState<string>("all");
  const { batchYears, isBatchYearsLoading } = useBatchYears();
  const { collegeStats, loadingStats, errorStats } = useCollegeStats(
    batchYearFilter,
    selectedCollege.toString().toLowerCase(),
    selectedProgram.toString().toLowerCase()
  );

  const columns = [
    { key: "graduates", label: "Graduates" },
    { key: "scholarship_count", label: "Scholars" },
    { key: "course_aligned_count", label: "Job Alignment" },
  ];

  useEffect(() => {
    // Transform the batchYears data
    const formattedData = batchYears.map((item: any) => ({
      key: item.batch_year.toString(),
      label: item.batch_year.toString(),
    }));

    // Append the "all" option
    formattedData.unshift({ key: "all", label: "All" });

    setBatchYearFormatted(formattedData);
  }, [batchYears]);

  const formatChartData = (stat: any, metric1: string) => {
    const labels: any = {
      employed_count: "Employed",
      scholarship_count: "Scholar",
      course_aligned_count: "Aligned",
    };

    const totalLabels: any = {
      employed_count: "Unemployed",
      scholarship_count: "Non-scholar",
      course_aligned_count: "Non-aligned",
    };

    return [
      { name: labels[metric1], value: stat[metric1] || 0 },
      {
        name: totalLabels[metric1],
        value: (stat.total_population || 0) - (stat[metric1] || 0),
      },
    ];
  };

  return (
    <div className="h-full w-full flex flex-col gap-3">
      <div className="w-full grid grid-cols-3 place-items-center lg:flex lg:justify-between gap-3">
        <Select
          items={batchYearFormatted}
          label="Year"
          disallowEmptySelection={true}
          size="sm"
          className="max-w-32"
          defaultSelectedKeys={["all"]}
          value={batchYearFilter}
          onChange={(e) => setBatchYearFilter(e.target.value)}
        >
          {batchYearFormatted.map((item) => (
            <SelectItem key={item.key}>{item.label}</SelectItem>
          ))}
        </Select>
      </div>

      <div className="flex h-full w-full overflow-y-auto">
        <Table
          fullWidth
          layout="auto"
          isHeaderSticky={true}
          aria-label="Specific Program and College Stats Table"
          classNames={{
            wrapper: "h-full bg-[#F4FFFC] border-2 border-[#008B47]",
          }}
          className="h-full w-full flex items-center justify-center"
        >
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn
                key={column.key}
                className="text-center whitespace-nowrap flex-nowrap"
              >
                {column.label}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody>
            {(collegeStats ?? []).map((stat, index) => (
              <TableRow key={index}>
                <TableCell>
                  <StatsBarChart
                    data={formatChartData(stat, "employed_count")}
                  />
                </TableCell>
                <TableCell>
                  <StatsBarChart
                    data={formatChartData(stat, "scholarship_count")}
                  />
                </TableCell>
                <TableCell>
                  <StatsBarChart
                    data={formatChartData(stat, "course_aligned_count")}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
