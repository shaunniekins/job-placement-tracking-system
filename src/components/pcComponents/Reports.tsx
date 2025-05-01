import { useState } from "react";
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
} from "@nextui-org/react";
import { useSelector } from "react-redux";
import { RootState } from "@/app/reduxUtils/store";
import useUsers from "@/hooks/useUsers";
import { formatDocumentKey } from "@/utils/compUtils";

const ReportsPC = () => {
  const user = useSelector((state: RootState) => state.user.user);
  const userCollege = user?.user_metadata?.college;

  const [page, setPage] = useState(1);
  const rowsPerPage = 16;
  const [showCertificates, setShowCertificates] = useState(false);

  // Fetch alumni data
  const { usersData, totalUserEntries } = useUsers(
    rowsPerPage,
    page,
    "alumni",
    "approved",
    userCollege
  );

  const totalPages = Math.ceil(totalUserEntries / rowsPerPage);

  // Define columns based on showCertificates state
  const normalColumns = [
    { key: "full_name", label: "Full Name" },
    { key: "contact_number", label: "Contact Number" },
    { key: "licensure_number", label: "Licensure Number" },
    { key: "year_pass", label: "Year Pass" },
  ];

  const certificateColumns = [
    { key: "full_name", label: "Full Name" },
    { key: "certificate_of_employment", label: "Employment Certificate" },
    { key: "awards", label: "Awards" },
  ];

  const columns = showCertificates ? certificateColumns : normalColumns;

  return (
    <div className="h-full w-full flex flex-col gap-2">
      <div className="w-full flex justify-between items-center gap-3">
        <Button
          color="success"
          className="text-white"
          onClick={() => setShowCertificates(!showCertificates)}
        >
          {showCertificates ? "Show Basic Info" : "Certificates"}
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

      <div className="mt-2 flex h-full w-full overflow-y-auto relative">
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
                        {item.meta_data.first_name} {item.meta_data.last_name}
                      </TableCell>
                    );
                  }

                  if (columnKey === "contact_number") {
                    return (
                      <TableCell className="text-center">
                        {item.meta_data.contact_number || "N/A"}
                      </TableCell>
                    );
                  }

                  if (columnKey === "licensure_number") {
                    return (
                      <TableCell className="text-center">
                        {item.meta_data.licensure_number || "N/A"}
                      </TableCell>
                    );
                  }

                  if (columnKey === "year_pass") {
                    return (
                      <TableCell className="text-center">
                        {item.meta_data.year_pass || "N/A"}
                      </TableCell>
                    );
                  }

                  if (columnKey === "certificate_of_employment") {
                    const coeKey = formatDocumentKey(
                      "Certificate of Employment"
                    );
                    return (
                      <TableCell className="text-center">
                        {item.meta_data[coeKey] ? (
                          <Button
                            size="sm"
                            color="primary"
                            as="a"
                            href={item.meta_data[coeKey]}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View Image
                          </Button>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                    );
                  }

                  if (columnKey === "awards") {
                    const awardsKey = formatDocumentKey(
                      "Awards and Recognition"
                    );
                    const awards = item.meta_data[awardsKey];
                    return (
                      <TableCell className="text-center">
                        {awards ? (
                          <Button
                            size="sm"
                            color="primary"
                            as="a"
                            href={Array.isArray(awards) ? awards[0] : awards}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View Image
                          </Button>
                        ) : (
                          "N/A"
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
