"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Input,
  Radio,
  Button,
  Select,
  SelectItem,
  RadioGroup,
  Modal,
  ModalContent,
  ModalBody,
  ModalHeader,
  ModalFooter,
  Textarea,
  Checkbox,
} from "@nextui-org/react";
import { IoAddOutline, IoRemoveCircleOutline } from "react-icons/io5";
import {
  checkIfExistingGTS,
  insertGraduateTracerStudy,
  updateGraduateTracerStudy,
} from "@/app/api/graduteTracerStudyIUD";
import useGTS from "@/hooks/useGTS";
import { deleteCOEIfSelfEmployed } from "@/utils/documentUtils";

interface EducationalBackground {
  degree: string;
  college: string;
  yearGraduated: string;
  honors: string;
}

interface ProfessionalExamination {
  name_of_exam: string;
  date_taken: string;
  rating: string;
}

interface CourseReasons {
  undergraduate: string[];
  graduate: string[];
  other_undergraduate: string;
  other_graduate: string;
}

interface TrainingAfterCollege {
  title: string;
  duration: string;
  institution: string;
}

interface JobLevels {
  first_job: string[];
  current_job: string[];
}

interface GTSComponentProps {
  userInfo: any;
  currentUserId: string;
  openGPTSModal: boolean;
  setOpenGPTSModal: (isOpen: boolean) => void;
  isReadOnly?: boolean;
  onEmploymentStatusChange?: (status: string) => void;
}

