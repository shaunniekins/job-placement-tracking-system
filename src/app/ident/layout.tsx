import BackButton from "@/components/BackButton";

export default function IdentSlugLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <main className="min-h-[100svh] grid lg:grid-cols-[1fr_2fr] items-center bg-[#007057]">
        <div className="hidden lg:block h-full relative">
          {/* <img
              src="/images/grass.jpg"
              alt="Image BG"
              className="absolute inset-0 w-full h-full object-cover opacity-85"
            /> */}
          <BackButton />
        </div>
        <div className="h-full bg-white lg:rounded-l-3xl">{children}</div>
      </main>
    </>
  );
}

{
  /* <main className="h-[100svh] grid lg:grid-cols-[1fr_3fr_1fr] items-center bg-[#007057]"> */
}

// export default function IdentSlugLayout({
//   children,
// }: Readonly<{
//   children: React.ReactNode;
// }>) {
//   return (
//     <>
//       <main className="h-[100svh] flex flex-col items-center bg-[#007057]">
//         {/* <main className="min-h-[100svh] grid lg:grid-cols-[1fr_2fr] items-center bg-[#007057]"> */}
//         {/* <div className="hidden lg:block h-full relative">
//           <img
//               src="/images/grass.jpg"
//               alt="Image BG"
//               className="absolute inset-0 w-full h-full object-cover opacity-85"
//             />
//           <BackButton />
//         </div> */}
//         <div className="h-full w-full container mx-auto bg-white lg:rounded-3xl">{children}</div>
//       </main>
//     </>
//   );
// }
