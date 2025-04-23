"use client";

import { RootState } from "@/app/reduxUtils/store";
import { Key, useEffect, useState, useRef } from "react";
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
import Papa from "papaparse";
import { toast } from "react-toastify";

interface CsvError {
  row?: number;
  email?: string;
  message: string;
}

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
  const [isDeleting, setIsDeleting] = useState(false);

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isUploadingCSV, setIsUploadingCSV] = useState(false);
  const [csvUploadErrors, setCsvUploadErrors] = useState<CsvError[]>([]);
  const [isCsvErrorModalOpen, setIsCsvErrorModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setUserId(user.id);
    }
  }, [user]);

  const handleTabSelectionChange = (key: Key) => {
    const keyString = key.toString();
    if (keyString !== currentView) {
      setCurrentView(keyString);
      setCsvFile(null);
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
    const formattedData = batchYears.map((item: any) => ({
      key: item.batch_year.toString(),
      label: item.batch_year.toString(),
    }));

    formattedData.unshift({ key: "all", label: "All" });

    setBatchYearFormatted(formattedData);
    // console.log("formattedData", formattedData);
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

    // Sort users by last name if they are alumni or admin
    if (currentView === "alumni" || currentView === "admin") {
      const sortedUsers = [...usersData].sort((a, b) => {
        const lastNameA = a.meta_data?.last_name?.toLowerCase() || "";
        const lastNameB = b.meta_data?.last_name?.toLowerCase() || "";
        return lastNameA.localeCompare(lastNameB);
      });
      setCurrentViewContent(sortedUsers);
    } else {
      setCurrentViewContent(usersData);
    }

    setTotalPages(Math.ceil(totalUserEntries / rowsPerPage));
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
  const [isCheckingDean, setIsCheckingDean] = useState(false);
  const [deanError, setDeanError] = useState("");

  const handleFileSelectClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCsvFile(e.target.files ? e.target.files[0] : null);
  };

  const handleCSVUpload = () => {
    if (!csvFile) {
      toast.error("Please select a CSV file first.");
      return;
    }

    // console.log("Starting CSV upload process...");
    setIsUploadingCSV(true);
    toast.info("Processing CSV file...");

    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        // console.log("Papa.parse complete callback entered.");
        // console.log("Parsed results:", results);

        const usersToCreate = results.data as any[];
        let successCount = 0;
        let errorCount = 0;
        const collectedErrors: CsvError[] = [];

        if (!usersToCreate || usersToCreate.length === 0) {
          console.error("CSV parsing resulted in empty data.");
          toast.error("CSV file is empty or invalid.");
          setIsUploadingCSV(false);
          return;
        }

        const expectedHeaders = [
          "ID NUMBER",
          "LASTNAME",
          "FIRSTNAME",
          "MIDDLENAME",
          "GENDER",
          "COURSE", // Changed from PROGRAM
          "COLLEGE",
          "CONTACT NUMBER",
          "INSTITUTIONAL EMAIL",
          "PASSWORD",
          "YEAR", // Changed from BATCH
        ];
        const actualHeaders = Object.keys(usersToCreate[0]);
        // console.log("Actual CSV Headers:", actualHeaders);
        const missingHeaders = expectedHeaders.filter(
          (header) => !actualHeaders.includes(header)
        );

        if (missingHeaders.length > 0) {
          console.error("Missing Required CSV Headers:", missingHeaders);
          collectedErrors.push({
            message: `CSV file is missing required headers: ${missingHeaders.join(
              ", "
            )}`,
          });
          setCsvUploadErrors(collectedErrors);
          setIsCsvErrorModalOpen(true);
          setIsUploadingCSV(false);
          return;
        }

        // console.log(`Attempting to create ${usersToCreate.length} users...`);

        const creationPromises = usersToCreate.map(async (userRow, index) => {
          const rowNumber = index + 2;
          const email = userRow["INSTITUTIONAL EMAIL"]?.trim();
          const password = userRow["PASSWORD"]?.trim();
          const idNumber = userRow["ID NUMBER"]?.trim();
          const lastName = userRow["LASTNAME"]?.trim();
          const firstName = userRow["FIRSTNAME"]?.trim();
          const middleName = userRow["MIDDLENAME"]?.trim() || "";
          const gender = userRow["GENDER"]?.trim();
          const contactNumber = userRow["CONTACT NUMBER"]?.trim();
          const batchYear = userRow["YEAR"]?.trim(); // Changed from BATCH
          const college = userRow["COLLEGE"]?.trim().toLowerCase() || ""; // Convert to lowercase
          const program = userRow["COURSE"]?.trim().toLowerCase() || ""; // Changed from PROGRAM, convert to lowercase
          const scholarship = userRow["SCHOLARSHIP"]?.trim() || "n/a"; // Assuming SCHOLARSHIP might still exist or be optional

          if (
            !email ||
            !password ||
            !idNumber ||
            !lastName ||
            !firstName ||
            !batchYear || // Keep batchYear check (now YEAR)
            !college || // Add check for COLLEGE
            !program // Add check for COURSE (program)
          ) {
            const errorMessage = `Missing required fields (Email, Password, ID Number, Last Name, First Name, Year, College, Course).`;
            console.warn(`Row ${rowNumber}: ${errorMessage}`, userRow);
            collectedErrors.push({
              row: rowNumber,
              email: email || "N/A",
              message: errorMessage,
            });
            errorCount++;
            return Promise.resolve();
          }

          try {
            const { error } = await supabaseAdmin.auth.admin.createUser({
              email: email,
              password: password,
              email_confirm: true,
              user_metadata: {
                account_status: "approved",
                profile_picture: "",
                email: email,
                user_type: "alumni",
                first_name: firstName,
                last_name: lastName,
                middle_name: middleName,
                contact_number: contactNumber,
                gender: gender,
                birth_date: "",
                address: "",
                batch_year: batchYear,
                id_number: idNumber,
                college: college, // Already lowercased
                program: program, // Already lowercased
                scholarship: scholarship,
                profile_of_employment: "",
              },
            });

            if (error) {
              throw new Error(error.message);
            }
            successCount++;
          } catch (error: any) {
            const errorMessage = error.message;
            console.error(
              `Error creating user for row ${rowNumber} (${email}):`,
              errorMessage,
              error
            );
            collectedErrors.push({
              row: rowNumber,
              email: email,
              message: errorMessage,
            });
            errorCount++;
          }
        });

        await Promise.allSettled(creationPromises);

        setIsUploadingCSV(false);
        setCsvFile(null);

        if (errorCount > 0) {
          setCsvUploadErrors(collectedErrors);
          setIsCsvErrorModalOpen(true);
          toast.warning(
            `${successCount} users created. ${errorCount} failed. Click details for more info.`,
            { autoClose: 7000 }
          );
        } else if (successCount > 0) {
          toast.success(`Successfully created ${successCount} alumni users.`);
        } else {
          if (collectedErrors.length > 0) {
            setCsvUploadErrors(collectedErrors);
            setIsCsvErrorModalOpen(true);
          } else {
            toast.info("No new users were created from the CSV file.");
          }
        }

        fetchAndSubscribeUsers();
      },
      error: (error: any) => {
        setIsUploadingCSV(false);
        const errorMessage = `Error parsing CSV file: ${error.message}`;
        toast.error(errorMessage);
        setCsvUploadErrors([{ message: errorMessage }]);
        setIsCsvErrorModalOpen(true);
        console.error("CSV Parsing Error:", error);
      },
    });
  };

  // Function to check if a dean already exists for the selected college
  const checkIfDeanExists = async (collegeKey: string): Promise<boolean> => {
    try {
      const { data, error } = await supabaseAdmin
        .from("ViewUsers")
        .select("*")
        .eq("meta_data->>college", collegeKey)
        .eq("meta_data->>faculty_type", "Dean")
        .eq("meta_data->>user_type", "admin");

      if (error) {
        console.error("Error checking for existing dean:", error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error("Exception checking for existing dean:", error);
      return false;
    }
  };

  // Function to handle faculty type change with validation
  const handleFacultyTypeChange = (value: string) => {
    setFacultyType(value);
    setDeanError(""); // Clear any previous errors

    // If changing to Dean and college is already selected, check for existing dean
    if (value === "Dean" && college) {
      validateDeanSelection(college);
    }
  };

  // Function to handle college change with dean validation
  const handleCollegeChange = (value: string) => {
    setCollege(value);
    setDeanError(""); // Clear any previous errors

    // If faculty type is already set to Dean, validate the college selection
    if (facultyType === "Dean") {
      validateDeanSelection(value);
    }
  };

  // Function to validate dean selection
  const validateDeanSelection = async (selectedCollege: string) => {
    if (facultyType === "Dean") {
      setIsCheckingDean(true);
      const deanExists = await checkIfDeanExists(selectedCollege);
      setIsCheckingDean(false);

      if (deanExists) {
        setDeanError(
          `A Dean for ${selectedCollege.toUpperCase()} already exists. Please select a different college or faculty type.`
        );
      } else {
        setDeanError("");
      }
    }
  };

  if (isLoadingUsers || isUploadingCSV) {
    return (
      <div className="h-full w-full flex justify-center items-center">
        <Spinner
          color="success"
          label={isUploadingCSV ? "Processing CSV..." : ""}
        />
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
                  color={deanError ? "danger" : "success"}
                  isRequired
                  value={college}
                  className="col-span-3"
                  onChange={(e) => handleCollegeChange(e.target.value)}
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
                  color={deanError ? "danger" : "success"}
                  variant="bordered"
                  required
                  value={facultyType}
                  onChange={(e) => handleFacultyTypeChange(e.target.value)}
                >
                  <SelectItem key={"Dean"}>Dean</SelectItem>
                  <SelectItem key={"ARO"}>ARO</SelectItem>
                  <SelectItem key={"Program Chair"}>Program Chair</SelectItem>
                </Select>
                {deanError && (
                  <div className="text-danger text-sm">{deanError}</div>
                )}
                {isCheckingDean && (
                  <div className="text-warning text-sm flex items-center gap-2">
                    <Spinner size="sm" color="warning" />
                    Checking dean availability...
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button
                  color="success"
                  className="text-white"
                  onClick={async () => {
                    // Re-validate before creating
                    if (facultyType === "Dean") {
                      setIsCheckingDean(true);
                      const deanExists = await checkIfDeanExists(college);
                      setIsCheckingDean(false);

                      if (deanExists) {
                        setDeanError(
                          `A Dean for ${college.toUpperCase()} already exists. Please select a different college or faculty type.`
                        );
                        return;
                      }
                    }

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
                            facultyType === "Program Chair"
                              ? "program-chair"
                              : "admin",
                        },
                      }
                    );
                    if (error) {
                      alert(error.message);
                      return;
                    }
                    // Reset form fields after successful creation
                    setEmail("");
                    setPassword("");
                    setFirstName("");
                    setLastName("");
                    setCollege("");
                    setFacultyType("");
                    setIsAddNewAdminModalOpen(false);
                    fetchAndSubscribeUsers();
                    toast.success(
                      `Successfully created ${facultyType} admin for ${college.toUpperCase()}.`
                    );
                  }}
                  isDisabled={
                    !email ||
                    !password ||
                    !facultyType ||
                    !college ||
                    deanError !== "" ||
                    isCheckingDean
                  }
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
          setSelectedUserEmail("");
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
                    setSelectedUserId("");
                    setSelectedUserEmail("");
                    setIsUserModalOpen(false);
                  }}
                  isDisabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  color="danger"
                  variant="flat"
                  isLoading={isDeleting}
                  onClick={async () => {
                    if (!selectedUserId) return;

                    try {
                      setIsDeleting(true);
                      const response =
                        await supabaseAdmin.auth.admin.deleteUser(
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
                        toast.success("User deleted successfully");
                      }
                    } catch (error) {
                      console.error("Error deleting user:", error);
                      toast.error("Failed to delete user");
                    } finally {
                      setIsDeleting(false);
                      setSelectedUserId("");
                      setSelectedUserEmail("");
                      setIsUserModalOpen(false);
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

      <Modal
        size="3xl"
        scrollBehavior="inside"
        isOpen={isCsvErrorModalOpen}
        onOpenChange={setIsCsvErrorModalOpen}
        onClose={() => setCsvUploadErrors([])}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col text-warning-500">
                CSV Upload Issues
              </ModalHeader>
              <ModalBody>
                <p>
                  The following errors occurred during the CSV upload process:
                </p>
                {csvUploadErrors.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-1 max-h-96 overflow-y-auto">
                    {csvUploadErrors.map((err, index) => (
                      <li key={index}>
                        {err.row && <strong>Row {err.row}</strong>}
                        {err.email && ` (${err.email})`}: {err.message}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No specific errors were recorded.</p>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="warning" variant="light" onPress={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Controls Section - Rearranged */}
      <div className="w-full flex flex-col gap-3">
        {/* First Row: Tabs and Pagination */}
        <div className="w-full flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="flex gap-3">
            <Tabs
              aria-label="Tab Options"
              selectedKey={currentView}
              color="success"
              size="lg"
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
          <Pagination
            isCompact
            showControls
            showShadow
            color="default"
            page={page}
            total={totalPages}
            onChange={(newPage) => setPage(newPage)}
            className={`${currenViewContent.length === 0 && "hidden"}`}
          />
        </div>

        {/* Second Row: Filters and Buttons */}
        <div className="w-full flex flex-col md:flex-row justify-end items-center gap-3">
          {/* Custom CSV Upload for Alumni */}
          {currentView === "alumni" && (
            <div className="flex gap-2 items-center">
              {/* Hidden File Input */}
              <input
                type="file"
                accept=".csv"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
              {/* Button to trigger file selection */}
              <Button
                // size="sm"
                variant="bordered"
                color="primary"
                onClick={handleFileSelectClick}
                isDisabled={isUploadingCSV}
              >
                Select CSV
              </Button>
              {/* Display selected file name */}
              {csvFile && (
                <span className="text-sm text-gray-600 truncate max-w-[150px]">
                  {csvFile.name}
                </span>
              )}
              {/* Upload Button */}
              <Button
                // size="sm"
                color="secondary"
                onClick={handleCSVUpload}
                isDisabled={!csvFile || isUploadingCSV}
                className={`${!csvFile && "hidden"}`}
                isLoading={isUploadingCSV}
              >
                Upload
              </Button>
            </div>
          )}

          {/* Add New Admin Button */}
          <Button
            color="success"
            startContent={<IoAddOutline />}
            className={`${currentView !== "admin" && "hidden"} text-white`}
            onClick={() => setIsAddNewAdminModalOpen(true)}
          >
            Add New Admin
          </Button>

          {/* College Filter */}
          <Select
            label="College"
            disallowEmptySelection={true}
            size="sm"
            className={`${currentView === "agency" && "hidden"} max-w-32`}
            defaultSelectedKeys={["all"]}
            selectedKeys={new Set([collegeFilter])}
            onSelectionChange={(keys) => {
              if (keys !== "all" && keys instanceof Set) {
                const selectedKey = Array.from(keys)[0];
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

          {/* Batch Year Filter */}
          <Select
            items={batchYearFormatted}
            label="Year"
            disallowEmptySelection={true}
            size="sm"
            className={`${currentView !== "alumni" && "hidden"} max-w-32`}
            selectedKeys={new Set([batchYearFilter])} // Use selectedKeys with a Set
            onSelectionChange={(keys) => {
              // Use onSelectionChange
              if (keys instanceof Set) {
                const selectedKey = Array.from(keys)[0];
                if (typeof selectedKey === "string") {
                  setBatchYearFilter(selectedKey);
                }
              }
            }}
          >
            {batchYearFormatted.map((item) => (
              <SelectItem key={item.key}>{item.label}</SelectItem>
            ))}
          </Select>

          {/* Search Input */}
          <Input
            size="sm"
            className="max-w-60"
            label="Search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
      </div>

      {/* Table Section */}
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
