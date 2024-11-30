"use client";

import { RootState } from "@/app/reduxUtils/store";
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
import { IoAddOutline } from "react-icons/io5";
import { EyeSlashFilledIcon } from "../../../public/icons/EyeSlashFilledIcon";
import { EyeFilledIcon } from "../../../public/icons/EyeFilledIcon";
import { colleges } from "@/app/api/collegeAndProgramData";
import AlumniProfileModal from "../agencyComponents/AlumniProfileModal";
import { MdDelete } from "react-icons/md";
import { sendEmailNotification } from "@/utils/compUtils";

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

  const [currentUserId, setCurrentUserId] = useState("");
  const [currentUserType, setCurrentUserType] = useState("");
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedUserEmail, setSelectedUserEmail] = useState("");

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

  const { batchYears } = useBatchYears();

  useEffect(() => {
    // Transform the batchYears data
    const formattedData = batchYears.map((item: any) => ({
      key: item.batch_year.toString(),
      label: item.batch_year.toString(),
    }));

    // Append the "all" option
    formattedData.unshift({ key: "all", label: "All" });

    setBatchYearFormatted(formattedData);
    console.log("formattedData", formattedData);
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

  // useEffect(() => {
  //   setPage(1);
  // }, [totalUserEntries]);

  useEffect(() => {
    // setPage(1);
    setCurrentColumns([]);
    setCurrentViewContent([]);
    setTotalPages(0);
    setCurrentUserId("");
    setCurrentUserType("");
    setIsUserProfileOpen(false);

    if (currentView === "agency") {
      setCurrentColumns(agencyColumns);
    } else {
      setCurrentColumns(otherColumns);
    }
    setCurrentViewContent(usersData);
    setTotalPages(Math.ceil(totalUserEntries / rowsPerPage));

    // setCurrentViewContent(usersData);
  }, [currentView, usersData, totalUserEntries, collegeFilter, searchInput]);

  const [isAddNewAdminModalOpen, setIsAddNewAdminModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isInputUserPasswordVisible, setIsInputUserPasswordVisible] =
    useState(false);
  const [facultyType, setFacultyType] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [college, setCollege] = useState("");

  if (isLoadingUsers) {
    return (
      <div className="h-full w-full flex justify-center items-center">
        <Spinner color="success" />
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col gap-2">
      <AlumniProfileModal
        alumniId={currentUserId}
        setAlumniId={setCurrentUserId}
        openAlumniProfile={isUserProfileOpen}
        setOpenAlumniProfile={setIsUserProfileOpen}
        userType={currentUserType}
        setUserType={setCurrentUserType}
      />

      <Modal
        size="xl"
        isOpen={isAddNewAdminModalOpen}
        onOpenChange={setIsAddNewAdminModalOpen}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>New Administrator</ModalHeader>
              <ModalBody>
                <Input
                  label="First Name"
                  variant="bordered"
                  color="success"
                  isRequired
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
                <Input
                  label="Last Name"
                  variant="bordered"
                  color="success"
                  isRequired
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />

                <Select
                  items={colleges}
                  label="College"
                  variant="bordered"
                  color="success"
                  isRequired
                  defaultSelectedKeys={[college]}
                  value={college}
                  className="col-span-3"
                  onChange={(e) => setCollege(e.target.value)}
                >
                  {colleges.map((item) => (
                    <SelectItem key={item.key}>{item.label}</SelectItem>
                  ))}
                </Select>
                <Input
                  type="email"
                  label="Email"
                  variant="bordered"
                  color="success"
                  isRequired
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Input
                  type={isInputUserPasswordVisible ? "text" : "password"}
                  label="Temporary Password"
                  variant="bordered"
                  color="success"
                  isRequired
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  endContent={
                    <button
                      className="focus:outline-none"
                      type="button"
                      onClick={() =>
                        setIsInputUserPasswordVisible(
                          !isInputUserPasswordVisible
                        )
                      }
                    >
                      {isInputUserPasswordVisible ? (
                        <EyeSlashFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                      ) : (
                        <EyeFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                      )}
                    </button>
                  }
                />
                <Select
                  label="Faculty Type"
                  color="success"
                  variant="bordered"
                  required
                  defaultSelectedKeys={[facultyType]}
                  value={facultyType}
                  onChange={(e) => setFacultyType(e.target.value)}
                >
                  <SelectItem key={"Dean"}>Dean</SelectItem>
                  <SelectItem key={"ARO"}>ARO</SelectItem>
                  <SelectItem key={"Program Chair"}>Program Chair</SelectItem>
                </Select>
              </ModalBody>
              <ModalFooter>
                <Button
                  color="success"
                  className="text-white"
                  onClick={async () => {
                    const { error } = await supabaseAdmin.auth.admin.createUser(
                      {
                        email,
                        password,
                        email_confirm: true,
                        user_metadata: {
                          account_status: "approved",
                          profile_picture: "",
                          email: email,
                          password: password,
                          first_name: firstName,
                          last_name: lastName,
                          college: college,
                          faculty_type: facultyType,
                          user_type:
                            facultyType !== "program-chair"
                              ? "admin"
                              : "program-chair",
                        },
                      }
                    );
                    if (error) {
                      alert(error.message);
                      return;
                    }
                    setIsAddNewAdminModalOpen(false);
                    fetchAndSubscribeUsers();
                  }}
                  isDisabled={!email || !password || !facultyType}
                >
                  Add
                </Button>
                <Button color="warning" onClick={onClose}>
                  Cancel
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal
        size="md"
        isOpen={isUserModalOpen}
        onOpenChange={setIsUserModalOpen}
        onClose={() => {
          setSelectedUserId("");
          setIsUserModalOpen(false);
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Delete Confirmation</ModalHeader>
              <ModalBody>
                <h1>Are you sure you want to delete this user?</h1>
              </ModalBody>
              <ModalFooter className="flex justify-end gap-2">
                <Button
                  variant="flat"
                  onClick={() => {
                    setIsUserModalOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  color="danger"
                  variant="flat"
                  onClick={async () => {
                    if (!selectedUserId) return;

                    const response = await supabaseAdmin.auth.admin.deleteUser(
                      selectedUserId
                    );
                    if (response) {
                      const sendEmailData = {
                        email: selectedUserEmail,
                        recipient_name: "",
                        subject: "Account Status Update",
                        message: `
Greetings!

We regret to inform you that your account has been deleted. You can no longer access your account.

Thank you!

Best regards,
JPTS Team`,
                      };

                      await sendEmailNotification(sendEmailData);
                      fetchAndSubscribeUsers();
                    }
                  }}
                >
                  Delete
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
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
          <Button
            color="success"
            startContent={<IoAddOutline />}
            className={`${currentView !== "admin" && "hidden"} text-white`}
            onClick={() => setIsAddNewAdminModalOpen(true)}
          >
            Add New Admin
          </Button>
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
            wrapper: "h-full bg-[#F4FFFC] border-2 border-[#008B47]",
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
                        <Button
                          size="sm"
                          color="success"
                          startContent={<EyeFilledIcon />}
                          onClick={() => {
                            setCurrentUserId(item.id);
                            setCurrentUserType(item.meta_data.user_type);
                            setIsUserProfileOpen(true);
                          }}
                        >
                          View
                        </Button>
                        <Button
                          size="sm"
                          color="warning"
                          startContent={<MdDelete />}
                          onClick={() => {
                            setSelectedUserId(item.id);
                            setSelectedUserEmail(item.email);
                            setIsUserModalOpen(true);
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
