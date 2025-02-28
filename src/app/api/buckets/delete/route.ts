import { NextRequest, NextResponse } from "next/server";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import s3Client from "@/lib/s3Client";

export async function POST(request: NextRequest) {
  try {
    const { filePath } = await request.json();

    if (!filePath) {
      return NextResponse.json(
        { error: "No file path provided" },
        { status: 400 }
      );
    }

    const deleteParams = {
      Bucket: "documents",
      Key: filePath,
    };

    const command = new DeleteObjectCommand(deleteParams);
    await s3Client.send(command);

    return NextResponse.json({
      message: "File deleted successfully",
      path: filePath,
    });
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { error: "File deletion failed" },
      { status: 500 }
    );
  }
}
