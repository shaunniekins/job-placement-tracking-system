"use client";

import {
  Card,
  CardHeader,
  CardBody,
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
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useCallback, useEffect, useRef, useState } from "react";
import { FaChevronDown, FaChevronUp, FaPrint } from "react-icons/fa";
import { useReactToPrint } from "react-to-print";
import html2canvas from "html2canvas";
import { programs } from "@/app/api/collegeAndProgramData";
import useCollegeStats from "@/hooks/useCollegeStats";
import useBatchYears from "@/hooks/useBatchYears";
import { useSelector } from "react-redux";
import { RootState } from "@/app/reduxUtils/store";

const DashboardComponent = () => {
  const [selectedCollege, setSelectedCollege] = useState<string>("");
  const [selectedProgram, setSelectedProgram] = useState<string>("");
  const user = useSelector((state: RootState) => state.user.user);
  const userType = user?.user_metadata?.user_type;
  const userCollege = user?.user_metadata?.college;

  const allColleges = [
    { src: "/images/college-ca.png", name: "CA", key: "ca" },
    { src: "/images/college-cas.png", name: "CAS", key: "cas" },
    { src: "/images/college-cba.jpg", name: "CBA", key: "cba" },
    { src: "/images/college-ccis.jpg", name: "CCIS", key: "ccis" },
    { src: "/images/college-ceit.png", name: "CEIT", key: "ceit" },
    { src: "/images/college-cte.png", name: "CTE", key: "cte" },
  ];

  const collegesToDisplay =
    userType === "admin" || userType === "program-chair"
      ? allColleges.filter((c) => c.key === userCollege)
      : allColleges;

  useEffect(() => {
    if ((userType === "admin" || userType === "program-chair") && userCollege) {
      const adminCollege = allColleges.find((c) => c.key === userCollege);
      if (adminCollege) {
        setSelectedCollege(adminCollege.name);
      }
    } else {
      setSelectedCollege("");
      setSelectedProgram("");
    }
  }, [userType, userCollege]);

  const handleImageClick = (collegeName: string) => {
    if (userType !== "admin" && userType !== "program-chair") {
      setSelectedCollege((prevSelectedCollege) =>
        prevSelectedCollege === collegeName ? "" : collegeName
      );
      setSelectedProgram("");
    }
  };

  const renderView = () => {
    if (userType === "admin" || userType === "program-chair") {
      if (selectedCollege && !selectedProgram) {
        return (
          <SelectedCollegeView
            selectedCollege={selectedCollege}
            setSelectedProgram={setSelectedProgram}
          />
        );
      } else if (selectedCollege && selectedProgram) {
        return (
          <SelectedProgramView
            selectedCollege={selectedCollege}
            selectedProgram={selectedProgram}
            setSelectedProgram={setSelectedProgram}
          />
        );
      } else {
        return <Spinner color="success" />;
      }
    } else {
      if (!selectedCollege && !selectedProgram) {
        return <DefaultView />;
      } else if (selectedCollege && !selectedProgram) {
        return (
          <SelectedCollegeView
            selectedCollege={selectedCollege}
            setSelectedProgram={setSelectedProgram}
          />
        );
      } else if (selectedCollege && selectedProgram) {
        return (
          <SelectedProgramView
            selectedCollege={selectedCollege}
            selectedProgram={selectedProgram}
            setSelectedProgram={setSelectedProgram}
          />
        );
      }
    }
    return null;
  };

  return (
    <div className="h-full w-full flex flex-col">
      <div
        className={`${
          (userType === "admin" ||
            userType === "program-chair" ||
            (selectedCollege && !selectedProgram)) &&
          "invisible"
        } -mt-10 mb-2 hidden lg:block`}
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
        {collegesToDisplay.map((college, index) => (
          <div
            key={index}
            className={`flex flex-col items-center rounded-xl p-2 border-2 ${
              selectedCollege === college.name
                ? "border-[#008B47]"
                : "border-[#F4FFFC]"
            } ${
              userType === "admin" || userType === "program-chair"
                ? "cursor-default"
                : "cursor-pointer"
            }`}
            onClick={() => handleImageClick(college.name)}
          >
            <Image
              src={college.src}
              alt={college.name}
              className={`w-full lg:w-24 lg:h-24 ${
                userType !== "admin" && userType !== "program-chair"
                  ? "cursor-pointer"
                  : "cursor-default"
              }`}
            />
            <span className="mt-2 text-center">{college.name}</span>
          </div>
        ))}
      </div>
      <div className="h-full flex overflow-y-auto">{renderView()}</div>
    </div>
  );
};

