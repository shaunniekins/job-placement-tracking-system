"use client";

import { RootState } from "@/app/reduxUtils/store";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Button,
  Spinner,
  Input,
  Avatar,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@nextui-org/react";
import { supabase, supabaseAdmin } from "@/utils/supabase";
import { useHandleLogout } from "@/utils/authUtils";
import { setUser } from "@/app/reduxUtils/userSlice";
import {
  MdDeleteOutline,
  MdCancel,
  MdModeEditOutline,
  MdSave,
} from "react-icons/md";
import { EyeSlashFilledIcon } from "../../../public/icons/EyeSlashFilledIcon";
import { EyeFilledIcon } from "../../../public/icons/EyeFilledIcon";
import { FaUserCircle } from "react-icons/fa";

const ProfileComponent = () => {
  const user = useSelector((state: RootState) => state.user.user);
  const dispatch = useDispatch();
  const [userId, setUserId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const handleLogout = useHandleLogout();

  // Agency info state
  const [agencyInfo, setAgencyInfo] = useState({
    address: "",
    first_name: "",
    last_name: "",
    middle_name: "",
    mobile_number: "",
    companyName: "",
    companyType: "",
    validId: "",
  });

  const [tempAgencyInfo, setTempAgencyInfo] = useState(agencyInfo);
  const [isAgencyEditing, setIsAgencyEditing] = useState(false);
  const [isAgencyChanged, setIsAgencyChanged] = useState(false);

  // Login info state
  const [loginInfo, setLoginInfo] = useState({
    email: "",
    password: "",
  });

  const [tempLoginInfo, setTempLoginInfo] = useState(loginInfo);
  const [isLoginEditing, setIsLoginEditing] = useState(false);
  const [isInputUserPasswordVisible, setIsInputUserPasswordVisible] =
    useState(false);
  const [isLoginChanged, setIsLoginChanged] = useState(false);

  // Image state
  const [displayImage, setDisplayImage] = useState({
    profile_picture: "",
  });
  const [displayImageOpen, setDisplayImageOpen] = useState(false);

  useEffect(() => {
    if (user) {
      const {
        profile_picture,
        email,
        password,
        address,
        first_name,
        last_name,
        middle_name,
        mobile_number,
        companyName,
        companyType,
        validId,
      } = user.user_metadata;

      setAgencyInfo({
        address: address || "",
        first_name: first_name || "",
        last_name: last_name || "",
        middle_name: middle_name || "",
        mobile_number: mobile_number || "",
        companyName: companyName || "",
        companyType: companyType || "",
        validId: validId || "",
      });

      setTempAgencyInfo({
        address: address || "",
        first_name: first_name || "",
        last_name: last_name || "",
        middle_name: middle_name || "",
        mobile_number: mobile_number || "",
        companyName: companyName || "",
        companyType: companyType || "",
        validId: validId || "",
      });

      setLoginInfo({
        email: email || user.email || "",
        password: password || "",
      });

      setTempLoginInfo({
        email: email || user.email || "",
        password: password || "",
      });

      setDisplayImage({
        profile_picture: profile_picture || "",
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

    if (!confirmed) return;

    try {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);
      if (error) throw error;

      setIsLoading(true);
      handleLogout();
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  // Handlers for agency info
  const handleAgencyInputChange = (e: any) => {
    const { name, value } = e.target;
    setTempAgencyInfo((prevState) => ({ ...prevState, [name]: value }));
    setIsAgencyChanged(true);
  };

  const handleAgencyEditToggle = () => {
    if (isAgencyEditing) {
      // If canceling, revert to old info
      setTempAgencyInfo(agencyInfo);
      setTempLoginInfo(loginInfo);

      setIsAgencyChanged(false);
      setIsLoginChanged(false);
    } else {
      // If starting to edit, save current info to temp
      setTempAgencyInfo(agencyInfo);
      setTempLoginInfo(loginInfo);
    }
    setIsAgencyEditing(!isAgencyEditing);
    setIsLoginEditing(false);
  };

  const handleAgencySave = async () => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          ...tempAgencyInfo,
        },
      });
      if (error) throw error;

      reloadUser();
      setIsAgencyEditing(false);
      setIsAgencyChanged(false);
    } catch (error) {
      console.error("Error updating agency information:", error);
    }
  };

  // Handlers for login info
  const handleLoginInputChange = (e: any) => {
    const { name, value } = e.target;
    setTempLoginInfo((prevState) => ({ ...prevState, [name]: value }));
    setIsLoginChanged(true);
  };

  const handleLoginEditToggle = () => {
    if (isLoginEditing) {
      // If canceling, revert to tempUserInfo
      setTempLoginInfo(loginInfo);
      setIsLoginChanged(false);
    } else {
      // If starting to edit, save current userInfo to tempUserInfo
      setTempLoginInfo(loginInfo);
    }
    setIsLoginEditing(!isLoginEditing);
  };

  const handleLoginSave = async () => {
    try {
      const { error } = await supabase.auth.updateUser({
        email: tempLoginInfo.email,
        password: tempLoginInfo.password,
        data: {
          email: tempLoginInfo.email,
          password: tempLoginInfo.password,
        },
      });
      if (error) throw error;

      reloadUser();
      setIsLoginEditing(false);
      setIsLoginChanged(false);

      // also disable agency since login is dependent on agency view
      setIsAgencyEditing(false);
      setIsAgencyChanged(false);
    } catch (error) {
      console.error("Error updating login information:", error);
    }
  };

  // Handlers for image
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayImageOpen(false);

    const files = e.target.files;
    const BUCKET_NAME = "profile-pictures";

    if (files && files[0]) {
      setDisplayImage((prevState) => ({
        ...prevState,
        profile_picture: "",
      }));

      setDisplayImage((prevState) => ({
        ...prevState,
        profile_picture: "",
      }));

      if (displayImage.profile_picture) {
        const { error } = await supabase.storage
          .from(BUCKET_NAME)
          .remove([`public/${user.id}`]);

        if (error) {
          console.error("Error deleting image:", error.message);
          return;
        }
      }

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(`public/${user.id}`, files[0]);

      if (data && !error) {
        const { publicUrl } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(data.path).data;

        const { error } = await supabase.auth.updateUser({
          data: {
            profile_picture: publicUrl,
          },
        });

        setDisplayImage((prevState) => ({
          ...prevState,
          profile_picture: publicUrl,
        }));

        setDisplayImage((prevState) => ({
          ...prevState,
          profile_picture: publicUrl,
        }));

        reloadUser();

        if (error) throw error;
      }
    }
  };

  const handleImageDelete = async () => {
    setDisplayImageOpen(false);

    const BUCKET_NAME = "profile-pictures";

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([`public/${user.id}`]);

    if (error) {
      console.error("Error deleting image:", error.message);
      return;
    }

    await supabase.auth.updateUser({
      data: {
        profile_picture: "",
      },
    });

    setDisplayImage((prevState) => ({
      ...prevState,
      profile_picture: "",
    }));

    reloadUser();
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
          startContent={isAgencyEditing ? <MdCancel /> : <MdModeEditOutline />}
          color="secondary"
          onClick={handleAgencyEditToggle}
        >
          {isAgencyEditing ? "Cancel" : "Edit Agency Info"}
        </Button>

        <Button
          startContent={<MdSave />}
          className={`${!isAgencyChanged && "hidden"} bg-[#007057] text-white`}
          onClick={() => {
            if (isAgencyChanged) {
              handleAgencySave();
            }
          }}
        >
          Save Agency Info
        </Button>
      </div>

      <div className="flex h-full w-full overflow-y-auto relative">
        {user && (
          <div className="h-full w-full border-2 border-[#007057] rounded-xl p-4">
            <div className="w-full grid lg:grid-cols-3 items-center gap-4">
              <h1 className="text-xl font-semibold col-span-3">
                Agency Information
              </h1>
              {/* Image field */}
              <div className="col-span-1 flex justify-center">
                <Popover
                  showArrow
                  placement="right"
                  isOpen={displayImageOpen}
                  onOpenChange={(open) =>
                    isAgencyEditing && setDisplayImageOpen(open)
                  }
                >
                  <PopoverTrigger>
                    {displayImage.profile_picture ? (
                      <Avatar
                        src={displayImage.profile_picture}
                        alt="Profile"
                        className="w-32 h-32 rounded-full object-cover cursor-pointer"
                      />
                    ) : (
                      <FaUserCircle size="8rem" className="text-gray-500" />
                    )}
                  </PopoverTrigger>
                  <PopoverContent className="p-3 flex flex-col items-start gap-3">
                    <label
                      htmlFor="profile-picture-upload"
                      className="flex items-center gap-2 text-md cursor-pointer"
                    >
                      <MdSave className="text-lg" />
                      <span>
                        {!displayImage ? "Upload an image" : "Change image"}
                      </span>
                    </label>

                    <input
                      id="profile-picture-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />

                    {displayImage.profile_picture && (
                      <button
                        className="flex items-center gap-2 text-md cursor-pointer"
                        onClick={handleImageDelete}
                      >
                        <MdDeleteOutline className="text-lg" />
                        <span>Delete</span>
                      </button>
                    )}
                  </PopoverContent>
                </Popover>
              </div>
              {/* Agency info fields */}
              <Input
                label="Company Name"
                name="companyName"
                color="success"
                variant="bordered"
                value={tempAgencyInfo.companyName}
                onChange={handleAgencyInputChange}
                readOnly={!isAgencyEditing}
                // className="col-span-2"
              />
              <Input
                label="Company Type"
                name="companyType"
                color="success"
                variant="bordered"
                value={tempAgencyInfo.companyType}
                onChange={handleAgencyInputChange}
                readOnly={!isAgencyEditing}
              />
              <hr className="col-span-3" />
              <Input
                label="First Name"
                name="first_name"
                color="success"
                variant="bordered"
                value={tempAgencyInfo.first_name}
                onChange={handleAgencyInputChange}
                readOnly={!isAgencyEditing}
              />
              <Input
                label="Last Name"
                name="last_name"
                color="success"
                variant="bordered"
                value={tempAgencyInfo.last_name}
                onChange={handleAgencyInputChange}
                readOnly={!isAgencyEditing}
              />
              <Input
                label="Middle Name"
                name="middle_name"
                color="success"
                variant="bordered"
                value={tempAgencyInfo.middle_name}
                onChange={handleAgencyInputChange}
                readOnly={!isAgencyEditing}
              />

              <Input
                label="Mobile Number"
                name="mobile_number"
                color="success"
                variant="bordered"
                value={tempAgencyInfo.mobile_number}
                onChange={handleAgencyInputChange}
                readOnly={!isAgencyEditing}
              />
              <Input
                label="Address"
                name="address"
                color="success"
                variant="bordered"
                value={tempAgencyInfo.address}
                onChange={handleAgencyInputChange}
                readOnly={!isAgencyEditing}
              />

              <Input
                label="Valid ID"
                name="validId"
                color="success"
                variant="bordered"
                value={tempAgencyInfo.validId}
                onChange={handleAgencyInputChange}
                readOnly={!isAgencyEditing}
              />
              <hr className="col-span-3" />
              <h1 className="text-xl font-semibold col-span-3">
                Account Login Information
              </h1>

              <Input
                label="Email"
                name="email"
                color="success"
                variant="bordered"
                value={tempLoginInfo.email}
                onChange={handleLoginInputChange}
                readOnly={!isLoginEditing}
              />
              <Input
                type={isInputUserPasswordVisible ? "text" : "password"}
                label="Password"
                name="password"
                color="success"
                variant="bordered"
                value={tempLoginInfo.password}
                onChange={handleLoginInputChange}
                readOnly={!isLoginEditing}
                endContent={
                  <button
                    className="focus:outline-none"
                    type="button"
                    onClick={() =>
                      setIsInputUserPasswordVisible(!isInputUserPasswordVisible)
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

              <div
                className={`${
                  !isAgencyEditing && "hidden"
                } flex justify-center items-center gap-4`}
              >
                <Button
                  fullWidth
                  startContent={
                    isLoginEditing ? <MdCancel /> : <MdModeEditOutline />
                  }
                  color="secondary"
                  onClick={handleLoginEditToggle}
                >
                  {isLoginEditing ? "Cancel" : "Edit Login Info"}
                </Button>
                <Button
                  fullWidth
                  startContent={<MdSave />}
                  className={`${
                    !isLoginChanged && "hidden"
                  } bg-[#007057] text-white`}
                  onClick={handleLoginSave}
                >
                  Save Login Info
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileComponent;
