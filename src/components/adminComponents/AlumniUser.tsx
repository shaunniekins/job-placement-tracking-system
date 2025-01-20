"use client";

import { Key, useEffect, useState } from "react";
import { useSelector } from "react-redux";
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
import { colleges } from "@/app/api/collegeAndProgramData";

const AlumniUserComponent = () => {
  const [page, setPage] = useState(1);
  const rowsPerPage = 13;
  const [searchInput, setSearchInput] = useState("");
  // const [totalPages, setTotalPages] = useState(0);
  const [collegeFilter, setCollegeFilter] = useState("all");
  const [batchYearFilter, setBatchYearFilter] = useState("all");
  const [batchYearFormatted, setBatchYearFormatted] = useState<any[]>([]);

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
    collegeFilter,
    searchInput,
    batchYearFilter
  );

  const totalPages = Math.ceil(totalUserEntries / rowsPerPage);

  const { batchYears, isBatchYearsLoading } = useBatchYears();

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

  const columns = [
    { key: "full_name", label: "Full Name" },
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
        <div className="w-full grid grid-cols-3 place-items-center lg:flex lg:justify-between gap-3">
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

          <div className="flex gap-3">
            <Select
              label="College Filter"
              disallowEmptySelection={true}
              size="sm"
              className={`max-w-32`}
              defaultSelectedKeys={["all"]}
              selectedKeys={new Set([collegeFilter])}
              onSelectionChange={(keys) => {
                if (keys !== "all" && keys instanceof Set) {
                  const selectedKey = Array.from(keys)[0]; // Assuming single selection
                  if (typeof selectedKey === "string") {
                    setCollegeFilter(selectedKey);
                  }
                }
              }}
            >
              <SelectItem key={"all"}>All</SelectItem>
              <SelectItem key={"CA"}>CA</SelectItem>
              <SelectItem key={"CAS"}>CAS</SelectItem>
              <SelectItem key={"CBA"}>CBA</SelectItem>
              <SelectItem key={"CCIS"}>CCIS</SelectItem>
              <SelectItem key={"CEIT"}>CEIT</SelectItem>
              <SelectItem key={"CTE"}>CTE</SelectItem>
            </Select>

            <Input
              size="sm"
              className="max-w-32"
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
