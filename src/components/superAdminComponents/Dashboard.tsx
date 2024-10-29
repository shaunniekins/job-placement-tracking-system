"use client";

import useCollegeStats from "@/hooks/useCollegeStats";
import {
  Card,
  CardHeader,
  CardBody,
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
  Button,
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
  Cell,
} from "recharts";
import { useCallback, useEffect, useRef, useState } from "react";
import useBatchYears from "@/hooks/useBatchYears";
import { programs } from "@/app/api/collegeAndProgramData";
import { FaChevronDown, FaChevronUp, FaFilePdf, FaPrint } from "react-icons/fa";
import { useReactToPrint } from "react-to-print";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";

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
      <div
        className={`${
          selectedCollege && !selectedProgram && "invisible"
        } -mt-20 mb-2 hidden lg:block`}
      >
        <div className="flex justify-end items-center space-x-4 p-4">
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 bg-[#00DAB2] mr-2"></span>
            <span>Employed / Scholar</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 bg-[#14FA00] mr-2"></span>
            <span>Aligned</span>
          </div>

          <div className="flex items-center">
            <span className="inline-block w-3 h-3 bg-black mr-2"></span>
            <span>Unaligned / Unemployed / Non-scholar</span>
          </div>
        </div>
      </div>
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
              className="w-full lg:w-24 lg:h-24 cursor-pointer"
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
            setSelectedProgram={setSelectedProgram}
          />
        )}
      </div>
    </div>
  );
};

export default DashboardComponent;

