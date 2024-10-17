"use client";

import { RootState } from "@/app/reduxUtils/store";
import useJobApplications from "@/hooks/useJobApplications";
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
} from "@nextui-org/react";
import useUsers from "@/hooks/useUsers";
import { supabaseAdmin } from "@/utils/supabase";
import useBatchYears from "@/hooks/useBatchYears";

const UserComponent = () => {
  const user = useSelector((state: RootState) => state.user.user);
  const [userId, setUserId] = useState("");
  const [page, setPage] = useState(1);
  const rowsPerPage = 13;
  const [currentView, setCurrentView] = useState("agency");
  const [currenViewContent, setCurrentViewContent] = useState<any[]>([]);
  const [collegeFilter, setCollegeFilter] = useState("all");
  const [batchYearFilter, setBatchYearFilter] = useState("all");
  const [batchYearFormatted, setBatchYearFormatted] = useState<any[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    if (user) {
      setUserId(user.id);
    }
  }, [user]);

  const handleTabSelectionChange = (key: Key) => {
    const keyString = key.toString();
    if (keyString !== currentView) {
      setCurrentView(keyString);
    }
  };

  const {
    usersData,
    totalUserEntries,
    isLoadingUsers,
    fetchAndSubscribeUsers,
  } = useUsers(
    rowsPerPage,
    page,
    currentView,
    "approved",
    collegeFilter,
    searchInput,
    batchYearFilter
  );

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

  const agencyColumns = [
    { key: "company_name", label: "Company Name" },
    { key: "company_type", label: "Company Type" },
    { key: "latest_profile_update", label: "Latest Profile Update" },
    { key: "action", label: "Action" },
  ];

  const otherColumns = [
    { key: "name", label: "Name" },
    { key: "college", label: "College" },
    { key: "latest_profile_update", label: "Latest Profile Update" },
    { key: "action", label: "Action" },
  ];

  const [currentColumns, setCurrentColumns] = useState(agencyColumns);

  useEffect(() => {
    setPage(1);
    setCurrentColumns([]);
    setCurrentViewContent([]);
    setTotalPages(0);

    if (currentView === "agency") {
      setCurrentColumns(agencyColumns);
    } else {
      setCurrentColumns(otherColumns);
    }
    setCurrentViewContent(usersData);
    setTotalPages(Math.ceil(totalUserEntries / rowsPerPage));

    // setCurrentViewContent(usersData);
  }, [currentView, usersData, totalUserEntries, collegeFilter, searchInput]);

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
        <div className="flex gap-3">
          <Tabs
            aria-label="Tab Options"
            selectedKey={currentView}
            color="success"
            size="lg"
            fullWidth={true}
            variant="underlined"
            onSelectionChange={handleTabSelectionChange}
          >
            <Tab
              key="agency"
              title={
                <div className="flex items-center space-x-2">
                  <span>Agency</span>
                </div>
              }
            />
            <Tab
              key="alumni"
              title={
                <div className="flex items-center space-x-2">
                  <span>Alumni</span>
                </div>
              }
            />
            <Tab
              key="admin"
              title={
                <div className="flex items-center space-x-2">
                  <span>Admin</span>
                </div>
              }
            />
          </Tabs>
        </div>
        <div className="w-full grid grid-cols-3 place-items-center lg:flex lg:justify-end gap-3">
          <Select
            label="College Filter"
            disallowEmptySelection={true}
            size="sm"
            className={`${currentView === "agency" && "hidden"} max-w-32`}
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

          {/* <Input
            size="sm"
            className={`${currentView !== "alumni" && "hidden"} max-w-32`}
            label="Batch Year"
            placeholder="YYYY"
            value={batchYearFilter}
            onChange={(e) => setBatchYearFilter(e.target.value)}
          /> */}

          <Select
            items={batchYearFormatted}
            label="Year"
            disallowEmptySelection={true}
            size="sm"
            className={`${currentView !== "alumni" && "hidden"} max-w-32`}
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
      <div className="flex h-full w-full overflow-y-auto relative">
        <Table
          fullWidth
          layout="auto"
          isHeaderSticky={true}
          aria-label="Job Applications Table"
          classNames={{
            wrapper: "h-full bg-[#F4FFFC] border-2 border-[#007057]",
          }}
          className="h-full w-full flex items-center justify-center"
        >
          <TableHeader columns={currentColumns}>
            {(column) => (
              <TableColumn
                key={column.key}
                className={`${column.key === "seen" && "lg:w-36"}
                     ${column.key === "message" && "w-32 lg:w-auto"} 
                    bg-[#008B47] text-white text-center whitespace-nowrap flex-nowrap`}
              >
                {column.label}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody
            items={currenViewContent}
            emptyContent={"No data to display."}
            loadingContent={<Spinner color="success" />}
          >
            {(item) => (
              <TableRow
                key={item.id}
                className="text-center hover:bg-green-100"
              >
                {(columnKey) => {
                  if (currentView === "agency") {
                    if (columnKey === "company_name") {
                      return (
                        <TableCell className="text-center">
                          {item.meta_data.company_name}
                        </TableCell>
                      );
                    }

                    if (columnKey === "company_type") {
                      return (
                        <TableCell className="text-center">
                          {item.meta_data.company_type}
                        </TableCell>
                      );
                    }
                  }

                  if (currentView === "alumni" || currentView === "admin") {
                    if (columnKey === "name") {
                      return (
                        <TableCell className="text-center">
                          {item.meta_data.first_name} {item.meta_data.last_name}
                        </TableCell>
                      );
                    }

                    if (columnKey === "college") {
                      return (
                        <TableCell className="text-center uppercase">
                          {item.meta_data.college}
                        </TableCell>
                      );
                    }
                  }

                  if (columnKey === "latest_profile_update") {
                    return (
                      <TableCell className="text-center">
                        {new Date(item.updated_at).toLocaleString()}
                      </TableCell>
                    );
                  }

                  if (columnKey === "action") {
                    return (
                      <TableCell className="flex items-center justify-center gap-4">
                        <Button size="sm" color="success" onClick={() => {}}>
                          View
                        </Button>
                        <Button
                          size="sm"
                          color="warning"
                          onClick={async () => {
                            const confirmed = window.confirm(
                              "Are you sure you want to delete this user?"
                            );
                            if (confirmed) {
                              await supabaseAdmin.auth.admin.deleteUser(
                                item.id
                              );
                            }
                          }}
                        >
                          Delete
                        </Button>
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

export default UserComponent;