const GTSComponent: React.FC<GTSComponentProps> = ({
  userInfo,
  currentUserId,
  openGPTSModal,
  setOpenGPTSModal,
  isReadOnly = false,
  onEmploymentStatusChange,
}) => {
  const [currentView, setCurrentView] = useState("A");
  const initialFormState = useMemo(
    () => ({
      contact_numbers: "",
      civil_status: "",
      sex: "",
      region: "",
      province: "",
      location_of_residence: "",
      educational_background: [] as EducationalBackground[],
      professional_examination: [] as ProfessionalExamination[],
      course_reasons: {
        undergraduate: [],
        graduate: [],
        other_undergraduate: "",
        other_graduate: "",
      } as CourseReasons,
      training_after_college: [] as TrainingAfterCollege[],
      advance_studies_reason: "",
      other_advance_studies_reason: "",
      employment_status: "",
      unemployment_reasons: [] as any,
      other_unemployment_reason: "",
      present_employment_status: "",
      present_occupation: "",
      major_line_of_business: "",
      place_of_work: "",
      agency: "",
      is_first_time_job_after_college: "",
      staying_on_job_reasons: [] as any,
      other_staying_on_job_reason: "",
      is_first_job_related_to_course: "",
      first_job_related_to_course_reasons: [] as any,
      other_first_job_related_to_course_reason: "",
      leaving_job_reasons: [] as any,
      other_leaving_job_reason: "",
      staying_duration_in_first_job: [] as any,
      other_staying_duration_in_first_job: "",
      first_job_found_through: [] as any,
      other_first_job_found_through: "",
      duration_before_first_job: [] as any,
      other_duration_before_first_job: "",
      job_levels: {
        first_job: [],
        current_job: [],
      } as JobLevels,
      initial_gross_first_job: "",
      is_curriculum_relevant_in_first_job: "",
      learned_competencies: [] as any,
      other_learned_competencies: "",
      suggestions: "",
    }),
    []
  );

  const [formData, setFormData] = useState(initialFormState);
  const [initialFormData, setInitialFormData] = useState(initialFormState);

  const { gts, loadingGTS, errorGTS } = useGTS(currentUserId);

  useEffect(() => {
    if (gts.length > 0) {
      const {
        email,
        first_name,
        last_name,
        middle_name,
        contact_number,
        address,
        birth_date,
        ...cleanedGTS
      } = gts[0];

      const completeGTSData = { ...initialFormState, ...cleanedGTS };

      setFormData(completeGTSData);
      setInitialFormData(completeGTSData);
    } else {
      setFormData(initialFormState);
      setInitialFormData(initialFormState);
    }
  }, [gts, initialFormState]);

  const isFormChanged = () => {
    return JSON.stringify(formData) !== JSON.stringify(initialFormData);
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleRadioChange = (name: string, value: string) => {
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleEducationChange = (
    index: number,
    field: keyof EducationalBackground,
    value: string
  ) => {
    setFormData((prevState) => {
      const newEducation = [...prevState.educational_background];
      newEducation[index] = { ...newEducation[index], [field]: value };
      return { ...prevState, educational_background: newEducation };
    });
  };

  const addEducation = () => {
    setFormData((prevState) => ({
      ...prevState,
      educational_background: [
        ...prevState.educational_background,
        {
          degree: "",
          college: "",
          yearGraduated: "",
          honors: "",
        },
      ],
    }));
  };

  const removeEducation = (index: number) => {
    setFormData((prevState) => ({
      ...prevState,
      educational_background: prevState.educational_background.filter(
        (_, i) => i !== index
      ),
    }));
  };

  const handleProfessionalChange = (
    index: number,
    field: keyof ProfessionalExamination,
    value: string
  ) => {
    setFormData((prevState) => {
      const newProfessional = [...prevState.professional_examination];
      newProfessional[index] = { ...newProfessional[index], [field]: value };
      return { ...prevState, professional_examination: newProfessional };
    });
  };

  const addProfessional = () => {
    setFormData((prevState) => ({
      ...prevState,
      professional_examination: [
        ...prevState.professional_examination,
        {
          name_of_exam: "",
          date_taken: "",
          rating: "",
        },
      ],
    }));
  };

  const removeProfessional = (index: number) => {
    setFormData((prevState) => ({
      ...prevState,
      professional_examination: prevState.professional_examination.filter(
        (_, i) => i !== index
      ),
    }));
  };

  const reasons = [
    "High grades in the course or subject area(s) related to the course",
    "Good grades in high school",
    "Influence of parents or relatives",
    "Peer Influence",
    "Inspired by a role model",
    "Strong passion for the profession",
    "Prospect for immediate employment",
    "Status or prestige of the profession",
    "Availability of course offering in chosen institution",
    "Prospect of career advancement",
    "Affordable for the family",
    "Prospect of attractive compensation",
    "Opportunity for employment abroad",
    "No particular choice or no better idea",
  ];

  const handleReasonChange = (
    level: "undergraduate" | "graduate",
    reason: string
  ) => {
    setFormData((prevState) => ({
      ...prevState,
      course_reasons: {
        ...prevState.course_reasons,
        [level]: prevState.course_reasons[level].includes(reason)
          ? prevState.course_reasons[level].filter((r) => r !== reason)
          : [...prevState.course_reasons[level], reason],
      },
    }));
  };

  const handleOtherReasonChange = (
    level: "undergraduate" | "graduate",
    value: string
  ) => {
    setFormData((prevState) => ({
      ...prevState,
      course_reasons: {
        ...prevState.course_reasons,
        [`other${level.charAt(0).toUpperCase() + level.slice(1)}`]: value,
      },
    }));
  };

  const handleTrainingChange = (
    index: number,
    field: keyof TrainingAfterCollege,
    value: string
  ) => {
    setFormData((prevState) => {
      const newTraining = [...prevState.training_after_college];
      newTraining[index] = { ...newTraining[index], [field]: value };
      return { ...prevState, training_after_college: newTraining };
    });
  };

  const addTraining = () => {
    setFormData((prevState) => ({
      ...prevState,
      training_after_college: [
        ...prevState.training_after_college,
        {
          title: "",
          duration: "",
          institution: "",
        },
      ],
    }));
  };

  const removeTraining = (index: number) => {
    setFormData((prevState) => ({
      ...prevState,
      training_after_college: prevState.training_after_college.filter(
        (_, i) => i !== index
      ),
    }));
  };

  const handleAdvanceStudiesReasonChange = (value: string) => {
    setFormData((prevState) => ({
      ...prevState,
      advance_studies_reason: value,
      other_advance_studies_reason:
        value === "Others" ? prevState.other_advance_studies_reason : "",
    }));
  };

  const handleOtherAdvanceStudiesReasonChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prevState) => ({
      ...prevState,
      other_advance_studies_reason: e.target.value,
    }));
  };

  const handleUnemploymentReasonChange = (
    reason: string,
    isChecked: boolean
  ) => {
    setFormData((prevState) => ({
      ...prevState,
      unemployment_reasons: isChecked
        ? [...prevState.unemployment_reasons, reason]
        : prevState.unemployment_reasons.filter((r: any) => r !== reason),
    }));
  };

  const handleOtherUnemploymentReasonChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prevState) => ({
      ...prevState,
      other_unemployment_reason: e.target.value,
    }));
  };

  const handleStayingReasonChange = (reason: string, isChecked: boolean) => {
    setFormData((prevState) => ({
      ...prevState,
      staying_on_job_reasons: isChecked
        ? [...prevState.staying_on_job_reasons, reason]
        : prevState.staying_on_job_reasons.filter((r: any) => r !== reason),
    }));
  };

  const handleOtherStayingOnJobReasonChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prevState) => ({
      ...prevState,
      other_staying_on_job_reason: e.target.value,
    }));
  };

  const handleIsFirstJobRelatedToCourseReasonChange = (
    reason: string,
    isChecked: boolean
  ) => {
    setFormData((prevState) => ({
      ...prevState,
      first_job_related_to_course_reasons: isChecked
        ? [...prevState.first_job_related_to_course_reasons, reason]
        : prevState.first_job_related_to_course_reasons.filter(
            (r: any) => r !== reason
          ),
    }));
  };

  const handleOtherFirstJobRelatedToCourseReasonChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prevState) => ({
      ...prevState,
      other_first_job_related_to_course_reason: e.target.value,
    }));
  };

  const handleLeavingJobReasonChange = (reason: string, isChecked: boolean) => {
    setFormData((prevState) => ({
      ...prevState,
      leaving_job_reasons: isChecked
        ? [...prevState.leaving_job_reasons, reason]
        : prevState.leaving_job_reasons.filter((r: any) => r !== reason),
    }));
  };

  const handleOtherLeavingJobReasonChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prevState) => ({
      ...prevState,
      other_leaving_job_reason: e.target.value,
    }));
  };

  const handleStayingDurationInFirstJobChange = (
    reason: string,
    isChecked: boolean
  ) => {
    setFormData((prevState) => ({
      ...prevState,
      staying_duration_in_first_job: isChecked
        ? [...prevState.staying_duration_in_first_job, reason]
        : prevState.staying_duration_in_first_job.filter(
            (r: any) => r !== reason
          ),
    }));
  };

  const handleOtherStayingDurationInFirstJobChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prevState) => ({
      ...prevState,
      other_staying_duration_in_first_job: e.target.value,
    }));
  };

  const handleFirstJobFoundThroughChange = (
    reason: string,
    isChecked: boolean
  ) => {
    setFormData((prevState) => ({
      ...prevState,
      first_job_found_through: isChecked
        ? [...prevState.first_job_found_through, reason]
        : prevState.first_job_found_through.filter((r: any) => r !== reason),
    }));
  };

  const handleOtherFirstJobFoundThroughChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prevState) => ({
      ...prevState,
      other_first_job_found_through: e.target.value,
    }));
  };

  const handleDurationBeforeFirstJobChange = (
    reason: string,
    isChecked: boolean
  ) => {
    setFormData((prevState) => ({
      ...prevState,
      duration_before_first_job: isChecked
        ? [...prevState.duration_before_first_job, reason]
        : prevState.duration_before_first_job.filter((r: any) => r !== reason),
    }));
  };

  const levels = [
    "Rank or Clerical",
    "Professional, Technical or Supervisory",
    "Managerial or Executive",
    "Self-employed",
  ];

  const handleLevelChange = (
    level: "first_job" | "current_job",
    value: string
  ) => {
    setFormData((prevState) => ({
      ...prevState,
      job_levels: {
        ...prevState.job_levels,
        [level]: prevState.job_levels[level].includes(value)
          ? prevState.job_levels[level].filter((r) => r !== value)
          : [...prevState.job_levels[level], value],
      },
    }));
  };

  const handleOtherDurationBeforeFirstJobChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prevState) => ({
      ...prevState,
      other_duration_before_first_job: e.target.value,
    }));
  };

  const handleLearnedCompetencies = (reason: string, isChecked: boolean) => {
    setFormData((prevState) => ({
      ...prevState,
      learned_competencies: isChecked
        ? [...prevState.learned_competencies, reason]
        : prevState.learned_competencies.filter((r: any) => r !== reason),
    }));
  };

  const handleOtherLearnedCompetencies = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prevState) => ({
      ...prevState,
      other_learned_competencies: e.target.value,
    }));
  };

  const handleSubmit = async () => {
    try {
      const cleanedFormData = { ...formData, alumni_id: currentUserId };

      if (formData.present_employment_status === "Self-employed") {
        await deleteCOEIfSelfEmployed(currentUserId);
      }

      const dataAlreadyCreated = await checkIfExistingGTS(currentUserId);
      let response;

      if (dataAlreadyCreated) {
        response = await updateGraduateTracerStudy(
          currentUserId,
          cleanedFormData
        );
      } else {
        response = await insertGraduateTracerStudy(cleanedFormData);
      }

      if (!response) {
        console.error("Failed to insert graduate tracer study.");
      }

      if (onEmploymentStatusChange && !isReadOnly) {
        onEmploymentStatusChange(formData.present_employment_status);
      }

      setOpenGPTSModal(false);
    } catch (error) {
      console.error("Error during submission:", error);
    }
  };

  useEffect(() => {
    if (
      onEmploymentStatusChange &&
      !isReadOnly &&
      formData.present_employment_status
    ) {
      onEmploymentStatusChange(formData.present_employment_status);
    }
  }, [
    formData.present_employment_status,
    onEmploymentStatusChange,
    isReadOnly,
  ]);

  return (
    <Modal
      size="xl"
      isOpen={openGPTSModal}
      onOpenChange={setOpenGPTSModal}
      className="overflow-hidden"
    >
      <ModalContent className="h-full w-full">
        {(onClose) => (
          <>
            <ModalHeader>GRADUATE TRACER SURVEY (GTS)</ModalHeader>
            {currentView === "A" && (
              <ModalBody className="h-full w-full overflow-y-auto">
                <>
                  <h1 className="lg:col-span-2 font-semibold justify-start place-content-start">
                    A. GENERAL INFORMATION
                  </h1>
                  <Input
                    label="1. Name"
                    name="name"
                    color="success"
                    variant="bordered"
                    value={`${userInfo.first_name} ${userInfo.middle_name} ${userInfo.last_name}`}
                    readOnly
                  />
                  <Input
                    label="2. Permanent Address"
                    name="address"
                    color="success"
                    variant="bordered"
                    value={userInfo.address}
                    readOnly
                  />
                  <Input
                    label="3. Email Address"
                    type="email"
                    name="email"
                    color="success"
                    variant="bordered"
                    value={userInfo.email}
                    readOnly
                  />
                  <Input
                    label="4. Telephone or Contact Number(s)"
                    placeholder="Enter your contact numbers"
                    name="contact_numbers"
                    color="success"
                    variant="bordered"
                    value={formData.contact_numbers}
                    onChange={handleChange}
                    readOnly={isReadOnly}
                  />
                  <Input
                    label="5. Mobile Number"
                    name="mobile_number"
                    color="success"
                    variant="bordered"
                    value={userInfo.contact_number}
                    readOnly
                  />
                  <div>
                    {!isReadOnly ? (
                      <>
                        <label className="text-xs font-medium text-green-500">
                          6. Civil Status
                        </label>
                        <RadioGroup
                          color="success"
                          orientation="horizontal"
                          value={formData.civil_status}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            handleRadioChange("civil_status", e.target.value)
                          }
                        >
                          <Radio value="Single">Single</Radio>
                          <Radio value="Married">Married</Radio>
                          <Radio value="Separated">Separated</Radio>
                          <Radio value="Single Parent">Single Parent</Radio>
                          <Radio value="Widowed">Widow or Widower</Radio>
                        </RadioGroup>
                      </>
                    ) : (
                      <Input
                        label="6.Civil Status"
                        name="civil_status"
                        color="success"
                        variant="bordered"
                        value={formData.civil_status}
                        onChange={handleChange}
                        readOnly
                      />
                    )}
                  </div>
                  <div>
                    {!isReadOnly ? (
                      <>
                        <label className="text-xs font-medium text-green-500">
                          7. Sex
                        </label>
                        <RadioGroup
                          color="success"
                          orientation="horizontal"
                          value={formData.sex}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            handleRadioChange("sex", e.target.value)
                          }
                        >
                          <Radio value="Male">Male</Radio>
                          <Radio value="Female">Female</Radio>
                        </RadioGroup>
                      </>
                    ) : (
                      <Input
                        label="7. Sex"
                        name="sex"
                        color="success"
                        variant="bordered"
                        value={formData.sex}
                        onChange={handleChange}
                        readOnly
                      />
                    )}
                  </div>
                  <Input
                    label="8. Birthday"
                    name="birthday"
                    color="success"
                    variant="bordered"
                    value={userInfo.birth_date}
                    readOnly
                  />
                  <div>
                    {!isReadOnly ? (
                      <>
                        <Select
                          label="9. Region of Origin"
                          variant="bordered"
                          color="success"
                          defaultSelectedKeys={[formData.region]}
                          value={formData.region}
                          onChange={(e) =>
                            setFormData({ ...formData, region: e.target.value })
                          }
                        >
                          <SelectItem key={"NCR"}>{"NCR"}</SelectItem>
                          <SelectItem key={"CAR"}>{"CAR"}</SelectItem>
                          <SelectItem key={"ARMM"}>{"ARMM"}</SelectItem>
                          <SelectItem key={"CARAGA"}>{"CARAGA"}</SelectItem>
                          <SelectItem key={"Region 1"}>{"Region 1"}</SelectItem>
                          <SelectItem key={"Region 2"}>{"Region 2"}</SelectItem>
                          <SelectItem key={"Region 3"}>{"Region 3"}</SelectItem>
                          <SelectItem key={"Region 4"}>{"Region 4"}</SelectItem>
                          <SelectItem key={"Region 5"}>{"Region 5"}</SelectItem>
                          <SelectItem key={"Region 6"}>{"Region 6"}</SelectItem>
                          <SelectItem key={"Region 7"}>{"Region 7"}</SelectItem>
                          <SelectItem key={"Region 8"}>{"Region 8"}</SelectItem>
                          <SelectItem key={"Region 9"}>{"Region 9"}</SelectItem>
                          <SelectItem key={"Region 10"}>
                            {"Region 10"}
                          </SelectItem>
                          <SelectItem key={"Region 11"}>
                            {"Region 11"}
                          </SelectItem>
                          <SelectItem key={"Region 12"}>
                            {"Region 12"}
                          </SelectItem>
                        </Select>
                      </>
                    ) : (
                      <Input
                        label="9. Region of Origin"
                        name="region"
                        color="success"
                        variant="bordered"
                        value={formData.region}
                        onChange={handleChange}
                        readOnly
                      />
                    )}
                  </div>
                  <Input
                    label="10. Province"
                    name="province"
                    color="success"
                    variant="bordered"
                    value={formData.province}
                    onChange={handleChange}
                    readOnly={isReadOnly}
                  />
                  <div>
                    {!isReadOnly ? (
                      <>
                        <label className="text-xs font-medium text-green-500">
                          11. Location of Residence
                        </label>
                        <RadioGroup
                          color="success"
                          orientation="horizontal"
                          value={formData.location_of_residence}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            handleRadioChange(
                              "location_of_residence",
                              e.target.value
                            )
                          }
                        >
                          <Radio value="City">City</Radio>
                          <Radio value="Municipality">Municipality</Radio>
                        </RadioGroup>
                      </>
                    ) : (
                      <Input
                        label="11. Location of Residence"
                        name="location_of_residence"
                        color="success"
                        variant="bordered"
                        value={formData.location_of_residence}
                        onChange={handleChange}
                        readOnly
                      />
                    )}
                  </div>
                </>
              </ModalBody>
            )}
            {currentView === "B" && (
              <ModalBody className="h-full w-full overflow-y-auto">
                <>
                  <h1 className="lg:col-span-2 font-semibold justify-start place-content-start">
                    B. EDUCATIONAL BACKGROUND
                  </h1>
                  <div className="flex flex-col justify-start items-start lg:flex-row lg:justify-between lg:items-center gap-2">
                    <label className="text-xs font-medium text-green-500">
                      12. Educational Attainment (Baccalaureate Degree only)
                    </label>
                    <Button
                      color="success"
                      className={`${isReadOnly && "hidden"} text-white`}
                      size="sm"
                      startContent={<IoAddOutline />}
                      onClick={addEducation}
                    >
                      Add Education
                    </Button>
                  </div>
                  {formData.educational_background.map((edu, index) => (
                    <div
                      key={index}
                      className="p-2 rounded grid grid-cols-2 gap-2"
                    >
                      <div className="col-span-2 flex justify-end">
                        <Button
                          color="danger"
                          size="sm"
                          variant="light"
                          className={`${isReadOnly && "hidden"}`}
                          startContent={<IoRemoveCircleOutline />}
                          onClick={() => removeEducation(index)}
                        >
                          Remove
                        </Button>
                      </div>
                      <Input
                        label="Degree & Specialization"
                        color="success"
                        variant="bordered"
                        size="sm"
                        value={edu.degree}
                        onChange={(e) =>
                          handleEducationChange(index, "degree", e.target.value)
                        }
                        isReadOnly={isReadOnly}
                      />
                      <Input
                        label="College/University"
                        color="success"
                        variant="bordered"
                        value={edu.college}
                        size="sm"
                        onChange={(e) =>
                          handleEducationChange(
                            index,
                            "college",
                            e.target.value
                          )
                        }
                        isReadOnly={isReadOnly}
                      />
                      <Input
                        label="Year Graduated"
                        color="success"
                        variant="bordered"
                        size="sm"
                        value={edu.yearGraduated}
                        onChange={(e) =>
                          handleEducationChange(
                            index,
                            "yearGraduated",
                            e.target.value
                          )
                        }
                        isReadOnly={isReadOnly}
                      />
                      <Input
                        label="Honors/Awards Received"
                        color="success"
                        variant="bordered"
                        size="sm"
                        value={edu.honors}
                        onChange={(e) =>
                          handleEducationChange(index, "honors", e.target.value)
                        }
                        isReadOnly={isReadOnly}
                      />
                    </div>
                  ))}
                  <div className="flex flex-col justify-start items-start lg:flex-row lg:justify-between lg:items-center gap-2">
                    <label className="text-xs font-medium text-green-500">
                      13. Professional Examination(s) Passed
                    </label>
                    <Button
                      color="success"
                      size="sm"
                      className={`${isReadOnly && "hidden"} text-white`}
                      startContent={<IoAddOutline />}
                      onClick={addProfessional}
                    >
                      Add Professional Examination
                    </Button>
                  </div>
                  {formData.professional_examination.map((prof, index) => (
                    <div
                      key={index}
                      className="p-2 rounded grid grid-cols-2 gap-2 mt-0"
                    >
                      <div className="col-span-2 flex justify-end">
                        <Button
                          color="danger"
                          size="sm"
                          variant="light"
                          className={`${isReadOnly && "hidden"}`}
                          startContent={<IoRemoveCircleOutline />}
                          onClick={() => removeProfessional(index)}
                        >
                          Remove
                        </Button>
                      </div>
                      <Input
                        label="Name of Examination"
                        color="success"
                        variant="bordered"
                        size="sm"
                        className="col-span-2"
                        value={prof.name_of_exam}
                        onChange={(e) =>
                          handleProfessionalChange(
                            index,
                            "name_of_exam",
                            e.target.value
                          )
                        }
                        isReadOnly={isReadOnly}
                      />
                      <Input
                        label="Date Taken"
                        color="success"
                        variant="bordered"
                        size="sm"
                        value={prof.date_taken}
                        onChange={(e) =>
                          handleProfessionalChange(
                            index,
                            "date_taken",
                            e.target.value
                          )
                        }
                        isReadOnly={isReadOnly}
                      />
                      <Input
                        label="Rating"
                        color="success"
                        variant="bordered"
                        size="sm"
                        value={prof.rating}
                        onChange={(e) =>
                          handleProfessionalChange(
                            index,
                            "rating",
                            e.target.value
                          )
                        }
                        isReadOnly={isReadOnly}
                      />
                    </div>
                  ))}
                  <div className="flex flex-col justify-start items-start lg:flex-row lg:justify-between lg:items-center gap-2">
                    <label className="text-xs font-medium text-green-500">
                      14. Reason(s) for taking the course(s) or pursuing
                      degree(s).
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-center text-xs font-semibold text-green-500">
                        Undergraduate/AB/BS
                      </h3>
                      {reasons.map((reason, index) => (
                        <Checkbox
                          key={`ug-${index}`}
                          color="success"
                          isReadOnly={isReadOnly}
                          isSelected={formData.course_reasons.undergraduate.includes(
                            reason
                          )}
                          onChange={() =>
                            handleReasonChange("undergraduate", reason)
                          }
                        >
                          {reason}
                        </Checkbox>
                      ))}
                      <Textarea
                        label="Other reason (please specify)"
                        color="success"
                        variant="bordered"
                        value={formData.course_reasons.other_undergraduate}
                        onChange={(e) =>
                          handleOtherReasonChange(
                            "undergraduate",
                            e.target.value
                          )
                        }
                        className="mt-2"
                        isReadOnly={isReadOnly}
                      />
                    </div>
                    <div>
                      <h3 className="text-center text-xs font-semibold text-green-500">
                        Graduate/MS/MA/PhD
                      </h3>
                      {reasons.map((reason, index) => (
                        <Checkbox
                          key={`g-${index}`}
                          color="success"
                          isReadOnly={isReadOnly}
                          isSelected={formData.course_reasons.graduate.includes(
                            reason
                          )}
                          onChange={() =>
                            handleReasonChange("graduate", reason)
                          }
                        >
                          {reason}
                        </Checkbox>
                      ))}
                      <Textarea
                        label="Other reason (please specify)"
                        color="success"
                        variant="bordered"
                        value={formData.course_reasons.other_graduate}
                        onChange={(e) =>
                          handleOtherReasonChange("graduate", e.target.value)
                        }
                        className="mt-2"
                        isReadOnly={isReadOnly}
                      />
                    </div>
                  </div>
                </>
              </ModalBody>
            )}
            {currentView === "C" && (
              <ModalBody className="h-full w-full overflow-y-auto">
                <>
                  <h1 className="lg:col-span-2 font-semibold justify-start place-content-start">
                    C. TRAINING(S)/ADVANCE STUDIES ATTENDED AFTER COLLEGE
                  </h1>
                  <div className="flex flex-col justify-start items-start lg:flex-row lg:justify-between lg:items-center gap-2">
                    <label className="text-xs font-medium text-green-500">
                      15a. Please list down all professional or work-related
                      training program(s) including advance studies you have
                      attended after college.
                    </label>
                    <Button
                      color="success"
                      className={`${isReadOnly && "hidden"} text-white`}
                      size="sm"
                      startContent={<IoAddOutline />}
                      onClick={addTraining}
                    >
                      Add Training
                    </Button>
                  </div>
                  {formData.training_after_college.map((training, index) => (
                    <div
                      key={index}
                      className="p-2 rounded grid grid-cols-2 gap-2 mt-0"
                    >
                      <div className="col-span-2 flex justify-end">
                        <Button
                          color="danger"
                          size="sm"
                          variant="light"
                          className={`${isReadOnly && "hidden"}`}
                          startContent={<IoRemoveCircleOutline />}
                          onClick={() => removeTraining(index)}
                        >
                          Remove
                        </Button>
                      </div>
                      <Input
                        label="Title of Training"
                        color="success"
                        variant="bordered"
                        size="sm"
                        className="col-span-2"
                        isReadOnly={isReadOnly}
                        value={training.title}
                        onChange={(e) =>
                          handleTrainingChange(index, "title", e.target.value)
                        }
                        readOnly={isReadOnly}
                      />
                      <Input
                        label="Duration"
                        color="success"
                        variant="bordered"
                        size="sm"
                        isReadOnly={isReadOnly}
                        value={training.duration}
                        onChange={(e) =>
                          handleTrainingChange(
                            index,
                            "duration",
                            e.target.value
                          )
                        }
                        readOnly={isReadOnly}
                      />
                      <Input
                        label="Institution"
                        color="success"
                        variant="bordered"
                        size="sm"
                        isReadOnly={isReadOnly}
                        value={training.institution}
                        onChange={(e) =>
                          handleTrainingChange(
                            index,
                            "institution",
                            e.target.value
                          )
                        }
                        readOnly={isReadOnly}
                      />
                    </div>
                  ))}
                  <div className="flex flex-col justify-start items-start lg:flex-row lg:justify-between lg:items-center gap-2">
                    <label className="text-xs font-medium text-green-500">
                      15b. What made you pursue advance studies?
                    </label>
                  </div>
                  <RadioGroup
                    color="success"
                    isReadOnly={isReadOnly}
                    value={formData.advance_studies_reason}
                    onValueChange={handleAdvanceStudiesReasonChange}
                  >
                    <Radio value="For promotion">For promotion</Radio>
                    <Radio value="For professional development">
                      For professional development
                    </Radio>
                    <Radio value="Others">Others</Radio>
                  </RadioGroup>
                  {formData.advance_studies_reason === "Others" && (
                    <Input
                      label="Please specify"
                      color="success"
                      variant="bordered"
                      value={formData.other_advance_studies_reason}
                      onChange={handleOtherAdvanceStudiesReasonChange}
                      readOnly={isReadOnly}
                    />
                  )}
                </>
              </ModalBody>
            )}
            {currentView === "D" && (
              <ModalBody className="h-full w-full overflow-y-auto">
                <>
                  <h1 className="lg:col-span-2 font-semibold justify-start place-content-start">
                    D. EMPLOYMENT DATA
                  </h1>
                  {!isReadOnly ? (
                    <Select
                      label="16. Are you presently employed?"
                      color="success"
                      variant="bordered"
                      defaultSelectedKeys={[formData.employment_status]}
                      value={formData.employment_status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          employment_status: e.target.value,
                        })
                      }
                    >
                      <SelectItem key={"Yes"}>Yes</SelectItem>
                      <SelectItem key={"No"}>No</SelectItem>
                      <SelectItem key={"Never Employed"}>
                        Never Employed
                      </SelectItem>
                    </Select>
                  ) : (
                    <Input
                      label="16. Are you presently employed?"
                      color="success"
                      variant="bordered"
                      value={formData.employment_status}
                      onChange={handleChange}
                      readOnly
                    />
                  )}
                  {(formData.employment_status === "No" ||
                    formData.employment_status === "Never Employed") && (
                    <>
                      <div className="flex flex-col justify-start items-start lg:flex-row lg:justify-between lg:items-center gap-2">
                        <label className="text-xs font-medium text-green-500">
                          17. Please state reason(s) why you are not yet
                          employed. You may check (✓) more than one answer.
                        </label>
                      </div>
                      <div className="flex flex-col gap-2">
                        {[
                          "Advance or further study",
                          "Family concern and decided not to find a job",
                          "Health-related reason(s)",
                          "Lack of work experience",
                          "No job opportunity",
                          "Did not look for a job",
                        ].map((reason) => (
                          <Checkbox
                            key={reason}
                            color="success"
                            isReadOnly={isReadOnly}
                            isSelected={formData.unemployment_reasons.includes(
                              reason
                            )}
                            onValueChange={(isSelected) =>
                              handleUnemploymentReasonChange(reason, isSelected)
                            }
                          >
                            {reason}
                          </Checkbox>
                        ))}
                        <Checkbox
                          isSelected={formData.unemployment_reasons.includes(
                            "Other"
                          )}
                          color="success"
                          isReadOnly={isReadOnly}
                          onValueChange={(isSelected) =>
                            handleUnemploymentReasonChange("Other", isSelected)
                          }
                        >
                          Other reason(s)
                        </Checkbox>
                        {formData.unemployment_reasons.includes("Other") && (
                          <Input
                            label="Please specify"
                            color="success"
                            variant="bordered"
                            value={formData.other_unemployment_reason}
                            onChange={handleOtherUnemploymentReasonChange}
                            className="mt-2"
                            isReadOnly={isReadOnly}
                          />
                        )}
                      </div>
                    </>
                  )}
                  {!isReadOnly ? (
                    <Select
                      label="18. Present Employment Status"
                      color="success"
                      variant="bordered"
                      defaultSelectedKeys={[formData.present_employment_status]}
                      value={formData.present_employment_status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          present_employment_status: e.target.value,
                        })
                      }
                    >
                      <SelectItem key={"Regular"}>
                        Regular or Permanent
                      </SelectItem>
                      <SelectItem key={"Temporary"}>Temporary</SelectItem>
                      <SelectItem key={"Casual"}>Casual</SelectItem>
                      <SelectItem key={"Contractual"}>Contractual</SelectItem>
                      <SelectItem key={"Self-employed"}>
                        Self-employed
                      </SelectItem>
                    </Select>
                  ) : (
                    <Input
                      label="18. Present Employment Status"
                      color="success"
                      variant="bordered"
                      value={formData.present_employment_status}
                      onChange={handleChange}
                      readOnly
                    />
                  )}
                  <Input
                    label="19. Present occupation"
                    placeholder="(Ex. Grade School Teacher, Electrical Engineer, Self-employed)"
                    name="present_occupation"
                    color="success"
                    variant="bordered"
                    value={formData.present_occupation}
                    onChange={handleChange}
                    readOnly={isReadOnly}
                  />
                  <Input
                    label="Agency/Company Name"
                    placeholder="Enter the name of the agency or company"
                    name="agency"
                    color="success"
                    variant="bordered"
                    value={formData.agency}
                    onChange={handleChange}
                    readOnly={isReadOnly}
                  />
                  {!isReadOnly ? (
                    <Select
                      label="20. Major line of business of the company you are presently employed in."
                      color="success"
                      variant="bordered"
                      defaultSelectedKeys={[formData.major_line_of_business]}
                      value={formData.major_line_of_business}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          major_line_of_business: e.target.value,
                        })
                      }
                    >
                      <SelectItem key="Agriculture, Hunting and Forestry">
                        Agriculture, Hunting and Forestry
                      </SelectItem>
                      <SelectItem key="Fishing">Fishing</SelectItem>
                      <SelectItem key="Mining and Quarrying">
                        Mining and Quarrying{" "}
                      </SelectItem>
                      <SelectItem key="Manufacturing">Manufacturing</SelectItem>
                      <SelectItem key="Electricity, Gas and Water Supply">
                        Electricity, Gas and Water Supply
                      </SelectItem>
                      <SelectItem key="Construction">Construction</SelectItem>
                      <SelectItem key="Wholesale and Retail Trade">
                        Wholesale and Retail Trade, repair of motor vehicles,
                        motorcycles and personal and household goods
                      </SelectItem>
                      <SelectItem key="Hotels and Restaurants">
                        Hotels and Restaurants
                      </SelectItem>
                      <SelectItem key="Transport Storage and Communication">
                        Transport Storage and Communication
                      </SelectItem>
                      <SelectItem key="Financial Intermediation">
                        Financial Intermediation
                      </SelectItem>
                      <SelectItem key="Real Estate, Renting and Business Activities">
                        Real Estate, Renting and Business Activities
                      </SelectItem>
                      <SelectItem key="Public Administration and Defense">
                        Public Administration and Defense; Compulsory Social
                        Security
                      </SelectItem>
                      <SelectItem key="Education">Education</SelectItem>
                      <SelectItem key="Health and Social Work">
                        Health and Social Work
                      </SelectItem>
                      <SelectItem key="Other Community, Social and Personal Service Activities">
                        Other Community, Social and Personal Service Activities
                      </SelectItem>
                      <SelectItem key="Private Households with Employed Persons">
                        Private Households with Employed Persons
                      </SelectItem>
                      <SelectItem key="Extra-territorial Organizations and Bodies">
                        Extra-territorial Organizations and Bodies
                      </SelectItem>
                    </Select>
                  ) : (
                    <Input
                      label="20. Major line of business of the company you are presently employed in."
                      color="success"
                      variant="bordered"
                      value={formData.major_line_of_business}
                      onChange={handleChange}
                      readOnly
                    />
                  )}
                  {!isReadOnly ? (
                    <Select
                      label="21. Place of work"
                      color="success"
                      variant="bordered"
                      defaultSelectedKeys={[formData.place_of_work]}
                      value={formData.place_of_work}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          place_of_work: e.target.value,
                        })
                      }
                    >
                      <SelectItem key="Local">Local</SelectItem>
                      <SelectItem key="Abroad">Abroad</SelectItem>
                    </Select>
                  ) : (
                    <Input
                      label="21. Place of work"
                      color="success"
                      variant="bordered"
                      value={formData.place_of_work}
                      onChange={handleChange}
                      readOnly
                    />
                  )}
                  {!isReadOnly ? (
                    <Select
                      label="22. Is this your first job after college?"
                      color="success"
                      variant="bordered"
                      defaultSelectedKeys={[
                        formData.is_first_time_job_after_college,
                      ]}
                      value={formData.is_first_time_job_after_college}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_first_time_job_after_college: e.target.value,
                        })
                      }
                    >
                      <SelectItem key="Yes">Yes</SelectItem>
                      <SelectItem key="No">No</SelectItem>
                    </Select>
                  ) : (
                    <Input
                      label="22. Is this your first job after college?"
                      color="success"
                      variant="bordered"
                      value={formData.is_first_time_job_after_college}
                      onChange={handleChange}
                      readOnly
                    />
                  )}
                  {formData.is_first_time_job_after_college === "Yes" && (
                    <>
                      <div className="flex flex-col justify-start items-start lg:flex-row lg:justify-between lg:items-center gap-2">
                        <label className="text-xs font-medium text-green-500">
                          23. What are your reason(s) for staying on the job?
                          You may check (✓) more than one answer.
                        </label>
                      </div>
                      <div className="flex flex-col gap-2">
                        {[
                          "Salaries and benefits",
                          "Career challenge",
                          "Related to special skill",
                          "Related to course or program of study",
                          "Proximity to residence",
                          "Peer influence",
                          "Family influence",
                        ].map((reason) => (
                          <Checkbox
                            key={reason}
                            color="success"
                            isReadOnly={isReadOnly}
                            isSelected={formData.staying_on_job_reasons.includes(
                              reason
                            )}
                            onValueChange={(isSelected) =>
                              handleStayingReasonChange(reason, isSelected)
                            }
                          >
                            {reason}
                          </Checkbox>
                        ))}
                        <Checkbox
                          isSelected={formData.staying_on_job_reasons.includes(
                            "Other"
                          )}
                          color="success"
                          isReadOnly={isReadOnly}
                          onValueChange={(isSelected) =>
                            handleStayingReasonChange("Other", isSelected)
                          }
                        >
                          Other reason(s)
                        </Checkbox>
                        {formData.staying_on_job_reasons.includes("Other") && (
                          <Input
                            label="Please specify"
                            color="success"
                            variant="bordered"
                            value={formData.other_staying_on_job_reason}
                            onChange={handleOtherStayingOnJobReasonChange}
                            className="mt-2"
                            isReadOnly={isReadOnly}
                          />
                        )}
                      </div>
                      {!isReadOnly ? (
                        <Select
                          label="24. Is your first job related to the course you took up in college? You may check (✓) more than one answer."
                          color="success"
                          variant="bordered"
                          defaultSelectedKeys={[
                            formData.is_first_job_related_to_course,
                          ]}
                          value={formData.is_first_job_related_to_course}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              is_first_job_related_to_course: e.target.value,
                            })
                          }
                        >
                          <SelectItem key="Yes">Yes</SelectItem>
                          <SelectItem key="No">No</SelectItem>
                        </Select>
                      ) : (
                        <Input
                          label="24. Is your first job related to the course you took up in college? You may check (✓) more than one answer."
                          color="success"
                          variant="bordered"
                          value={formData.is_first_job_related_to_course}
                          onChange={handleChange}
                          readOnly
                        />
                      )}
                      {formData.is_first_job_related_to_course === "Yes" && (
                        <>
                          <div className="flex flex-col justify-start items-start lg:flex-row lg:justify-between lg:items-center gap-2">
                            <label className="text-xs font-medium text-green-500">
                              25. What were your reason(s) for accepting the
                              job? You may check (✓) more than one answer.
                            </label>
                          </div>
                          <div className="flex flex-col gap-2">
                            {[
                              "Salaries and benefits",
                              "Career challenge",
                              "Related to special skill",
                              "Related to course or program of study",
                              "Proximity to residence",
                            ].map((reason) => (
                              <Checkbox
                                key={reason}
                                color="success"
                                isReadOnly={isReadOnly}
                                isSelected={formData.first_job_related_to_course_reasons.includes(
                                  reason
                                )}
                                onValueChange={(isSelected) =>
                                  handleIsFirstJobRelatedToCourseReasonChange(
                                    reason,
                                    isSelected
                                  )
                                }
                              >
                                {reason}
                              </Checkbox>
                            ))}
                            <Checkbox
                              isSelected={formData.first_job_related_to_course_reasons.includes(
                                "Other"
                              )}
                              color="success"
                              isReadOnly={isReadOnly}
                              onValueChange={(isSelected) =>
                                handleIsFirstJobRelatedToCourseReasonChange(
                                  "Other",
                                  isSelected
                                )
                              }
                            >
                              Other reason(s)
                            </Checkbox>
                            {formData.first_job_related_to_course_reasons.includes(
                              "Other"
                            ) && (
                              <Input
                                label="Please specify"
                                color="success"
                                variant="bordered"
                                value={
                                  formData.other_first_job_related_to_course_reason
                                }
                                onChange={
                                  handleOtherFirstJobRelatedToCourseReasonChange
                                }
                                className="mt-2"
                                isReadOnly={isReadOnly}
                              />
                            )}
                          </div>
                        </>
                      )}
                    </>
                  )}
                  {formData.is_first_job_related_to_course === "Yes" && (
                    <>
                      <div className="flex flex-col justify-start items-start lg:flex-row lg:justify-between lg:items-center gap-2">
                        <label className="text-xs font-medium text-green-500">
                          26. What were your reason(s) for changing job? You may
                          check (✓) more than one answer.
                        </label>
                      </div>
                      <div className="flex flex-col gap-2">
                        {[
                          "Salaries and benefits",
                          "Career challenge",
                          "Related to special skill",
                          "Related to course or program of study",
                          "Proximity to residence",
                        ].map((reason) => (
                          <Checkbox
                            key={reason}
                            color="success"
                            isReadOnly={isReadOnly}
                            isSelected={formData.leaving_job_reasons.includes(
                              reason
                            )}
                            onValueChange={(isSelected) =>
                              handleLeavingJobReasonChange(reason, isSelected)
                            }
                          >
                            {reason}
                          </Checkbox>
                        ))}
                        <Checkbox
                          isSelected={formData.leaving_job_reasons.includes(
                            "Other"
                          )}
                          color="success"
                          isReadOnly={isReadOnly}
                          onValueChange={(isSelected) =>
                            handleLeavingJobReasonChange("Other", isSelected)
                          }
                        >
                          Other reason(s)
                        </Checkbox>
                        {formData.leaving_job_reasons.includes("Other") && (
                          <Input
                            label="Please specify"
                            color="success"
                            variant="bordered"
                            value={formData.other_leaving_job_reason}
                            onChange={handleOtherLeavingJobReasonChange}
                            className="mt-2"
                            isReadOnly={isReadOnly}
                          />
                        )}
                      </div>
                      <div className="flex flex-col justify-start items-start lg:flex-row lg:justify-between lg:items-center gap-2">
                        <label className="text-xs font-medium text-green-500">
                          27. How long did you stay in your first job?
                        </label>
                      </div>
                      <div className="flex flex-col gap-2">
                        {[
                          "Less than a month",
                          "1 to 6 months",
                          "7 to 11 months",
                          "1 year to less than 2 years",
                          "2 years to less than 3 years",
                          "3 years to less than 4 years",
                        ].map((reason) => (
                          <Checkbox
                            key={reason}
                            color="success"
                            isReadOnly={isReadOnly}
                            isSelected={formData.staying_duration_in_first_job.includes(
                              reason
                            )}
                            onValueChange={(isSelected) =>
                              handleStayingDurationInFirstJobChange(
                                reason,
                                isSelected
                              )
                            }
                          >
                            {reason}
                          </Checkbox>
                        ))}
                        <Checkbox
                          isSelected={
                            formData.staying_duration_in_first_job === "Other"
                          }
                          color="success"
                          isReadOnly={isReadOnly}
                          onValueChange={(isSelected) =>
                            handleStayingDurationInFirstJobChange(
                              "Other",
                              isSelected
                            )
                          }
                        >
                          Other duration(s)
                        </Checkbox>
                        {formData.staying_duration_in_first_job === "Other" && (
                          <Input
                            label="Please specify"
                            color="success"
                            variant="bordered"
                            value={formData.other_staying_duration_in_first_job}
                            onChange={
                              handleOtherStayingDurationInFirstJobChange
                            }
                            className="mt-2"
                            isReadOnly={isReadOnly}
                          />
                        )}
                      </div>
                    </>
                  )}
                  <div className="flex flex-col justify-start items-start lg:flex-row lg:justify-between lg:items-center gap-2">
                    <label className="text-xs font-medium text-green-500">
                      28. How did you find your first job?
                    </label>
                  </div>
                  <div className="flex flex-col gap-2">
                    {[
                      "Response to an advertisement",
                      "As walk-in applicant",
                      "Recommended by someone",
                      "Information from friends",
                      "Arranged by school&apos;s job placement officer",
                      "Family business",
                      "Job Fair or Public Employment Service Office (PESO)",
                    ].map((reason) => (
                      <Checkbox
                        key={reason}
                        color="success"
                        isReadOnly={isReadOnly}
                        isSelected={formData.first_job_found_through.includes(
                          reason
                        )}
                        onValueChange={(isSelected) =>
                          handleFirstJobFoundThroughChange(reason, isSelected)
                        }
                      >
                        {reason}
                      </Checkbox>
                    ))}
                    <Checkbox
                      isSelected={formData.first_job_found_through.includes(
                        "Other"
                      )}
                      color="success"
                      isReadOnly={isReadOnly}
                      onValueChange={(isSelected) =>
                        handleFirstJobFoundThroughChange("Other", isSelected)
                      }
                    >
                      Other reason(s)
                    </Checkbox>
                    {formData.first_job_found_through.includes("Other") && (
                      <Input
                        label="Please specify"
                        color="success"
                        variant="bordered"
                        value={formData.other_first_job_found_through}
                        onChange={handleOtherFirstJobFoundThroughChange}
                        className="mt-2"
                        isReadOnly={isReadOnly}
                      />
                    )}
                  </div>
                  <div className="flex flex-col justify-start items-start lg:flex-row lg:justify-between lg:items-center gap-2">
                    <label className="text-xs font-medium text-green-500">
                      29. How long did it take you to land your first job?
                    </label>
                  </div>
                  <div className="flex flex-col gap-2">
                    {[
                      "Less than a month",
                      "1 to 6 months",
                      "7 to 11 months",
                      "1 year to less than 2 years",
                      "2 years to less than 3 years",
                      "3 years to less than 4 years",
                    ].map((reason) => (
                      <Checkbox
                        key={reason}
                        color="success"
                        isReadOnly={isReadOnly}
                        isSelected={formData.duration_before_first_job.includes(
                          reason
                        )}
                        onValueChange={(isSelected) =>
                          handleDurationBeforeFirstJobChange(reason, isSelected)
                        }
                      >
                        {reason}
                      </Checkbox>
                    ))}
                    <Checkbox
                      isSelected={
                        formData.duration_before_first_job === "Other"
                      }
                      color="success"
                      isReadOnly={isReadOnly}
                      onValueChange={(isSelected) =>
                        handleDurationBeforeFirstJobChange("Other", isSelected)
                      }
                    >
                      Other duration(s)
                    </Checkbox>
                    {formData.duration_before_first_job === "Other" && (
                      <Input
                        label="Please specify"
                        color="success"
                        variant="bordered"
                        value={formData.other_duration_before_first_job}
                        onChange={handleOtherDurationBeforeFirstJobChange}
                        className="mt-2"
                        isReadOnly={isReadOnly}
                      />
                    )}
                  </div>
                  <div className="flex flex-col justify-start items-start lg:flex-row lg:justify-between lg:items-center gap-2">
                    <label className="text-xs font-medium text-green-500">
                      30. Job Level Position
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-center text-xs font-semibold text-green-500">
                        30.1. First Job
                      </h3>
                      {levels.map((level, index) => (
                        <Checkbox
                          key={`first-job-${index}`}
                          color="success"
                          isReadOnly={isReadOnly}
                          isSelected={formData.job_levels.first_job.includes(
                            level
                          )}
                          onChange={() => handleLevelChange("first_job", level)}
                        >
                          {level}
                        </Checkbox>
                      ))}
                    </div>
                    <div>
                      <h3 className="text-center text-xs font-semibold text-green-500">
                        30.2. Current or Present Job
                      </h3>
                      {levels.map((level, index) => (
                        <Checkbox
                          key={`current-job-${index}`}
                          color="success"
                          isReadOnly={isReadOnly}
                          isSelected={formData.job_levels.current_job.includes(
                            level
                          )}
                          onChange={() =>
                            handleLevelChange("current_job", level)
                          }
                        >
                          {level}
                        </Checkbox>
                      ))}
                    </div>
                  </div>
                  {!isReadOnly ? (
                    <Select
                      label="31. What is your initial gross monthly earning in your first job after college?"
                      color="success"
                      variant="bordered"
                      defaultSelectedKeys={[formData.initial_gross_first_job]}
                      value={formData.initial_gross_first_job}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          initial_gross_first_job: e.target.value,
                        })
                      }
                    >
                      <SelectItem key={"Below P5,000.00"}>
                        Below P5,000.00
                      </SelectItem>
                      <SelectItem key={"P5,000.00 to less than P10,000.00"}>
                        P5,000.00 to less than P10,000.00
                      </SelectItem>
                      <SelectItem key={"P10,000.00 to less than P15,000.00"}>
                        P10,000.00 to less than P15,000.00
                      </SelectItem>
                      <SelectItem key={"P15,000.00 to less than P20,000.00"}>
                        P15,000.00 to less than P20,000.00
                      </SelectItem>
                      <SelectItem key={"P20,000.00 to less than P25,000.00"}>
                        P20,000.00 to less than P25,000.00
                      </SelectItem>
                      <SelectItem key={"P25,000.00 and above"}>
                        P25,000.00 and above
                      </SelectItem>
                    </Select>
                  ) : (
                    <Input
                      label="31. What is your initial gross monthly earning in your first job after college?"
                      color="success"
                      variant="bordered"
                      value={formData.initial_gross_first_job}
                      onChange={handleChange}
                      readOnly
                    />
                  )}
                  {!isReadOnly ? (
                    <Select
                      label="32. Was the curriculum you had in college relevant to your first job?"
                      color="success"
                      variant="bordered"
                      defaultSelectedKeys={[
                        formData.is_curriculum_relevant_in_first_job,
                      ]}
                      value={formData.is_curriculum_relevant_in_first_job}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_curriculum_relevant_in_first_job: e.target.value,
                        })
                      }
                    >
                      <SelectItem key="Yes">Yes</SelectItem>
                      <SelectItem key="No">No</SelectItem>
                    </Select>
                  ) : (
                    <Input
                      label="32. Was the curriculum you had in college relevant to your first job?"
                      color="success"
                      variant="bordered"
                      value={formData.is_curriculum_relevant_in_first_job}
                      onChange={handleChange}
                      readOnly
                    />
                  )}
                  {formData.is_curriculum_relevant_in_first_job === "Yes" && (
                    <>
                      <div className="flex flex-col justify-start items-start lg:flex-row lg:justify-between lg:items-center gap-2">
                        <label className="text-xs font-medium text-green-500">
                          33. If YES, what competencies learned in college did
                          you find very useful in your first job? You may check
                          (✓) more than one answer.
                        </label>
                      </div>
                      <div className="flex flex-col gap-2">
                        {[
                          "Communication skills",
                          "Human Relations skills",
                          "Entrepreneurial skills",
                          "Information Technology skills",
                          "Problem-solving skills",
                          "Critical Thinking skills",
                        ].map((reason) => (
                          <Checkbox
                            key={reason}
                            color="success"
                            isReadOnly={isReadOnly}
                            isSelected={formData.learned_competencies.includes(
                              reason
                            )}
                            onValueChange={(isSelected) =>
                              handleLearnedCompetencies(reason, isSelected)
                            }
                          >
                            {reason}
                          </Checkbox>
                        ))}
                        <Checkbox
                          isSelected={formData.learned_competencies.includes(
                            "Other"
                          )}
                          color="success"
                          isReadOnly={isReadOnly}
                          onValueChange={(isSelected) =>
                            handleLearnedCompetencies("Other", isSelected)
                          }
                        >
                          Other skills(s)
                        </Checkbox>
                        {formData.learned_competencies.includes("Other") && (
                          <Input
                            label="Please specify"
                            color="success"
                            variant="bordered"
                            value={formData.other_learned_competencies}
                            onChange={handleOtherLearnedCompetencies}
                            isReadOnly={isReadOnly}
                          />
                        )}
                      </div>
                    </>
                  )}
                  <Textarea
                    label="34. List down suggestions to further improve your course curriculum"
                    color="success"
                    variant="bordered"
                    value={formData.suggestions}
                    onChange={(e) =>
                      setFormData({ ...formData, suggestions: e.target.value })
                    }
                    isReadOnly={isReadOnly}
                  />
                </>
              </ModalBody>
            )}
            <ModalFooter>
              <Button
                color="success"
                className={currentView === "A" ? "hidden" : "text-white"}
                onClick={() => {
                  if (currentView === "B") {
                    setCurrentView("A");
                  } else if (currentView === "C") {
                    setCurrentView("B");
                  } else if (currentView === "D") {
                    setCurrentView("C");
                  }
                }}
              >
                Prev
              </Button>
              {currentView !== "D" && (
                <Button
                  color="success"
                  className="text-white"
                  onClick={() => {
                    if (currentView === "A") {
                      setCurrentView("B");
                    } else if (currentView === "B") {
                      setCurrentView("C");
                    } else if (currentView === "C") {
                      setCurrentView("D");
                    }
                  }}
                >
                  Next
                </Button>
              )}
              <Button
                color="success"
                className={`text-white ${isReadOnly && "hidden"}`}
                isDisabled={isReadOnly || !isFormChanged()}
                onClick={() => {
                  if (!isReadOnly) {
                    handleSubmit();
                  } else {
                    setOpenGPTSModal(false);
                  }
                }}
              >
                Submit
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default GTSComponent;