// BarChart component for displaying statistics
const StatsBarChart = ({ data }: { data: any[] }) => {
  const colors: any = {
    Employed: "#00DAB2",
    Unemployed: "#000000",
    Scholar: "#00DAB2",
    "Non-scholar": "#000000",
    Aligned: "#14FA00",
    "Non-aligned": "#000000",
  };

  // console.log("data", data);

  return (
    <div className="h-48 lg:h-96">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <Tooltip />
          {/* <Bar dataKey="value" fill="#8884d8" /> */}
          <Bar dataKey="value">
            {data.map((entry: any, index: any) => (
              <Cell key={`cell-${index}`} fill={colors[entry.name]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
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

  // useEffect(() => {
  //   console.log("collegeStats", collegeStats);
  // }, [collegeStats]);

  //////////////////////////// NEW CODE ////////////////////////////

  const getCollegeData = (collegeKey: any, batchYear: any) => {
    // Filter and aggregate data if batchYear is "all"
    const collegeDataArray = collegeStats?.filter(
      (stat) =>
        stat.college === collegeKey &&
        (batchYear === "all" || stat.batch_year === batchYear)
    );

    // Calculate totals by summing values across all matching entries
    const totalPopulation =
      collegeDataArray?.reduce((acc, curr) => acc + curr.total_population, 0) ??
      0;
    const employedCount =
      collegeDataArray?.reduce((acc, curr) => acc + curr.employed_count, 0) ??
      0;
    const scholarshipCount =
      collegeDataArray?.reduce(
        (acc, curr) => acc + curr.scholarship_count,
        0
      ) ?? 0;
    const courseAlignedCount =
      collegeDataArray?.reduce(
        (acc, curr) => acc + curr.course_aligned_count,
        0
      ) ?? 0;

    return {
      graduates: [
        { category: "Employed", value: employedCount },
        { category: "Unemployed", value: totalPopulation - employedCount },
      ],
      scholars: [
        { category: "Scholar", value: scholarshipCount },
        { category: "Non-scholar", value: totalPopulation - scholarshipCount },
      ],
      alignment: [
        { category: "Aligned", value: courseAlignedCount },
        {
          category: "Non-aligned",
          value: totalPopulation - courseAlignedCount,
        },
      ],
    };
  };

  const colors = {
    Employed: "#00DAB2",
    Unemployed: "#000000",
    Scholar: "#00DAB2",
    "Non-scholar": "#000000",
    Aligned: "#14FA00",
    "Non-aligned": "#000000",
  };

  const MetricChart = ({
    title,
    data,
    colors,
  }: {
    title: any;
    data: any;
    colors: any;
  }) => (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <h1 className="text-sm font-medium">{title}</h1>
      </CardHeader>
      <CardBody>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="category" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="value">
                {data.map((entry: any, index: any) => (
                  <Cell key={`cell-${index}`} fill={colors[entry.category]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardBody>
    </Card>
  );

  const CollegeSection = ({
    college,
    batchYear,
  }: {
    college: any;
    batchYear: any;
  }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const data = getCollegeData(college.key, batchYear);

    return (
      <Card className="w-full mb-6">
        <CardHeader className="w-full pb-2">
          <div
            className="w-full flex justify-between items-center"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <h1 className="text-xl font-bold text-[#008B47]">{college.name}</h1>
            <button
              // onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
            </button>
          </div>
        </CardHeader>
        {isExpanded && (
          <CardBody>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <MetricChart
                // title="Graduate Employment Status"
                title="Graduates"
                data={data.graduates}
                colors={colors}
              />
              <MetricChart
                title="Scholar Distribution"
                data={data.scholars}
                colors={colors}
              />
              <MetricChart
                title="Job Alignment"
                data={data.alignment}
                colors={colors}
              />
            </div>
          </CardBody>
        )}
      </Card>
    );
  };

  //////////////////////////// NEW CODE ////////////////////////////

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

  const generatePDF = () => {
    const doc = new jsPDF("p", "mm", "a4");
    doc.setFontSize(16);
    doc.text("Data by each College", 105, 20, { align: "center" });

    colleges.forEach((college, index) => {
      const data = getCollegeData(college.key, batchYearFilter);
      doc.setFontSize(14);
      doc.text(`${college.name} Statistics`, 15, 30 + index * 60);

      autoTable(doc, {
        startY: 35 + index * 60,
        head: [["Category", "Value"]],
        body: [
          ...data.graduates.map((item) => [item.category, item.value]),
          ...data.scholars.map((item) => [item.category, item.value]),
          ...data.alignment.map((item) => [item.category, item.value]),
        ],
      });
    });

    doc.save("college_data.pdf");
  };

  const printPage = () => {
    window.print();
  };

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
        <div className="flex gap-2">
          <Button
            endContent={<FaFilePdf />}
            // onClick={generatePDF}
          >
            Download as PDF
          </Button>
          <Button
            endContent={<FaPrint />}
            // onClick={printPage}
          >
            Print
          </Button>
        </div>
      </div>

      <div className="h-full w-full flex overflow-y-auto">
        {/* lg:grid-cols-2 gap-6 */}
        <div className="h-fit w-full grid grid-cols-1">
          {colleges.map((college) => (
            <CollegeSection
              key={college.key}
              college={college}
              batchYear={batchYearFilter}
            />
          ))}
        </div>
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

  // Format the data for the table
  const formatTableData = useCallback(() => {
    if (!collegeStats || !filteredPrograms) return [];

    return filteredPrograms.map((program) => {
      // Filter stats for this program
      const programStats = collegeStats.filter(
        (stat) => stat.program.toLowerCase() === program.key.toLowerCase()
      );

      // Calculate totals for the program
      const totalPopulation = programStats.reduce(
        (sum, stat) => sum + stat.total_population,
        0
      );
      const totalScholarship = programStats.reduce(
        (sum, stat) => sum + stat.scholarship_count,
        0
      );
      const totalEmployed = programStats.reduce(
        (sum, stat) => sum + stat.employed_count,
        0
      );

      return {
        id: program.key,
        graduates: (
          <div
            className="cursor-pointer hover:text-green-600"
            onClick={() => {
              if (totalPopulation === 0) {
                alert("No data to show");
              } else {
                setSelectedProgram(program.key);
              }
            }}
          >
            {program.label}
            {/* ({totalPopulation}) */}
          </div>
        ),
        scholarship_count: totalScholarship,
        employed_count: totalEmployed,
      };
    });
  }, [collegeStats, filteredPrograms, setSelectedProgram]);

  useEffect(() => {
    const formattedData = batchYears.map((item: any) => ({
      key: item.batch_year.toString(),
      label: item.batch_year.toString(),
    }));
    formattedData.unshift({ key: "all", label: "All" });
    setBatchYearFormatted(formattedData);
  }, [batchYears]);

  const tableData = formatTableData();

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
                className="bg-[#008B47] text-white whitespace-nowrap text-center flex-nowrap"
              >
                {column.label}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody
            items={tableData}
            emptyContent="No data to display."
            isLoading={loadingStats}
            loadingContent={<Spinner color="success" />}
          >
            {(item) => (
              <TableRow key={item.id}>
                {(columnKey) => (
                  <TableCell className="text-center">
                    {item[columnKey as keyof typeof item]}
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

// third view: selected program
const SelectedProgramView = ({
  selectedCollege,
  selectedProgram,
  setSelectedProgram,
}: {
  selectedCollege: string;
  selectedProgram: string;
  setSelectedProgram: (program: string) => void;
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
    const formattedData = batchYears.map((item: any) => ({
      key: item.batch_year.toString(),
      label: item.batch_year.toString(),
    }));
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

  // New function to merge stats when "all" is selected
  const getMergedStats = () => {
    if (!collegeStats || collegeStats.length === 0) return [];

    if (batchYearFilter !== "all") return collegeStats;

    // Initialize merged stats with zeros
    const mergedStats = {
      college: collegeStats[0].college,
      program: collegeStats[0].program,
      batch_year: 0, // This won't matter for merged view
      total_population: 0,
      employed_count: 0,
      course_aligned_count: 0,
      scholarship_count: 0,
    };

    // Sum up all the stats
    collegeStats.forEach((stat) => {
      mergedStats.total_population += stat.total_population;
      mergedStats.employed_count += stat.employed_count;
      mergedStats.course_aligned_count += stat.course_aligned_count;
      mergedStats.scholarship_count += stat.scholarship_count;
    });

    return [mergedStats];
  };

  const processedStats = getMergedStats();

  const colors = {
    Employed: "#00DAB2",
    Unemployed: "#000000",
    Scholar: "#00DAB2",
    "Non-scholar": "#000000",
    Aligned: "#14FA00",
    "Non-aligned": "#000000",
  };

  return (
    <div className="h-full w-full flex flex-col gap-3">
      <div className="w-full grid grid-cols-1 place-items-center lg:flex lg:justify-between gap-3">
        <div className="flex gap-3 w-full justify-center lg:justify-start">
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
          <Button
            color="success"
            size="lg"
            className={`${!selectedProgram && "invisible"} text-white`}
            onPress={() => setSelectedProgram("")}
          >
            {selectedProgram.toUpperCase()}
          </Button>
        </div>

        <div className="flex gap-2">
          <Button endContent={<FaFilePdf />}>Download as PDF</Button>
          <Button endContent={<FaPrint />}>Print</Button>
        </div>
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
                className="bg-[#008B47] text-white whitespace-nowrap text-center flex-nowrap"
              >
                {column.label}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody>
            {processedStats.map((stat, index) => (
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