export default DashboardComponent;

const StatsBarChart = ({ data }: { data: any[] }) => {
  const colors: any = {
    Employed: "#00DAB2",
    Unemployed: "#000000",
    Scholar: "#00DAB2",
    "Non-scholar": "#000000",
    Aligned: "#14FA00",
    "Non-aligned": "#000000",
  };

  return (
    <div className="h-48 lg:h-96 print:h-96">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          className="svg-print-container"
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" className="print:!opacity-100">
            {data.map((entry: any, index: any) => (
              <Cell
                key={`cell-${index}`}
                fill={colors[entry.name]}
                className="print:!opacity-100"
                stroke="none"
                strokeWidth={0}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const DefaultView = () => {
  const [batchYearFormatted, setBatchYearFormatted] = useState<any[]>([]);
  const [batchYearFilter, setBatchYearFilter] = useState<string>("all");
  const [isPrinting, setIsPrinting] = useState(false);
  const { batchYears } = useBatchYears();
  const { collegeStats } = useCollegeStats(batchYearFilter);

  const printRef = useRef<HTMLDivElement>(null);

  const prepareChartsForPrinting = async (): Promise<void> => {
    setIsPrinting(true);

    if (printRef.current) {
      const createdCanvases: HTMLCanvasElement[] = [];
      const svgElements = printRef.current.querySelectorAll("svg");

      for (let i = 0; i < svgElements.length; i++) {
        const svg = svgElements[i];
        const parent = svg.parentNode;

        if (parent) {
          try {
            const canvas = await html2canvas(svg as unknown as HTMLElement, {
              backgroundColor: null,
              scale: 2,
              logging: false,
              allowTaint: true,
              useCORS: true,
            });

            canvas.style.width = `${svg.getBoundingClientRect().width}px`;
            canvas.style.height = `${svg.getBoundingClientRect().height}px`;
            canvas.classList.add("temp-print-canvas");

            createdCanvases.push(canvas);

            parent.insertBefore(canvas, svg);
            svg.style.display = "none";
          } catch (error) {
            console.error("Error converting SVG:", error);
          }
        }
      }

      (window as any).__printCanvases = createdCanvases;
    }

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 1000);
    });
  };

  const cleanupAfterPrinting = (): void => {
    if (printRef.current) {
      const svgElements = printRef.current.querySelectorAll("svg");
      svgElements.forEach((svg) => {
        svg.style.display = "";
      });
    }

    const canvases = document.querySelectorAll(".temp-print-canvas");
    canvases.forEach((canvas) => canvas.remove());

    setIsPrinting(false);
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Data Graphs",
    onBeforePrint: prepareChartsForPrinting,
    onAfterPrint: cleanupAfterPrinting,
  });

  const handlePrintWrapper = (e: any) => {
    setTimeout(() => {
      handlePrint();
    }, 500);
  };

  const getCollegeData = (collegeKey: any, batchYear: any) => {
    const collegeDataArray = collegeStats?.filter(
      (stat) =>
        stat.college === collegeKey &&
        (batchYear === "all" || stat.batch_year === batchYear)
    );

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
    <Card className="w-full print:shadow-none print:border print:border-gray-300">
      <CardHeader className="pb-2 print:pb-1">
        <h1 className="text-sm font-medium print:text-xs">{title}</h1>
      </CardHeader>
      <CardBody className="print:p-1">
        <div className="h-48 print:h-[150px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" fontSize={10} interval={0} />
              <YAxis fontSize={10} />
              <Tooltip wrapperStyle={{ fontSize: "10px" }} />
              <Bar dataKey="value" className="print:!opacity-100">
                {data.map((entry: any, index: any) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={colors[entry.category]}
                    className="print:!opacity-100"
                  />
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
      <Card className="w-full mb-4 print:mb-2 print:break-inside-avoid print:shadow-none print:border-none">
        <CardHeader className="w-full pb-2 print:pb-1">
          <div
            className="w-full flex items-center gap-3 cursor-pointer print:cursor-default"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Button
              size="sm"
              color="success"
              isIconOnly
              className="text-white rounded-full print:hidden"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
            >
              {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
            </Button>
            <h1 className="text-xl font-bold text-[#008B47] print:text-lg">
              {college.name}
            </h1>
          </div>
        </CardHeader>
        <CardBody
          className={`${isExpanded ? "block" : "hidden"} print:block print:p-1`}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 print:grid-cols-3 gap-4 print:gap-2">
            <MetricChart
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
      </Card>
    );
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
    const formattedData = batchYears.map((item: any) => ({
      key: item.batch_year.toString(),
      label: item.batch_year.toString(),
    }));

    formattedData.unshift({ key: "all", label: "All" });

    setBatchYearFormatted(formattedData);
  }, [batchYears]);

  return (
    <div className="h-full w-full flex flex-col gap-3 pb-[6.3rem]">
      <div className="w-full grid grid-cols-3 place-items-center lg:flex lg:justify-between gap-3 print:hidden">
        <Select
          items={batchYearFormatted}
          label="Year"
          disallowEmptySelection={true}
          size="sm"
          color="success"
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
          className="text-white"
          endContent={
            isPrinting ? <Spinner size="sm" color="white" /> : <FaPrint />
          }
          onPress={(e) => {
            setIsPrinting(true);
            handlePrintWrapper(e);
          }}
          isDisabled={isPrinting}
        >
          {isPrinting ? "Exporting..." : "Export"}
        </Button>
      </div>

      <div
        className="h-full w-full flex flex-col overflow-y-auto print:overflow-visible"
        ref={printRef}
      >
        <div className="hidden print:block pt-2 pb-4 w-full text-center">
          <h1 className="text-xl font-bold text-green-700 uppercase">
            College Data Visualizations
          </h1>
          <p className="text-sm">
            Batch Year:{" "}
            {batchYearFilter === "all" ? "All Years" : batchYearFilter}
          </p>
        </div>
        <div className="h-fit w-full flex flex-col print:gap-2">
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

const SelectedCollegeView = ({
  selectedCollege,
  setSelectedProgram,
}: {
  selectedCollege: string;
  setSelectedProgram: (program: string) => void;
}) => {
  const [batchYearFormatted, setBatchYearFormatted] = useState<any[]>([]);
  const [batchYearFilter, setBatchYearFilter] = useState<string>("all");
  const { batchYears } = useBatchYears();
  const allColleges = [
    { name: "CA", key: "ca" },
    { name: "CAS", key: "cas" },
    { name: "CBA", key: "cba" },
    { name: "CCIS", key: "ccis" },
    { name: "CEIT", key: "ceit" },
    { name: "CTE", key: "cte" },
  ];
  const collegeKey =
    allColleges.find((c) => c.name === selectedCollege)?.key || "";
  const { collegeStats, loadingStats } = useCollegeStats(
    batchYearFilter,
    collegeKey
  );

  const columns = [
    { key: "graduates", label: "Graduates" },
    { key: "scholarship_count", label: "Scholars" },
    { key: "employed_count", label: "Number of Employed" },
  ];

  const getProgramsByCollege = (collegeKey: string) => {
    return programs.filter(
      (program) => program.college.toLowerCase() === collegeKey.toLowerCase()
    );
  };

  const filteredPrograms = getProgramsByCollege(collegeKey);

  const formatTableData = useCallback(() => {
    if (!collegeStats || !filteredPrograms) return [];

    const programsWithData = filteredPrograms.filter((program) => {
      const programStats = collegeStats.filter(
        (stat) => stat.program.toLowerCase() === program.key.toLowerCase()
      );
      const totalPopulation = programStats.reduce(
        (sum, stat) => sum + stat.total_population,
        0
      );
      return totalPopulation > 0;
    });

    return programsWithData.map((program) => {
      const programStats = collegeStats.filter(
        (stat) => stat.program.toLowerCase() === program.key.toLowerCase()
      );

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
            onClick={() => setSelectedProgram(program.key)}
          >
            {program.label}
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
          color="success"
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
  const [isPrinting, setIsPrinting] = useState(false);
  const { batchYears } = useBatchYears();
  const allColleges = [
    { name: "CA", key: "ca" },
    { name: "CAS", key: "cas" },
    { name: "CBA", key: "cba" },
    { name: "CCIS", key: "ccis" },
    { name: "CEIT", key: "ceit" },
    { name: "CTE", key: "cte" },
  ];
  const collegeKey =
    allColleges.find((c) => c.name === selectedCollege)?.key || "";
  const { collegeStats } = useCollegeStats(
    batchYearFilter,
    collegeKey,
    selectedProgram.toString().toLowerCase()
  );

  const printRef = useRef<HTMLDivElement>(null);

  const prepareChartsForPrinting = async (): Promise<void> => {
    setIsPrinting(true);

    if (printRef.current) {
      const createdCanvases: HTMLCanvasElement[] = [];
      const svgElements = printRef.current.querySelectorAll("svg");

      for (let i = 0; i < svgElements.length; i++) {
        const svg = svgElements[i];
        const parent = svg.parentNode;

        if (parent) {
          try {
            const canvas = await html2canvas(svg as unknown as HTMLElement, {
              backgroundColor: null,
              scale: 2,
              logging: false,
              allowTaint: true,
              useCORS: true,
            });

            canvas.style.width = `${svg.getBoundingClientRect().width}px`;
            canvas.style.height = `${svg.getBoundingClientRect().height}px`;
            canvas.classList.add("temp-print-canvas");

            createdCanvases.push(canvas);

            parent.insertBefore(canvas, svg);
            svg.style.display = "none";
          } catch (error) {
            console.error("Error converting SVG:", error);
          }
        }
      }

      (window as any).__printCanvases = createdCanvases;
    }

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 1000);
    });
  };

  const cleanupAfterPrinting = (): void => {
    if (printRef.current) {
      const svgElements = printRef.current.querySelectorAll("svg");
      svgElements.forEach((svg) => {
        svg.style.display = "";
      });
    }

    const canvases = document.querySelectorAll(".temp-print-canvas");
    canvases.forEach((canvas) => canvas.remove());

    setIsPrinting(false);
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Data Graphs",
    onBeforePrint: prepareChartsForPrinting,
    onAfterPrint: cleanupAfterPrinting,
  });

  const handlePrintWrapper = (e: any) => {
    setTimeout(() => {
      handlePrint();
    }, 300);
  };

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

  const getMergedStats = () => {
    if (!collegeStats || collegeStats.length === 0) return [];

    if (batchYearFilter !== "all") return collegeStats;

    const mergedStats = {
      college: collegeStats[0].college,
      program: collegeStats[0].program,
      batch_year: 0,
      total_population: 0,
      employed_count: 0,
      course_aligned_count: 0,
      scholarship_count: 0,
    };

    collegeStats.forEach((stat) => {
      mergedStats.total_population += stat.total_population;
      mergedStats.employed_count += stat.employed_count;
      mergedStats.course_aligned_count += stat.course_aligned_count;
      mergedStats.scholarship_count += stat.scholarship_count;
    });

    return [mergedStats];
  };

  const processedStats = getMergedStats();

  return (
    <div className="h-full w-full flex flex-col gap-3">
      <div className="w-full grid grid-cols-1 place-items-center lg:flex lg:justify-between gap-3">
        <div className="flex gap-3 w-full justify-center lg:justify-start">
          <Select
            items={batchYearFormatted}
            label="Year"
            disallowEmptySelection={true}
            size="sm"
            color="success"
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

        <Button
          color="success"
          className="text-white"
          endContent={
            isPrinting ? <Spinner size="sm" color="white" /> : <FaPrint />
          }
          onPress={(e) => {
            setIsPrinting(true);
            handlePrintWrapper(e);
          }}
          isDisabled={isPrinting}
        >
          {isPrinting ? "Exporting..." : "Export"}
        </Button>
      </div>

      <div
        className="h-full w-full flex flex-col overflow-y-auto print:overflow-visible"
        ref={printRef}
      >
        <div className="print:block hidden pt-5 pb-7 whitespace-nowrap w-full text-center text-2xl font-bold border-black text-green-600 print:mb-7 uppercase">
          {selectedProgram} DATA VISUALIZATION
        </div>
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
