"use client";

import { RootState } from "@/app/reduxUtils/store";
import useJobApplications from "@/hooks/useJobApplications";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Button,
  Pagination,
  Spinner,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableColumn,
  TableCell,
  SelectItem,
  Select,
  Input,
} from "@nextui-org/react";
import { formatDate, formatDateSuffix } from "@/utils/compUtils";
import {
  MdCancel,
  MdClose,
  MdDeleteOutline,
  MdModeEditOutline,
  MdSave,
} from "react-icons/md";
import { supabase, supabaseAdmin } from "@/utils/supabase";
import { useHandleLogout } from "@/utils/authUtils";
import { setUser } from "@/app/reduxUtils/userSlice";

const ProfileComponent = () => {
  const user = useSelector((state: RootState) => state.user.user);
  const dispatch = useDispatch();
  const [userId, setUserId] = useState("");
  const [page, setPage] = useState(1);
  const rowsPerPage = 15;
  const [isLoading, setIsLoading] = useState(false);
  const handleLogout = useHandleLogout();

  const [userInfo, setUserInfo] = useState({
    profile_picture: "",
    email: "",
    password: "",
    address: "",
    first_name: "",
    last_name: "",
    middle_name: "",
    mobile_number: "",
    companyName: "",
    companyType: "",
    validId: "",
  });
  const [tempUserInfo, setTempUserInfo] = useState(userInfo);
  const [isEditing, setIsEditing] = useState(false);
  const [isChanged, setIsChanged] = useState(false);

  useEffect(() => {
    if (user) {
      const {
        profile_picture,
        email,
        address,
        first_name,
        last_name,
        middle_name,
        mobile_number,
        companyName,
        companyType,
        validId,
        user_type,
      } = user.user_metadata;

      setUserInfo({
        profile_picture: profile_picture || "",
        email: email || user.email || "",
        address: address || "",
        first_name: first_name || "",
        last_name: last_name || "",
        middle_name: middle_name || "",
        mobile_number: mobile_number || "",
        companyName: companyName || "",
        companyType: companyType || "",
        validId: validId || "",
        password: "", // Password should not be set from user data for security reasons
      });

      setTempUserInfo({
        profile_picture: profile_picture || "",
        email: email || user.email || "",
        address: address || "",
        first_name: first_name || "",
        last_name: last_name || "",
        middle_name: middle_name || "",
        mobile_number: mobile_number || "",
        companyName: companyName || "",
        companyType: companyType || "",
        validId: validId || "",
        password: "", // Password should not be set from user data for security reasons
      });

      setUserId(user.id);
    }
  }, [user]);

  const reloadUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    dispatch(setUser(user));
  };

  const handleDeleteToggle = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this user? This action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    try {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);

      if (error) {
        throw error;
      }

      setIsLoading(true);
      handleLogout();
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setTempUserInfo((prevState) => ({
      ...prevState,
      [name]: value,
    }));
    setIsChanged(true);
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase.auth.updateUser({
        email: tempUserInfo.email,
        data: {
          profile_picture: tempUserInfo.profile_picture,
          email: tempUserInfo.email,
          address: tempUserInfo.address,
          first_name: tempUserInfo.first_name,
          last_name: tempUserInfo.last_name,
          middle_name: tempUserInfo.middle_name,
          mobile_number: tempUserInfo.mobile_number,
          companyName: tempUserInfo.companyName,
          companyType: tempUserInfo.companyType,
          validId: tempUserInfo.validId,
        },
      });

      if (error) {
        throw error;
      }

      reloadUser();
      setIsEditing(false);
      setIsChanged(false);
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // If canceling, revert to tempUserInfo
      setTempUserInfo(userInfo);
      setIsChanged(false);
    } else {
      // If starting to edit, save current userInfo to tempUserInfo
      setTempUserInfo(userInfo);
    }
    setIsEditing(!isEditing);
  };

  if (!user || isLoading) {
    return (
      <div className="h-full w-full flex justify-center items-center">
        <Spinner color="success" />
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col gap-2">
      <div className="justify-start gap-4 flex items-center">
        <Button
          startContent={<MdDeleteOutline />}
          color="danger"
          onClick={handleDeleteToggle}
        >
          Delete Account
        </Button>
        <Button
          startContent={isEditing ? <MdCancel /> : <MdModeEditOutline />}
          color="secondary"
          onClick={handleEditToggle}
        >
          {isEditing ? "Cancel" : "Edit"}
        </Button>
        <Button
          startContent={<MdSave />}
          className={`${
            !isChanged && "hidden"
          } bg-[#007057] text-white self-center`}
          onClick={() => {
            if (isChanged) {
              handleSave();
            }
          }}
        >
          Save
        </Button>
      </div>
      <div className="flex h-full w-full overflow-y-auto relative">
        {user && (
          <div className="h-full w-full border-2 border-[#007057] rounded-xl p-4">
            <div>
              <h1 className="text-xl font-semibold">Agency Information</h1>
              <div className="w-full grid lg:grid-cols-3 gap-4">
                <Input
                  label="First Name"
                  name="first_name"
                  color="success"
                  variant="bordered"
                  value={tempUserInfo.first_name}
                  onChange={handleInputChange}
                  readOnly={!isEditing}
                />
                <Input
                  label="Last Name"
                  name="last_name"
                  color="success"
                  variant="bordered"
                  value={tempUserInfo.last_name}
                  onChange={handleInputChange}
                  readOnly={!isEditing}
                />
                <Input
                  label="Middle Name"
                  name="middle_name"
                  color="success"
                  variant="bordered"
                  value={tempUserInfo.middle_name}
                  onChange={handleInputChange}
                  readOnly={!isEditing}
                />
                <Input
                  label="Email"
                  name="email"
                  color="success"
                  variant="bordered"
                  value={tempUserInfo.email}
                  onChange={handleInputChange}
                  readOnly={!isEditing}
                />
                <Input
                  label="Mobile Number"
                  name="mobile_number"
                  color="success"
                  variant="bordered"
                  value={tempUserInfo.mobile_number}
                  onChange={handleInputChange}
                  readOnly={!isEditing}
                />
                <Input
                  label="Address"
                  name="address"
                  color="success"
                  variant="bordered"
                  value={tempUserInfo.address}
                  onChange={handleInputChange}
                  readOnly={!isEditing}
                />
                <Input
                  label="Company Name"
                  name="companyName"
                  color="success"
                  variant="bordered"
                  value={tempUserInfo.companyName}
                  onChange={handleInputChange}
                  readOnly={!isEditing}
                />
                <Input
                  label="Company Type"
                  name="companyType"
                  color="success"
                  variant="bordered"
                  value={tempUserInfo.companyType}
                  onChange={handleInputChange}
                  readOnly={!isEditing}
                />
                <Input
                  label="Valid ID"
                  name="validId"
                  color="success"
                  variant="bordered"
                  value={tempUserInfo.validId}
                  onChange={handleInputChange}
                  readOnly={!isEditing}
                />
                <div className="col-span-3 flex flex-col justify-center items-center flicker text-5xl">
                  currently editing {":<<"}
                  <span>
                    but working na ni cya if ever mag-edit ug info and
                    makadelete napod ni ug account. the photo avatar sa user kay
                    soon pa, tapos murag wala namay lain info c agency (nagbased
                    kos docs).
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileComponent;
