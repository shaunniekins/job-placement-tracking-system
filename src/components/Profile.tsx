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
  Select,
  SelectItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
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
import { EyeSlashFilledIcon } from "../../public/icons/EyeSlashFilledIcon";
import { EyeFilledIcon } from "../../public/icons/EyeFilledIcon";
import { FaUserCircle } from "react-icons/fa";
import {
  RiAwardLine,
  RiProfileLine,
  RiQuestionnaireLine,
  RiUpload2Line,
} from "react-icons/ri";
import {
  colleges,
  programs,
  scholarships,
} from "@/app/api/collegeAndProgramData";
import GTSComponent from "./GTS";
import { deleteGraduateTracerStudy } from "@/app/api/graduteTracerStudyIUD";
import POEComponent from "./POEComponent";
import { IoOptionsOutline } from "react-icons/io5";
import PDSComponent from "./PDSComponent";
import { insertMOAFiles } from "@/app/api/moaIUD";

const ProfileComponent = () => {
  const user = useSelector((state: RootState) => state.user?.user);
  const dispatch = useDispatch();
  const [userId, setUserId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserType, setCurrentUserType] = useState("");
  const handleLogout = useHandleLogout();

  const [openGPTSModal, setOpenGPTSModal] = useState(false);

  const [POEFile, setPOEFile] = useState<File | null>(null);
  const [PDSFile, setPDSFile] = useState<File | null>(null);

  const [isPOEModalOpen, setIsPOEModalOpen] = useState(false);
  const [isUploadAwardsModalOpen, setIsUploadAwardsModalOpen] = useState(false);
  const [isPDSModalOpen, setIsPDSModalOpen] = useState(false);

  const [isOptionModalOpen, setIsOptionModalOpen] = useState(false);

  // User info state
  const [userInfo, setUserInfo] = useState({
    profile_picture: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    contact_number: "",
    address: "",

    // admin / superadmin
    gender: "",

    // agency
    company_name: "",
    company_type: "",
    valid_id: "",
    moa_year_start: "",
    moa_year_end: "",
    moa_file: "",

    // alumni
    birth_date: "",
    college: "",
    program: "",
    scholarship: "",
    batch_year: "",
    is_currently_employed: "",
    is_course_aligned_with_job: "",
    profile_of_employment: "",
  });

  const [tempUserInfo, setTempUserInfo] = useState(userInfo);
  const [isUserEditing, setIsUserEditing] = useState(false);
  const [isUserChanged, setIsUserChanged] = useState(false);

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
        email,
        password,
        profile_picture,
        first_name,
        middle_name,
        last_name,
        contact_number,
        address,
        gender,
        company_name,
        company_type,
        valid_id,
        moa_year_start,
        moa_year_end,
        moa_file,
        birth_date,
        college,
        program,
        scholarship,
        batch_year,
        is_currently_employed,
        is_course_aligned_with_job,
        profile_of_employment,
      } = user.user_metadata;

      setCurrentUserType(
        user.user_metadata.user_type
          ? user.user_metadata.user_type
          : "superadmin"
      );

      const commonUserInfo = {
        profile_picture: profile_picture || "",
        email: email || "",
        first_name: first_name || "",
        middle_name: middle_name || "",
        last_name: last_name || "",
        contact_number: contact_number || "",
        address: address || "",
        gender: gender || "",
        company_name: "",
        company_type: "",
        valid_id: "",
        moa_year_start: "",
        moa_year_end: "",
        moa_file: "",
        birth_date: "",
        college: "",
        program: "",
        scholarship: "",
        batch_year: "",
        is_currently_employed: "",
        is_course_aligned_with_job: "",
        profile_of_employment: "",
      };

      if (user.user_metadata.user_type === "agency") {
        setUserInfo({
          ...commonUserInfo,
          company_name: company_name || "",
          company_type: company_type || "",
          valid_id: valid_id || "",
          moa_year_start: moa_year_start || "",
          moa_year_end: moa_year_end || "",
          moa_file: moa_file || "",
        });

        setTempUserInfo({
          ...commonUserInfo,
          company_name: company_name || "",
          company_type: company_type || "",
          valid_id: valid_id || "",
          moa_year_start: moa_year_start || "",
          moa_year_end: moa_year_end || "",
          moa_file: moa_file || "",
        });
      } else if (user.user_metadata.user_type === "alumni") {
        setUserInfo({
          ...commonUserInfo,
          birth_date: birth_date || "",
          college: college || "",
          program: program || "",
          scholarship: scholarship || "",
          batch_year: batch_year || "",
          is_currently_employed: is_currently_employed || "",
          is_course_aligned_with_job: is_course_aligned_with_job || "",
          profile_of_employment: profile_of_employment || "",
        });

        setTempUserInfo({
          ...commonUserInfo,
          birth_date: birth_date || "",
          college: college || "",
          program: program || "",
          scholarship: scholarship || "",
          batch_year: batch_year || "",
          is_currently_employed: is_currently_employed || "",
          is_course_aligned_with_job: is_course_aligned_with_job || "",
          profile_of_employment: profile_of_employment || "",
        });
      } else {
        setUserInfo({
          ...commonUserInfo,
        });

        setTempUserInfo({
          ...commonUserInfo,
        });
      }

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
      await deleteGraduateTracerStudy(user.id);
      const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);
      if (error) throw error;

      setIsLoading(true);
      handleLogout();
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  // Handlers for user info
  const handleUserInputChange = (e: any) => {
    const { name, value } = e.target;
    setTempUserInfo((prevState) => ({ ...prevState, [name]: value }));
    setIsUserChanged(true);
  };

  const handleUserEditToggle = () => {
    if (isUserEditing) {
      // If canceling, revert to old info
      setTempUserInfo(userInfo);
      setTempLoginInfo(loginInfo);

      setIsUserChanged(false);
      setIsLoginChanged(false);
    } else {
      // If starting to edit, save current info to temp
      setTempUserInfo(userInfo);
      setTempLoginInfo(loginInfo);
    }
    setIsUserEditing(!isUserEditing);
    setIsLoginEditing(false);
  };

  const handleUserSave = async () => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          ...tempUserInfo,
        },
      });
      if (error) throw error;

      reloadUser();
      setIsUserEditing(false);
      setIsUserChanged(false);
    } catch (error) {
      console.error("Error updating user information:", error);
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

      // also disable user since login is dependent on user view
      setIsUserEditing(false);
      setIsUserChanged(false);
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
      <GTSComponent
        userInfo={tempUserInfo}
        currentUserId={user.id}
        openGPTSModal={openGPTSModal}
        setOpenGPTSModal={setOpenGPTSModal}
      />
      <POEComponent
        userID={user.id}
        tempUserInfo={tempUserInfo}
        isPOEModalOpen={isPOEModalOpen}
        setIsPOEModalOpen={setIsPOEModalOpen}
        reloadUser={reloadUser}
        POEFile={POEFile}
        setPOEFile={setPOEFile}
      />
      <PDSComponent
        userID={user.id}
        tempUserInfo={tempUserInfo}
        isPDSModalOpen={isPDSModalOpen}
        setIsPDSModalOpen={setIsPDSModalOpen}
        reloadUser={reloadUser}
        PDSFile={PDSFile}
        setPDSFile={setPDSFile}
      />
      <Modal
        size="xs"
        isOpen={isOptionModalOpen}
        onOpenChange={setIsOptionModalOpen}
        onClose={() => {
          setIsOptionModalOpen(false);
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Options</ModalHeader>
              <ModalBody>
                <div className="flex flex-col gap-2">
                  <Button
                    startContent={<MdDeleteOutline />}
                    color="danger"
                    onClick={handleDeleteToggle}
                  >
                    Delete Account
                  </Button>
                  <Button
                    startContent={
                      isUserEditing ? <MdCancel /> : <MdModeEditOutline />
                    }
                    color="secondary"
                    onClick={handleUserEditToggle}
                  >
                    {isUserEditing ? "Cancel Edit" : "Edit Info"}
                  </Button>
                  <Button
                    startContent={<MdSave />}
                    className={`${
                      !isUserChanged && "hidden"
                    } bg-[#008B47] capitalize text-white`}
                    onClick={() => {
                      if (isUserChanged) {
                        handleUserSave();
                      }
                    }}
                  >
                    Save Info
                  </Button>
                  <Button
                    startContent={<RiQuestionnaireLine />}
                    className={`${
                      currentUserType !== "alumni" && "hidden"
                    } bg-[#008B47] text-white`}
                    onClick={() => setOpenGPTSModal(true)}
                  >
                    GTS
                  </Button>

                  <Button
                    startContent={<RiProfileLine />}
                    color="primary"
                    className={`${currentUserType !== "alumni" && "hidden"} `}
                    onClick={() => setIsPOEModalOpen(true)}
                  >
                    Certificate of Employment
                  </Button>
                  <Button
                    startContent={<RiAwardLine />}
                    className={`${
                      currentUserType !== "alumni" && "hidden"
                    } bg-cyan-400 text-white hidden `}
                    onClick={() => setIsUploadAwardsModalOpen(true)}
                  >
                    Upload Awards
                  </Button>
                  <Button
                    startContent={<RiUpload2Line />}
                    className={`${
                      currentUserType !== "alumni" && "hidden"
                    } bg-orange-400 text-white `}
                    onClick={() => setIsPDSModalOpen(true)}
                  >
                    Upload PDS
                  </Button>
                </div>
              </ModalBody>
              <ModalFooter className="flex justify-end gap-2">
                <Button
                  variant="flat"
                  onClick={() => {
                    setIsOptionModalOpen(false);
                  }}
                >
                  Cancel
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <div className="grid grid-cols-2 gap-2 lg:flex lg:justify-start lg:items-center lg:gap-4">
        <Button
          isIconOnly
          startContent={<IoOptionsOutline size={23} />}
          color="default"
          onClick={() => setIsOptionModalOpen(true)}
        />
        {/* <Button
          startContent={isUserEditing ? <MdCancel /> : <MdModeEditOutline />}
          color="secondary"
          className={`${!isUserEditing && "hidden"}`}
          onClick={handleUserEditToggle}
        >
          {isUserEditing ? "Cancel Edit" : "Edit Info"}
        </Button>
        <Button
          startContent={<MdSave />}
          className={`${
            !isUserChanged && "hidden"
          } bg-[#008B47] capitalize text-white`}
          onClick={() => {
            if (isUserChanged) {
              handleUserSave();
            }
          }}
        >
         Save Info
        </Button> */}
      </div>

      <div
        className={`${
          currentUserType === "agency" ||
          (currentUserType === "alumni" && "mb-24 lg:mb-0")
        } flex h-full w-full overflow-y-auto relative`}
      >
        {user && (
          <div className="h-full w-full border-2 border-[#008B47] rounded-xl p-4 overflow-y-auto ">
            <div className="w-full flex flex-col lg:grid lg:grid-cols-3 items-center gap-4">
              <h1 className="text-xl font-semibold col-span-3 capitalize">
                {`  ${currentUserType} Information`}
              </h1>
              {/* Image field */}
              <div className="col-span-1 flex justify-center">
                <Popover
                  showArrow
                  isOpen={displayImageOpen}
                  onOpenChange={(open) =>
                    isUserEditing && setDisplayImageOpen(open)
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
              {/* User info fields */}
              {currentUserType === "agency" && (
                <>
                  <Input
                    label="Company Name"
                    name="company_name"
                    color="success"
                    variant="bordered"
                    value={tempUserInfo.company_name}
                    onChange={handleUserInputChange}
                    readOnly={!isUserEditing}
                    // className="col-span-2"
                  />
                  <Input
                    label="Company Type"
                    name="company_type"
                    color="success"
                    variant="bordered"
                    value={tempUserInfo.company_type}
                    onChange={handleUserInputChange}
                    readOnly={!isUserEditing}
                  />
                  <Input
                    label="Valid ID"
                    name="valid_id"
                    color="success"
                    variant="bordered"
                    value={tempUserInfo.valid_id}
                    onChange={handleUserInputChange}
                    readOnly={!isUserEditing}
                  />
                  <Input
                    label="MOA Start Date"
                    name="moa_year_start"
                    type="date"
                    color="success"
                    variant="bordered"
                    value={tempUserInfo.moa_year_start}
                    onChange={handleUserInputChange}
                    readOnly={!isUserEditing}
                  />
                  <Input
                    label="MOA End Date"
                    name="moa_year_end"
                    type="date"
                    color="success"
                    variant="bordered"
                    value={tempUserInfo.moa_year_end}
                    onChange={handleUserInputChange}
                    readOnly={!isUserEditing}
                  />
                  <div className="col-span-2 flex items-center gap-2">
                    <Input
                      type="file"
                      label="MOA File"
                      accept=".pdf,image/*"
                      name="moa_file"
                      color="success"
                      variant="bordered"
                      className={`${!isUserEditing && "hidden"}`}
                      onChange={async (e) => {
                        if (e.target.files && e.target.files[0]) {
                          const moaFileUrl = await insertMOAFiles(
                            userId,
                            e.target.files[0]
                          );
                          if (moaFileUrl) {
                            setTempUserInfo({
                              ...tempUserInfo,
                              moa_file: moaFileUrl,
                            });
                            setIsUserChanged(true);
                          }
                        }
                      }}
                    />
                    {tempUserInfo.moa_file && (
                      <Button
                        color="primary"
                        as="a"
                        href={tempUserInfo.moa_file}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View MOA
                      </Button>
                    )}
                  </div>
                </>
              )}
              {currentUserType === "alumni" && (
                <>
                  <Input
                    label="Are you currently Employed?"
                    name="is_currently_employed"
                    color="success"
                    variant="bordered"
                    value={tempUserInfo.is_currently_employed}
                    readOnly
                    className={`${isUserEditing && "hidden"}`}
                  />

                  <Select
                    label="Are you currently Employed?"
                    name="is_currently_employed"
                    variant="bordered"
                    color="success"
                    isRequired
                    isDisabled={!isUserEditing}
                    defaultSelectedKeys={[
                      tempUserInfo.is_currently_employed
                        ? tempUserInfo.is_currently_employed
                        : "no",
                    ]}
                    value={tempUserInfo.is_currently_employed}
                    onChange={handleUserInputChange}
                    className={`${!isUserEditing && "hidden"}`}
                  >
                    <SelectItem key={"yes"}>Yes</SelectItem>
                    <SelectItem key={"no"}>No</SelectItem>
                  </Select>

                  <Input
                    label="Is your job aligned with your course?"
                    name="is_course_aligned_with_job"
                    color="success"
                    variant="bordered"
                    value={tempUserInfo.is_course_aligned_with_job}
                    readOnly
                    className={`${isUserEditing && "hidden"}`}
                  />

                  <Select
                    label="Is your job aligned with your course?"
                    name="is_course_aligned_with_job"
                    variant="bordered"
                    color="success"
                    isRequired
                    isDisabled={!isUserEditing}
                    defaultSelectedKeys={[
                      tempUserInfo.is_course_aligned_with_job
                        ? tempUserInfo.is_course_aligned_with_job
                        : "no",
                    ]}
                    value={tempUserInfo.is_course_aligned_with_job}
                    onChange={handleUserInputChange}
                    className={`${!isUserEditing && "hidden"}`}
                  >
                    <SelectItem key={"yes"}>Yes</SelectItem>
                    <SelectItem key={"no"}>No</SelectItem>
                  </Select>
                </>
              )}
              <hr className="col-span-3" />
              <Input
                label="First Name"
                name="first_name"
                color="success"
                variant="bordered"
                value={tempUserInfo.first_name}
                onChange={handleUserInputChange}
                readOnly={!isUserEditing}
              />
              <Input
                label="Last Name"
                name="last_name"
                color="success"
                variant="bordered"
                value={tempUserInfo.last_name}
                onChange={handleUserInputChange}
                readOnly={!isUserEditing}
              />
              <Input
                label="Middle Name"
                name="middle_name"
                color="success"
                variant="bordered"
                value={tempUserInfo.middle_name}
                onChange={handleUserInputChange}
                readOnly={!isUserEditing}
              />

              <Input
                label="Contact Number"
                name="contact_number"
                color="success"
                variant="bordered"
                value={tempUserInfo.contact_number}
                onChange={handleUserInputChange}
                readOnly={!isUserEditing}
              />
              <Input
                label="Address"
                name="address"
                color="success"
                variant="bordered"
                value={tempUserInfo.address}
                onChange={handleUserInputChange}
                readOnly={!isUserEditing}
              />

              {(currentUserType === "admin" ||
                currentUserType === "superadmin") && (
                <Input
                  label="Gender"
                  name="gender"
                  color="success"
                  variant="bordered"
                  value={tempUserInfo.gender}
                  onChange={handleUserInputChange}
                  readOnly={!isUserEditing}
                />
              )}

              {currentUserType === "alumni" && (
                <>
                  <Input
                    label="Birth Date"
                    name="birth_date"
                    color="success"
                    variant="bordered"
                    value={tempUserInfo.birth_date}
                    onChange={handleUserInputChange}
                    readOnly={!isUserEditing}
                  />
                </>
              )}

              {(currentUserType === "alumni" ||
                currentUserType === "admin") && (
                <>
                  <Input
                    label="College"
                    color="success"
                    variant="bordered"
                    value={tempUserInfo.college.toLocaleUpperCase()}
                    readOnly
                    className={`${isUserEditing && "hidden"}`}
                  />
                  <Select
                    items={colleges}
                    label="College"
                    variant="bordered"
                    color="success"
                    isRequired
                    isDisabled={!isUserEditing}
                    defaultSelectedKeys={[tempUserInfo.college]}
                    value={tempUserInfo.college}
                    onChange={handleUserInputChange}
                    className={`${!isUserEditing && "hidden"}`}
                  >
                    {colleges.map((item) => (
                      <SelectItem key={item.key}>{item.label}</SelectItem>
                    ))}
                  </Select>
                </>
              )}

              {currentUserType === "alumni" && (
                <>
                  <Input
                    label="Program"
                    color="success"
                    variant="bordered"
                    value={tempUserInfo.program.toLocaleUpperCase()}
                    readOnly
                    className={`${isUserEditing && "hidden"}`}
                  />
                  <Select
                    items={programs}
                    label="Program"
                    variant="bordered"
                    color="success"
                    isRequired
                    isDisabled={!isUserEditing}
                    defaultSelectedKeys={[tempUserInfo.program]}
                    value={tempUserInfo.program}
                    onChange={handleUserInputChange}
                    className={`${!isUserEditing && "hidden"}`}
                  >
                    {programs.map((item) => (
                      <SelectItem key={item.key}>{item.label}</SelectItem>
                    ))}
                  </Select>

                  <Input
                    label="Scholarship"
                    color="success"
                    variant="bordered"
                    value={tempUserInfo.scholarship.toLocaleUpperCase()}
                    readOnly
                    className={`${isUserEditing && "hidden"}`}
                  />
                  <Select
                    items={scholarships}
                    label="Scholarship"
                    variant="bordered"
                    color="success"
                    isRequired
                    isDisabled={!isUserEditing}
                    defaultSelectedKeys={[tempUserInfo.scholarship]}
                    value={tempUserInfo.scholarship}
                    onChange={handleUserInputChange}
                    className={`${!isUserEditing && "hidden"}`}
                  >
                    {scholarships.map((item) => (
                      <SelectItem key={item.key}>{item.label}</SelectItem>
                    ))}
                  </Select>
                  <Input
                    label="Batch Year"
                    name="batch_year"
                    color="success"
                    variant="bordered"
                    value={tempUserInfo.batch_year}
                    onChange={handleUserInputChange}
                    readOnly={!isUserEditing}
                  />
                </>
              )}

              {currentUserType !== "superadmin" && (
                <>
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

                  <div
                    className={`${
                      !isUserEditing && "hidden"
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
                      } bg-[#008B47] text-white`}
                      onClick={handleLoginSave}
                    >
                      Save Login Info
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileComponent;
